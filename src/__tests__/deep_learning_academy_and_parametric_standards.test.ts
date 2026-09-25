import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { ParametricExamService, ParametricExamMaster } from "../services/parametricExamService";
import { DeepLearningAcademyService, MasteryPassportReport } from "../services/deepLearningAcademyService";

describe("CiberAcademy Deep Learning & SENAI Parametric Exam Standards Test Suite", () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  const mockPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    on: vi.fn()
  };

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, mockPool as any);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as any).port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // 1. PADRÃO INSTITUCIONAL SENAI PARA PROVAS PARAMÉTRICAS
  // =========================================================================
  describe("1. Parametric Exams SENAI Institutional Standards", () => {
    it("Deve gerar Dossiê Master de Prova no Padrão SENAI com cabeçalho oficial e matriz de sala", async () => {
      const exam = await ParametricExamService.generateParametricExam({
        examTitle: "Avaliação Prática de Algoritmos Avançados",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        subject: "Programação de Soluções Computacionais",
        basePrompt: "Implementar cálculo de desconto progressivo",
        language: "typescript",
        variantCount: 4,
        durationMinutes: 90,
        students: [
          { id: "st-01", name: "Ana Beatriz Silva" },
          { id: "st-02", name: "Carlos Eduardo Santos" },
          { id: "st-03", name: "Mariana Oliveira" },
          { id: "st-04", name: "Lucas Lima" }
        ]
      });

      expect(exam.variants.length).toBe(4);
      expect(exam.studentAssignments.length).toBe(4);
      expect(exam.studentAssignments[0].assignedVariant).toBe("A");
      expect(exam.studentAssignments[1].assignedVariant).toBe("B");

      const pdfBuffer = await ParametricExamService.generateMasterExamPdf(exam);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(5000);
    });

    it("Deve gerar simulado com QUANTIDADE EXATA DE QUESTÕES solicitada e 4 ALTERNATIVAS (A, B, C, D) em várias linguagens de programação", async () => {
      const requestedQuestions = 12;
      const languages = ["python", "javascript", "typescript", "java", "sql", "csharp", "cpp", "go"];

      const exam = await ParametricExamService.generateParametricExam({
        examTitle: "Simulado Técnico Multi-Linguagens SENAI",
        courseName: "Técnico em Desenvolvimento de Sistemas",
        subject: "Linguagens de Programação & Estruturas de Dados",
        basePrompt: "Simulado completo cobrindo sintaxe, POO, closures e consultas relacionais",
        questionCount: requestedQuestions,
        selectedLanguages: languages,
        variantCount: 4,
        durationMinutes: 120,
        students: [
          { id: "st-01", name: "Ana Beatriz Silva", enrollmentCode: "SENAI-2026-001" },
          { id: "st-02", name: "Carlos Eduardo Santos", enrollmentCode: "SENAI-2026-002" },
          { id: "st-03", name: "Mariana Oliveira", enrollmentCode: "SENAI-2026-003" }
        ]
      });

      expect(exam.questionCount).toBe(requestedQuestions);
      expect(exam.variants.length).toBe(4);

      // Verify each variant has the exact requested number of questions
      exam.variants.forEach(variant => {
        expect(variant.questions.length).toBe(requestedQuestions);

        // Verify each question has exactly 4 options (A, B, C, D) with 1 correct
        variant.questions.forEach(q => {
          expect(q.options.length).toBe(4);
          expect(q.options.map(o => o.letter)).toEqual(["A", "B", "C", "D"]);
          
          const correctOptions = q.options.filter(o => o.isCorrect);
          expect(correctOptions.length).toBe(1);
          expect(q.correctOption).toBe(correctOptions[0].letter);
          expect(q.explanation).toBeDefined();
        });
      });

      // Verify multi-language distribution
      const generatedLanguages = new Set(exam.variants[0].questions.map(q => q.language));
      expect(generatedLanguages.size).toBeGreaterThanOrEqual(3);
    });

    it("Deve gerar Cadernos Individuais de Prova para os alunos selecionados da turma e permitir exportação em lote", async () => {
      const selectedClassStudents = [
        { id: "std-01", name: "Gabriel Monteiro Cruz", enrollmentCode: "MAT-2026-101" },
        { id: "std-02", name: "Helena Beatriz Barbosa", enrollmentCode: "MAT-2026-102" },
        { id: "std-03", name: "Isabela Ferreira Ramos", enrollmentCode: "MAT-2026-103" }
      ];

      const exam = await ParametricExamService.generateParametricExam({
        examTitle: "Avaliação Oficial da Turma DS-2026",
        courseName: "Técnico em Desenvolvimento de Sistemas",
        subject: "Desenvolvimento de Software",
        basePrompt: "Prova bimestral de algoritmos e linguagens",
        questionCount: 8,
        selectedLanguages: ["python", "javascript", "java", "sql"],
        classId: "turma-ds-01",
        className: "Turma DS-101 Noite",
        students: selectedClassStudents
      });

      // Verify individual booklets generated for each student
      expect(exam.studentBooklets.length).toBe(3);
      expect(exam.studentBooklets[0].studentName).toBe("Gabriel Monteiro Cruz");
      expect(exam.studentBooklets[0].enrollmentCode).toBe("MAT-2026-101");
      expect(exam.studentBooklets[0].questions.length).toBe(8);
      expect(exam.studentBooklets[0].uniqueExamToken).toContain("EXAM-");

      // Verify single student booklet PDF export
      const singleBookletPdf = ParametricExamService.exportStudentIndividualBookletPdf(exam.studentBooklets[0]);
      expect(singleBookletPdf).toBeInstanceOf(Buffer);
      expect(singleBookletPdf.length).toBeGreaterThan(3000);

      // Verify all class booklets batch PDF export
      const allClassBookletsPdf = ParametricExamService.exportAllClassBookletsPdf(exam.studentBooklets);
      expect(allClassBookletsPdf).toBeInstanceOf(Buffer);
      expect(allClassBookletsPdf.length).toBeGreaterThan(singleBookletPdf.length);
    });

    it("Deve gerar Caderno Individual de Prova e Folha Oficial de Respostas Pautada", () => {
      const variant = {
        variantId: "A" as const,
        title: "Avaliação Variante A - E-Commerce",
        domainScenario: "Checkout de E-Commerce",
        problemStatement: "Calcular taxa e desconto progressivo",
        inputFormat: "number",
        outputFormat: "number",
        constraints: ["O(1) tempo", "Sem libs externas"],
        starterCode: "export function resolver(v: number) { return v; }",
        expectedSolutionCode: "export function resolver(v: number) { return v * 0.9; }",
        testCases: [
          { id: "t1", name: "Caso 1", input: "100", expectedOutput: "90", isHidden: false },
          { id: "t2", name: "Caso Oculto", input: "500", expectedOutput: "425", isHidden: true }
        ],
        rubric: [
          { id: "r1", criterion: "Conhecimentos CHA", weight: 40, description: "Lógica e sintaxe" }
        ],
        antiPlagiarismChecksum: "sig_A_12345",
        variableDictionary: { fnName: "resolver" },
        questions: [],
        questionCount: 0,
        answerKeyMap: {}
      };

      const singlePdf = ParametricExamService.exportSingleVariantPdf(variant, {
        examTitle: "Avaliação Oficial",
        courseName: "Técnico SENAI",
        durationMinutes: 90
      });
      expect(singlePdf).toBeInstanceOf(Buffer);
      expect(singlePdf.length).toBeGreaterThan(3000);

      const answerSheet = ParametricExamService.exportAnswerSheetPdf({
        examTitle: "Avaliação Oficial",
        courseName: "Técnico SENAI",
        variantId: "A"
      });
      expect(answerSheet).toBeInstanceOf(Buffer);
      expect(answerSheet.length).toBeGreaterThan(2000);

      const moodleXml = ParametricExamService.exportVariantMoodleXml(variant);
      expect(moodleXml).toContain("<quiz>");
      expect(moodleXml).toContain("[SENAI]");
      expect(moodleXml).toContain("Checkout de E-Commerce");
    });
  });

  // =========================================================================
  // 2. CIBERACADEMY • APRENDIZADO PROFUNDO & MODELOS MENTAIS
  // =========================================================================
  describe("2. Deep Learning Academy & Cognitive Models", () => {
    it("Deve carregar catálogo de conceitos estruturantes com modelos mentais, intuição e analogias", () => {
      const nodes = DeepLearningAcademyService.getInitialConceptNodes();
      expect(nodes.length).toBeGreaterThanOrEqual(6);
      
      const bigO = nodes.find(n => n.id === "node_big_o");
      expect(bigO).toBeDefined();
      expect(bigO?.mentalModel.coreIntuition).toContain("Big-O");
      expect(bigO?.mentalModel.realWorldAnalogy.length).toBeGreaterThan(20);
      expect(bigO?.mentalModel.failureGotchas.length).toBeGreaterThanOrEqual(2);
    });

    it("Deve iniciar sessão socrática adaptativa e evoluir de fase na sabatina com IA", async () => {
      const session = await DeepLearningAcademyService.startSocraticInquiry({
        studentId: "st-01",
        conceptId: "node_async_event_loop",
        conceptTitle: "Modelo de Concorrência & Event Loop"
      });

      expect(session.sessionId).toContain("soc_");
      expect(session.currentStage).toBe("intuition_hypothesis");
      expect(session.conversationHistory.length).toBe(1);

      // Responder a primeira pergunta
      const step2 = await DeepLearningAcademyService.evaluateSocraticStep({
        session,
        studentResponse: "Acredito que o gargalo ocorre quando o Event Loop fica bloqueado por código síncrono pesado."
      });

      expect(step2.currentStage).toBe("edge_case_investigation");
      expect(step2.conversationHistory.length).toBe(3);
      expect(step2.depthScore).toBeGreaterThan(session.depthScore);
    });

    it("Deve simular rastreamento mental de execução com Call Stack, Heap e questão preditiva", () => {
      const steps = DeepLearningAcademyService.simulateMentalDebugger("const arr = new Array(1000);");
      expect(steps.length).toBeGreaterThanOrEqual(3);

      const step1 = steps[0];
      expect(step1.callStack).toContain("main()");
      expect(step1.heapAllocations).toBeDefined();
      expect(step1.predictionQuestion).toBeDefined();
      expect(step1.predictionQuestion?.options.length).toBe(4);
    });

    it("Deve gerenciar repetição espaçada SM-2 expandindo intervalos para acertos", () => {
      const deck = DeepLearningAcademyService.getSpacedRepetitionDeck();
      expect(deck.length).toBeGreaterThanOrEqual(4);

      const card = deck[0];
      const reviewedEasy = DeepLearningAcademyService.reviewCard(card, 5);
      expect(reviewedEasy.repetitions).toBe(1);
      expect(reviewedEasy.intervalDays).toBeGreaterThanOrEqual(1);

      const reviewedFailed = DeepLearningAcademyService.reviewCard(reviewedEasy, 1);
      expect(reviewedFailed.repetitions).toBe(0);
      expect(reviewedFailed.intervalDays).toBe(1);
    });

    it("Deve fornecer dojo de trade-offs de engenharia e emitir passaporte de domínio SENAI em PDF", () => {
      const tradeOffs = DeepLearningAcademyService.getTradeOffChallenges();
      expect(tradeOffs.length).toBeGreaterThanOrEqual(2);
      expect(tradeOffs[0].tradeOffAxis).toBe("Time vs Space");

      const passport: MasteryPassportReport = {
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
        overallMasteryPercentage: 92,
        deepConcepts: [
          { concept: "Complexidade Big-O", score: 95, level: "Mastery" },
          { concept: "Event Loop", score: 88, level: "Advanced" }
        ],
        verifiedHours: 42,
        socraticSynthesesCount: 10,
        pedagogicalEndorsement: "Demonstrou excelente capacidade de abstração e domínio arquitetural.",
        hashVerification: "SENAI-TEST-HASH-123",
        issuedAt: new Date().toISOString()
      };

      const pdf = DeepLearningAcademyService.exportMasteryPassportPdf(passport);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(4000);
    });
  });

  // =========================================================================
  // 3. SUÍTE DE ROTAS HTTP EXPRESS
  // =========================================================================
  describe("3. Express Endpoints for Academy & Parametric Standards", () => {
    it("GET /api/academy/concepts - Deve retornar lista de conceitos estruturantes", async () => {
      const res = await fetch(`${baseUrl}/api/academy/concepts`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.concepts.length).toBeGreaterThanOrEqual(6);
    });

    it("POST /api/academy/socratic/start - Deve iniciar sessão socrática", async () => {
      const res = await fetch(`${baseUrl}/api/academy/socratic/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "st-01", conceptId: "node_big_o", conceptTitle: "Análise Assintótica Big-O" })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.sessionId).toBeDefined();
    });

    it("GET /api/academy/spaced-repetition/deck - Deve retornar baralho de flashcards", async () => {
      const res = await fetch(`${baseUrl}/api/academy/spaced-repetition/deck`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.cards.length).toBeGreaterThanOrEqual(4);
    });

    it("POST /api/academy/export-passport-pdf - Deve exportar PDF do passaporte", async () => {
      const res = await fetch(`${baseUrl}/api/academy/export-passport-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passport: {
            studentId: "st-01",
            studentName: "Ana Beatriz Silva",
            courseName: "Técnico SENAI",
            overallMasteryPercentage: 90,
            deepConcepts: [{ concept: "Big-O", score: 90, level: "Mastery" }],
            verifiedHours: 30,
            socraticSynthesesCount: 5,
            pedagogicalEndorsement: "Aprovado com distinção",
            hashVerification: "HASH123",
            issuedAt: new Date().toISOString()
          }
        })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });

    it("POST /api/parametric-exam/export-answersheet-pdf - Deve exportar folha de respostas oficial", async () => {
      const res = await fetch(`${baseUrl}/api/parametric-exam/export-answersheet-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examTitle: "Avaliação Somativa",
          courseName: "Técnico SENAI",
          variantId: "B"
        })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
    });
  });
});
