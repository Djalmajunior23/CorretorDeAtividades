import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { ActivityValidatorService } from "../services/activityValidatorService";
import { PilotClassroomService } from "../services/pilotClassroomService";
import { ReliableSubmissionService } from "../services/reliableSubmissionService";
import { SystemIntegrityDiagnosticsService } from "../services/systemIntegrityDiagnosticsService";
import { generateJwtToken } from "../utils/security";

describe("Integrated Pedagogical Pilot, Backend Evaluation & Demo Isolation Suite", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, null);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 3000;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // FRENTE 1: VALIDAÇÃO REAL & MUTANTES CONCRETOS
  // =========================================================================
  describe("Frente 1: Pre-Flight Activity Validation & Mutant Testing", () => {
    it("should strictly reject constant -999 solution and forbid publishing", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Soma de Pares",
        statement: "Desenvolva uma função somar_pares(n) que retorna a soma dos pares até n.",
        language: "python",
        starterCode: "def somar_pares(n): pass",
        referenceSolution: "def somar_pares(n):\n    return -999",
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
          { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
          { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true }
        ],
        rubric: [
          { id: "r1", name: "Lógica", weight: 60, description: "Cálculo correto" },
          { id: "r2", name: "Casos Limite", weight: 40, description: "Zero e negativos" }
        ],
        maxAttempts: 3
      });

      expect(report.isValidForPublishing).toBe(false);
      const refCheck = report.checks.find(c => c.id === "check-ref-solution");
      expect(refCheck?.status).toBe("FAILED");
    });

    it("should approve valid reference solution and report concrete killed mutants", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Soma de Pares com Filtro",
        statement: "Desenvolva uma função somar_pares(n) que retorna a soma dos pares até n inclusive.",
        language: "python",
        starterCode: "def somar_pares(n): pass",
        referenceSolution: "def somar_pares(n):\n    if n <= 0: return 0\n    return sum(i for i in range(2, n + 1, 2))",
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
          { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
          { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true },
          { id: "tc-4", input: "100", expectedOutput: "2550", isPrivate: true }
        ],
        rubric: [
          { id: "r1", name: "Lógica", weight: 50, description: "Cálculo correto" },
          { id: "r2", name: "Casos Limite", weight: 50, description: "Zero e negativos" }
        ],
        maxAttempts: 3
      });

      expect(report.isValidForPublishing).toBe(true);
      expect(report.mutantVariants).toBeDefined();
      expect(report.mutantVariants?.length).toBeGreaterThanOrEqual(3);

      const constMutant = report.mutantVariants?.find(m => m.id === "mut_const_999");
      expect(constMutant?.status).toBe("KILLED");

      const mutantCheck = report.checks.find(c => c.id === "check-mutants");
      expect(mutantCheck?.status).toBe("PASSED");
    });

    it("should invalidate digest if code or test cases change", () => {
      const originalParams = {
        title: "Atividade Algoritmos",
        statement: "Enunciado detalhado com restrições.",
        language: "python",
        referenceSolution: "def somar_pares(n): return sum(range(2, n+1, 2))",
        testCases: [{ id: "tc1", input: "10", expectedOutput: "30", isPrivate: false }],
        rubric: [{ id: "r1", name: "Critério", weight: 100, description: "Nota" }]
      };

      const digest1 = ActivityValidatorService.computeDigest(originalParams);
      const digest2 = ActivityValidatorService.computeDigest({
        ...originalParams,
        referenceSolution: "def somar_pares(n): return -999"
      });

      expect(digest1).not.toBe(digest2);
    });
  });

  // =========================================================================
  // FRENTE 2: ISOLAMENTO DA DEMONSTRAÇÃO & SEGURANÇA SERVER-SIDE
  // =========================================================================
  describe("Frente 2: Demo Isolation & System Diagnostics", () => {
    it("should block mutations from demo session with HTTP 403", async () => {
      const demoToken = generateJwtToken({ id: "guest_demo_user", name: "Visitante Convidado", email: "visitante@demo.com", role: "DEMO" });

      const res = await fetch(`${baseUrl}/api/system/diagnostics/self-heal`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${demoToken}`,
          "Content-Type": "application/json"
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Modo Demonstração");
    });

    it("should provide full diagnostics with taxonomy: Verificado, Configurado, Simulado", async () => {
      const diagnostics = await SystemIntegrityDiagnosticsService.runFullDiagnostics();
      expect(diagnostics.securityCompliance.asvsLevel).toBe("OWASP ASVS 4.0.3 Nível 2");
      expect(diagnostics.activeChecks.length).toBeGreaterThanOrEqual(4);

      const states = diagnostics.activeChecks.map(c => c.operationalState);
      expect(states).toContain("Verificado");
      expect(states).toContain("Configurado");
    });
  });

  // =========================================================================
  // FRENTE 3: JORNADA PEDAGÓGICA INTEGRADA (RECEIPTS, DEDUPLICATION, REVIEWS)
  // =========================================================================
  describe("Frente 3: Integrated Pedagogical Delivery & Lifecycle", () => {
    it("should issue cryptographic receipt upon submission and deduplicate by idempotency key", async () => {
      const payload = {
        activityId: "act-101",
        activityVersion: "v1.0",
        studentId: "stu-001",
        studentName: "Estudante Alpha",
        codeContent: "def somar_pares(n): return sum(range(2, n+1, 2))",
        attemptNumber: 1,
        idempotencyKey: "idem_key_unique_001"
      };

      const res1 = await fetch(`${baseUrl}/api/activities/submissions/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data1 = await res1.json();
      expect(res1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data1.receipt.receiptId).toMatch(/^rcpt-/);

      // Repeat with same idempotency key
      const res2 = await fetch(`${baseUrl}/api/activities/submissions/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data2 = await res2.json();
      expect(res2.status).toBe(200);
      expect(data2.duplicatePrevented).toBe(true);
      expect(data2.submission.id).toBe(data1.submission.id);
    });

    it("should allow teacher review with score moderation and override justification", async () => {
      const teacherToken = generateJwtToken({ id: "teacher_1", name: "Prof. Demo", email: "prof@senai.br", role: "TEACHER" });
      const res = await fetch(`${baseUrl}/api/activities/submissions/review`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${teacherToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          submissionId: "rcpt-abc-123",
          moderatedScore: 95,
          generalFeedback: "Excelente estrutura e clareza de código.",
          justificationForOverride: "Bonificação de 5 pontos por legibilidade de Clean Code."
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.officialScore).toBe(95);
      expect(data.justificationRecorded).toContain("Bonificação");
    });

    it("should support resubmission attempt up to max 3 attempts", async () => {
      const resAttempt2 = await fetch(`${baseUrl}/api/activities/submissions/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: "act-101",
          studentId: "stu-001",
          codeContent: "def somar_pares(n): return sum(i for i in range(2, n+1, 2))",
          previousAttemptNumber: 1
        })
      });

      expect(resAttempt2.status).toBe(200);
      const data2 = await resAttempt2.json();
      expect(data2.attemptNumber).toBe(2);

      // Attempt exceeding max attempts (attempt 4)
      const resExceeded = await fetch(`${baseUrl}/api/activities/submissions/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: "act-101",
          studentId: "stu-001",
          codeContent: "def somar_pares(n): return 0",
          previousAttemptNumber: 3
        })
      });

      expect(resExceeded.status).toBe(400);
      const dataExceeded = await resExceeded.json();
      expect(dataExceeded.error).toContain("Limite máximo");
    });
  });

  // =========================================================================
  // FRENTE 5: PREPARAÇÃO E TELEMETRIA DO PILOTO (20 ESTUDANTES)
  // =========================================================================
  describe("Frente 5: Pilot Preparation & Aggregated Telemetry", () => {
    it("should provide default config for class pilot of 20 students", async () => {
      const res = await fetch(`${baseUrl}/api/pilot/config`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.config.targetStudentCount).toBe(20);
      expect(data.config.allowRefactoring).toBe(true);
    });

    it("should provide complete 7-phase runbook with contingencies", async () => {
      const res = await fetch(`${baseUrl}/api/pilot/runbook`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.runbook.length).toBe(7);
      expect(data.runbook[0].phaseName).toContain("Criação");
      expect(data.runbook[6].phaseName).toContain("Consolidação");
    });

    it("should compute aggregated metrics without toxic ranking or leaks", async () => {
      const res = await fetch(`${baseUrl}/api/pilot/classroom-metrics`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.metrics.totalStudentsEnrolled).toBe(20);
      expect(data.metrics.technicalFailureRatePercent).toBe(0);
      expect(data.metrics.feedbackComprehensionScoreAvg).toBeGreaterThanOrEqual(4.0);
    });
  });
});
