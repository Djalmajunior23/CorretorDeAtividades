import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { 
  StudentCorrectionInsightService,
  AssertiveStudentReport 
} from "../services/studentCorrectionInsightService";

// Mock pg Pool
const mockPool = {
  query: vi.fn().mockImplementation((queryText: string, params: any[]) => {
    if (queryText.includes("correction_vault")) {
      return Promise.resolve({
        rows: [
          {
            id: "v1",
            student_id: "st-01",
            activity_title: "Desafio 01: Manipulação de Arrays",
            language: "python",
            submitted_code: "def filtrar_aprovados(notas):\n    return [n for n in notas if n >= 60]\n",
            score: 95,
            max_score: 100,
            feedback: "Excelente solução!",
            created_at: new Date().toISOString()
          }
        ]
      });
    }
    return Promise.resolve({ rows: [] });
  }),
  on: vi.fn(),
};

describe("Portal de Correções Assertivas, Auditoria & Laudos do Aluno (SENAI)", () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, mockPool as any);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });

  describe("StudentCorrectionInsightService Unit Tests", () => {
    it("deve gerar laudo de correção hiper-assertivo com anotações de código e complexidade Big-O", async () => {
      const report = await StudentCorrectionInsightService.generateAssertiveStudentReport({
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        className: "Desenvolvimento de Sistemas 1A",
        activityTitle: "Algoritmo de Filtragem",
        language: "Python",
        submittedCode: "def filtrar(valores):\n    if not valores:\n        return []\n    return [v for v in valores if v > 10]\n",
        testCases: [{ input: "[5, 12, 18]", expected: "[12, 18]" }]
      });

      expect(report).toBeDefined();
      expect(report.studentName).toBe("Ana Beatriz Silva");
      expect(report.score).toBeGreaterThanOrEqual(60);
      expect(report.isApproved).toBe(true);
      expect(report.passingScore).toBe(60);
      expect(report.lineAnnotations.length).toBeGreaterThan(0);
      expect(report.asymptoticComplexity).toBeDefined();
      expect(report.asymptoticComplexity.timeComplexity).toBeDefined();
      expect(report.testCaseDiffs.length).toBeGreaterThan(0);
      expect(report.stepByStepRefactoringHints.length).toBeGreaterThanOrEqual(1);
    });

    it("deve gerar dicas socráticas incrementais (Nível 1, 2 e 3)", async () => {
      const hint1 = await StudentCorrectionInsightService.generateProgressiveRefactorHint({
        code: "def soma(a, b): return a + b",
        language: "Python",
        hintLevel: 1
      });
      expect(hint1.hintLevel).toBe(1);
      expect(hint1.hintTitle).toBeDefined();
      expect(hint1.hintText).toBeDefined();

      const hint2 = await StudentCorrectionInsightService.generateProgressiveRefactorHint({
        code: "def soma(a, b): return a + b",
        language: "Python",
        hintLevel: 2
      });
      expect(hint2.hintLevel).toBe(2);

      const hint3 = await StudentCorrectionInsightService.generateProgressiveRefactorHint({
        code: "def soma(a, b): return a + b",
        language: "Python",
        hintLevel: 3
      });
      expect(hint3.hintLevel).toBe(3);
    });

    it("deve processar recurso pedagógico / contestação de nota", async () => {
      const dispute = await StudentCorrectionInsightService.submitGradeDispute({
        studentName: "Carlos Eduardo",
        activityTitle: "Desafio Fibonacci",
        submittedCode: "def fib(n): return n if n <= 1 else fib(n-1) + fib(n-2)",
        originalScore: 70,
        studentJustification: "Minha solução recursiva atende perfeitamente à definição matemática de Fibonacci."
      });

      expect(dispute).toBeDefined();
      expect(dispute.studentName).toBe("Carlos Eduardo");
      expect(dispute.verdict).toBeDefined();
      expect(dispute.juryOpinion).toBeDefined();
      expect(dispute.teacherRecommendation).toBeDefined();
    });

    it("deve exportar laudo oficial em PDF (SENAI) com layout institucional e tabelas", async () => {
      const mockReport: AssertiveStudentReport = {
        reportId: "rep-999",
        submissionId: "sub-999",
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        enrollmentCode: "20260101",
        className: "Desenvolvimento de Sistemas 1A",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        activityTitle: "Laboratório de Listas e Filtros",
        language: "Python",
        submittedCode: "def filtrar(arr):\n    return [x for x in arr if x >= 60]\n",
        score: 95,
        maxScore: 100,
        status: "Aprovado com Excelência",
        isApproved: true,
        passingScore: 60,
        submittedAt: new Date().toISOString(),
        evaluatedAt: new Date().toISOString(),
        executiveVerdict: "Excelente implementação de algoritmos funcionais.",
        whatComputerExecuted: "Executou a compreensão de lista filtrando em tempo O(n).",
        whyItSucceededOrFailed: "Casos de teste validados com sucesso.",
        asymptoticComplexity: {
          timeComplexity: "O(n)",
          spaceComplexity: "O(1)",
          complexityVerdict: "Ótima"
        },
        lineAnnotations: [
          { lineNumber: 1, codeLine: "def filtrar(arr):", type: "success", message: "Declaração PEP-8" },
          { lineNumber: 2, codeLine: "    return [x for x in arr if x >= 60]", type: "success", message: "Compreensão eficiente" }
        ],
        testCaseDiffs: [
          { testId: 1, input: "[50, 70, 80]", expectedOutput: "[70, 80]", actualOutput: "[70, 80]", passed: true, executionTimeMs: 3 }
        ],
        stepByStepRefactoringHints: ["Dica 1: Inclua docstrings explicativas."],
        recommendedConceptReview: ["Python Idiomático"],
        nextChallengeSuggestion: "Estruturas de Árvores Binárias"
      };

      const pdfBuffer = StudentCorrectionInsightService.exportStudentCorrectionReportPdf(mockReport);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });
  });

  describe("API Integration Endpoints", () => {
    it("GET /api/student/corrections/:studentId - Deve retornar histórico de correções do aluno", async () => {
      const res = await fetch(`${baseUrl}/api/student/corrections/st-01`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.studentId).toBe("st-01");
      expect(Array.isArray(data.submissions)).toBe(true);
    });

    it("POST /api/student/corrections/detailed-report - Deve gerar laudo detalhado e assertivo", async () => {
      const payload = {
        studentId: "st-01",
        studentName: "Ana Beatriz",
        className: "Turma 1A",
        activityTitle: "Validação de Dados",
        language: "Python",
        submittedCode: "def validar(dado):\n    return bool(dado)\n",
        rawScore: 88
      };

      const res = await fetch(`${baseUrl}/api/student/corrections/detailed-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.score).toBeGreaterThanOrEqual(60);
      expect(data.report.lineAnnotations).toBeDefined();
    });

    it("POST /api/student/corrections/export-pdf - Deve gerar e enviar stream do PDF", async () => {
      const payload = {
        report: {
          reportId: "rep-101",
          studentId: "st-01",
          studentName: "Lucas Lima",
          enrollmentCode: "20260104",
          className: "Turma 1A",
          courseName: "SENAI TDS",
          activityTitle: "Estruturas de Repetição",
          language: "Python",
          submittedCode: "for i in range(10): pass",
          score: 80,
          maxScore: 100,
          status: "Aprovado",
          isApproved: true,
          passingScore: 60,
          submittedAt: new Date().toISOString(),
          evaluatedAt: new Date().toISOString(),
          executiveVerdict: "Código aprovado",
          whatComputerExecuted: "Loop executado",
          whyItSucceededOrFailed: "OK",
          asymptoticComplexity: { timeComplexity: "O(n)", spaceComplexity: "O(1)", complexityVerdict: "Adequada" },
          lineAnnotations: [],
          testCaseDiffs: [],
          stepByStepRefactoringHints: ["Adicione prints formatados."]
        }
      };

      const res = await fetch(`${baseUrl}/api/student/corrections/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const blob = await res.arrayBuffer();
      expect(blob.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/student/corrections/dispute - Deve registrar recurso e emitir veredito da banca recursal", async () => {
      const payload = {
        studentName: "Beatriz Helena",
        activityTitle: "Desafio 02: CPF",
        submittedCode: "def validar_cpf(cpf): return len(cpf) == 11",
        originalScore: 65,
        studentJustification: "Minha função foca na checagem de tamanho conforme solicitado na primeira parte do enunciado."
      };

      const res = await fetch(`${baseUrl}/api/student/corrections/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.disputeResult).toBeDefined();
      expect(data.disputeResult.juryOpinion).toBeDefined();
    });

    it("POST /api/student/corrections/refactor-hint - Deve retornar dica incremental do tutor socrático", async () => {
      const payload = {
        code: "def calc(x): return x * 2",
        language: "Python",
        hintLevel: 2
      };

      const res = await fetch(`${baseUrl}/api/student/corrections/refactor-hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.hint.hintLevel).toBe(2);
      expect(data.hint.hintText).toBeDefined();
    });
  });
});
