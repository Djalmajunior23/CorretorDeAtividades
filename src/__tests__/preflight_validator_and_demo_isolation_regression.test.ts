import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { ActivityValidatorService } from "../services/activityValidatorService";
import { SystemIntegrityDiagnosticsService } from "../services/systemIntegrityDiagnosticsService";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { generateJwtToken } from "../utils/security";

describe("Pre-Flight Validator & Demo Isolation Regression Suite", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, null);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 3000;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe("1. Caso do Gabarito -999 & Validação Pré-Publicação", () => {
    it("deve estritamente REPROVAR e BLOQUEAR publicação quando o gabarito retorna valor constante -999", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Soma de Números Pares com Filtro",
        statement: "Desenvolva uma função em Python chamada somar_pares(n) que receba um número inteiro positivo N e retorne a soma de todos os números pares de 1 até N inclusive.",
        language: "python",
        starterCode: "def somar_pares(n):\n    pass",
        referenceSolution: "def somar_pares(n):\n    return -999", // Buggy constant return
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
          { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
          { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true },
          { id: "tc-4", input: "100", expectedOutput: "2550", isPrivate: true }
        ],
        rubric: [
          { id: "r-1", name: "Sintaxe e Estrutura", weight: 30, description: "Indentação e boas práticas" },
          { id: "r-2", name: "Lógica e Algoritmo", weight: 40, description: "Cálculo correto do somatório par" },
          { id: "r-3", name: "Casos Limite", weight: 30, description: "Tratamento de zero e números grandes" }
        ],
        maxAttempts: 3
      });

      expect(report.isValidForPublishing).toBe(false);
      expect(report.summary.failedCount).toBeGreaterThanOrEqual(1);

      const refCheck = report.checks.find(c => c.id === "check-ref-solution");
      expect(refCheck).toBeDefined();
      expect(refCheck?.status).toBe("FAILED");
      expect(refCheck?.details).toContain("Falha no teste com entrada");
      expect(refCheck?.details).toContain("-999");
    });

    it("deve APROVAR o gabarito oficial correto com 100% de acerto no Sandbox", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Soma de Números Pares com Filtro",
        statement: "Desenvolva uma função em Python chamada somar_pares(n) que receba um número inteiro positivo N e retorne a soma de todos os números pares de 1 até N inclusive.",
        language: "python",
        starterCode: "def somar_pares(n):\n    pass",
        referenceSolution: "def somar_pares(n):\n    if n <= 0: return 0\n    return sum(i for i in range(2, n + 1, 2))",
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
          { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
          { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true },
          { id: "tc-4", input: "100", expectedOutput: "2550", isPrivate: true }
        ],
        rubric: [
          { id: "r-1", name: "Sintaxe", weight: 30, description: "Boas práticas" },
          { id: "r-2", name: "Lógica", weight: 40, description: "Cálculo do somatório" },
          { id: "r-3", name: "Casos Limite", weight: 30, description: "Tratamento de zero" }
        ],
        maxAttempts: 3
      });

      expect(report.isValidForPublishing).toBe(true);
      expect(report.summary.failedCount).toBe(0);
      expect(report.executionId).toContain("val_");
      expect(report.paramsDigest).toBeDefined();

      const refCheck = report.checks.find(c => c.id === "check-ref-solution");
      expect(refCheck?.status).toBe("PASSED");
    });

    it("deve REPROVAR gabarito com erro de sintaxe ou compilação", async () => {
      const report = await ActivityValidatorService.validateActivity({
        title: "Atividade com Sintaxe Inválida",
        statement: "Enunciado detalhado com restrições e casos de teste especificados.",
        language: "python",
        starterCode: "def teste(): pass",
        referenceSolution: "def somar_pares(n)\n    return n", // Missing colon
        testCases: [
          { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false }
        ],
        rubric: [
          { id: "r-1", name: "Geral", weight: 100, description: "100%" }
        ],
        maxAttempts: 2
      });

      expect(report.isValidForPublishing).toBe(false);
      const refCheck = report.checks.find(c => c.id === "check-ref-solution");
      expect(refCheck?.status).toBe("FAILED");
    });

    it("deve calcular digest criptográfico e invalidar publicação quando o código é alterado após laudo", () => {
      const params1 = {
        title: "Atividade A",
        statement: "Enunciado da atividade",
        language: "python",
        referenceSolution: "def somar_pares(n):\n    return sum(i for i in range(2, n + 1, 2))",
        testCases: [{ id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false }],
        rubric: [{ id: "r-1", name: "A", weight: 100, description: "100%" }]
      };

      const digest1 = ActivityValidatorService.computeDigest(params1);

      const params2 = {
        ...params1,
        referenceSolution: "def somar_pares(n):\n    return -999" // Modified!
      };

      const digest2 = ActivityValidatorService.computeDigest(params2);

      expect(digest1).not.toBe(digest2);
    });
  });

  describe("2. Isolamento de Demonstração & Controle de Acesso nas APIs", () => {
    it("deve BLOQUEAR com HTTP 403 tentativas de executar backup no Modo Demonstração (Visitante)", async () => {
      const demoToken = generateJwtToken({ id: "demo_visitor", name: "Visitante Demo", email: "demo@senai.br", role: "DEMO" });

      const res = await fetch(`${baseUrl}/api/backup/export`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${demoToken}`
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Modo Demonstração (Visitante)");
    });

    it("deve BLOQUEAR com HTTP 403 tentativas de acionar auto-cura no Modo Demonstração", async () => {
      const demoToken = generateJwtToken({ id: "demo_visitor", name: "Visitante Demo", email: "demo@senai.br", role: "DEMO" });

      const res = await fetch(`${baseUrl}/api/system/diagnostics/self-heal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${demoToken}`
        }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Modo Demonstração (Visitante)");
    });

    it("deve rotular fixtures sintéticas isoladas e expor cabeçalho X-Data-Origin", async () => {
      const res = await fetch(`${baseUrl}/api/students`);
      expect(res.status).toBe(200);

      const students = await res.json();
      expect(Array.isArray(students)).toBe(true);
      expect(students.length).toBeGreaterThanOrEqual(1);

      // Verify explicit synthetic identification
      expect(students[0].name).toContain("[Sintético]");
      expect(students[0].email).toContain("@codecheck.sintetico.local");
    });
  });

  describe("3. Unificação OWASP ASVS 4.0.3 & Diagnósticos", () => {
    it("deve reportar conformidade unificada com OWASP ASVS 4.0.3 Nível 2", async () => {
      const report = await SystemIntegrityDiagnosticsService.runFullDiagnostics();
      expect(report.securityCompliance.asvsLevel).toBe("OWASP ASVS 4.0.3 Nível 2");
      expect(report.systemStatus).toBe("OPERATIONAL");
    });
  });
});
