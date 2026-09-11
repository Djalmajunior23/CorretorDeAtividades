import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";

// Mock pg Pool
const mockPool = {
  query: vi.fn().mockImplementation((queryText: string, params: any[]) => {
    return Promise.resolve({ rows: [] });
  }),
  on: vi.fn(),
};

describe("Módulo de Controle Central de Atividades e Entregas (Activities & Submissions Hub)", () => {
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

  it("GET /api/activities/submissions-status - Deve retornar status de entregas, KPIs e lista nominal de discentes", async () => {
    const res = await fetch(`${baseUrl}/api/activities/submissions-status?class_id=all&activity_id=act-1`);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.activity).toBeDefined();
    expect(data.kpis).toBeDefined();
    expect(data.kpis.total_enrolled).toBeGreaterThanOrEqual(1);
    expect(data.kpis.total_delivered).toBeGreaterThanOrEqual(0);
    expect(data.kpis.average_grade).toBeDefined();
    expect(data.kpis.approval_rate).toBeDefined();
    expect(Array.isArray(data.students)).toBe(true);

    const firstStudent = data.students[0];
    expect(firstStudent).toHaveProperty("student_id");
    expect(firstStudent).toHaveProperty("name");
    expect(firstStudent).toHaveProperty("delivery_status");
    expect(["delivered_on_time", "delivered_late", "pending", "overdue"]).toContain(firstStudent.delivery_status);
  });

  it("POST /api/activities/manual - Deve cadastrar nova atividade criada pelo docente com casos de teste e SLA", async () => {
    const newActivity = {
      title: "Laboratório de Algoritmos de Busca Binária",
      description: "Implementar busca binária recursiva com complexidade O(log n)",
      type: "code",
      class_id: "turma-senai-2026",
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      language: "python",
      points: 100,
      sla_tolerance_hours: 24,
      test_cases: [
        { input: "[1, 3, 5, 7, 9], 5", expected: "2", isPublic: true },
        { input: "[1, 3, 5, 7, 9], 8", expected: "-1", isPublic: false }
      ]
    };

    const res = await fetch(`${baseUrl}/api/activities/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newActivity)
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
    expect(data.activity.title).toBe(newActivity.title);
    expect(data.activity.language).toBe("python");
    expect(data.activity.test_cases.length).toBe(2);
  });

  it("POST /api/activities/manual - Deve rejeitar com 400 se título ou descrição não forem informados", async () => {
    const res = await fetch(`${baseUrl}/api/activities/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        description: ""
      })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("obrigatórios");
  });

  it("POST /api/activities/manual-grade - Deve lançar nota manual respeitando regra de aprovação (>= 60)", async () => {
    // Aluno Aprovado (Nota 85 >= 60)
    const resApproved = await fetch(`${baseUrl}/api/activities/manual-grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "std-001",
        activity_id: "act-1",
        score: 85,
        feedback: "Excelente implementação com boas práticas e DRY."
      })
    });

    expect(resApproved.status).toBe(200);
    const dataApproved = await resApproved.json();
    expect(dataApproved.success).toBe(true);
    expect(dataApproved.score).toBe(85);
    expect(dataApproved.is_approved).toBe(true);
    expect(dataApproved.status).toBe("Aprovado");

    // Aluno em Recuperação (Nota 45 < 60)
    const resRecovery = await fetch(`${baseUrl}/api/activities/manual-grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "std-002",
        activity_id: "act-1",
        score: 45,
        feedback: "Necessário revisar laços de repetição e vetores."
      })
    });

    expect(resRecovery.status).toBe(200);
    const dataRecovery = await resRecovery.json();
    expect(dataRecovery.success).toBe(true);
    expect(dataRecovery.score).toBe(45);
    expect(dataRecovery.is_approved).toBe(false);
    expect(dataRecovery.status).toBe("Recuperação");
  });

  it("POST /api/activities/bulk-remind - Deve disparar lembretes automáticos para discentes com atividades pendentes", async () => {
    const res = await fetch(`${baseUrl}/api/activities/bulk-remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: "act-1",
        class_id: "all",
        customMessage: "Atenção: Prazo de entrega encerra hoje às 23:59!"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.dispatched_count).toBeGreaterThan(0);
    expect(data.dispatched_at).toBeDefined();
  });

  it("POST /api/activities/toggle-delivery - Deve alternar status de entrega de estudante pelo docente", async () => {
    // 1. Marcar como entregue no prazo
    const resDeliver = await fetch(`${baseUrl}/api/activities/toggle-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "std-1",
        activity_id: "act-1",
        delivery_status: "delivered_on_time"
      })
    });

    expect(resDeliver.status).toBe(200);
    const dataDeliver = await resDeliver.json();
    expect(dataDeliver.success).toBe(true);
    expect(dataDeliver.delivery_status).toBe("delivered_on_time");
    expect(dataDeliver.submission_date).toBeDefined();

    // 2. Marcar como não entregue (pendente)
    const resPending = await fetch(`${baseUrl}/api/activities/toggle-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "std-1",
        activity_id: "act-1",
        delivery_status: "pending"
      })
    });

    expect(resPending.status).toBe(200);
    const dataPending = await resPending.json();
    expect(dataPending.success).toBe(true);
    expect(dataPending.delivery_status).toBe("pending");
  });

  it("POST /api/activities/bulk-delivery - Deve marcar em lote todos os estudantes como entregues ou não entregues", async () => {
    const resBulk = await fetch(`${baseUrl}/api/activities/bulk-delivery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: "act-1",
        student_ids: ["std-1", "std-2", "std-3"],
        delivery_status: "delivered_on_time"
      })
    });

    expect(resBulk.status).toBe(200);
    const dataBulk = await resBulk.json();
    expect(dataBulk.success).toBe(true);
    expect(dataBulk.count).toBe(3);
    expect(dataBulk.delivery_status).toBe("delivered_on_time");
  });

  it("POST /api/activities/export-deliveries-pdf - Deve gerar PDF formal com ata e controle de entregas da turma", async () => {
    const res = await fetch(`${baseUrl}/api/activities/export-deliveries-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity: { title: "Laboratório 01", deadline: new Date().toISOString() },
        kpis: { total_enrolled: 25, total_delivered: 20, completion_rate: 80, average_grade: 78 },
        students: [
          { name: "Carlos Eduardo", enrollment_code: "SENAI-2026-01", delivery_status: "delivered_on_time", score: 85 },
          { name: "Beatriz Lima", enrollment_code: "SENAI-2026-02", delivery_status: "delivered_late", hours_overdue: 4, score: 70 },
          { name: "Diego Santos", enrollment_code: "SENAI-2026-03", delivery_status: "pending", score: null }
        ]
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
  });
});
