import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { generateJwtToken } from "../utils/security";
import { AccessControlEngine } from "../security/AccessControlEngine";
import { setupTeacherAPIs } from "../../server-apis-addon";

describe("QA Test Suite: Gestão de Turmas e Alunos (Classes & Students Management)", () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  const teacherToken = generateJwtToken({
    id: "prof_djalma",
    name: "Djalma Junior",
    email: "djalma.professor@codecheck.ai",
    role: "PROFESSOR"
  });

  const demoToken = generateJwtToken({
    id: "guest-demo-visitor",
    name: "Visitante Demo",
    email: "visitante.demo@codecheck.senai.br",
    role: "DEMO"
  });

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Security & RBAC middlewares
    app.use(AccessControlEngine.responseMinimizerMiddleware());
    app.use(AccessControlEngine.authGuardMiddleware());

    // Setup APIs
    setupTeacherAPIs(app, null);

    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("1. GET /api/classes deve ser acessível publicamente (status 200)", async () => {
    const res = await fetch(`${baseUrl}/api/classes`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("2. POST /api/classes sem credencial deve ser rejeitado com 401 UNAUTHENTICATED", async () => {
    const res = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Turma Invasora" })
    });
    expect(res.status).toBe(401);
  });

  it("3. POST /api/classes com token DEMO deve ser bloqueado com 403 DEMO_MUTATION_BLOCKED", async () => {
    const res = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${demoToken}`
      },
      body: JSON.stringify({ name: "Turma Demo" })
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe("DEMO_MUTATION_BLOCKED");
  });

  it("4. POST /api/classes com token PROFESSOR deve criar a turma com sucesso (status 201)", async () => {
    const res = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "Desenvolvimento Web 2026 - Noite",
        course: "Técnico em Desenvolvimento de Sistemas",
        module: "Módulo 2",
        semester: "1º Semestre",
        shift: "Noturno",
        year: 2026,
        description: "Turma criada pelo teste de QA"
      })
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.class).toBeDefined();
    expect(data.class.name).toBe("Desenvolvimento Web 2026 - Noite");
    expect(data.class.id).toBeDefined();

    // Validar se aparece no GET /api/classes
    const getRes = await fetch(`${baseUrl}/api/classes`);
    const list = await getRes.json();
    const created = list.find((c: any) => c.id === data.id);
    expect(created).toBeDefined();
    expect(created.name).toBe("Desenvolvimento Web 2026 - Noite");
  });

  it("5. POST /api/classes deve falhar se o nome da turma for vazio (status 400)", async () => {
    const res = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "   "
      })
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("O nome da turma é obrigatório.");
  });

  it("6. PUT /api/classes/:id deve atualizar a turma existente", async () => {
    // Primeiro cria uma turma
    const createRes = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "Turma Original Para Edição",
        course: "TI",
        year: 2026
      })
    });
    const createdData = await createRes.json();
    const classId = createdData.id;

    // Atualiza
    const putRes = await fetch(`${baseUrl}/api/classes/${classId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "Turma Nome Atualizado 2026",
        course: "Técnico em Redes",
        module: "Módulo 3",
        status: "active"
      })
    });
    expect(putRes.status).toBe(200);

    // Valida na listagem
    const getRes = await fetch(`${baseUrl}/api/classes`);
    const list = await getRes.json();
    const updated = list.find((c: any) => c.id === classId);
    expect(updated).toBeDefined();
    expect(updated.name).toBe("Turma Nome Atualizado 2026");
  });

  it("7. DELETE /api/classes/:id deve marcar a turma como deleted", async () => {
    // Cria turma
    const createRes = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "Turma Para Deletar",
        year: 2026
      })
    });
    const createdData = await createRes.json();
    const classId = createdData.id;

    // Exclui
    const delRes = await fetch(`${baseUrl}/api/classes/${classId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${teacherToken}`
      }
    });
    expect(delRes.status).toBe(200);

    // Valida que não aparece no GET
    const getRes = await fetch(`${baseUrl}/api/classes`);
    const list = await getRes.json();
    const found = list.find((c: any) => c.id === classId);
    expect(found).toBeUndefined();
  });

  it("8. POST /api/students deve vincular aluno à turma criada", async () => {
    // Cria turma
    const createRes = await fetch(`${baseUrl}/api/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        name: "Turma com Alunos Teste",
        year: 2026
      })
    });
    const classId = (await createRes.json()).id;

    // Cria aluno
    const studentRes = await fetch(`${baseUrl}/api/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        class_id: classId,
        name: "Lucas Teste QA",
        enrollment_code: "2026QA999",
        email: "lucas.qa@senai.br"
      })
    });
    expect(studentRes.status).toBe(200);

    // Listar alunos por turma
    const getStudents = await fetch(`${baseUrl}/api/students?class_id=${classId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(getStudents.status).toBe(200);
    const students = await getStudents.json();
    expect(Array.isArray(students)).toBe(true);
    const lucas = students.find((s: any) => s.name === "Lucas Teste QA");
    expect(lucas).toBeDefined();
  });
});
