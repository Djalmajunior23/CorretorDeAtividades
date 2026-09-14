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

describe("Evolução do Sistema - 4 Pilares Estratégicos", () => {
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

  // =========================================================================
  // PILAR 1: FLUXO FECHADO (Atividades ➔ Sincronização de Notas no Boletim)
  // =========================================================================
  describe("Pilar 1: Fluxo Fechado (Atividades ➔ Sincronização com Boletim)", () => {
    it("POST /api/activities/sync-grades - Deve sincronizar entregas para a tabela de notas com sucesso", async () => {
      // First, set a delivery override
      await fetch(`${baseUrl}/api/activities/toggle-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: "st-01",
          activity_id: "act-sync-test",
          delivery_status: "delivered_on_time"
        })
      });

      const res = await fetch(`${baseUrl}/api/activities/sync-grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: "act-sync-test",
          class_id: "turma-1a",
          activity_name: "Prova Prática de Algoritmos",
          default_points: 100
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.activity_name).toBe("Prova Prática de Algoritmos");
      expect(data.synced_count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(data.synced_students)).toBe(true);

      const syncedStudent = data.synced_students.find((s: any) => s.student_id === "st-01");
      expect(syncedStudent).toBeDefined();
      expect(syncedStudent.grade).toBe(100);
    });

    it("POST /api/activities/sync-grades - Deve validar que activity_id é obrigatório", async () => {
      const res = await fetch(`${baseUrl}/api/activities/sync-grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  // =========================================================================
  // PILAR 2: RADAR DE RISCO PEDAGÓGICO 360° (Early Warning System)
  // =========================================================================
  describe("Pilar 2: Radar de Risco Pedagógico 360° (Early Warning System)", () => {
    it("Deve classificar corretamente os níveis de risco (Crítico, Atenção e Regular)", () => {
      const evaluateRisk = (attendanceRate: number, pendingCount: number, averageGrade: number) => {
        if (attendanceRate < 75 || averageGrade < 50 || pendingCount >= 3) {
          return "critical";
        }
        if (attendanceRate < 85 || averageGrade < 60 || pendingCount >= 1) {
          return "warning";
        }
        return "regular";
      };

      expect(evaluateRisk(72.5, 3, 52.0)).toBe("critical"); // Abaixo do limite LDB 75%
      expect(evaluateRisk(85.0, 1, 70.0)).toBe("warning");  // Faltas moderadas e 1 pendência
      expect(evaluateRisk(95.0, 0, 92.5)).toBe("regular");  // Excelente
    });
  });

  // =========================================================================
  // PILAR 3: PORTAL DO ESTUDANTE / VISÃO DO ALUNO
  // =========================================================================
  describe("Pilar 3: Portal do Estudante / Visão do Aluno", () => {
    it("GET /api/student/portal-data/:studentId - Deve retornar resumo de assiduidade, dados cadastrais e notas", async () => {
      const res = await fetch(`${baseUrl}/api/student/portal-data/st-01?class_id=turma-1a`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.student).toBeDefined();
      expect(data.student.id).toBe("st-01");
      expect(data.student.name).toBeDefined();
      expect(data.student.enrollment_code).toBeDefined();
      expect(data.attendance).toBeDefined();
      expect(data.attendance.attendance_percentage).toBeGreaterThanOrEqual(75);
      expect(Array.isArray(data.grades)).toBe(true);
    });

    it("POST /api/student/submit-activity - Deve registrar a submissão de código do aluno e atualizar status para Entregue", async () => {
      const payload = {
        student_id: "st-02",
        activity_id: "act-portal-sub",
        class_id: "turma-1a",
        code_content: "def solucao(notas):\n    return [n for n in notas if n >= 60]\n",
        submission_notes: "Solução enviada pelo Portal do Aluno com compreensão de listas."
      };

      const res = await fetch(`${baseUrl}/api/student/submit-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.student_id).toBe("st-02");
      expect(data.delivery_status).toBe("delivered_on_time");
      expect(data.submission_date).toBeDefined();
    });
  });

  // =========================================================================
  // PILAR 4: CORREÇÃO EM LOTE ASSISTIDA POR IA (Batch AI Grading)
  // =========================================================================
  describe("Pilar 4: Correção em Lote Assistida por IA", () => {
    it("POST /api/activities/batch-ai-grade - Deve processar avaliações de código com testes e notas sugeridas", async () => {
      const res = await fetch(`${baseUrl}/api/activities/batch-ai-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: "act-batch-test",
          class_id: "turma-1a",
          auto_publish_grades: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.evaluations_count).toBeGreaterThanOrEqual(1);
      expect(data.average_score).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.evaluations)).toBe(true);

      const firstEval = data.evaluations[0];
      expect(firstEval).toHaveProperty("student_id");
      expect(firstEval).toHaveProperty("score");
      expect(firstEval).toHaveProperty("passedTests");
      expect(firstEval).toHaveProperty("feedback");
      expect(firstEval).toHaveProperty("status");
    });
  });
});
