import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { DatabaseModelAssessmentService, type DatabaseModelAssessmentResult } from "../services/databaseModelAssessmentService";
import { exportModelAssessmentPdf } from "../services/modelAssessmentPdfExport";
import { WafSecurityEngine } from "../security/WafSecurityEngine";
import { AccessControlEngine } from "../security/AccessControlEngine";
import { generateJwtToken } from "../utils/security";
import { setupTeacherAPIs } from "../../server-apis-addon";

const assessment: DatabaseModelAssessmentResult = {
  assessmentId: "pdf-regression", modelCategory: "physical", inputFormat: "ddl",
  totalGrade: 80, passingGrade: 60, status: "Aprovado", isApproved: true,
  rubrics: [], strengths: [], modelingIssues: [], normalizationNotes: [],
  normalizationAudit: {
    firstNormalForm: { compliant: true, issues: [], explanation: "OK" },
    secondNormalForm: { compliant: true, issues: [], explanation: "OK" },
    thirdNormalForm: { compliant: true, issues: [], explanation: "OK" },
  },
  extractedTables: [], pedagogicalRecommendations: [], extractedMermaidCode: "",
  suggestedCorrectedDiagram: "", generatedDdlSql: "CREATE TABLE users (id INT); DROP TABLE old_users;",
  evaluatedAt: "2026-11-01T12:00:00Z",
};

let server: Server | undefined;
afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  WafSecurityEngine.resetForTesting();
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = undefined;
  }
});

describe("Model assessment PDF exports", () => {
  it("generates an actual PDF without a global Node Buffer", async () => {
    vi.stubGlobal("Buffer", undefined);
    const bytes = await DatabaseModelAssessmentService.generateModelAssessmentPdf(assessment, "Aluno", "Turma A");
    expect(bytes).toBeInstanceOf(ArrayBuffer);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });

  it("uses the browser-compatible generator when the server is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    vi.stubGlobal("Buffer", undefined);
    const blob = await exportModelAssessmentPdf("/api/database-models/export-pdf", assessment);
    expect(blob.type).toBe("application/pdf");
    expect(new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
  });

  it.each([401, 403])("reports HTTP %s without bypassing authorization via local fallback", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Denied", { status })));
    const local = vi.spyOn(DatabaseModelAssessmentService, "generateModelAssessmentPdf");
    await expect(exportModelAssessmentPdf("/api/database-models/export-pdf", assessment)).rejects.toThrow();
    expect(local).not.toHaveBeenCalled();
  });

  it("exports SQL-containing assessments through WAF and authentication, while blocking injections in metadata", async () => {
    const app = express();
    app.use(express.json());
    app.use(WafSecurityEngine.sqlInjectionInspectorMiddleware());
    app.use(AccessControlEngine.authGuardMiddleware());
    setupTeacherAPIs(app, null);
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server!.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing port");
    const base = `http://127.0.0.1:${address.port}`;
    const token = generateJwtToken({ id: "pdf-teacher", name: "Professor", email: "teacher@example.test", role: "PROFESSOR" });
    for (const endpoint of ["/api/database-models/export-pdf", "/api/diagrams/export-pdf"]) {
      const response = await fetch(base + endpoint, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessment, studentName: "Aluno" }),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/pdf");
      expect(new TextDecoder().decode((await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-");
    }
    const denied = await fetch(base + "/api/database-models/export-pdf", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessment }),
    });
    expect(denied.status).toBe(401);
    const demoToken = generateJwtToken({ id: "pdf-demo", name: "Visitante", email: "demo@example.test", role: "DEMO" });
    const demo = await fetch(base + "/api/database-models/export-pdf", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${demoToken}` },
      body: JSON.stringify({ assessment }),
    });
    expect(demo.status).toBe(403);
    const injection = await fetch(base + "/api/database-models/export-pdf", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assessment, studentName: "1 UNION SELECT * FROM users--" }),
    });
    expect(injection.status).toBe(403);
    expect((await injection.json()).code).toBe("WAF_SQLI_BLOCKED");
    const otherRoute = await fetch(base + "/api/other-route", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assessment }),
    });
    expect(otherRoute.status).toBe(403);
    expect((await otherRoute.json()).code).toBe("WAF_SQLI_BLOCKED");
  });
});
