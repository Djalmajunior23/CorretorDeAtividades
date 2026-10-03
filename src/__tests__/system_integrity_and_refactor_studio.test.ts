import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { SystemIntegrityDiagnosticsService } from "../services/systemIntegrityDiagnosticsService";
import { SmartCodeRefactorService } from "../services/smartCodeRefactorService";
import { generateJwtToken } from "../utils/security";

// Mock pg Pool
const mockPool = {
  query: vi.fn().mockImplementation((queryText: string, params: any[]) => {
    return Promise.resolve({ rows: [] });
  }),
  on: vi.fn(),
};

describe("Suíte de Diagnóstico de Integridade, Self-Healing & Refatoração Inteligente (SENAI IT & AppSec)", () => {
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

  describe("1. SystemIntegrityDiagnosticsService", () => {
    it("deve executar diagnóstico completo de infraestrutura e retornar relatório com conformidade ASVS", async () => {
      const report = await SystemIntegrityDiagnosticsService.runFullDiagnostics();

      expect(report).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(50);
      expect(report.activeChecks.length).toBeGreaterThanOrEqual(4);
      expect(report.securityCompliance.asvsLevel).toContain("ASVS");
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it("deve executar rotina de auto-cura (self-healing) e registrar ações saneadoras", async () => {
      const result = await SystemIntegrityDiagnosticsService.triggerSelfHealingRoutine();

      expect(result.success).toBe(true);
      expect(result.actionsTaken.length).toBeGreaterThan(0);
      expect(result.healedAt).toBeDefined();
    });
  });

  describe("2. SmartCodeRefactorService", () => {
    it("deve detectar vulnerabilidade de eval/exec e calcular complexidade ciclomática", () => {
      const vulnerableCode = `
def processar(dados):
    for i in range(len(dados)):
        if dados[i] > 10:
            for j in range(len(dados)):
                if j == i:
                    res = eval(str(dados[i] + dados[j]))
    return res
`;
      const analysis = SmartCodeRefactorService.generateDeterministicOfflineRefactor(vulnerableCode, "python");

      expect(analysis).toBeDefined();
      expect(analysis.metrics.cyclomaticComplexityBefore).toBeGreaterThan(2);
      expect(analysis.metrics.securityFlawsDetected).toBeGreaterThanOrEqual(1);
      expect(analysis.findings.some(f => f.category === "security_vulnerability")).toBe(true);
      expect(analysis.refactoredCode).toBeDefined();
      expect(analysis.pedagogicalSummary.length).toBeGreaterThan(10);
    });

    it("deve detectar concatenação insegura de SQL (CWE-89)", () => {
      const sqlVulnerableCode = `
def buscar_usuario(req):
    query = "SELECT * FROM users WHERE id = " + req.params.id
    return db.query(query)
`;
      const analysis = SmartCodeRefactorService.generateDeterministicOfflineRefactor(sqlVulnerableCode, "python");

      expect(analysis.metrics.securityFlawsDetected).toBeGreaterThanOrEqual(1);
      expect(analysis.findings.some(f => f.title.includes("SQL"))).toBe(true);
    });
  });

  describe("3. API Endpoints de Diagnóstico e Refatoração", () => {
    it("GET /api/system/diagnostics/full-report - Deve retornar relatório de integridade", async () => {
      const res = await fetch(`${baseUrl}/api/system/diagnostics/full-report`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.report).toBeDefined();
      expect(data.report.overallScore).toBeGreaterThanOrEqual(50);
    });

    it("POST /api/system/diagnostics/self-heal - Deve acionar rotina de auto-cura", async () => {
      const adminToken = generateJwtToken({
        id: "admin-1",
        name: "Admin SENAI",
        email: "admin@senai.br",
        role: "ADMIN"
      });

      const res = await fetch(`${baseUrl}/api/system/diagnostics/self-heal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result.actionsTaken).toBeDefined();
    });

    it("POST /api/code/smart-refactor - Deve analisar e refatorar código", async () => {
      const res = await fetch(`${baseUrl}/api/code/smart-refactor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "def soma(a, b):\n    return a + b",
          language: "python",
          contextTopic: "Funções Básicas"
        })
      });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.analysis).toBeDefined();
      expect(data.analysis.metrics).toBeDefined();
    });
  });
});
