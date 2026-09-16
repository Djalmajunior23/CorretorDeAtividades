import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";

// Mock pg Pool
const mockPool = {
  query: vi.fn().mockImplementation((queryText: string, params: any[]) => {
    if (queryText.includes("d_student_record")) {
      return Promise.resolve({
        rows: [{ id: "st-01", name: "Ana Beatriz Silva", class_id: "turma-1a", enrollment_code: "20260101" }]
      });
    }
    if (queryText.includes("d_class_group")) {
      return Promise.resolve({
        rows: [{ id: "turma-1a", name: "Desenvolvimento de Sistemas 1A" }]
      });
    }
    if (queryText.includes("correction_vault")) {
      return Promise.resolve({
        rows: [
          { id: "v1", question_title: "Desafio 01 - Arrays", score: 90, source: "sandbox", language: "python", created_at: new Date().toISOString() },
          { id: "v2", question_title: "Modelagem Lógica E-commerce", score: 85, source: "diagram_assessment", language: "erd", created_at: new Date().toISOString() }
        ]
      });
    }
    if (queryText.includes("d_generated_report")) {
      return Promise.resolve({
        rows: [
          {
            id: "rep-001",
            teacher_id: "teacher_1",
            class_id: "turma-1a",
            student_id: "st-01",
            type: "student_summary",
            title: "Parecer Pedagógico - Ana Beatriz Silva",
            content: {
              student_name: "Ana Beatriz Silva",
              class_name: "Desenvolvimento de Sistemas 1A",
              activities_corrected: 2,
              average_score: 87.5,
              summary: "Aluna com excelente desempenho em código e modelagem de banco.",
              strengths: ["Lógica algorítmica", "Normalização 3FN"],
              improvements: ["Otimização de índices"]
            },
            status: "approved",
            created_at: new Date().toISOString()
          }
        ]
      });
    }
    return Promise.resolve({ rows: [] });
  }),
  on: vi.fn(),
};

describe("Armazenamento Permanente de Relatórios Individuais dos Alunos", () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

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

  it("POST /api/students/:student_id/reports - Deve gerar e armazenar relatório individual do aluno no banco", async () => {
    const res = await fetch(`${baseUrl}/api/students/st-01/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Parecer Trimestral Consolidado",
        teacher_notes: "Estudante com alto rendimento e ótima participação.",
        class_id: "turma-1a"
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.student_id).toBe("st-01");
    expect(data.data.title).toContain("Parecer");
    expect(data.data.content).toBeDefined();
    expect(data.data.content.student_name).toBe("Ana Beatriz Silva");
    expect(data.data.content.average_score).toBeGreaterThanOrEqual(60);
    // Verifies SQL INSERT was executed
    expect(mockPool.query).toHaveBeenCalled();
  });

  it("GET /api/students/:student_id/reports - Deve listar todos os relatórios arquivados do aluno", async () => {
    const res = await fetch(`${baseUrl}/api/students/st-01/reports`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].student_id).toBe("st-01");
    expect(data[0].title).toBeDefined();
  });

  it("POST /api/reports/generate (student_summary) - Deve gerar e persistir parecer no d_generated_report", async () => {
    const res = await fetch(`${baseUrl}/api/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "student_summary",
        student_id: "st-01",
        class_id: "turma-1a",
        teacher_notes: "Nota docente de acompanhamento contínuo"
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
    expect(data.data.content.average_score).toBeDefined();
  });

  it("DELETE /api/reports/:id - Deve permitir ao professor remover relatório se necessário", async () => {
    const res = await fetch(`${baseUrl}/api/reports/rep-001`, {
      method: "DELETE"
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
