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

describe("Módulos Pedagógicos Avançados: Smart Exam Arena, Recovery Engine, Skill Tree & LMS Webhooks", () => {
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
  // 1. SMART EXAM ARENA & ANTI-CHEAT ENVIRONMENT
  // =========================================================================
  describe("1. Smart Exam Arena & Anti-Cheat Environment", () => {
    it("GET /api/exams - Deve listar todas as avaliações configuradas", async () => {
      const res = await fetch(`${baseUrl}/api/exams`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("title");
      expect(data[0]).toHaveProperty("duration_minutes");
      expect(data[0]).toHaveProperty("lockdown_enabled");
    });

    it("POST /api/exams - Deve criar nova avaliação com parâmetros de lockdown", async () => {
      const payload = {
        title: "Avaliação Prática 02 - Estruturas de Repetição",
        class_id: "turma-1b",
        duration_minutes: 90,
        lockdown_enabled: true,
        randomize_variants: true,
        scheduled_for: "2026-09-15T08:00:00Z"
      };
      const res = await fetch(`${baseUrl}/api/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.exam).toBeDefined();
      expect(data.exam.title).toBe(payload.title);
      expect(data.exam.duration_minutes).toBe(90);
    });

    it("POST /api/exams/generate-variants - Deve gerar variantes A, B e C com parâmetros permutados", async () => {
      const payload = {
        base_prompt: "Escreva uma função que receba uma lista de números e retorne a soma dos elementos pares.",
        language: "python",
        variant_count: 3
      };
      const res = await fetch(`${baseUrl}/api/exams/generate-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.variants)).toBe(true);
      expect(data.variants.length).toBe(3);
      expect(data.variants[0].variant_code).toBe("A");
      expect(data.variants[1].variant_code).toBe("B");
      expect(data.variants[2].variant_code).toBe("C");
      expect(data.variants[0].test_cases.length).toBeGreaterThan(0);
    });

    it("POST /api/exams/submit - Deve auditar blur/tab-switch e calcular score de integridade", async () => {
      const payload = {
        exam_id: "exam-01",
        student_id: "std-01",
        student_name: "Ana Rodrigues Silva",
        variant_code: "A",
        submitted_code: "def calcular_pares(lista): return sum(x for x in lista if x % 2 == 0)",
        blur_count: 2,
        paste_count: 1,
        time_spent_seconds: 1420
      };
      const res = await fetch(`${baseUrl}/api/exams/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.integrity_score).toBe(60); // 100 - (2*15) - (1*10) = 60
      expect(data.grade).toBeGreaterThanOrEqual(60);
      expect(data.receipt_token).toBeDefined();
    });

    it("POST /api/exams/export-roster-pdf - Deve exportar PDF da ata oficial do exame", async () => {
      const payload = {
        exam_id: "exam-01",
        class_name: "Desenvolvimento de Sistemas 1A"
      };
      const res = await fetch(`${baseUrl}/api/exams/export-roster-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  // =========================================================================
  // 2. PERSONALIZED AI RECOVERY ENGINE
  // =========================================================================
  describe("2. Personalized AI Recovery Engine (SENAI >= 60 Rule)", () => {
    it("GET /api/recovery/students-at-risk - Deve triar discentes com média inferior a 60 pontos", async () => {
      const res = await fetch(`${baseUrl}/api/recovery/students-at-risk?class_id=all`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.approval_threshold).toBe(60);
      expect(Array.isArray(data.students_at_risk)).toBe(true);
      data.students_at_risk.forEach((s: any) => {
        expect(s.average_grade).toBeLessThan(60);
      });
    });

    it("POST /api/recovery/generate-plan - Deve gerar roteiro e 3 exercícios direcionados", async () => {
      const payload = {
        student_id: "std-04",
        student_name: "Vinícius Souza",
        average_grade: 55.0,
        failed_competencies: ["Loops aninhados", "Tratamento de exceções"]
      };
      const res = await fetch(`${baseUrl}/api/recovery/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan).toBeDefined();
      expect(data.plan.approval_goal).toBe(">= 60 Pontos");
      expect(data.plan.targeted_exercises.length).toBe(3);
    });

    it("POST /api/recovery/record-grade - Deve recalcular e aprovar discente quando nota >= 60", async () => {
      const payload = {
        student_id: "std-04",
        student_name: "Vinícius Souza",
        recovery_score: 75.0,
        notes: "Realizou lista complementar e demonstrou domínio em matrizes."
      };
      const res = await fetch(`${baseUrl}/api/recovery/record-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.is_approved).toBe(true);
      expect(data.status).toBe("Aprovado");
    });

    it("POST /api/recovery/record-grade - Deve manter recuperação pendente quando nota < 60", async () => {
      const payload = {
        student_id: "std-05",
        student_name: "Daniel Santos Ramos",
        recovery_score: 48.0,
        notes: "Dificuldade persistente em laços."
      };
      const res = await fetch(`${baseUrl}/api/recovery/record-grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.is_approved).toBe(false);
      expect(data.status).toBe("Recuperação");
    });

    it("POST /api/recovery/export-workbook-pdf - Deve exportar caderno de estudos em PDF", async () => {
      const payload = {
        student_name: "Vinícius Souza",
        plan: {
          diagnostic_summary: "Reforço em estruturas de repetição e matrizes.",
          targeted_exercises: [
            { title: "Exercício 1", prompt: "Enunciado teste", points: 30, test_cases: [{ input: "1", expected: "1" }] }
          ]
        }
      };
      const res = await fetch(`${baseUrl}/api/recovery/export-workbook-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  // =========================================================================
  // 3. SKILL TREE & STUDENT PORTFOLIO SHOWCASE
  // =========================================================================
  describe("3. Interactive Skill Tree & Student Portfolio Showcase", () => {
    it("GET /api/skills/tree - Deve retornar o grafo curricular com nós e mastery %", async () => {
      const res = await fetch(`${baseUrl}/api/skills/tree`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.subject).toBeDefined();
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(data.nodes.length).toBeGreaterThanOrEqual(5);

      const firstNode = data.nodes[0];
      expect(firstNode).toHaveProperty("id");
      expect(firstNode).toHaveProperty("name");
      expect(firstNode).toHaveProperty("class_mastery_pct");
      expect(firstNode).toHaveProperty("skills");
    });

    it("GET /api/skills/student-portfolio/:studentId - Deve retornar portfólio com badges e projetos", async () => {
      const res = await fetch(`${baseUrl}/api/skills/student-portfolio/std-02`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.student_name).toBeDefined();
      expect(data.overall_average).toBeGreaterThanOrEqual(60);
      expect(Array.isArray(data.badges)).toBe(true);
      expect(Array.isArray(data.approved_projects)).toBe(true);
      expect(data.approved_projects.length).toBeGreaterThanOrEqual(1);
    });

    it("POST /api/skills/export-portfolio-pdf - Deve exportar PDF do portfólio discente", async () => {
      const payload = {
        portfolio: {
          student_name: "Carlos Henrique Souza",
          enrollment_code: "SENAI-2026-01",
          course: "Técnico em Desenvolvimento de Sistemas",
          overall_average: 86.5,
          total_projects_approved: 8,
          badges: [{ name: "Clean Code", icon: "✨", desc: "Perfeito" }],
          approved_projects: [{ title: "App 1", language: "python", grade: 95, teacher_feedback: "Excelente" }]
        }
      };
      const res = await fetch(`${baseUrl}/api/skills/export-portfolio-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  // =========================================================================
  // 4. LMS INTEROPERABILITY & REAL-TIME WEBHOOK HUB
  // =========================================================================
  describe("4. LMS Interoperability & Real-Time Webhook Hub", () => {
    it("POST /api/lms/export-moodle - Deve exportar CSV formatado para o livro de notas do Moodle", async () => {
      const res = await fetch(`${baseUrl}/api/lms/export-moodle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: "turma-1a" })
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      const csvText = await res.text();
      expect(csvText).toContain("Identificador");
      expect(csvText).toContain("Endereço de email");
      expect(csvText).toContain("Média Final (Real)");
    });

    it("POST /api/lms/export-classroom - Deve exportar schema JSON para Google Classroom", async () => {
      const res = await fetch(`${baseUrl}/api/lms/export-classroom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: "Desenvolvimento de Sistemas 1A" })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.source).toContain("LTI 1.3");
      expect(Array.isArray(data.gradebook)).toBe(true);
      expect(data.gradebook[0]).toHaveProperty("final_grade_pct");
      expect(data.gradebook[0]).toHaveProperty("status");
    });

    it("POST /api/lms/test-webhook - Deve testar disparo com payload estruturado para Discord/Slack", async () => {
      const payload = {
        webhook_url: "https://discord.com/api/webhooks/mock",
        channel: "discord",
        event_type: "sla_warning"
      };
      const res = await fetch(`${baseUrl}/api/lms/test-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.channel).toBe("discord");
      expect(data.payload_preview).toBeDefined();
    });

    it("POST /api/lms/dispatch-sla-alerts - Deve simular envio automático de alertas de prazo", async () => {
      const payload = {
        activity_id: "act-01",
        channels: ["discord", "slack", "email"]
      };
      const res = await fetch(`${baseUrl}/api/lms/dispatch-sla-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.alerts_sent).toBe(5);
    });
  });
});
