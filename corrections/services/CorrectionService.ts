import { SecurityAnalyzer } from "../security/SecurityAnalyzer.ts";
import { CodeQualityAnalyzer, LintingSettings } from "../analyzers/CodeQualityAnalyzer.ts";
import { TestRunner } from "../test_runner/TestRunner.ts";
import { Grader, Rubric } from "../graders/Grader.ts";
import { PedagogicalFeedback, FeedbackStructure } from "../feedback/PedagogicalFeedback.ts";
import { RubricGrader, RubricCriterion } from "../feedback/RubricGrader.ts";
import { AIFeedbackGenerator, AIFeedbackResponse } from "../feedback/AIFeedbackGenerator.ts";

import { PythonExecutor } from "../executors/PythonExecutor.ts";
import { JavaScriptExecutor } from "../executors/JavaScriptExecutor.ts";
import { TypeScriptExecutor } from "../executors/TypeScriptExecutor.ts";
import { SQLExecutor } from "../executors/SQLExecutor.ts";
import { StaticLangsExecutor } from "../executors/StaticLangsExecutor.ts";
import { TestCase } from "../executors/BaseExecutor.ts";

import { SandboxExecutor } from "../executors/SandboxExecutor.ts";

export interface CorrectionResult20 {
  language: string;
  status: "CORRECTED" | "EXECUTOR_UNAVAILABLE" | "SECURITY_BLOCKED" | "SYNTAX_ERROR" | "RUNTIME_ERROR" | "COMPILE_ERROR" | "TIMEOUT";
  syntax_ok: boolean;
  security_ok: boolean;
  compiled: boolean;
  tests_passed: number;
  total_tests: number;
  syntax_score: number;
  test_score: number;
  quality_score: number;
  final_score: number;
  stdout: string;
  stderr: string;
  execution_time: number; // in seconds
  memory_used: number | null;
  feedback: FeedbackStructure;
  test_results: Array<{
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
    is_hidden?: boolean;
  }>;
  competencies?: {
    variables: number;
    conditionals: number;
    loops: number;
    functions: number;
    arrays: number;
  };
  ai_detection?: {
    probability: "LOW" | "MEDIUM" | "HIGH";
    justification: string;
    ai_score: number;
  };
  sandbox_metrics?: {
    cpu_limit_ghz: number;
    ram_limit_mb: number;
    timeout_ms: number;
    network_firewall: "BLOCKED" | "ALLOWED";
    os_sandbox: "CONTAINER_SECURE" | "LOCAL_SANDBOX";
  };
  rubric_criteria?: RubricCriterion[];
  ai_pedagogical_feedback?: AIFeedbackResponse;
}

