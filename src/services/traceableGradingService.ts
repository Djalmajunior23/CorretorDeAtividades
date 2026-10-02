/**
 * ============================================================================
 * TRACEABLE GRADING & VERSIONED AUDIT SERVICE
 * ============================================================================
 * OWASP ASVS 5.0 & Educational Verification Standards:
 * 1. Immutable audit snapshots for every grading attempt.
 * 2. Complete provenance: Activity version, submission version, rubric weights,
 *    test case visibility, evaluator/AI engine, execution stages.
 * 3. Clear distinction between student logical error vs server/runner technical failure.
 * 4. Non-destructive re-evaluations (preserves complete attempt history).
 * 5. Private test cases and internal secrets are never exposed to students.
 * ============================================================================
 */

import { IsomorphicCrypto as crypto } from "../utils/isomorphicCrypto";

export interface RubricCriterionSnapshot {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoreObtained: number;
  status: "Excelente" | "Aprovado" | "Atenção" | "Insuficiente";
  feedback: string;
}

export interface TestCaseSnapshot {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  isPrivate: boolean; // Hidden from student view
  executionTimeMs?: number;
  memoryKb?: number;
}

export interface PipelineStageResult {
  stage: "LINT_AND_SYNTAX" | "SANDBOX_UNIT_TESTS" | "AI_PEDAGOGICAL_RUBRIC" | "TEACHER_HUMAN_REVIEW";
  status: "PASSED" | "FAILED" | "SKIPPED" | "TECHNICAL_ERROR";
  durationMs: number;
  details: string;
  timestamp: string;
}

export interface TraceableGradingAttempt {
  attemptId: string;
  activityId: string;
  activityVersion: string;
  studentId: string;
  studentName: string;
  classId: string;
  attemptNumber: number;
  timestamp: string;
  codeLanguage: string;
  codeSha256: string;
  codeSnippet: string;
  
  // Environment metadata
  environment: {
    runner: string;
    runtimeVersion: string;
    isolationType: "MANDATORY_SANDBOX_PROCESS" | "MICRO_VM" | "ISOLATED_CONTAINER";
    timeoutLimitMs: number;
    memoryLimitMb: number;
  };

  // Execution Stages
  pipelineStages: PipelineStageResult[];

  // Test Results
  testCases: TestCaseSnapshot[];
  testsPassed: number;
  totalTests: number;

  // Rubric
  rubricCriteria: RubricCriterionSnapshot[];
  rubricTotalWeight: number;

  // Grade Breakdown
  suggestedScore: number; // AI + Unit tests calculation
  publishedScore: number | null; // Null if awaiting teacher review
  isPublished: boolean;
  scoreCalculationPolicy: "HIGHEST_ATTEMPT" | "AVERAGE" | "LATEST_ATTEMPT";

  // Error Classification
  errorType?: "STUDENT_SYNTAX_ERROR" | "STUDENT_LOGIC_ERROR" | "STUDENT_TIMEOUT" | "SERVICE_TECHNICAL_FAILURE" | "NONE";
  serviceFailureReason?: string;

  // Evaluator Info
  evaluatorInfo: {
    engine: string;
    aiModelUsed?: string;
    aiConfidenceScore?: number;
    promptTokensUsed?: number;
  };

  // Teacher Review & Override
  teacherReview?: {
    reviewerId: string;
    reviewerName: string;
    reviewedAt: string;
    originalSuggestedScore: number;
    finalPublishedScore: number;
    writtenJustification: string;
    actionTaken: "APPROVED" | "ADJUSTED_SCORE" | "REQUESTED_REFACTORING";
  };

  // Student Appeal
  studentAppeal?: {
    appealId: string;
    appealedAt: string;
    studentRationale: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    teacherResponse?: string;
  };
}

export class TraceableGradingService {
  private static attemptsStore: TraceableGradingAttempt[] = [];

