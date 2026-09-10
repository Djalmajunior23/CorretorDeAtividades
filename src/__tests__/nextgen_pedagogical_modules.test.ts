import { describe, it, expect } from "vitest";
import { PullRequestReviewService } from "../services/pullRequestReviewService";
import { MutationTestingService } from "../services/mutationTestingService";
import { AccessibilityAuditService } from "../services/accessibilityAuditService";
import { ArchitecturalBoardService, BOARD_PERSONAS } from "../services/architecturalBoardService";

describe("Next-Gen EdTech - AI Code Review & Pull Request Simulator", () => {
  it("should create and review a Pull Request with inline comments and CI/CD checks", async () => {
    const pr = await PullRequestReviewService.createAndReviewPR({
      title: "feat(auth): add JWT stateless authentication",
      author: "Juliana Silva",
      description: "Implementação de autenticação JWT segura com refresh tokens",
      originalCode: "function login(user, pass) { return db.find(user, pass); }",
      modifiedCode: "export async function login(req, res) { const user = await authService.validate(req.body); return res.json(user); }",
      language: "typescript"
    });

    expect(pr).toBeDefined();
    expect(pr.id).toMatch(/^pr_/);
    expect(pr.author).toBe("Juliana Silva");
    expect(pr.cleanCodeScore).toBeGreaterThanOrEqual(50);
    expect(pr.securityScore).toBeGreaterThanOrEqual(50);
    expect(pr.cicdChecks.length).toBeGreaterThanOrEqual(3);
    expect(pr.inlineComments.length).toBeGreaterThanOrEqual(1);
    expect(pr.overallReviewVerdict).toBeDefined();
  });

  it("should generate a valid PDF buffer for the Pull Request Review report", async () => {
    const mockPr = await PullRequestReviewService.createAndReviewPR({
      title: "refactor(data): optimize queries",
      author: "Felipe Nogueira",
      description: "Otimização de consultas",
      originalCode: "SELECT * FROM users",
      modifiedCode: "SELECT id, name FROM users WHERE active = true",
      language: "typescript"
    });

    const pdfBuffer = await PullRequestReviewService.generateReportPdf(mockPr);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("Next-Gen EdTech - Automated Mutation Testing & TDD Lab", () => {
  it("should generate mutants and calculate Mutation Score %", async () => {
    const report = await MutationTestingService.runMutationTesting({
      studentName: "Carlos Eduardo",
      code: "def eh_maior(a, b):\n    if a > b:\n        return True\n    return False",
      testSuite: "import unittest\nclass TestMaior(unittest.TestCase):\n    def test_maior(self):\n        self.assertTrue(eh_maior(10, 5))",
      language: "python"
    });

    expect(report).toBeDefined();
    expect(report.reportId).toMatch(/^mut_/);
    expect(report.mutationScore).toBeGreaterThanOrEqual(0);
    expect(report.mutationScore).toBeLessThanOrEqual(100);
    expect(report.totalMutants).toBeGreaterThanOrEqual(2);
    expect(report.mutants.length).toBe(report.totalMutants);
    expect(report.tddMaturityLevel).toBeDefined();
    expect(report.missingEdgeCasesIdentified.length).toBeGreaterThan(0);
  });

  it("should generate a valid PDF buffer for the Mutation Testing report", async () => {
    const report = await MutationTestingService.runMutationTesting({
      studentName: "Lucas Silveira",
      code: "def dobro(x): return x * 2",
      testSuite: "def test_dobro(): assert dobro(2) == 4",
      language: "python"
    });

    const pdfBuffer = await MutationTestingService.generateReportPdf(report);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("Next-Gen EdTech - Accessibility (a11y) & WCAG 2.2 Inspector", () => {
  it("should audit frontend code against WCAG 2.2 guidelines", async () => {
    const audit = await AccessibilityAuditService.auditFrontendCode({
      studentName: "Mariana Costa",
      projectName: "App Portfólio",
      code: "<main><img src='pic.jpg' /><button><span /></button></main>"
    });

    expect(audit).toBeDefined();
    expect(audit.auditId).toMatch(/^a11y_/);
    expect(audit.score).toBeGreaterThanOrEqual(0);
    expect(audit.score).toBeLessThanOrEqual(100);
    expect(audit.wcagComplianceGrade).toBeDefined();
    expect(audit.violations.length).toBeGreaterThanOrEqual(1);
    expect(audit.contrastRatioMetrics.lowestRatioFound).toBeDefined();
    expect(audit.keyboardNavigationReport).toBeDefined();
  });

  it("should generate a valid PDF buffer for the Accessibility report", async () => {
    const audit = await AccessibilityAuditService.auditFrontendCode({
      studentName: "Mariana Costa",
      code: "<button aria-label='Salvar dados'>Salvar</button>"
    });

    const pdfBuffer = await AccessibilityAuditService.generateReportPdf(audit);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("Next-Gen EdTech - Virtual Architectural Board & Multi-Agent Panel", () => {
  it("should start a 3-agent architectural board session with specialized opening questions", async () => {
    const session = await ArchitecturalBoardService.startSession({
      studentName: "Gabriel Martins",
      systemName: "Gateway de Telemetria IoT",
      architectureSummary: "Arquitetura orientada a eventos com RabbitMQ e Redis"
    });

    expect(session).toBeDefined();
    expect(session.sessionId).toMatch(/^board_/);
    expect(session.interactions.length).toBeGreaterThanOrEqual(3);

    const csoQuestion = session.interactions.find((i) => i.sender === "security_cso");
    const cloudQuestion = session.interactions.find((i) => i.sender === "cloud_devops");
    const perfQuestion = session.interactions.find((i) => i.sender === "performance_ux");

    expect(csoQuestion).toBeDefined();
    expect(cloudQuestion).toBeDefined();
    expect(perfQuestion).toBeDefined();
    expect(BOARD_PERSONAS.security_cso.name).toBeDefined();
  });

  it("should conclude defense, generate Architectural Decision Record (ADR) and final score", async () => {
    const initialSession = await ArchitecturalBoardService.startSession({
      studentName: "Gabriel Martins",
      systemName: "Gateway de Telemetria IoT",
      architectureSummary: "Arquitetura orientada a eventos com RabbitMQ e Redis"
    });

    const concludedSession = await ArchitecturalBoardService.concludeBoardAndGenerateADR({
      sessionId: initialSession.sessionId,
      studentName: "Gabriel Martins",
      systemName: initialSession.systemName,
      architectureSummary: initialSession.architectureSummary,
      interactions: initialSession.interactions,
      studentDefenseText: "Usamos mTLS para segurança interna e cluster Redis em 3 nós com replicação assíncrona."
    });

    expect(concludedSession.finalScore).toBeGreaterThanOrEqual(50);
    expect(concludedSession.verdict).toBeDefined();
    expect(concludedSession.adr).toBeDefined();
    expect(concludedSession.adr?.status).toBe("ACCEPTED");
    expect(concludedSession.adr?.tradeOffsMatrix.length).toBeGreaterThanOrEqual(1);
  });

  it("should generate a valid PDF buffer for the Architectural Board Dossier", async () => {
    const session = await ArchitecturalBoardService.startSession({
      studentName: "Gabriel Martins",
      systemName: "Sistema IoT",
      architectureSummary: "Arquitetura em camadas"
    });
    const concluded = await ArchitecturalBoardService.concludeBoardAndGenerateADR({
      sessionId: session.sessionId,
      studentName: "Gabriel Martins",
      systemName: session.systemName,
      architectureSummary: session.architectureSummary,
      interactions: session.interactions,
      studentDefenseText: "Defesa completa."
    });

    const pdfBuffer = await ArchitecturalBoardService.generateReportPdf(concluded);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
