import { describe, it, expect } from "vitest";
import { TechInterviewAiService } from "../services/techInterviewAiService";
import { CognitiveTelemetryService } from "../services/cognitiveTelemetryService";
import { CapstoneProjectService } from "../services/capstoneProjectService";
import { CodeArenaService } from "../services/codeArenaService";

describe("EdTech Powerhouse - Tech Mock Interview AI Service", () => {
  it("should initialize a 3-stage tech mock interview session with valid questions", async () => {
    const session = await TechInterviewAiService.startInterviewSession({
      studentName: "Carlos Eduardo",
      studentRegistration: "2026-SENAI-101",
      targetRole: "junior_fullstack",
      language: "typescript"
    });

    expect(session).toBeDefined();
    expect(session.sessionId).toMatch(/^intv_/);
    expect(session.roleTitle).toContain("Fullstack");
    expect(session.questions.length).toBeGreaterThanOrEqual(3);

    const starQ = session.questions.find((q) => q.type === "behavioral_star");
    const codingQ = session.questions.find((q) => q.type === "live_coding");
    const designQ = session.questions.find((q) => q.type === "system_design");

    expect(starQ).toBeDefined();
    expect(codingQ).toBeDefined();
    expect(designQ).toBeDefined();
    expect(codingQ?.starterCode).toBeDefined();
  });

  it("should evaluate candidate answers and calculate Market Readiness Score", async () => {
    const session = await TechInterviewAiService.startInterviewSession({
      studentName: "Juliana Mendes",
      targetRole: "junior_backend",
      language: "python"
    });

    const report = await TechInterviewAiService.evaluateInterview({
      sessionId: session.sessionId,
      studentName: "Juliana Mendes",
      targetRole: "junior_backend",
      questions: session.questions,
      answers: [
        {
          questionId: session.questions[0].id,
          responseType: "text",
          content: "Situação: Em um projeto de API, identificamos lentidão. Tarefa: Otimizar as queries SQL. Ação: Adicionei índices no Postgres e cache Redis. Resultado: Latência caiu de 450ms para 35ms."
        },
        {
          questionId: session.questions[1].id,
          responseType: "code",
          content: "class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n    def get(self, key): return self.cache.get(key, -1)\n    def put(self, key, value): self.cache[key] = value"
        },
        {
          questionId: session.questions[2].id,
          responseType: "text",
          content: "Para alta disponibilidade, usamos filas RabbitMQ para processamento assíncrono e balanceamento de carga NGINX."
        }
      ]
    });

    expect(report.marketReadinessScore).toBeGreaterThanOrEqual(50);
    expect(report.marketReadinessScore).toBeLessThanOrEqual(100);
    expect(report.scoreBreakdown.codingProficiency).toBeDefined();
    expect(report.scoreBreakdown.architecturalThinking).toBeDefined();
    expect(report.scoreBreakdown.communicationSoftSkills).toBeDefined();
    expect(report.keyStrengths.length).toBeGreaterThan(0);
    expect(report.areasToImprove.length).toBeGreaterThan(0);
  });

  it("should generate a valid PDF binary buffer for the Employability Report without styling errors", async () => {
    const mockReport = {
      sessionId: "intv_test_01",
      studentName: "Lucas Silveira",
      studentRegistration: "2026-TEST",
      targetRole: "junior_fullstack" as const,
      roleTitle: "Desenvolvedor Fullstack Júnior",
      marketReadinessScore: 88,
      hiringDecision: "Recommended (Aprovado)" as const,
      scoreBreakdown: {
        codingProficiency: 90,
        architecturalThinking: 85,
        communicationSoftSkills: 88,
        problemSolvingSpeed: 86,
        industryBestPractices: 87
      },
      keyStrengths: ["Excelente raciocínio algorítmico", "Comunicação STAR precisa"],
      areasToImprove: ["Refinar testes automatizados de carga"],
      recommendedCurricularPaths: ["Microsserviços Avançados"],
      executiveSummary: "Candidato altamente recomendado para início imediato.",
      questionEvaluations: [],
      generatedAt: new Date().toISOString()
    };

    const pdfBuffer = await TechInterviewAiService.generateReportPdf(mockReport);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("EdTech Powerhouse - Cognitive Telemetry & Live Radar Service", () => {
  it("should calculate Cognitive Load Index (CLI) correctly for Flow State", () => {
    const event = {
      studentId: "stu_flow_01",
      studentName: "Ana Clara",
      charsAdded: 150,
      charsDeleted: 10,
      pasteCount: 0,
      executionErrorsCount: 0,
      currentCodeLength: 500,
      timestamp: Date.now()
    };

    const metrics = CognitiveTelemetryService.recordTelemetryEvent(event);
    expect(metrics.state).toBe("flow_state");
    expect(metrics.cognitiveLoadIndex).toBeLessThan(0.4);
    expect(metrics.needsTeacherIntervention).toBe(false);
  });

  it("should detect Cognitive Overload when student experiences high churn and error loops", () => {
    const event = {
      studentId: "stu_stuck_01",
      studentName: "Rodrigo Almeida",
      charsAdded: 20,
      charsDeleted: 80,
      pasteCount: 3,
      executionErrorsCount: 4,
      currentCodeLength: 120,
      timestamp: Date.now()
    };

    const metrics = CognitiveTelemetryService.recordTelemetryEvent(event);
    expect(metrics.state).toBe("cognitive_overload");
    expect(metrics.cognitiveLoadIndex).toBeGreaterThanOrEqual(0.7);
    expect(metrics.needsTeacherIntervention).toBe(true);
    expect(metrics.recommendedAction).toContain("Micro-Dica");
  });

  it("should aggregate classroom radar telemetry", () => {
    const radar = CognitiveTelemetryService.getClassroomRadar();
    expect(radar.totalActiveStudents).toBeGreaterThan(0);
    expect(radar.averageCognitiveLoad).toBeGreaterThanOrEqual(0);
    expect(radar.students.length).toBe(radar.totalActiveStudents);
  });

  it("should generate Socratic Just-In-Time Micro-Hints across 3 levels", async () => {
    const hintL1 = await CognitiveTelemetryService.generateMicroHint({
      studentName: "Lucas",
      studentId: "stu_01",
      codeSnippet: "for i in range(len(lista)):\n  print(lista[i+1])",
      language: "python",
      errorLog: "IndexError: list index out of range",
      hintLevel: 1
    });
    expect(hintL1.hintLevel).toBe(1);
    expect(hintL1.socraticHint).toBeDefined();

    const hintL3 = await CognitiveTelemetryService.generateMicroHint({
      studentName: "Lucas",
      studentId: "stu_01",
      codeSnippet: "def somar(): pass",
      language: "python",
      hintLevel: 3
    });
    expect(hintL3.hintLevel).toBe(3);
    expect(hintL3.pseudocodeScaffold).toBeDefined();
  });
});

describe("EdTech Powerhouse - Capstone Project Architect & PBL Dispatcher", () => {
  it("should generate a complete PBL project specification with Gherkin User Stories and Milestones", async () => {
    const spec = await CapstoneProjectService.generateProjectSpec({
      theme: "Sistema IoT de Monitoramento de Caldeiras Industriais",
      industrySector: "Indústria 4.0 & Manufatura Inteligente",
      preferredStack: "React, Node.js, PostgreSQL, Docker"
    });

    expect(spec.projectId).toBeDefined();
    expect(spec.title).toContain("Caldeiras");
    expect(spec.recommendedTechStack.database).toContain("PostgreSQL");
    expect(spec.userStories.length).toBeGreaterThanOrEqual(1);
    expect(spec.userStories[0].gherkinAcceptance).toContain("Cenário");
    expect(spec.milestones.length).toBeGreaterThanOrEqual(1);
  });

  it("should allocate balanced team squad roles across members", () => {
    const members = [
      { id: "s1", name: "Alice", dominantSkills: ["React"], skillLevel: "Avançado" as const },
      { id: "s2", name: "Bob", dominantSkills: ["Node.js"], skillLevel: "Avançado" as const },
      { id: "s3", name: "Charlie", dominantSkills: ["Docker"], skillLevel: "Intermediário" as const },
      { id: "s4", name: "Diana", dominantSkills: ["Vitest"], skillLevel: "Intermediário" as const },
      { id: "s5", name: "Evan", dominantSkills: ["Agile"], skillLevel: "Intermediário" as const }
    ];

    const allocation = CapstoneProjectService.allocateTeamRoles({
      teamName: "Squad IoT Pro",
      projectId: "pbl_101",
      projectTitle: "Smart Factory",
      members
    });

    expect(allocation.allocatedMembers.length).toBe(5);
    const assignedRoles = allocation.allocatedMembers.map((m) => m.assignedRole);
    expect(assignedRoles).toContain("Tech Lead & Arquiteto");
    expect(assignedRoles).toContain("Desenvolvedor(a) Backend & DB");
    expect(assignedRoles).toContain("Desenvolvedor(a) Frontend");
    expect(allocation.teamSynergyScore).toBeGreaterThan(80);
  });

  it("should evaluate Capstone Project with 360° rubric", () => {
    const evaluation = CapstoneProjectService.evaluateCapstoneProject({
      projectId: "pbl_101",
      teamName: "Squad IoT",
      architectureScore: 90,
      codeQualityScore: 85,
      testCoverageScore: 80,
      collaborationScore: 95,
      defenseScore: 90
    });

    expect(evaluation.finalScore).toBe(88);
    expect(evaluation.gradeCategory).toBe("Aprovado (Atende Plenamente)");
    expect(evaluation.technicalStrengths.length).toBeGreaterThan(0);
  });

  it("should generate a valid PDF Capstone Project Dossier buffer", async () => {
    const fallbackSpec = await CapstoneProjectService.generateProjectSpec({
      theme: "Gestão Hospitalar Resiliente",
      industrySector: "HealthTech"
    });

    const pdfBuffer = await CapstoneProjectService.generateCapstonePdf(fallbackSpec);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("EdTech Powerhouse - Code Arena & Real-Time Duels Service", () => {
  it("should create an active arena room with challenge and duelists", async () => {
    const room = await CodeArenaService.createRoom({
      roomName: "Duelo 1v1 Fast Sprint",
      mode: "1v1_duel",
      difficulty: "Intermediário",
      duelistA: { id: "p1", name: "Lucas" },
      duelistB: { id: "p2", name: "Ana" }
    });

    expect(room.roomId).toBeDefined();
    expect(room.challenge).toBeDefined();
    expect(room.duelists.length).toBe(2);
    expect(room.status).toBe("in_progress");
  });

  it("should evaluate a duelist solution, award score, Elo rating delta, and unlock badges", () => {
    const room = CodeArenaService.getRoom("arena_test_duel");

    const result = CodeArenaService.submitSolution({
      roomId: room.roomId,
      duelistId: "stu_101",
      code: "def detectar_anomalias(leituras):\n    media = sum(leituras) / len(leituras)\n    return [x for x in leituras if x > media * 1.5]",
      language: "python",
      timeElapsedSeconds: 38
    });

    expect(result.testsPassed).toBeGreaterThan(0);
    expect(result.scoreGained).toBeGreaterThan(500);
    expect(result.eloDelta).toBeGreaterThan(0);
    expect(result.badgesUnlocked.length).toBeGreaterThan(0);
  });

  it("should return sorted leaderboard entries", () => {
    const leaderboard = CodeArenaService.getLeaderboard();
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].eloRating).toBeGreaterThanOrEqual(leaderboard[1].eloRating);
  });
});
