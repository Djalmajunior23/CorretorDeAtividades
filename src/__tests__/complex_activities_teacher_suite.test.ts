import { describe, it, expect } from "vitest";
import { ComplexActivityGeneratorService, ComplexActivityService, ComplexActivity } from "../services/complexActivityService";

describe("Complex Activities & Teacher AI Suite", () => {
  // =========================================================================
  // MODULE 1: GERADOR DE ATIVIDADES COMPLEXAS COM CONTEXTO INDUSTRIAL
  // =========================================================================
  describe("Module 1: Complex Activity Generator Engine", () => {
    it("should generate a rich industrial activity with strict command and test cases for Fintech", async () => {
      const activity = await ComplexActivityGeneratorService.generateComplexActivity({
        topic: "Processamento de Transações Financeiras e Detecção de Fraude",
        bloomLevel: "Criação de Sistemas",
        difficulty: "Avançado / Industrial",
        industrialSector: "Fintech & Bancário",
        languageOrDialect: "TypeScript",
        modality: "Algoritmo / Código"
      });

      expect(activity).toBeDefined();
      expect(activity.id).toMatch(/^act_complex_/);
      expect(activity.title).toBeDefined();
      expect(activity.contextualScenario.length).toBeGreaterThan(30);
      expect(activity.questionCommand.length).toBeGreaterThan(20);
      expect(activity.businessRules.length).toBeGreaterThanOrEqual(2);
      expect(activity.edgeCasesAndConstraints.length).toBeGreaterThanOrEqual(1);
      expect(activity.testCases.length).toBeGreaterThanOrEqual(2);
      expect(activity.referenceSolution.length).toBeGreaterThan(20);
      expect(activity.rubrics.length).toBeGreaterThanOrEqual(2);
      expect(activity.bloomLevel).toBe("Criação de Sistemas");
      expect(activity.industrialSector).toBe("Fintech & Bancário");

      // Verify test cases have isHidden flags
      const hasPublic = activity.testCases.some(t => !t.isHidden);
      const hasHidden = activity.testCases.some(t => t.isHidden);
      expect(hasPublic).toBe(true);
      expect(hasHidden).toBe(true);
    });

    it("should generate activity across multiple industrial domains (Indústria 4.0, Saúde)", async () => {
      const iotActivity = await ComplexActivityService.generateComplexActivity({
        topic: "Telemetria de Sensores MQTT em Linha de Montagem",
        industrialSector: "Indústria 4.0 & Manufatura",
        languageOrDialect: "Python",
        difficulty: "Intermediário",
        bloomLevel: "Análise Crítica"
      });

      expect(iotActivity).toBeDefined();
      expect(iotActivity.industrialSector).toBe("Indústria 4.0 & Manufatura");
      expect(iotActivity.languageOrDialect).toBe("Python");
      expect(iotActivity.rubrics.reduce((acc, r) => acc + r.weight, 0)).toBe(100);
    });

    it("should export activity to SENAI styled PDF Buffer", () => {
      const mockActivity: ComplexActivity = {
        id: "act_test_123",
        title: "Microsserviço de Conciliação Bancária",
        topic: "Conciliação Bancária",
        industrialSector: "Fintech & Bancário",
        bloomLevel: "Avaliação de Soluções",
        difficulty: "Avançado / Industrial",
        modality: "Algoritmo / Código",
        languageOrDialect: "TypeScript",
        contextualScenario: "Você foi contratado por um banco digital em expansão para desenvolver o motor de conciliação...",
        questionCommand: "Desenvolva a função reconcileTransactions(batches)...",
        businessRules: ["Regra 1: Validação de chave PIX", "Regra 2: Tolerância de 0.01 centavos"],
        edgeCasesAndConstraints: ["Transações com timestamp idêntico", "Payload com valores nulos"],
        testCases: [
          { id: 1, description: "Lote Válido", input: "[100, 200]", expectedOutput: "300", isHidden: false },
          { id: 2, description: "Lote com Nulos", input: "[100, null]", expectedOutput: "100", isHidden: true }
        ],
        referenceSolution: "export function reconcileTransactions() { return 300; }",
        rubrics: [
          { criterion: "Corretude Algorítmica", weight: 50, performanceExpectation: "Passa em todos os testes" },
          { criterion: "Tratamento de Exceções", weight: 30, performanceExpectation: "Proteção contra nulos" },
          { criterion: "Clean Code", weight: 20, performanceExpectation: "Código legível" }
        ],
        estimatedTimeMinutes: 60,
        tags: ["Fintech", "TypeScript"],
        createdAt: new Date().toISOString()
      };

      const buffer = ComplexActivityGeneratorService.exportActivityToPdf(mockActivity, {
        teacherName: "Prof. Especialista SENAI",
        className: "Técnico em Desenvolvimento de Sistemas"
      });
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });

    it("should export Moodle XML with structured question and unit tests", () => {
      const mockActivity: ComplexActivity = {
        id: "act_moodle_test",
        title: "API de Pagamentos",
        topic: "API REST",
        industrialSector: "E-Commerce de Alto Tráfego",
        bloomLevel: "Aplicação Prática",
        difficulty: "Intermediário",
        modality: "Algoritmo / Código",
        languageOrDialect: "JavaScript",
        contextualScenario: "Construa o motor de checkout...",
        questionCommand: "Implemente a rota POST /checkout",
        businessRules: ["Valide cartão de crédito"],
        edgeCasesAndConstraints: ["Timeout de gateway"],
        testCases: [
          { id: 1, description: "Sucesso", input: "req_ok", expectedOutput: "200_OK", isHidden: false },
          { id: 2, description: "Recusa", input: "req_bad", expectedOutput: "400_BAD", isHidden: true }
        ],
        referenceSolution: "function checkout() {}",
        rubrics: [],
        estimatedTimeMinutes: 45,
        tags: ["E-Commerce"],
        createdAt: new Date().toISOString()
      };

      const xml = ComplexActivityGeneratorService.exportMoodleXml(mockActivity);
      expect(xml).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
      expect(xml).toContain("<quiz>");
      expect(xml).toContain("<text>API de Pagamentos</text>");
      expect(xml).toContain("Casos de Teste Automatizados:");
      expect(xml).toContain("[PUBLICO]");
      expect(xml).toContain("[OCULTO]");
      expect(xml).toContain("</quiz>");
    });
  });

  // =========================================================================
  // MODULE 2: TEST-DRIVE DE ENUNCIADO COM 3 PERSONAS DE IA
  // =========================================================================
  describe("Module 2: AI Statement Test-Drive Simulator", () => {
    it("should simulate test-drive across High-Performer, Average, and Struggling student personas", async () => {
      const testDrive = await ComplexActivityGeneratorService.simulatePromptTestDrive({
        activityTitle: "Processamento Assíncrono de Pedidos",
        contextualScenario: "Uma fintech precisa enfileirar pagamentos concorrentes com controle de concorrência.",
        questionCommand: "Crie um serviço em TypeScript para processar pedidos concorrentes com semáforo assíncrono.",
        businessRules: ["Máximo de 5 requisições paralelas", "Fila FIFO"],
        languageOrDialect: "TypeScript"
      });

      expect(testDrive).toBeDefined();
      expect(testDrive.clarityScore).toBeGreaterThanOrEqual(60);
      expect(testDrive.clarityScore).toBeLessThanOrEqual(100);
      expect(testDrive.simulations).toHaveLength(3);

      const personas = testDrive.simulations.map(p => p.persona);
      expect(personas).toContain("Aluno Excelente (High Performer)");
      expect(personas).toContain("Aluno Mediano (Erro Conceitual Típico)");
      expect(personas).toContain("Aluno Iniciante (Bloqueio / Dúvidas)");

      // Check teacher recommendations and improvements
      expect(testDrive.suggestedImprovements.length).toBeGreaterThanOrEqual(1);
      expect(testDrive.predictedClassroomQuestions.length).toBeGreaterThanOrEqual(1);

      // Verify struggling persona has typical stumbling blocks
      const struggling = testDrive.simulations.find(p => p.persona.includes("Iniciante"));
      expect(struggling?.identifiedIssueOrAmbiguity.length).toBeGreaterThan(0);
      expect(struggling?.predictedStudentQuestion.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // MODULE 3: MATRIZES DE AVALIAÇÃO SAEP / SENAI
  // =========================================================================
  describe("Module 3: SAEP / SENAI Rubrics Matrix Generator", () => {
    it("should generate a complete SAEP evaluation matrix with 4 proficiency levels", async () => {
      const matrix = await ComplexActivityGeneratorService.generateSaepRubricMatrix({
        title: "Matriz SAEP - Desenvolvimento Web e Mobile",
        courseName: "Curso Técnico em Desenvolvimento de Sistemas",
        unitCurricular: "Desenvolvimento de Aplicações Web e Mobile",
        focalCompetencies: [
          "Construir componentes de software modulares e desacoplados",
          "Aplicar testes unitários e de integração",
          "Trabalhar em equipe com versionamento colaborativo"
        ]
      });

      expect(matrix).toBeDefined();
      expect(matrix.matrixId).toMatch(/^saep_mat_/);
      expect(matrix.competencies.length).toBeGreaterThanOrEqual(2);

      // Verify each competency has 4 proficiency levels
      for (const comp of matrix.competencies) {
        expect(comp.indicators.insatisfatorio.length).toBeGreaterThan(5);
        expect(comp.indicators.basico.length).toBeGreaterThan(5);
        expect(comp.indicators.adequado.length).toBeGreaterThan(5);
        expect(comp.indicators.avancado.length).toBeGreaterThan(5);
        expect(comp.weight).toBeGreaterThan(0);
      }
    });

    it("should generate SAEP Matrix PDF Buffer successfully", () => {
      const mockMatrix = {
        matrixId: "saep_test",
        title: "Matriz SAEP - Redes de Computadores",
        courseName: "Técnico em Redes",
        unitCurricular: "Segurança de Redes",
        totalPoints: 100,
        competencies: [
          {
            id: "cap1",
            capacityName: "Configurar Firewall e Políticas de Acesso",
            capacityType: "Técnica" as const,
            weight: 60,
            indicators: {
              insatisfatorio: "Não sabe configurar regras de filtragem.",
              basico: "Configura regras básicas com supervisão.",
              adequado: "Configura com segurança e documenta regras.",
              avancado: "Automatiza regras, audita logs e mitiga ataques em tempo real."
            }
          },
          {
            id: "soc1",
            capacityName: "Ética e Sigilo Profissional",
            capacityType: "Socioemocional / Metodológica" as const,
            weight: 40,
            indicators: {
              insatisfatorio: "Expõe credenciais e descumpre políticas.",
              basico: "Mantém sigilo parcial.",
              adequado: "Postura ética rigorosa e segura.",
              avancado: "Promove cultura de segurança e privacidade no squad."
            }
          }
        ],
        generalObservations: "Padrão de Avaliação SAEP 2026",
        createdAt: new Date().toISOString()
      };

      const buffer = ComplexActivityGeneratorService.exportSaepMatrixToPdf(mockMatrix);
      expect(buffer).toBeDefined();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  // =========================================================================
  // MODULE 4: FEEDBACK POR VOZ / DITADO RÁPIDO DO PROFESSOR
  // =========================================================================
  describe("Module 4: Teacher Voice Feedback Engine", () => {
    it("should synthesize unstructured spoken teacher comments into a structured formal report", async () => {
      const voiceInput = "Olha Carlos, a sua lógica da rota de login funcionou bem e você tratou a senha certinho com bcrypt, mas você esqueceu de tratar o token JWT expirado quando manda a requisição e a validação do email aceita formato inválido. Presta atenção na injeção de dependência também.";

      const report = await ComplexActivityGeneratorService.formatVoiceDictatedFeedback({
        rawDictatedNotes: voiceInput,
        studentName: "Carlos Eduardo Silva",
        activityTitle: "Microsserviço de Autenticação com JWT",
        assignedGrade: 85
      });

      expect(report).toBeDefined();
      expect(report.studentName).toBe("Carlos Eduardo Silva");
      expect(report.strengths.length).toBeGreaterThan(0);
      expect(report.criticalCorrections.length).toBeGreaterThan(0);
      expect(report.actionPlan.length).toBeGreaterThan(0);
      expect(report.assignedGrade).toBe(85);
      expect(report.officialSenaiParecer.length).toBeGreaterThan(20);
    });
  });

  // =========================================================================
  // MODULE 5: TRILHAS ADAPTATIVAS DE REFORÇO (DIFERENCIAÇÃO PEDAGÓGICA)
  // =========================================================================
  describe("Module 5: Adaptive Reinforcement Tracks Engine", () => {
    it("should generate 3 tiered pedagogical tracks (Remedial, Consolidation, Advanced)", async () => {
      const tracks = await ComplexActivityGeneratorService.generateAdaptiveTracks({
        topic: "Manipulação de Árvores Binárias",
        language: "Python",
        commonDifficulties: ["Recursão infinita", "Ponteiros nulos sem validação"]
      });

      expect(tracks).toBeDefined();
      expect(tracks.tiers).toHaveLength(3);

      const remedial = tracks.tiers.find(t => t.tierName === "Nivelamento / Scaffold");
      const standard = tracks.tiers.find(t => t.tierName === "Consolidação Padrão");
      const advanced = tracks.tiers.find(t => t.tierName === "Desafio Avançado");

      expect(remedial).toBeDefined();
      expect(remedial?.scaffoldingHints.length).toBeGreaterThan(0);
      expect(remedial?.sampleStarterCode.length).toBeGreaterThan(0);

      expect(standard).toBeDefined();
      expect(standard?.adaptedCommand.length).toBeGreaterThan(15);

      expect(advanced).toBeDefined();
      expect(advanced?.adaptedCommand.length).toBeGreaterThan(15);
    });
  });
});
