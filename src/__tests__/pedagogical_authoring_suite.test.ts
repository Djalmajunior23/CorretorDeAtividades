import { describe, it, expect } from "vitest";
import { 
  PedagogicalAuthoringSuiteService,
  CoursewareBooklet,
  LearningSituation,
  DebugLabScenario,
  CaseStudyScenario,
  GuidedResearchQuest
} from "../services/pedagogicalAuthoringSuiteService";

describe("Pedagogical Authoring Suite - Test Suite", () => {
  
  // 1. APOSTILAS DIDÁTICAS MODULARES (COURSEWARE)
  describe("1. Courseware Studio & Modular Booklets", () => {
    it("Deve gerar Apostila Didática Modular com capítulos, dicas sênior, pegadinhas e exemplos de código", async () => {
      const booklet = await PedagogicalAuthoringSuiteService.generateCoursewareBooklet({
        theme: "Arquitetura de Software e Padrões SOLID",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        subject: "Desenvolvimento de Soluções Computacionais",
        chapterCount: 3,
        language: "typescript"
      });

      expect(booklet).toBeDefined();
      expect(booklet.title).toContain("Arquitetura");
      expect(booklet.chapters.length).toBeGreaterThanOrEqual(1);

      const firstChapter = booklet.chapters[0];
      expect(firstChapter.conceptIntro).toBeDefined();
      expect(firstChapter.industrialWhyItMatters).toBeDefined();
      expect(firstChapter.seniorDevTip).toBeDefined();
      expect(firstChapter.commonSyntaxTrap).toBeDefined();
      expect(firstChapter.codeExamples.length).toBeGreaterThan(0);
      expect(firstChapter.selfAssessmentQuestions.length).toBeGreaterThan(0);
      expect(firstChapter.handsOnExercises.length).toBeGreaterThan(0);

      // PDF Export
      const pdfBuffer = PedagogicalAuthoringSuiteService.exportCoursewarePdf(booklet);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(3000);
    });
  });

  // 2. SITUAÇÕES DE APRENDIZAGEM (METODOLOGIA SENAI / MATRIZ CHA)
  describe("2. Learning Situations (Metodologia SENAI / CHA & SAEP)", () => {
    it("Deve gerar Situação de Aprendizagem com Matriz CHA (Conhecimentos, Habilidades, Atitudes) e Rubricas SAEP", async () => {
      const situation = await PedagogicalAuthoringSuiteService.generateLearningSituation({
        theme: "Microsserviços e Mensageria com RabbitMQ",
        courseName: "Técnico em Desenvolvimento de Sistemas",
        unitCurricular: "Sistemas Distribuídos",
        workloadHours: 40,
        industrialSector: "Fintech & Pagamentos Digitais"
      });

      expect(situation).toBeDefined();
      expect(situation.code).toContain("SA-");
      expect(situation.scenarioCompany).toBeDefined();
      expect(situation.industrialContext).toBeDefined();
      expect(situation.problemStatement).toBeDefined();
      expect(situation.challengeDeliverables.length).toBeGreaterThanOrEqual(2);

      // Verify Matriz CHA
      expect(situation.chaMatrix.knowledge.length).toBeGreaterThanOrEqual(3);
      expect(situation.chaMatrix.skills.length).toBeGreaterThanOrEqual(3);
      expect(situation.chaMatrix.attitudes.length).toBeGreaterThanOrEqual(3);

      // Verify SAEP Rubrics (3 levels: Não Desenvolvido, Em Desenvolvimento, Desenvolvido)
      expect(situation.saepRubrics.length).toBeGreaterThanOrEqual(2);
      situation.saepRubrics.forEach(r => {
        expect(r.criterion).toBeDefined();
        expect(r.weight).toBeGreaterThan(0);
        expect(r.indicators.nonDeveloped).toBeDefined();
        expect(r.indicators.inDevelopment).toBeDefined();
        expect(r.indicators.developed).toBeDefined();
      });

      // PDF Export
      const pdfBuffer = PedagogicalAuthoringSuiteService.exportLearningSituationPdf(situation);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(3000);
    });
  });

  // 3. DEBUG LABS & LABORATÓRIOS FORENSES ("ACHE O BUG")
  describe("3. Debug Labs & Forensic Auditing Labs", () => {
    it("Deve gerar Debug Lab com código defeituoso, testes que falham e dicas progressivas em 3 níveis", async () => {
      const debugLab = await PedagogicalAuthoringSuiteService.generateDebugLab({
        theme: "Concorrência e Mutabilidade em Arrays",
        language: "typescript",
        difficulty: "Intermediário",
        bugFocus: "Mutação Indevida e Off-by-one"
      });

      expect(debugLab).toBeDefined();
      expect(debugLab.buggyCode).toBeDefined();
      expect(debugLab.fixedSolutionCode).toBeDefined();
      expect(debugLab.failingTestsCode).toBeDefined();
      expect(debugLab.bugCategories.length).toBeGreaterThan(0);

      // Verify 3-level progressive hints
      expect(debugLab.progressiveHints.length).toBe(3);
      expect(debugLab.progressiveHints[0].level).toBe(1);
      expect(debugLab.progressiveHints[1].level).toBe(2);
      expect(debugLab.progressiveHints[2].level).toBe(3);
      expect(debugLab.postMortemExplanation).toBeDefined();

      // PDF Export
      const pdfBuffer = PedagogicalAuthoringSuiteService.exportDebugLabPdf(debugLab);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(2500);
    });
  });

  // 4. ESTUDOS DE CASO & AUTÓPSIAS TÉCNICAS (POST-MORTEM & ADR)
  describe("4. Case Studies & Architectural Post-Mortems (ADR)", () => {
    it("Deve gerar Estudo de Caso com linha do tempo de incidente, logs de erro, RCA e ADR de decisão", async () => {
      const caseStudy = await PedagogicalAuthoringSuiteService.generateCaseStudy({
        theme: "Colapso de Timeout e Pool de Conexões",
        industryDomain: "E-Commerce de Alta Escala"
      });

      expect(caseStudy).toBeDefined();
      expect(caseStudy.incidentSummary).toBeDefined();
      expect(caseStudy.timelineEvents.length).toBeGreaterThanOrEqual(2);
      expect(caseStudy.systemLogsSnapshot).toBeDefined();
      expect(caseStudy.rootCauseAnalysis).toBeDefined();

      // Verify ADR Proposal
      expect(caseStudy.adrProposal.title).toBeDefined();
      expect(caseStudy.adrProposal.recommendedDecision).toBeDefined();
      expect(caseStudy.evaluationQuestions.length).toBeGreaterThan(0);

      // PDF Export
      const pdfBuffer = PedagogicalAuthoringSuiteService.exportCaseStudyPdf(caseStudy);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(2500);
    });
  });

  // 5. PESQUISAS GUIADAS & WEBQUESTS ESTRUTURADAS
  describe("5. Guided Research & Structured WebQuests", () => {
    it("Deve gerar Roteiro de Pesquisa Guiada com fontes oficiais (RFCs), perguntas Bloom e critérios antiplágio", async () => {
      const quest = await PedagogicalAuthoringSuiteService.generateGuidedResearch({
        theme: "Arquiteturas Orientadas a Eventos vs REST Síncrono",
        courseName: "Técnico em Desenvolvimento de Sistemas"
      });

      expect(quest).toBeDefined();
      expect(quest.mainInquiryQuestion).toBeDefined();
      expect(quest.recommendedSources.length).toBeGreaterThanOrEqual(2);
      expect(quest.guidingCriticalQuestions.length).toBeGreaterThanOrEqual(2);
      expect(quest.antiPlagiarismCriteria.length).toBeGreaterThan(0);
      expect(quest.evaluationRubric.length).toBeGreaterThan(0);

      // PDF Export
      const pdfBuffer = PedagogicalAuthoringSuiteService.exportGuidedResearchPdf(quest);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(2000);
    });
  });

  // 6. PACOTE MESTRE INTEGRADO (1-CLICK MASTER TEACHING PACK)
  describe("6. Master Teaching Pack (1-Click Generation)", () => {
    it("Deve gerar o Pacote Mestre Integrado com todos os 5 artefatos sincronizados em 1 chamada", async () => {
      const pack = await PedagogicalAuthoringSuiteService.generateMasterTeachingPack({
        theme: "Construção de APIs REST com PostgreSQL e Validação Estrita",
        courseName: "Técnico SENAI",
        subject: "Backend & Bancos de Dados",
        language: "typescript"
      });

      expect(pack).toBeDefined();
      expect(pack.courseware).toBeDefined();
      expect(pack.learningSituation).toBeDefined();
      expect(pack.debugLab).toBeDefined();
      expect(pack.caseStudy).toBeDefined();
      expect(pack.guidedResearch).toBeDefined();
    });
  });

});