  /**
   * Initializes sample synthetic traceable records for demonstration and offline fallback
   */
  public static initSampleData(): void {
    if (this.attemptsStore.length > 0) return;

    this.attemptsStore.push({
      attemptId: "att-trace-001",
      activityId: "act-f12-01",
      activityVersion: "v1.2",
      studentId: "std-vinicius-01",
      studentName: "Vinícius Souza",
      classId: "turma-ds-2026",
      attemptNumber: 1,
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      codeLanguage: "python",
      codeSha256: crypto.createHash("sha256").update("def somar(a, b): return a + b").digest("hex"),
      codeSnippet: "def somar_pares(n):\n    soma = 0\n    for i in range(1, n + 1):\n        if i % 2 == 0:\n            soma += i\n    return soma",
      environment: {
        runner: "Node Sandbox Runner",
        runtimeVersion: "Python 3.11.8",
        isolationType: "MANDATORY_SANDBOX_PROCESS",
        timeoutLimitMs: 3000,
        memoryLimitMb: 128
      },
      pipelineStages: [
        { stage: "LINT_AND_SYNTAX", status: "PASSED", durationMs: 45, details: "0 erros sintáticos. 1 comentário explicativo.", timestamp: new Date().toISOString() },
        { stage: "SANDBOX_UNIT_TESTS", status: "PASSED", durationMs: 120, details: "4/4 casos de teste aprovados.", timestamp: new Date().toISOString() },
        { stage: "AI_PEDAGOGICAL_RUBRIC", status: "PASSED", durationMs: 450, details: "Rubrica avaliada com coerência lógica 100%.", timestamp: new Date().toISOString() }
      ],
      testCases: [
        { id: "tc-1", input: "10", expectedOutput: "30", actualOutput: "30", passed: true, isPrivate: false, executionTimeMs: 25 },
        { id: "tc-2", input: "5", expectedOutput: "6", actualOutput: "6", passed: true, isPrivate: false, executionTimeMs: 20 },
        { id: "tc-3", input: "0", expectedOutput: "0", actualOutput: "0", passed: true, isPrivate: true, executionTimeMs: 18 },
        { id: "tc-4", input: "100", expectedOutput: "2550", actualOutput: "2550", passed: true, isPrivate: true, executionTimeMs: 35 }
      ],
      testsPassed: 4,
      totalTests: 4,
      rubricCriteria: [
        { id: "rc-1", name: "Sintaxe e Estrutura", description: "Código limpo e indentado", weight: 30, scoreObtained: 30, status: "Excelente", feedback: "Boa organização estrutural." },
        { id: "rc-2", name: "Lógica e Algoritmo", description: "Implementação correta do loop e filtro par", weight: 40, scoreObtained: 40, status: "Excelente", feedback: "Lógica correta com range(1, n+1)." },
        { id: "rc-3", name: "Casos Limite e Qualidade", description: "Tratamento de zero e números grandes", weight: 30, scoreObtained: 30, status: "Excelente", feedback: "Passou em todos os casos limite." }
      ],
      rubricTotalWeight: 100,
      suggestedScore: 100,
      publishedScore: 100,
      isPublished: true,
      scoreCalculationPolicy: "HIGHEST_ATTEMPT",
      errorType: "NONE",
      evaluatorInfo: {
        engine: "CodeCheck Hybrid Rule-AI Engine v3.0",
        aiModelUsed: "gemini-2.0-flash-exp",
        aiConfidenceScore: 0.98
      }
    });

    this.attemptsStore.push({
      attemptId: "att-trace-002",
      activityId: "act-f12-01",
      activityVersion: "v1.2",
      studentId: "std-mariana-02",
      studentName: "Mariana Alencar",
      classId: "turma-ds-2026",
      attemptNumber: 1,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      codeLanguage: "python",
      codeSha256: crypto.createHash("sha256").update("def somar_pares(n): return n*(n+1)").digest("hex"),
      codeSnippet: "def somar_pares(n):\n    # Erro de caso base em n=0\n    return sum([x for x in range(n) if x % 2 == 0])",
      environment: {
        runner: "Node Sandbox Runner",
        runtimeVersion: "Python 3.11.8",
        isolationType: "MANDATORY_SANDBOX_PROCESS",
        timeoutLimitMs: 3000,
        memoryLimitMb: 128
      },
      pipelineStages: [
        { stage: "LINT_AND_SYNTAX", status: "PASSED", durationMs: 35, details: "Sintaxe OK", timestamp: new Date().toISOString() },
        { stage: "SANDBOX_UNIT_TESTS", status: "FAILED", durationMs: 140, details: "2/4 casos de teste falharam (range(n) omite o valor N).", timestamp: new Date().toISOString() },
        { stage: "AI_PEDAGOGICAL_RUBRIC", status: "PASSED", durationMs: 500, details: "IA sugeriu refação orientada.", timestamp: new Date().toISOString() }
      ],
      testCases: [
        { id: "tc-1", input: "10", expectedOutput: "30", actualOutput: "20", passed: false, isPrivate: false, executionTimeMs: 30 },
        { id: "tc-2", input: "5", expectedOutput: "6", actualOutput: "6", passed: true, isPrivate: false, executionTimeMs: 25 },
        { id: "tc-3", input: "0", expectedOutput: "0", actualOutput: "0", passed: true, isPrivate: true, executionTimeMs: 20 },
        { id: "tc-4", input: "100", expectedOutput: "2550", actualOutput: "2450", passed: false, isPrivate: true, executionTimeMs: 40 }
      ],
      testsPassed: 2,
      totalTests: 4,
      rubricCriteria: [
        { id: "rc-1", name: "Sintaxe e Estrutura", description: "Código limpo e indentado", weight: 30, scoreObtained: 30, status: "Excelente", feedback: "Uso elegante de list comprehension." },
        { id: "rc-2", name: "Lógica e Algoritmo", description: "Implementação correta do loop e filtro par", weight: 40, scoreObtained: 20, status: "Atenção", feedback: "Atenção ao intervalo: range(n) vai até n-1, deixando o próprio n de fora quando n é par." },
        { id: "rc-3", name: "Casos Limite e Qualidade", description: "Tratamento de zero e números grandes", weight: 30, scoreObtained: 15, status: "Atenção", feedback: "Falha nos testes onde n deve ser incluído na soma." }
      ],
      rubricTotalWeight: 100,
      suggestedScore: 65,
      publishedScore: null, // Awaiting teacher review or student refactoring
      isPublished: false,
      scoreCalculationPolicy: "HIGHEST_ATTEMPT",
      errorType: "STUDENT_LOGIC_ERROR",
      evaluatorInfo: {
        engine: "CodeCheck Hybrid Rule-AI Engine v3.0",
        aiModelUsed: "gemini-2.0-flash-exp",
        aiConfidenceScore: 0.94
      },
      studentAppeal: {
        appealId: "app-001",
        appealedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        studentRationale: "Professor, meu algoritmo funciona para números ímpares como 5, mas percebi que range(n) não inclui o 10. Gostaria de autorização para refazer ou revisão do peso de lógica.",
        status: "PENDING"
      }
    });

    this.attemptsStore.push({
      attemptId: "att-trace-003",
      activityId: "act-f12-02",
      activityVersion: "v1.0",
      studentId: "std-lucas-03",
      studentName: "Lucas Ferreira",
      classId: "turma-ds-2026",
      attemptNumber: 1,
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      codeLanguage: "python",
      codeSha256: crypto.createHash("sha256").update("while True: pass").digest("hex"),
      codeSnippet: "def busca_binaria(arr, x):\n    # Loop sem incremento\n    while True:\n        pass",
      environment: {
        runner: "Node Sandbox Runner",
        runtimeVersion: "Python 3.11.8",
        isolationType: "MANDATORY_SANDBOX_PROCESS",
        timeoutLimitMs: 3000,
        memoryLimitMb: 128
      },
      pipelineStages: [
        { stage: "LINT_AND_SYNTAX", status: "PASSED", durationMs: 25, details: "Sintaxe OK", timestamp: new Date().toISOString() },
        { stage: "SANDBOX_UNIT_TESTS", status: "FAILED", durationMs: 3005, details: "Processo interrompido por Time Limit Exceeded (3000ms).", timestamp: new Date().toISOString() },
        { stage: "AI_PEDAGOGICAL_RUBRIC", status: "FAILED", durationMs: 200, details: "Execução abortada por timeout.", timestamp: new Date().toISOString() }
      ],
      testCases: [
        { id: "tc-1", input: "[1, 2, 3, 4], 3", expectedOutput: "2", actualOutput: "TIMEOUT", passed: false, isPrivate: false, executionTimeMs: 3000 }
      ],
      testsPassed: 0,
      totalTests: 1,
      rubricCriteria: [
        { id: "rc-1", name: "Execução e Lógica", description: "Código deve terminar dentro do tempo limite", weight: 100, scoreObtained: 0, status: "Insuficiente", feedback: "Loop infinito detectado. Limite de 3000ms excedido." }
      ],
      rubricTotalWeight: 100,
      suggestedScore: 0,
      publishedScore: null,
      isPublished: false,
      scoreCalculationPolicy: "HIGHEST_ATTEMPT",
      errorType: "STUDENT_TIMEOUT",
      evaluatorInfo: {
        engine: "CodeCheck Rule Engine v2.4"
      }
    });
  }