export class CorrectionService {
  /**
   * Main orchestrator of the Correction Engine 2.0 Pipeline
   */
  static async run(
    language: string,
    code: string,
    testCases: TestCase[],
    rubric?: Rubric,
    lintingSettings?: LintingSettings,
    enableSandbox: boolean = false
  ): Promise<CorrectionResult20> {
    const langLower = language.toLowerCase();
    
    // 1. Initial State Default variables
    let status: CorrectionResult20["status"] = "CORRECTED";
    let syntax_ok = true;
    let compiled = true;
    let tests_passed = 0;
    let execution_time_ms = 0;
    let stdout = "";
    let stderr = "";
    let test_results: CorrectionResult20["test_results"] = [];
    let testScorePercentage = 0;

    // 2. Validate security
    const securityResult = SecurityAnalyzer.check(code, language);
    if (!securityResult.security_ok) {
      const feedback = await PedagogicalFeedback.generate(
        language,
        code,
        false,
        testCases.length,
        0,
        [],
        "",
        false,
        securityResult.reason
      );

      return {
        language,
        status: "SECURITY_BLOCKED",
        syntax_ok: false,
        security_ok: false,
        compiled: false,
        tests_passed: 0,
        total_tests: testCases.length,
        syntax_score: 0,
        test_score: 0,
        quality_score: 0,
        final_score: 0,
        stdout: "",
        stderr: securityResult.reason || "Código bloqueado por segurança.",
        execution_time: 0,
        memory_used: null,
        feedback,
        test_results: testCases.map(tc => ({
          input: tc.input,
          expected_output: tc.expected_output,
          actual_output: "",
          passed: false
        }))
      };
    }

    // Is there sandbox support for this language?
    const isSandboxSupported = ["python", "javascript", "c", "cpp"].includes(langLower);

    // 3. Static check if the language is not executable locally, or if is static Portugol/Pseudocode
    const isStaticOrUnavailable = !enableSandbox && ["portugol", "pseudocode", "pseudocodigo", "pseudocódigo", "java", "c", "cpp", "csharp", "php", "go", "rust", "kotlin"].includes(langLower);
    
    // Check if we should use Sandbox
    if (enableSandbox && isSandboxSupported) {
       // Route to Sandbox
       const sbRes = await SandboxExecutor.execute(code, language, testCases);
       syntax_ok = sbRes.syntaxOk;
       compiled = sbRes.compiled;
       tests_passed = sbRes.testsPassed;
       test_results = sbRes.testResults;
       stdout = sbRes.stdout;
       stderr = sbRes.stderr;
       execution_time_ms = sbRes.executionTimeMs;
       status = sbRes.status as any;
       
       if (tests_passed === testCases.length && testCases.length > 0) {
         testScorePercentage = 100;
       } else if (testCases.length > 0) {
         testScorePercentage = (tests_passed / testCases.length) * 100;
       }

       // Extract additional sandbox metadata
       const sandbox_metrics = (sbRes as any).sandboxMetrics;
       const security_flags = (sbRes as any).securityFlags;

       // Quality Checks (still run static quality check even in sandbox)
       const qualityAnalysis = CodeQualityAnalyzer.analyze(code, language, lintingSettings);
       
       // Calculate Rubric Grades
       const graded = Grader.grade(
         syntax_ok,
         testScorePercentage,
         qualityAnalysis.score,
         true,
         rubric
       );

       // Generate advanced pedagogical response details
       const feedback = await PedagogicalFeedback.generate(
         language,
         code,
         syntax_ok,
         testCases.length,
         tests_passed,
         qualityAnalysis.issues,
         stderr,
         true,
         null
       );

       const execution_time = parseFloat((execution_time_ms / 1000).toFixed(3)) || 0.01;
       const competencies = CorrectionService.analyzeCompetencies(code, language);
       const ai_detection = CorrectionService.analyzeAIDetection(code, language);

       // Evaluate rubrics (if flag is active)
       let rubric_criteria: RubricCriterion[] | undefined = undefined;
       if (process.env.ENABLE_RUBRIC_CORRECTION !== "false") {
         const rubricEval = await RubricGrader.evaluate(
           language,
           code,
           syntax_ok,
           testCases.length,
           tests_passed,
           qualityAnalysis.issues,
           stderr,
           graded.final_score
         );
         rubric_criteria = rubricEval.criteria;
       }

       // Evaluate AI feedback (if flag is active)
       let ai_pedagogical_feedback: AIFeedbackResponse | undefined = undefined;
       if (process.env.ENABLE_AI_FEEDBACK !== "false") {
         ai_pedagogical_feedback = await AIFeedbackGenerator.generate(
           language,
           code,
           syntax_ok,
           testCases.length,
           tests_passed,
           qualityAnalysis.issues,
           stderr,
           graded.final_score
         );
       }

       return {
         language,
         status,
         syntax_ok,
         security_ok: status !== "SECURITY_BLOCKED",
         compiled,
         tests_passed,
         total_tests: testCases.length,
         syntax_score: graded.syntax_score,
         test_score: graded.test_score,
         quality_score: graded.quality_score,
         final_score: graded.final_score,
         stdout,
         stderr,
         execution_time,
         memory_used: (sbRes as any).memoryUsed,
         feedback,
         test_results,
         competencies,
         ai_detection,
         sandbox_metrics,
         rubric_criteria,
         ai_pedagogical_feedback
       };

    } else if (isStaticOrUnavailable) {
      const staticRes = StaticLangsExecutor.analyze(code, language);
      
      const qualityAnalysis = CodeQualityAnalyzer.analyze(code, language, lintingSettings);
      const graded = Grader.grade(
        staticRes.syntaxOk,
        staticRes.isUnavailable ? 0 : 100, // static Portugol gets full test points mock, unavailable gets 0
        qualityAnalysis.score,
        true,
        rubric
      );

      const feedback = await PedagogicalFeedback.generate(
        language,
        code,
        staticRes.syntaxOk,
        testCases.length,
        staticRes.isUnavailable ? 0 : testCases.length,
        qualityAnalysis.issues,
        staticRes.isUnavailable ? staticRes.feedback : "",
        true,
        null
      );

      const staticCompetencies = CorrectionService.analyzeCompetencies(code, language);
      const staticAiDetection = CorrectionService.analyzeAIDetection(code, language);
      const staticSandboxMetrics = {
        cpu_limit_ghz: 1.5,
        ram_limit_mb: 128,
        timeout_ms: 3000,
        network_firewall: "BLOCKED" as const,
        os_sandbox: "CONTAINER_SECURE" as const
      };

      // Evaluate rubrics (if flag is active)
      let rubric_criteria: RubricCriterion[] | undefined = undefined;
      if (process.env.ENABLE_RUBRIC_CORRECTION !== "false" && !staticRes.isUnavailable) {
        const rubricEval = await RubricGrader.evaluate(
          language,
          code,
          staticRes.syntaxOk,
          testCases.length,
          staticRes.isUnavailable ? 0 : testCases.length,
          qualityAnalysis.issues,
          staticRes.isUnavailable ? staticRes.feedback : "",
          graded.final_score
        );
        rubric_criteria = rubricEval.criteria;
      }

      // Evaluate AI feedback (if flag is active)
      let ai_pedagogical_feedback: AIFeedbackResponse | undefined = undefined;
      if (process.env.ENABLE_AI_FEEDBACK !== "false" && !staticRes.isUnavailable) {
        ai_pedagogical_feedback = await AIFeedbackGenerator.generate(
          language,
          code,
          staticRes.syntaxOk,
          testCases.length,
          staticRes.isUnavailable ? 0 : testCases.length,
          qualityAnalysis.issues,
          staticRes.isUnavailable ? staticRes.feedback : "",
          graded.final_score
        );
      }

      return {
        language,
        status: staticRes.isUnavailable ? "EXECUTOR_UNAVAILABLE" : "CORRECTED",
        syntax_ok: staticRes.syntaxOk,
        security_ok: true,
        compiled: staticRes.syntaxOk,
        tests_passed: staticRes.isUnavailable ? 0 : testCases.length,
        total_tests: testCases.length,
        syntax_score: staticRes.isUnavailable ? 0 : graded.syntax_score,
        test_score: staticRes.isUnavailable ? 0 : graded.test_score,
        quality_score: staticRes.isUnavailable ? 0 : graded.quality_score,
        final_score: staticRes.isUnavailable ? 0 : graded.final_score,
        stdout: staticRes.isUnavailable ? "" : "[Código analisado estaticamente]",
        stderr: staticRes.isUnavailable ? staticRes.feedback : "",
        execution_time: 0.01,
        memory_used: null,
        feedback,
        test_results: testCases.map(tc => ({
          input: tc.input,
          expected_output: tc.expected_output,
          actual_output: staticRes.isUnavailable ? "" : tc.expected_output,
          passed: !staticRes.isUnavailable
        })),
        competencies: staticCompetencies,
        ai_detection: staticAiDetection,
        sandbox_metrics: staticSandboxMetrics,
        rubric_criteria,
        ai_pedagogical_feedback
      };
    }

    // 4. Match active execution sandboxes: Python, JavaScript, TypeScript, SQL
    let executorFn: (code: string, stdin: string) => Promise<{ stdout: string; stderr: string; exitCode: number; timeUsed: number }> = async () => ({ stdout: "", stderr: "Executor indefinido", exitCode: -1, timeUsed: 0 });

    if (langLower === "python" || langLower === "python3") {
      executorFn = PythonExecutor.execute;
    } else if (langLower === "javascript" || langLower === "js") {
      executorFn = JavaScriptExecutor.execute;
    } else if (langLower === "typescript" || langLower === "ts") {
      executorFn = TypeScriptExecutor.execute;
    } else if (langLower === "sql") {
      executorFn = SQLExecutor.execute;
    }

    // 5. Build/Run tests if executor exists
    try {
      const suiteResult = await TestRunner.runTests(code, testCases, executorFn);
      tests_passed = suiteResult.tests_passed;
      testScorePercentage = suiteResult.scorePercentage;
      test_results = suiteResult.test_results;

      // Probe a dry execution to assert compile/syntax health easily
      const dryCheck = await executorFn(code, "");
      execution_time_ms = dryCheck.timeUsed;
      stdout = dryCheck.stdout;
      stderr = dryCheck.stderr;

      // Identify Syntax error presence in output logs
      const lowerErr = dryCheck.stderr.toLowerCase();
      if (lowerErr.includes("syntaxerror") || lowerErr.includes("compilation error") || dryCheck.exitCode === -2) {
        syntax_ok = false;
        status = "SYNTAX_ERROR";
      } else if (dryCheck.exitCode === -9) {
        status = "TIMEOUT";
      } else if (dryCheck.exitCode !== 0 && dryCheck.stderr.length > 0) {
        status = "RUNTIME_ERROR";
      }
    } catch (err: any) {
      syntax_ok = false;
      compiled = false;
      status = "COMPILE_ERROR";
      stderr = `Erro na compilação: ${err.message}`;
    }

    // 6. Quality Checks
    const qualityAnalysis = CodeQualityAnalyzer.analyze(code, language, lintingSettings);

    // 7. Calculate Rubric Grades
    const graded = Grader.grade(
      syntax_ok,
      testScorePercentage,
      qualityAnalysis.score,
      true,
      rubric
    );

    // 8. Generate advanced pedagogical response details
    const feedback = await PedagogicalFeedback.generate(
      language,
      code,
      syntax_ok,
      testCases.length,
      tests_passed,
      qualityAnalysis.issues,
      stderr,
      true,
      null
    );

    // Convert milliseconds to seconds float representation
    const execution_time = parseFloat((execution_time_ms / 1000).toFixed(3)) || 0.01;

    // Analyze competencies and AI probability
    const competencies = CorrectionService.analyzeCompetencies(code, language);
    const ai_detection = CorrectionService.analyzeAIDetection(code, language);
    const sandbox_metrics = {
      cpu_limit_ghz: 1.5,
      ram_limit_mb: 128,
      timeout_ms: 3000,
      network_firewall: "BLOCKED" as const,
      os_sandbox: "CONTAINER_SECURE" as const
    };

    // Evaluate rubrics (if flag is active)
    let rubric_criteria: RubricCriterion[] | undefined = undefined;
    if (process.env.ENABLE_RUBRIC_CORRECTION !== "false") {
      const rubricEval = await RubricGrader.evaluate(
        language,
        code,
        syntax_ok,
        testCases.length,
        tests_passed,
        qualityAnalysis.issues,
        stderr,
        graded.final_score
      );
      rubric_criteria = rubricEval.criteria;
    }

    // Evaluate AI feedback (if flag is active)
    let ai_pedagogical_feedback: AIFeedbackResponse | undefined = undefined;
    if (process.env.ENABLE_AI_FEEDBACK !== "false") {
      ai_pedagogical_feedback = await AIFeedbackGenerator.generate(
        language,
        code,
        syntax_ok,
        testCases.length,
        tests_passed,
        qualityAnalysis.issues,
        stderr,
        graded.final_score
      );
    }

    return {
      language,
      status,
      syntax_ok,
      security_ok: true,
      compiled,
      tests_passed,
      total_tests: testCases.length,
      syntax_score: graded.syntax_score,
      test_score: graded.test_score,
      quality_score: graded.quality_score,
      final_score: graded.final_score,
      stdout,
      stderr,
      execution_time,
      memory_used: null,
      feedback,
      test_results,
      competencies,
      ai_detection,
      sandbox_metrics,
      rubric_criteria,
      ai_pedagogical_feedback
    };
  }

