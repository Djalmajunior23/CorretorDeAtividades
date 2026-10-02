import { describe, it, expect, beforeEach } from "vitest";
import { ActivityValidatorService } from "../services/activityValidatorService";
import { TraceableGradingService } from "../services/traceableGradingService";
import { RefactoringCycleService } from "../services/refactoringCycleService";
import { SqlDialectEvaluationService } from "../services/sqlDialectEvaluationService";
import { PedagogicalInterventionService } from "../services/pedagogicalInterventionService";
import { PeerReviewService } from "../services/peerReviewService";
import { ReliableSubmissionService } from "../services/reliableSubmissionService";

describe("Pedagogical Evolution & Verifiable Assessment Suite", () => {
  beforeEach(() => {
    TraceableGradingService.initSampleData();
  });

  describe("1. Activity Pre-flight Validator (Authoring QA)", () => {
    it("deve validar o gabarito oficial no Sandbox e aprovar atividade coerente", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Algoritmo de Somatório Par",
        statement: "Implemente a função somar_pares(n) que retorna a soma dos números pares de 1 a N.",
        language: "python",
        starterCode: "def somar_pares(n):\n    pass",
        referenceSolution: "def somar_pares(n):\n    if n <= 0: return 0\n    return sum(i for i in range(2, n + 1, 2))",
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
          { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
          { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true },
          { id: "tc-4", input: "100", expectedOutput: "2550", isPrivate: true }
        ],
        rubric: [
          { id: "r-1", name: "Sintaxe", weight: 30, description: "Indentação e boas práticas" },
          { id: "r-2", name: "Lógica", weight: 40, description: "Cálculo do somatório" },
          { id: "r-3", name: "Casos Limite", weight: 30, description: "Tratamento de n=0" }
        ],
        maxAttempts: 3
      });

      expect(report.isValidForPublishing).toBe(true);
      expect(report.summary.passedCount).toBeGreaterThanOrEqual(4);
      expect(report.summary.failedCount).toBe(0);
      expect(report.newVersionProposed).toBe("v1.1");
    });

    it("deve bloquear publicação quando a soma dos pesos da rubrica for diferente de 100%", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Atividade com Erro de Rubrica",
        statement: "Enunciado detalhado com restrições e casos de teste especificados.",
        language: "python",
        starterCode: "def teste(): pass",
        referenceSolution: "def teste(): return 42",
        testCases: [
          { id: "tc-1", input: "", expectedOutput: "42", isPrivate: false },
          { id: "tc-2", input: "0", expectedOutput: "42", isPrivate: true }
        ],
        rubric: [
          { id: "r-1", name: "Critério A", weight: 50, description: "50%" },
          { id: "r-2", name: "Critério B", weight: 30, description: "30% (Total 80% - Errado!)" }
        ],
        maxAttempts: 2
      });

      expect(report.isValidForPublishing).toBe(false);
      expect(report.summary.failedCount).toBeGreaterThan(0);
    });
  });

  describe("2. Traceable Grading Engine & Teacher Review Central", () => {
    it("deve registrar snapshot imutável e proteger casos de teste privados na visão do aluno", () => {
      const attempts = TraceableGradingService.getAttemptsForStudent("std-vinicius-01");
      expect(attempts.length).toBeGreaterThan(0);

      const attempt = attempts[0];
      expect(attempt.activityVersion).toBeDefined();
      expect(attempt.codeSha256).toBeDefined();
      expect(attempt.pipelineStages.length).toBeGreaterThan(0);

      const studentView = TraceableGradingService.sanitizeForStudentView(attempt);
      const privateTests = studentView.testCases.filter((tc: any) => tc.isPrivate);
      expect(privateTests.length).toBeGreaterThan(0);

      // Casos privados não devem exibir dados reais de entrada e saída esperada
      privateTests.forEach((tc: any) => {
        expect(tc.input).toContain("Oculto");
        expect(tc.expectedOutput).toContain("Oculto");
      });
    });

    it("deve permitir que o professor homologue ou ajuste nota com justificativa auditada", () => {
      const queue = TraceableGradingService.getReviewQueue();
      expect(queue.length).toBeGreaterThan(0);

      const target = queue[0];
      const updated = TraceableGradingService.publishTeacherReview({
        attemptId: target.attemptId,
        reviewerId: "prof-djalma",
        reviewerName: "Professor Djalma Batista",
        finalPublishedScore: 85,
        writtenJustification: "Recurso acolhido: lógica parcialmente correta.",
        actionTaken: "ADJUSTED_SCORE",
        appealStatusUpdate: "ACCEPTED"
      });

      expect(updated).not.toBeNull();
      expect(updated?.publishedScore).toBe(85);
      expect(updated?.teacherReview?.writtenJustification).toContain("Recurso acolhido");
      expect(updated?.isPublished).toBe(true);
    });
  });

  describe("3. Guided Refactoring Cycle (Ciclo de Refação Orientada)", () => {
    it("deve gerenciar scaffolding com desbloqueio de dicas progressivas e histórico de versões", () => {
      const session = RefactoringCycleService.getSession("std-vinicius", "act-f12-01");
      expect(session.versions.length).toBeGreaterThan(0);
      expect(session.hints.length).toBe(3);

      // Desbloquear dica nível 2
      const hint2 = RefactoringCycleService.unlockHint("std-vinicius", "act-f12-01", 2);
      expect(hint2?.isUnlocked).toBe(true);

      // Submeter refação com justificativa
      const updatedSession = RefactoringCycleService.submitRefactoring({
        studentId: "std-vinicius",
        activityId: "act-f12-01",
        newCode: "def somar_pares(n):\n    return sum(i for i in range(2, n + 1, 2))",
        changeRationale: "Corrigi o limite superior para n+1 e usei passo 2",
        scoreObtained: 100,
        feedbackHighlights: ["100% dos testes aprovados"],
        testsPassed: 4,
        totalTests: 4
      });

      expect(updatedSession.versions.length).toBe(2);
      expect(updatedSession.attemptsCount).toBe(2);

      const finalScore = RefactoringCycleService.calculateFinalScore(updatedSession);
      expect(finalScore).toBe(100);
    });
  });

  describe("4. Multi-Dialect SQL Evaluation", () => {
    it("deve avaliar consultas por semântica de conjuntos independentemente da ordem quando não exigido ORDER BY", () => {
      const exercise = {
        id: "sql-test",
        title: "Listagem de Alunos",
        dialect: "postgresql" as const,
        level: "SELECT" as const,
        statement: "Selecione nome e nota",
        schemaInitScript: "",
        seedDataScript: "",
        expectedQuery: "SELECT nome, nota FROM alunos",
        requiresStrictOrdering: false,
        gradingType: "QUERY_RESULT" as const,
        rubric: { correctnessWeight: 60, syntaxWeight: 20, performanceWeight: 20 }
      };

      const expectedRows = [
        { nome: "Mariana Alencar", nota: 88.0 },
        { nome: "Vinícius Souza", nota: 95.5 }
      ];

      // Aluno retornou na ordem inversa:
      const actualRowsReversed = [
        { nome: "Vinícius Souza", nota: 95.5 },
        { nome: "Mariana Alencar", nota: 88.0 }
      ];

      const result = SqlDialectEvaluationService.evaluateQuery({
        studentQuery: "SELECT nome, nota FROM alunos",
        exercise,
        actualRows: actualRowsReversed,
        expectedRows
      });

      expect(result.success).toBe(true);
      expect(result.score).toBe(100);
      expect(result.semanticMatch).toBe(true);
    });
  });

  describe("5. Pedagogical Diagnostic & Targeted Intervention", () => {
    it("deve mapear clusters de erros por competência e atribuir reforço em 1-clique", () => {
      const clusters = PedagogicalInterventionService.getClusters();
      expect(clusters.length).toBeGreaterThan(0);

      const cluster = clusters[0];
      expect(cluster.affectedStudentsCount).toBeGreaterThan(0);
      expect(cluster.recommendedReinforcement).toBeDefined();

      const assigned = PedagogicalInterventionService.assignIntervention(cluster.clusterId);
      expect(assigned?.interventionStatus).toBe("EM_PROGRESSO");
    });
  });

  describe("6. Double-Blind Peer Review (Revisão por Pares)", () => {
    it("deve permitir avaliação anônima por pares e submeter à moderação docente", () => {
      const assignments = PeerReviewService.getAssignmentsForReviewer("std-vinicius");
      expect(assignments.length).toBeGreaterThan(0);

      const target = assignments[0];
      expect(target.authorPseudonym).toContain("Colega");

      const submitted = PeerReviewService.submitEvaluation({
        assignmentId: target.assignmentId,
        rubricScores: [
          { criterionName: "Legibilidade", scoreGiven: 10, comment: "Código limpo" },
          { criterionName: "Eficiência", scoreGiven: 9, comment: "Boa lógica" }
        ],
        overallPeerScore: 95,
        qualitativeFeedback: "Muito bom! Parabéns pela organização."
      });

      expect(submitted?.status).toBe("AVALIADO");
      expect(submitted?.isModerated).toBe(false);

      // Professor modera
      const moderated = PeerReviewService.moderateReview(target.assignmentId, true, "Aprovado pelo professor.");
      expect(moderated?.status).toBe("MODERADO_PELO_PROFESSOR");
      expect(moderated?.teacherApproved).toBe(true);
    });
  });

  describe("7. Reliable Submission & Cryptographic Receipt", () => {
    it("deve gerar comprovante digital de entrega com SHA-256 e assinatura digital HMAC", () => {
      const receipt = ReliableSubmissionService.generateReceipt({
        activityId: "act-f12-01",
        activityVersion: "v1.2",
        studentId: "std-vinicius",
        studentName: "Vinícius Souza",
        codeContent: "def somar(a, b): return a + b",
        attemptNumber: 1
      });

      expect(receipt.receiptId).toBeDefined();
      expect(receipt.codeSha256Checksum).toBeDefined();
      expect(receipt.digitalSignatureHmac).toBeDefined();
      expect(receipt.serverConfirmationToken.startsWith("TOKEN-")).toBe(true);
      expect(receipt.submittedAtIso).toBeDefined();
    });

    it("deve fazer pre-flight de importação em lote com detecção de nomes e duplicidades", () => {
      const sampleFiles = [
        { filename: "Vinicius_Souza_lista1.py", content: "print('Vinicius')" },
        { filename: "Mariana_Alencar_lista1.py", content: "print('Mariana')" },
        { filename: "Desconhecido_lista1.py", content: "print('Ninguém')" },
        { filename: "Vinicius_Souza_duplicata.py", content: "print('Vinicius repetido')" }
      ];

      const roster = [
        { id: "std-01", name: "Vinícius Souza" },
        { id: "std-02", name: "Mariana Alencar" }
      ];

      const mapping = ReliableSubmissionService.preflightBatchMapping(sampleFiles, roster);
      expect(mapping.length).toBe(4);

      expect(mapping[0].status).toBe("MATCHED");
      expect(mapping[1].status).toBe("MATCHED");
      expect(mapping[2].status).toBe("UNRESOLVED_STUDENT");
      expect(mapping[3].status).toBe("DUPLICATE_WARNING");
    });
  });
});
