import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { generateJwtToken } from "../utils/security";
import { AccessControlEngine } from "../security/AccessControlEngine";
import { setupTeacherAPIs } from "../../server-apis-addon";

describe("CodeCheck Security & Access Control Hardening Test Suite (OWASP ASVS 4.0.3 L2)", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  // Test identities
  const teacherAToken = generateJwtToken({
    id: "teacher_alpha_uuid",
    name: "Prof. Alberto Santos",
    email: "alberto.santos@senai.br",
    role: "PROFESSOR"
  });

  const teacherBToken = generateJwtToken({
    id: "teacher_beta_uuid",
    name: "Profa. Beatriz Costa",
    email: "beatriz.costa@senai.br",
    role: "PROFESSOR"
  });

  const studentToken = generateJwtToken({
    id: "student_carlos_uuid",
    name: "Carlos Eduardo Aluno",
    email: "carlos.aluno@estudante.senai.br",
    role: "ALUNO"
  });

  const adminToken = generateJwtToken({
    id: "admin_root_uuid",
    name: "Administrador Central",
    email: "admin@codecheck.senai.br",
    role: "ADMIN"
  });

  const demoGuestToken = generateJwtToken({
    id: "guest_demo_ephemeral",
    name: "Visitante Demo Convidado",
    email: "visitante.demo@codecheck.senai.br",
    role: "DEMO"
  });

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mount Central Access Control and Data Minimization Engine
    app.use(AccessControlEngine.responseMinimizerMiddleware());
    app.use(AccessControlEngine.authGuardMiddleware());

    // Register teacher APIs and Mock Endpoints
    setupTeacherAPIs(app, null);

    // Mock Admin route
    app.get("/api/cloud-sync/export-dump", (_req, res) => {
      res.json({
        success: true,
        data: { classes: [], students: [], secrets: "CRITICAL_SYSTEM_STATE" }
      });
    });

    // Mock Activity Route returning solutions for teachers
    app.get("/api/test-activities/sample", (_req, res) => {
      res.json({
        id: "act-101",
        title: "Estrutura de Repetição com While",
        description: "Construa um laço que conte até 10.",
        solution_code: "for(let i=0; i<10; i++) { console.log(i); }",
        gabarito: "Resultado esperado: 0 a 9",
        teacher_notes: "Critério de corte: não permitir loop infinito",
        test_cases: [
          { input: "10", output: "0..9" },
          { input: "5", output: "0..4" },
          { input: "100", output: "SECRET_EVALUATION_HASH" }
        ]
      });
    });

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

  // =========================================================================
  // 1. DENY-BY-DEFAULT POLICY & PUBLIC WHITELIST
  // =========================================================================
  describe("1. Central Deny-by-Default Access Control", () => {
    it("deve PERMITIR acesso anônimo a rotas na allowlist pública (/health, /api/health-status, /auth/login)", async () => {
      const res = await fetch(`${baseUrl}/api/health/corrections`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
    });

    it("deve REJEITAR requisição anônima a endpoint privado com HTTP 401 UNAUTHENTICATED", async () => {
      const res = await fetch(`${baseUrl}/api/students`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("UNAUTHENTICATED");
    });

    it("deve REJEITAR token forjado ou com assinatura corrompida com HTTP 401", async () => {
      const forgedToken = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImFkbWluIiwicm9sZSI6IkFETUlOIn0.INVALID_SIGNATURE";
      const res = await fetch(`${baseUrl}/api/students`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe("SESSION_EXPIRED");
    });

    it("deve REJEITAR token com formato de string arbitrária (ex: demo_guest_session_xyz)", async () => {
      const fakeToken = "demo_guest_session_123456";
      const res = await fetch(`${baseUrl}/api/students`, {
        headers: { Authorization: `Bearer ${fakeToken}` }
      });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE ELEVATION PROTECTION
  // =========================================================================
  describe("2. RBAC & Privilege Elevation Protection", () => {
    it("deve BLOQUEAR aluno tentando acessar endpoint restrito a Administrador com HTTP 403", async () => {
      const res = await fetch(`${baseUrl}/api/cloud-sync/export-dump`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("INSUFFICIENT_PRIVILEGES");
    });

    it("deve BLOQUEAR aluno tentando acessar endpoint restrito a Professor (/api/teacher/*) com HTTP 403", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/classes`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("TEACHER_ROLE_REQUIRED");
    });

    it("deve REJEITAR token com papel desconhecido (role desconhecida) com HTTP 403 INVALID_ROLE", async () => {
      const hackerToken = generateJwtToken({
        id: "attacker_id",
        name: "Attacker",
        email: "attacker@exploit.com",
        role: "SUPER_GOD_MODE"
      });

      const res = await fetch(`${baseUrl}/api/students`, {
        headers: { Authorization: `Bearer ${hackerToken}` }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("INVALID_ROLE");
    });

    it("deve PERMITIR administrador acessar endpoint de exportação de dados", async () => {
      const res = await fetch(`${baseUrl}/api/cloud-sync/export-dump`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // 3. DATA MINIMIZATION & SOLUTION CODE REDACTION
  // =========================================================================
  describe("3. Data Minimization & Solution Code Stripping", () => {
    it("deve EXIBIR gabarito e solution_code para Professores e Administradores", async () => {
      const res = await fetch(`${baseUrl}/api/test-activities/sample`, {
        headers: { Authorization: `Bearer ${teacherAToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.solution_code).toBeDefined();
      expect(data.gabarito).toBeDefined();
      expect(data.teacher_notes).toBeDefined();
      expect(data.test_cases.length).toBe(3);
    });

    it("deve OCULTAR solution_code, gabarito e notas privadas quando requisitado por Aluno", async () => {
      const res = await fetch(`${baseUrl}/api/test-activities/sample`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.title).toBe("Estrutura de Repetição com While");
      expect(data.solution_code).toBeUndefined();
      expect(data.gabarito).toBeUndefined();
      expect(data.teacher_notes).toBeUndefined();
      // Test cases must be limited to sample public tests (max 2)
      expect(data.test_cases.length).toBeLessThanOrEqual(2);
      expect(data.test_cases.some((tc: any) => tc.output === "SECRET_EVALUATION_HASH")).toBe(false);
    });

    it("deve OCULTAR solution_code e segredos quando requisitado por Visitante Demo", async () => {
      const res = await fetch(`${baseUrl}/api/test-activities/sample`, {
        headers: { Authorization: `Bearer ${demoGuestToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.solution_code).toBeUndefined();
      expect(data.gabarito).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. DEMO SANDBOX ISOLATION & READ-ONLY ENFORCEMENT
  // =========================================================================
  describe("4. Demo Mode Sandbox Isolation", () => {
    it("deve BLOQUEAR mutações (POST/PUT/DELETE) originadas de sessões DEMO com HTTP 403", async () => {
      const res = await fetch(`${baseUrl}/api/classes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${demoGuestToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: "Turma Invasora Demo" })
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe("DEMO_MUTATION_BLOCKED");
    });
  });

  // =========================================================================
  // 5. RESOURCE OWNERSHIP & ANTI-IDOR / ANTI-BOLA IDENTITY RESOLUTION
  // =========================================================================
  describe("5. Resource Ownership & Identity Resolution", () => {
    it("deve resolver o ID do professor estritamente a partir do token verificado (não do body/query)", () => {
      const reqMockAlpha = {
        headers: { authorization: `Bearer ${teacherAToken}` },
        body: { teacher_id: "teacher_victim_id" },
        query: { teacher_id: "teacher_victim_id" },
        user: { id: "teacher_alpha_uuid", role: "PROFESSOR", name: "Alpha", email: "a@s.br" }
      } as any;

      const effectiveId = AccessControlEngine.resolveEffectiveTeacherId(reqMockAlpha);
      expect(effectiveId).toBe("teacher_alpha_uuid");
      expect(effectiveId).not.toBe("teacher_victim_id");
    });

    it("deve permitir que Administrador filtre escopo de outros professores", () => {
      const reqMockAdmin = {
        headers: { authorization: `Bearer ${adminToken}` },
        body: {},
        query: { teacher_id: "teacher_alpha_uuid" },
        user: { id: "admin_root_uuid", role: "ADMIN", name: "Admin", email: "adm@s.br" }
      } as any;

      const effectiveId = AccessControlEngine.resolveEffectiveTeacherId(reqMockAdmin);
      expect(effectiveId).toBe("teacher_alpha_uuid");
    });
  });
});
