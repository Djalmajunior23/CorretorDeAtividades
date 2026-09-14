import { describe, it, expect } from "vitest";
import { ParametricExamService } from "../services/parametricExamService";
import { GitAutoGradingService } from "../services/gitAutoGradingService";
import { SocraticScaffoldingService } from "../services/socraticScaffoldingService";

describe("Next-Gen Three Core Features Test Suite", () => {
  // ==========================================
  // 1. ANTI-CHEAT PARAMETRIC EXAM GENERATOR
  // ==========================================
  describe("Feature 1: Anti-Cheat Parametric Exam & Assessment Generator", () => {
    it("should generate 4 equivalent variants (A, B, C, D) with distinct domain contexts", async () => {
      const exam = await ParametricExamService.generateParametricExam({
        examTitle: "Avaliação Prática de Algoritmos",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        basePrompt: "Cálculo de alíquotas e descontos progressivos por faixa.",
        language: "typescript",
        variantCount: 4,
        durationMinutes: 90
      });

      expect(exam).toBeDefined();
      expect(exam.examId).toMatch(/^pexam_/);
      expect(exam.totalVariants).toBe(4);
      expect(exam.variants.length).toBe(4);

      const letters = exam.variants.map(v => v.variantId);
      expect(letters).toEqual(["A", "B", "C", "D"]);

      // Verify each variant has required properties
      exam.variants.forEach(variant => {
        expect(variant.title).toBeDefined();
        expect(variant.problemStatement.length).toBeGreaterThan(20);
        expect(variant.starterCode).toContain("export function");
        expect(variant.expectedSolutionCode).toContain("export function");
        expect(variant.testCases.length).toBeGreaterThanOrEqual(3);
        expect(variant.rubric.length).toBeGreaterThanOrEqual(3);
        expect(variant.antiPlagiarismChecksum).toBeDefined();
      });
    });

    it("should distribute variants evenly among students so adjacent desks don't share variants", async () => {
      const exam = await ParametricExamService.generateParametricExam({
        basePrompt: "Validação de regras de negócio",
        students: [
          { id: "s1", name: "Aluno 1" },
          { id: "s2", name: "Aluno 2" },
          { id: "s3", name: "Aluno 3" },
          { id: "s4", name: "Aluno 4" },
          { id: "s5", name: "Aluno 5" }
        ]
      });

      expect(exam.studentAssignments.length).toBe(5);
      expect(exam.studentAssignments[0].assignedVariant).toBe("A");
      expect(exam.studentAssignments[1].assignedVariant).toBe("B");
      expect(exam.studentAssignments[2].assignedVariant).toBe("C");
      expect(exam.studentAssignments[3].assignedVariant).toBe("D");
      expect(exam.studentAssignments[4].assignedVariant).toBe("A");
      expect(exam.studentAssignments[0].uniqueExamToken).toContain("EXAM-A-");
    });

    it("should generate a valid Master Exam Dossier PDF with test cases and answer key", async () => {
      const exam = await ParametricExamService.generateParametricExam({
        basePrompt: "Algoritmo de cálculo financeiro"
      });

      const pdfBuffer = await ParametricExamService.generateMasterExamPdf(exam);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1500);
    });
  });

  // ==========================================
  // 2. GITHUB & GITLAB CI/CD AUTO-GRADING
  // ==========================================
  describe("Feature 2: GitHub / GitLab CI/CD Auto-Grading & Pipeline Studio", () => {
    it("should process a successful webhook payload and award high score", async () => {
      const validCode = `
        export function calcularTotal(qtd: number, preco: number): number {
          if (qtd <= 0 || preco <= 0) throw new Error("ValorInválido");
          return Number((qtd * preco).toFixed(2));
        }
      `;

      const result = await GitAutoGradingService.processWebhook({
        provider: "github",
        eventType: "pull_request",
        repository: {
          name: "senai-ecommerce",
          url: "https://github.com/senai/senai-ecommerce",
          owner: "senai"
        },
        branch: "main",
        commitHash: "e4d5f6a7",
        commitMessage: "feat: cálculo de total com validação",
        author: {
          name: "Maria Eduarda",
          username: "meduarda",
          email: "meduarda@aluno.senai.br"
        },
        pullRequestNumber: 8,
        submissionCode: validCode,
        language: "typescript"
      });

      expect(result).toBeDefined();
      expect(result.executionId).toMatch(/^cicd_/);
      expect(result.totalScore).toBeGreaterThanOrEqual(80);
      expect(result.status).toBe("SUCCESS");
      expect(result.testResults.passed).toBe(4);
      expect(result.simulatedPrCommentMarkdown).toContain("CodeCheck AI — Relatório de CI/CD Auto-Grading");
      expect(result.statusBadgeUrl).toContain("CodeCheck%20AI");
    });

    it("should penalize code with syntax flaws or anti-patterns in auto-grading", async () => {
      const flawedCode = `
        export function processar(data: any): any {
          console.log("DEBUG:", data);
          if (data) {
            if (data.x) {
              if (data.x.y) {
                if (data.x.y.z) {
                  return data.x.y.z;
                }
              }
            }
          }
          throw new Error('Não implementado');
        }
      `;

      const result = await GitAutoGradingService.processWebhook({
        provider: "gitlab",
        eventType: "push",
        repository: {
          name: "senai-microservice",
          url: "https://gitlab.com/senai/microservice",
          owner: "senai"
        },
        branch: "dev",
        commitHash: "b1c2d3e4",
        author: {
          name: "Aluno Desatento",
          username: "alunod",
          email: "aluno@senai.br"
        },
        submissionCode: flawedCode,
        language: "typescript"
      });

      expect(result.linterResults.issues.length).toBeGreaterThan(0);
      expect(result.status).toBe("FAILED");
      expect(result.totalScore).toBeLessThan(70);
    });

    it("should generate a valid CI/CD Pipeline Report PDF", async () => {
      const history = GitAutoGradingService.getMockPipelinesHistory();
      expect(history.length).toBeGreaterThan(0);

      const pdfBuffer = await GitAutoGradingService.generatePipelineReportPdf(history[0]);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });
  });

  // ==========================================
  // 3. ADAPTIVE SOCRATIC TUTOR & SCAFFOLDING
  // ==========================================
  describe("Feature 3: Adaptive Socratic Tutor & Scaffolding Assistant", () => {
    it("should generate a Level 1 hint preserving 100% student autonomy", async () => {
      const hint = await SocraticScaffoldingService.generateSocraticHint({
        exerciseTitle: "Busca em Matrizes",
        problemStatement: "Encontre o elemento x na matriz ordenada.",
        studentCode: "function buscar(m, x) { return null; }",
        studentDoubt: "Não sei por onde começar a percorrer",
        targetLevel: 1
      });

      expect(hint.level).toBe(1);
      expect(hint.levelMeta.autonomyRetentionPercent).toBe(100);
      expect(hint.socraticInquiry).toBeDefined();
      expect(hint.autonomyScoreRemaining).toBe(100);
    });

    it("should generate progressive hints with calculated autonomy penalties for Levels 2, 3, and 4", async () => {
      const hintLvl2 = await SocraticScaffoldingService.generateSocraticHint({
        exerciseTitle: "Fatorial Recursivo",
        problemStatement: "Calcule o fatorial de n.",
        studentCode: "function fat(n) { return fat(n); }",
        studentDoubt: "Está dando Maximum call stack size exceeded",
        targetLevel: 2,
        previousHintsUsed: [1]
      });
      expect(hintLvl2.level).toBe(2);
      expect(hintLvl2.autonomyScoreRemaining).toBe(85);

      const hintLvl3 = await SocraticScaffoldingService.generateSocraticHint({
        exerciseTitle: "Fatorial Recursivo",
        problemStatement: "Calcule o fatorial de n.",
        studentCode: "function fat(n) { return fat(n); }",
        studentDoubt: "Preciso de um esqueleto",
        targetLevel: 3,
        previousHintsUsed: [1, 2]
      });
      expect(hintLvl3.level).toBe(3);
      expect(hintLvl3.codeScaffoldSnippet).toBeDefined();
      expect(hintLvl3.autonomyScoreRemaining).toBe(65);

      const hintLvl4 = await SocraticScaffoldingService.generateSocraticHint({
        exerciseTitle: "Fatorial Recursivo",
        problemStatement: "Calcule o fatorial de n.",
        studentCode: "function fat(n) { return fat(n); }",
        studentDoubt: "Me diga onde está o erro",
        targetLevel: 4,
        previousHintsUsed: [1, 2, 3]
      });
      expect(hintLvl4.level).toBe(4);
      expect(hintLvl4.autonomyScoreRemaining).toBe(45);
    });

    it("should return class radar telemetry summary and generate pedagogical PDF", async () => {
      const radar = SocraticScaffoldingService.getClassRadarSummary();
      expect(radar.totalSessions).toBeGreaterThan(0);
      expect(radar.averageAutonomyIndex).toBeGreaterThan(50);
      expect(radar.topStrugglingTopics.length).toBeGreaterThan(0);

      const pdfBuffer = await SocraticScaffoldingService.generateScaffoldingReportPdf({
        studentId: "std_42",
        studentName: "Juliana Ramos",
        exerciseTitle: "Recursão & Estruturas de Árvores",
        levelsRequested: [1, 2, 3],
        finalAutonomyIndex: 65,
        autonomyClassification: "MODERADAMENTE_AUTONOMO",
        timestamp: new Date().toISOString()
      });

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });
  });
});
