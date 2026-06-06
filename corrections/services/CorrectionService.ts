import { SecurityAnalyzer } from "../security/SecurityAnalyzer.ts";
import { CodeQualityAnalyzer } from "../analyzers/CodeQualityAnalyzer.ts";
import { TestRunner } from "../test_runner/TestRunner.ts";
import { Grader, Rubric } from "../graders/Grader.ts";
import { PedagogicalFeedback, FeedbackStructure } from "../feedback/PedagogicalFeedback.ts";

import { PythonExecutor } from "../executors/PythonExecutor.ts";
import { JavaScriptExecutor } from "../executors/JavaScriptExecutor.ts";
import { TypeScriptExecutor } from "../executors/TypeScriptExecutor.ts";
import { SQLExecutor } from "../executors/SQLExecutor.ts";
import { StaticLangsExecutor } from "../executors/StaticLangsExecutor.ts";
import { TestCase } from "../executors/BaseExecutor.ts";

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
}

export class CorrectionService {
  /**
   * Main orchestrator of the Correction Engine 2.0 Pipeline
   */
  static async run(
    language: string,
    code: string,
    testCases: TestCase[],
    rubric?: Rubric
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

    // 3. Static check if the language is not executable locally, or if is static Portugol/Pseudocode
    const isStaticOrUnavailable = ["portugol", "pseudocode", "pseudocodigo", "pseudocódigo", "java", "c", "cpp", "csharp", "php", "go", "rust", "kotlin"].includes(langLower);
    
    if (isStaticOrUnavailable) {
      const staticRes = StaticLangsExecutor.analyze(code, language);
      
      const qualityAnalysis = CodeQualityAnalyzer.analyze(code, language);
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
        }))
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
    const qualityAnalysis = CodeQualityAnalyzer.analyze(code, language);

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
      test_results
    };
  }
}