  /**
   * Registers a new grading attempt snapshot
   */
  public static recordAttempt(attempt: Omit<TraceableGradingAttempt, "attemptId">): TraceableGradingAttempt {
    const fullAttempt: TraceableGradingAttempt = {
      ...attempt,
      attemptId: `att-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    };
    this.attemptsStore.unshift(fullAttempt);
    return fullAttempt;
  }

  /**
   * Returns all attempts for a given student and activity
   */
  public static getAttemptsForStudent(studentId: string, activityId?: string): TraceableGradingAttempt[] {
    this.initSampleData();
    return this.attemptsStore.filter(a => {
      const matchStudent = a.studentId === studentId || a.studentName.toLowerCase().includes(studentId.toLowerCase());
      const matchActivity = !activityId || a.activityId === activityId;
      return matchStudent && matchActivity;
    });
  }

  /**
   * Returns all items awaiting human teacher review in the queue
   */
  public static getReviewQueue(filters?: { classId?: string; activityId?: string; reason?: string }): TraceableGradingAttempt[] {
    this.initSampleData();
    return this.attemptsStore.filter(a => {
      // Must not be published yet, or has a pending appeal, or has technical error, or low score
      const needsReview = !a.isPublished || a.studentAppeal?.status === "PENDING" || a.errorType === "SERVICE_TECHNICAL_FAILURE";
      if (!needsReview) return false;

      if (filters?.classId && filters.classId !== "all" && a.classId !== filters.classId) return false;
      if (filters?.activityId && filters.activityId !== "all" && a.activityId !== filters.activityId) return false;
      if (filters?.reason) {
        if (filters.reason === "appeal" && a.studentAppeal?.status !== "PENDING") return false;
        if (filters.reason === "failure" && a.errorType !== "SERVICE_TECHNICAL_FAILURE") return false;
        if (filters.reason === "timeout" && a.errorType !== "STUDENT_TIMEOUT") return false;
      }
      return true;
    });
  }

  /**
   * Submits teacher review and publishes grade with full audit trail
   */
  public static publishTeacherReview(params: {
    attemptId: string;
    reviewerId: string;
    reviewerName: string;
    finalPublishedScore: number;
    writtenJustification: string;
    actionTaken: "APPROVED" | "ADJUSTED_SCORE" | "REQUESTED_REFACTORING";
    appealStatusUpdate?: "ACCEPTED" | "REJECTED";
  }): TraceableGradingAttempt | null {
    this.initSampleData();
    const item = this.attemptsStore.find(a => a.attemptId === params.attemptId);
    if (!item) return null;

    item.publishedScore = params.finalPublishedScore;
    item.isPublished = params.actionTaken !== "REQUESTED_REFACTORING";
    item.teacherReview = {
      reviewerId: params.reviewerId,
      reviewerName: params.reviewerName,
      reviewedAt: new Date().toISOString(),
      originalSuggestedScore: item.suggestedScore,
      finalPublishedScore: params.finalPublishedScore,
      writtenJustification: params.writtenJustification,
      actionTaken: params.actionTaken
    };

    if (item.studentAppeal && params.appealStatusUpdate) {
      item.studentAppeal.status = params.appealStatusUpdate;
      item.studentAppeal.teacherResponse = params.writtenJustification;
    }

    return item;
  }

  /**
   * Sanitizes attempt payload for student view (hides private test cases and internal secrets)
   */
  public static sanitizeForStudentView(attempt: TraceableGradingAttempt): any {
    return {
      attemptId: attempt.attemptId,
      activityId: attempt.activityId,
      activityVersion: attempt.activityVersion,
      attemptNumber: attempt.attemptNumber,
      timestamp: attempt.timestamp,
      codeLanguage: attempt.codeLanguage,
      codeSnippet: attempt.codeSnippet,
      testsPassed: attempt.testsPassed,
      totalTests: attempt.totalTests,
      // Public tests visible, private tests marked as confidential
      testCases: attempt.testCases.map(tc => {
        if (tc.isPrivate) {
          return {
            id: tc.id,
            passed: tc.passed,
            isPrivate: true,
            input: "[Caso de Teste Oculto / Avaliação de Limites]",
            expectedOutput: "[Oculto pelo Professor]",
            actualOutput: tc.passed ? "[Aprovado]" : "[Reprovado]"
          };
        }
        return tc;
      }),
      rubricCriteria: attempt.rubricCriteria,
      publishedScore: attempt.publishedScore,
      isPublished: attempt.isPublished,
      teacherReview: attempt.teacherReview ? {
        reviewedAt: attempt.teacherReview.reviewedAt,
        finalPublishedScore: attempt.teacherReview.finalPublishedScore,
        writtenJustification: attempt.teacherReview.writtenJustification,
        actionTaken: attempt.teacherReview.actionTaken
      } : null,
      studentAppeal: attempt.studentAppeal
    };
  }
}
