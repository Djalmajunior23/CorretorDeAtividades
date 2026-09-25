import { describe, it, expect } from "vitest";
import { AdvancedItemBankService } from "../services/advancedItemBankService";

describe("Advanced Item Bank & Question Engineering Studio Suite", () => {
  // =========================================================================
  // MODULE 1: TRI & PSYCHOMETRIC CALIBRATION
  // =========================================================================
  describe("Module 1: Item Response Theory (TRI) & Psychometric Engine", () => {
    it("should calculate parameters b (difficulty), a (discrimination) and point-biserial correlation", () => {
      const mockSubmissions = [
        { studentId: "s1", studentAbilityScore: 95, isCorrect: true, timeSpentSeconds: 40 },
        { studentId: "s2", studentAbilityScore: 90, isCorrect: true, timeSpentSeconds: 50 },
        { studentId: "s3", studentAbilityScore: 85, isCorrect: true, timeSpentSeconds: 60 },
        { studentId: "s4", studentAbilityScore: 80, isCorrect: true, timeSpentSeconds: 55 },
        { studentId: "s5", studentAbilityScore: 70, isCorrect: true, timeSpentSeconds: 70 },
        { studentId: "s6", studentAbilityScore: 60, isCorrect: false, timeSpentSeconds: 90 },
        { studentId: "s7", studentAbilityScore: 50, isCorrect: false, timeSpentSeconds: 100 },
        { studentId: "s8", studentAbilityScore: 40, isCorrect: false, timeSpentSeconds: 120 },
        { studentId: "s9", studentAbilityScore: 30, isCorrect: false, timeSpentSeconds: 130 },
        { studentId: "s10", studentAbilityScore: 20, isCorrect: false, timeSpentSeconds: 110 }
      ];

      const metrics = AdvancedItemBankService.calculateItemTriMetrics({
        itemId: "ITEM-SQL-01",
        itemTitle: "Agrupamento com GROUP BY e HAVING",
        submissions: mockSubmissions
      });

      expect(metrics).toBeDefined();
      expect(metrics.itemId).toBe("ITEM-SQL-01");
      expect(metrics.totalAttempts).toBe(10);
      expect(metrics.successRatePercentage).toBe(50);
      expect(metrics.difficultyParamB).toBeDefined();
      expect(metrics.discriminationParamA).toBeGreaterThan(0.5);
      expect(metrics.pointBiserialCorrelation).toBeGreaterThan(0.2);
      expect(["EXCELENTE", "ADEQUADO", "REQUER_REVISAO", "ITEM_DEFEITUOSO_AMBIGUO"]).toContain(metrics.qualityStatus);
      expect(metrics.diagnosticRecommendation.length).toBeGreaterThan(10);
    });

    it("should flag ambiguous or defective items with negative discrimination", () => {
      // Itens onde alunos de baixa proficiência acertam e os de alta proficiência erram (pegadinha)
      const defectiveSubmissions = [
        { studentId: "s1", studentAbilityScore: 95, isCorrect: false, timeSpentSeconds: 40 },
        { studentId: "s2", studentAbilityScore: 90, isCorrect: false, timeSpentSeconds: 50 },
        { studentId: "s3", studentAbilityScore: 85, isCorrect: false, timeSpentSeconds: 60 },
        { studentId: "s4", studentAbilityScore: 30, isCorrect: true, timeSpentSeconds: 120 },
        { studentId: "s5", studentAbilityScore: 20, isCorrect: true, timeSpentSeconds: 110 }
      ];

      const metrics = AdvancedItemBankService.calculateItemTriMetrics({
        itemId: "ITEM-BUGGY-02",
        itemTitle: "Questão Ambígua",
        submissions: defectiveSubmissions
      });

      expect(metrics.qualityStatus).toBe("ITEM_DEFEITUOSO_AMBIGUO");
      expect(metrics.diagnosticRecommendation).toContain("Alerta Crítico");
    });
  });

  // =========================================================================
  // MODULE 2: DIAGNOSTIC MCQ (DISTRACTOR COGNITIVE ENGINEERING)
  // =========================================================================
  describe("Module 2: Diagnostic MCQ Generator with Distractor Mapping", () => {
    it("should generate a 5-option question with pedagogical misconceptions mapped to each distractor", async () => {
      const mcq = await AdvancedItemBankService.generateDiagnosticMcq({
        topic: "Programação Orientada a Objetos",
        subtopic: "Polimorfismo e Sobrescrita de Métodos",
        bloomLevel: "Análise / Diagnóstico",
        targetCompetency: "Aplicar herança e polimorfismo mantendo o princípio de substituição de Liskov"
      });

      expect(mcq).toBeDefined();
      expect(mcq.id).toMatch(/^mcq_diag_/);
      expect(mcq.contextScenario.length).toBeGreaterThan(20);
      expect(mcq.questionStem.length).toBeGreaterThan(20);
      expect(mcq.options).toHaveLength(5);

      const correctOptions = mcq.options.filter(o => o.isCorrect);
      expect(correctOptions).toHaveLength(1);

      // Verify all distractors have pedagogical misconceptions mapped
      for (const opt of mcq.options) {
        expect(opt.misconceptionDiagnosed.length).toBeGreaterThan(5);
        expect(opt.pedagogicalIntervention.length).toBeGreaterThan(5);
      }
    });
  });

  // =========================================================================
  // MODULE 3: PARAMETRIC ANTI-CHEAT POLIMORPHIC GENERATOR
  // =========================================================================
  describe("Module 3: Parametric Polymorphic Anti-Cheat Engine", () => {
    it("should generate unique deterministic math/logic instances per student with computed test cases", () => {
      const students = [
        { id: "MATR-101", name: "Alice Fernandes" },
        { id: "MATR-102", name: "Bernardo Silva" },
        { id: "MATR-103", name: "Caio Moreira" }
      ];

      const template = AdvancedItemBankService.generateParametricInstances({
        title: "Cálculo de Juros de Empréstimo Fintech",
        scenarioTemplate: "Geração para avaliação prática presencial.",
        studentList: students,
        formulaType: "FINANCE_INTEREST"
      });

      expect(template).toBeDefined();
      expect(template.sampleInstances).toHaveLength(3);

      const [instA, instB] = template.sampleInstances;
      // Instances should have distinct parameters and statements
      expect(instA.studentNameOrId).toBe("Alice Fernandes");
      expect(instB.studentNameOrId).toBe("Bernardo Silva");
      expect(instA.renderedStatement).not.toEqual(instB.renderedStatement);
      expect(instA.verificationHash).toBeDefined();
      expect(instA.testCases.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // MODULE 4: OCR & MULTI-SOURCE INGESTION
  // =========================================================================
  describe("Module 4: Multi-Source OCR & Exam Ingestion", () => {
    it("should parse raw text and segment into structured questions with automated test suites", async () => {
      const rawExamText = `
        Questão 1: Desenvolva uma função em Python para calcular a média de consumo de combustível de uma frota de caminhões. Receba uma lista de quilômetros rodados e litros consumidos e retorne o consumo médio em km/l. Trate divisões por zero.
      `;

      const result = await AdvancedItemBankService.ingestMultiSourceExam({
        rawTextOrOcr: rawExamText,
        sourceType: "PDF_PROVA",
        targetCourse: "Técnico em Desenvolvimento de Sistemas"
      });

      expect(result).toBeDefined();
      expect(result.totalIngested).toBeGreaterThanOrEqual(1);
      expect(result.items[0].commandText.length).toBeGreaterThan(15);
      expect(result.items[0].autoGeneratedTestCases?.length).toBeGreaterThanOrEqual(1);
      expect(result.items[0].confidenceScore).toBeGreaterThanOrEqual(70);
    });
  });

  // =========================================================================
  // MODULE 5: SMART EXAM ASSEMBLER (4 ROTATED BOOKLETS A, B, C, D)
  // =========================================================================
  describe("Module 5: Smart Exam Assembler & Booklet Generator", () => {
    it("should assemble 4 rotated booklets with synchronized answer keys", () => {
      const mockItems = [
        {
          id: "Q1",
          title: "SQL Normalização",
          type: "Múltipla Escolha",
          difficulty: "Fácil" as const,
          statement: "O que é 1FN?",
          options: [
            { letter: "A", text: "Atributos atômicos sem repetições." },
            { letter: "B", text: "Tabelas sem chaves." }
          ],
          correctAnswer: "A",
          points: 50
        },
        {
          id: "Q2",
          title: "Recursão em C",
          type: "Código",
          difficulty: "Médio" as const,
          statement: "Escreva uma função recursiva para fatorial.",
          correctAnswer: "int fat(int n) { return n <= 1 ? 1 : n * fat(n-1); }",
          points: 50
        }
      ];

      const booklets = AdvancedItemBankService.assembleBalancedExam({
        examTitle: "Exame SAEP de Avaliação Técnica",
        courseName: "Técnico em TI",
        classId: "Turma 2A",
        durationMinutes: 60,
        distribution: { easyPct: 50, mediumPct: 50, hardPct: 0 },
        availableBankItems: mockItems
      });

      expect(booklets).toHaveLength(4);
      const [bookletA, bookletB, bookletC, bookletD] = booklets;

      expect(bookletA.versionLetter).toBe("A");
      expect(bookletB.versionLetter).toBe("B");
      expect(bookletC.versionLetter).toBe("C");
      expect(bookletD.versionLetter).toBe("D");

      expect(bookletA.items).toHaveLength(2);
      expect(bookletA.answerKeyMatrix).toHaveLength(2);
      expect(bookletA.totalPoints).toBe(100);

      // Verify PDF generation for Booklet A
      const pdfBuffer = AdvancedItemBankService.exportExamBookletToPdf(bookletA);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });
  });

  // =========================================================================
  // MODULE 6: CODE BUG HUNT & REFACTORING LAB
  // =========================================================================
  describe("Module 6: Code Bug Hunt & Refactoring Lab", () => {
    it("should generate a realistic legacy codebase with catalog of 3 intentional bugs and regression tests", async () => {
      const challenge = await AdvancedItemBankService.generateBugHuntChallenge({
        topic: "Controle Concorrente de Assentos em Linha Aérea",
        language: "TypeScript"
      });

      expect(challenge).toBeDefined();
      expect(challenge.id).toMatch(/^bughunt_/);
      expect(challenge.buggySourceCode.length).toBeGreaterThan(50);
      expect(challenge.totalBugsCount).toBeGreaterThanOrEqual(2);
      expect(challenge.bugsCatalog.length).toBeGreaterThanOrEqual(2);

      // Verify bug detail structure
      for (const bug of challenge.bugsCatalog) {
        expect(bug.bugId).toBeDefined();
        expect(bug.locationHint.length).toBeGreaterThan(5);
        expect(bug.explanation.length).toBeGreaterThan(10);
        expect(bug.fixSolution.length).toBeGreaterThan(10);
      }

      // Verify regression test cases
      expect(challenge.regressionTestCases.length).toBeGreaterThanOrEqual(2);
      expect(challenge.refactoredGoldenSolution.length).toBeGreaterThan(30);
    });
  });
});