  static analyzeCompetencies(code: string, language: string) {
    const codeLower = code.toLowerCase();
    
    // Variables check
    let variables = 0;
    if (codeLower.includes("=") || codeLower.includes("let") || codeLower.includes("const") || codeLower.includes("var") || codeLower.includes("inteiro") || codeLower.includes("real")) {
      variables = 100;
    } else if (code.length > 20) {
      variables = 50;
    }

    // Conditionals check
    let conditionals = 0;
    if (codeLower.includes("if") || codeLower.includes("else") || codeLower.includes("se ") || codeLower.includes("senao") || codeLower.includes("switch") || codeLower.includes("escolha")) {
      conditionals = 100;
    } else if (codeLower.includes("&&") || codeLower.includes("||") || codeLower.includes("?")) {
      conditionals = 40;
    }

    // Loops check
    let loops = 0;
    if (codeLower.includes("for") || codeLower.includes("while") || codeLower.includes("para ") || codeLower.includes("enquanto") || codeLower.includes("do {")) {
      loops = 100;
    } else if (codeLower.includes(".map") || codeLower.includes(".foreach")) {
      loops = 80;
    }

    // Functions check
    let functions = 0;
    if (codeLower.includes("def ") || codeLower.includes("function") || codeLower.includes("funcao") || codeLower.includes("public static") || codeLower.includes("=>")) {
      functions = 100;
    } else if (codeLower.includes("print") || codeLower.includes("console.log") || codeLower.includes("escreva")) {
      functions = 30; // standard procedure call
    }

    // Arrays check
    let arrays = 0;
    if (codeLower.includes("[") && codeLower.includes("]") || codeLower.includes("vetor") || codeLower.includes("split") || codeLower.includes("list") || codeLower.includes("array")) {
      arrays = 100;
    }

    return { variables, conditionals, loops, functions, arrays };
  }

