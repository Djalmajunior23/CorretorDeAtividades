import { describe, it, expect } from "vitest";
import { TeacherGlobalSuperAuthoringService } from "../services/teacherGlobalSuperAuthoringService";

describe("TeacherGlobalSuperAuthoringService Test Suite", () => {
  describe("1. 1-Click Multi-Tier Content Differentiator", () => {
    it("should generate 3 distinct pedagogical tiers from a single topic", () => {
      const topic = "Modelagem de Banco de Dados e Consultas Otimizadas";
      const pkg = TeacherGlobalSuperAuthoringService.generateMultiTierDifferentiatedContent(topic, "sql");

      expect(pkg.originalTopic).toBe(topic);
      expect(pkg.tier1_beginner.parsonsBlocks.length).toBeGreaterThanOrEqual(4);
      expect(pkg.tier1_beginner.fillInTheBlanksCode).toContain("/* PREENCHA_");
      expect(pkg.tier1_beginner.conceptualHints.length).toBeGreaterThanOrEqual(2);

      expect(pkg.tier2_proficient.businessRules.length).toBeGreaterThanOrEqual(2);
      expect(pkg.tier2_proficient.acceptanceCriteria.length).toBeGreaterThanOrEqual(2);

      expect(pkg.tier3_challenger.extremeConstraints.some(c => c.includes("O(N log N)"))).toBe(true);
      expect(pkg.tier3_challenger.cornerCases.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("2. AI Synthetic Student Pre-Flight Simulator", () => {
    it("should simulate 3 personas and generate calibration feedback", () => {
      const title = "Atividade de Modelagem 3FN";
      const prompt = "Construa um esquema de banco de dados para e-commerce com tabelas de clientes e pedidos aplicando 3FN.";
      const report = TeacherGlobalSuperAuthoringService.runSyntheticStudentSimulation(title, prompt);

      expect(report.overallReadinessScore).toBeGreaterThanOrEqual(60);
      expect(report.personas).toHaveLength(3);

      const beginner = report.personas.find(p => p.personaType === "BEGINNER_STRUGGLING");
      const copier = report.personas.find(p => p.personaType === "AI_PROMPT_COPIER");
      const advanced = report.personas.find(p => p.personaType === "ADVANCED_EXPLORER");

      expect(beginner).toBeDefined();
      expect(copier).toBeDefined();
      expect(advanced).toBeDefined();
      expect(report.teacherCalibrationAdvice).toBeDefined();
    });
  });

  describe("3. Executable Interactive Slide Decks", () => {
    it("should generate structured slides with live code blocks and Marp export", () => {
      const deck = TeacherGlobalSuperAuthoringService.generateExecutableSlideDeck("Normalização 3FN & Índices", "Turma SENAI", "sql");

      expect(deck.slides.length).toBeGreaterThanOrEqual(4);
      expect(deck.slides.some(s => s.executableCodeBlock !== undefined)).toBe(true);
      expect(deck.slides.some(s => s.mermaidDiagram !== undefined)).toBe(true);
      expect(deck.slides.some(s => s.livePollCheckpoint !== undefined)).toBe(true);

      expect(deck.exportFormats.marpMarkdown).toContain("marp: true");
      expect(deck.exportFormats.revealHtml).toContain("class=\"reveal\"");
    });
  });

  describe("4. Surgical SAEP & Bloom Rubric Matrix", () => {
    it("should generate 4 standard-aligned dimensions with 4 proficiency levels each", () => {
      const matrix = TeacherGlobalSuperAuthoringService.generateBloomSaepRubricMatrix("Projeto de E-Commerce", "Banco de Dados");

      expect(matrix.dimensions).toHaveLength(4);
      expect(matrix.totalWeight).toBe(100);

      for (const dim of matrix.dimensions) {
        expect(dim.levels.insufficient).toBeDefined();
        expect(dim.levels.basic).toBeDefined();
        expect(dim.levels.adequate).toBeDefined();
        expect(dim.levels.advanced).toBeDefined();
      }
    });
  });

  describe("5. Bug Hunt & Parsons Problem Generator", () => {
    it("should generate code with intentional vulnerabilities and remediation puzzle", () => {
      const challenge = TeacherGlobalSuperAuthoringService.generateBugHuntChallenge("Autenticação Segura", "SECURITY_INJECTION");

      expect(challenge.challengeId).toContain("bughunt_");
      expect(challenge.hiddenBugs.length).toBeGreaterThanOrEqual(2);
      expect(challenge.hiddenBugs.some(b => b.bugType.includes("SQL Injection"))).toBe(true);
      expect(challenge.parsonsReorderPuzzle.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("6. Live Classroom Orchestrator & Ghost Mode", () => {
    it("should generate confusion heatmaps, anonymous ghost snippet and quick pop challenge", () => {
      const session = TeacherGlobalSuperAuthoringService.generateLiveClassroomSession("JOINs e Agregações");

      expect(session.confusionHeatmap.length).toBeGreaterThanOrEqual(3);
      expect(session.ghostModeSnippet.flawedCode).toBeDefined();
      expect(session.ghostModeSnippet.socraticQuestionForClass).toBeDefined();
      expect(session.popChallenge.quickQuizOptions.length).toBe(4);
      expect(session.popChallenge.durationMinutes).toBe(3);
    });
  });

  describe("7. Real-World Industry Case Injector", () => {
    it("should generate a realistic industry incident with synthetic CSV data", () => {
      const caseStudy = TeacherGlobalSuperAuthoringService.generateIndustryCaseStudy("Fintech", "Microsserviços de Pagamento");

      expect(caseStudy.companyName).toBeDefined();
      expect(caseStudy.incidentNarrative).toContain("Black Friday");
      expect(caseStudy.syntheticDataSetCsv).toContain("transacao_id");
      expect(caseStudy.executiveRequirements.length).toBeGreaterThanOrEqual(2);
      expect(caseStudy.technicalDeliverables.length).toBeGreaterThanOrEqual(2);
    });
  });
});