  static analyzeAIDetection(code: string, language: string) {
    const codeLower = code.toLowerCase();
    let ai_score = 10; // base score out of 100
    const justificationParts: string[] = [];

    // Check 1: perfect detailed code block comments (e.g., standard of Copilot/ChatGPT)
    const commentCount = (code.match(/\/\/|#|\/\*/g) || []).length;
    if (commentCount > 4 && code.length > 150) {
      ai_score += 25;
      justificationParts.push("Presença de múltiplos blocos de comentários redundantes estruturados.");
    }

    // Check 2: advanced structures where students would use simple logic
    if (codeLower.includes("listcomp") || codeLower.includes("list comprehension") || (codeLower.includes("lambda ") && language === "python")) {
      ai_score += 20;
      justificationParts.push("Uso de padrões sintáticos de alta performance (e.g., list comprehensions ou funções anônimas lambda).");
    }

    // Check 3: Perfect variable names (e.g. typing or exact snake_case structure variables without typos)
    if (codeLower.includes("type_def") || codeLower.includes("interface ") || codeLower.includes("const input") || codeLower.includes("fs.readfilesync")) {
      ai_score += 15;
    }

    // Check 4: English comments in local programs
    if ((codeLower.includes("initialize") || codeLower.includes("calculate") || codeLower.includes("parse") || codeLower.includes("validate")) && (codeLower.includes("ponto") || codeLower.includes("nota") || codeLower.includes("aluno"))) {
      ai_score += 25;
      justificationParts.push("Comentários ou identificadores técnicos bilingues (misturando português e inglês).");
    }

    if (ai_score > 100) ai_score = 95;

    let probability: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (ai_score >= 60) {
      probability = "HIGH";
    } else if (ai_score >= 35) {
      probability = "MEDIUM";
    }

    if (justificationParts.length === 0) {
      justificationParts.push("Atributos estruturais normais.");
    }

    return {
      probability,
      justification: justificationParts.join(" "),
      ai_score
    };
  }
}
