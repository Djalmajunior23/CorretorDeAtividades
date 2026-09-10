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

describe("Suíte Avançada de IA para o Docente (AI Teacher Powerhouse)", () => {
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
  // 1. BANCA SOCRÁTICA & VALIDADOR DE AUTORIA COGNITIVA
  // =========================================================================
  describe("1. Banca Socrática & Validador de Autoria", () => {
    it("POST /api/ai/socratic/generate-questions - Deve gerar 3 perguntas socráticas direcionadas a decisões e casos de borda", async () => {
      const payload = {
        code: "def calcular_total(itens): return sum(x.get('preco', 0) for x in itens if x.get('ativo'))",
        student_name: "Carlos Henrique",
        topic: "Algoritmos e Coleções",
        language: "python"
      };
      const res = await fetch(`${baseUrl}/api/ai/socratic/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBe(3);
      expect(data.questions[0]).toHaveProperty("category");
      expect(data.questions[0]).toHaveProperty("hint_for_teacher");
      expect(data.evaluation_rubric).toBeDefined();
    });

    it("POST /api/ai/socratic/evaluate-defense - Deve avaliar respostas e calcular índice de domínio cognitivo", async () => {
      const payload = {
        student_name: "Carlos Henrique",
        answers: [
          { question: "Por que usou generator?", answer: "Para evitar carregar a lista inteira na memória RAM mantendo O(1) de espaço." },
          { question: "Como lida com lista vazia?", answer: "A função sum() sobre um generator vazio retorna 0 com segurança." },
          { question: "Qual a complexidade?", answer: "Complexidade O(n) pois itera uma única vez sobre cada item." }
        ],
        code: "def total(l): return sum(x for x in l)"
      };
      const res = await fetch(`${baseUrl}/api/ai/socratic/evaluate-defense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.cognitive_mastery_pct).toBeGreaterThanOrEqual(60);
      expect(data.is_approved).toBe(true);
      expect(data.authorship_confidence).toContain("Autoria Legítima");
    });

    it("POST /api/ai/socratic/export-defense-pdf - Deve exportar PDF oficial do laudo socrático", async () => {
      const payload = {
        student_name: "Carlos Henrique",
        result: {
          cognitive_mastery_pct: 92,
          authorship_confidence: "Alta",
          defense_verdict: "Aprovado com mérito técnico."
        }
      };
      const res = await fetch(`${baseUrl}/api/ai/socratic/export-defense-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  // =========================================================================
  // 2. DETECTOR FORENSE DE IA & ESTILOMETRIA
  // =========================================================================
  describe("2. Detector Forense de IA & Estilometria", () => {
    it("POST /api/ai/forensics/analyze-code - Deve analisar probabilidade sintética, entropia de tokens e estilometria", async () => {
      const payload = {
        code: "def somar(a, b):\n    # Adiciona dois inteiros\n    return a + b",
        language: "python",
        student_name: "Ana Rodrigues"
      };
      const res = await fetch(`${baseUrl}/api/ai/forensics/analyze-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("llm_generated_probability");
      expect(data).toHaveProperty("authenticity_confidence");
      expect(data).toHaveProperty("burstiness_score");
      expect(data.stylometry).toBeDefined();
      expect(data.stylometry).toHaveProperty("cyclomatic_complexity");
      expect(data.historical_comparison).toBeDefined();
    });
  });

  // =========================================================================
  // 3. AGRUPAMENTO SEMÂNTICO DE CÓDIGOS DA TURMA
  // =========================================================================
  describe("3. Agrupamento Semântico de Códigos (Clustering)", () => {
    it("POST /api/ai/clustering/group-submissions - Deve segmentar a turma em clusters arquiteturais", async () => {
      const payload = {
        activity_title: "Laboratório de Algoritmos",
        class_name: "Desenvolvimento de Sistemas 1A"
      };
      const res = await fetch(`${baseUrl}/api/ai/clustering/group-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.clusters)).toBe(true);
      expect(data.clusters.length).toBeGreaterThanOrEqual(3);

      const firstCluster = data.clusters[0];
      expect(firstCluster).toHaveProperty("cluster_id");
      expect(firstCluster).toHaveProperty("name");
      expect(firstCluster).toHaveProperty("percentage");
      expect(firstCluster).toHaveProperty("representative_snippet");
      expect(Array.isArray(firstCluster.students)).toBe(true);
    });

    it("POST /api/ai/clustering/apply-bulk-feedback - Deve aplicar notas e feedback coletivo em lote", async () => {
      const payload = {
        cluster_id: "cluster-01",
        grade: 95,
        feedback: "Excelente uso de algoritmos iterativos com acumulador.",
        student_ids: ["Ana Rodrigues", "Carlos Henrique"]
      };
      const res = await fetch(`${baseUrl}/api/ai/clustering/apply-bulk-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.grade_applied).toBe(95);
      expect(data.students_affected_count).toBe(2);
    });
  });

  // =========================================================================
  // 4. GERADOR DE AULAS, SLIDES & HANDOUTS
  // =========================================================================
  describe("4. Gerador de Aulas, Slides Interativos & Handouts", () => {
    it("POST /api/ai/lessons/generate-plan-and-slides - Deve gerar cronograma minuto a minuto e apresentação de slides", async () => {
      const payload = {
        topic: "Recursão e Árvores Binárias",
        duration_minutes: 90,
        course_name: "Técnico em Desenvolvimento de Sistemas"
      };
      const res = await fetch(`${baseUrl}/api/ai/lessons/generate-plan-and-slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.lesson_plan).toBeDefined();
      expect(data.lesson_plan.timeline.length).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(data.slides)).toBe(true);
      expect(data.slides.length).toBeGreaterThanOrEqual(4);
      expect(data.slides[0]).toHaveProperty("title");
      expect(data.slides[0]).toHaveProperty("bullets");
    });

    it("POST /api/ai/lessons/export-handout-pdf - Deve exportar apostila de exercícios em PDF", async () => {
      const payload = {
        topic: "Recursão e Algoritmos",
        lesson_plan: {
          pedagogical_goals: ["Dominar caso base", "Evitar StackOverflow"],
          timeline: [{ time_slot: "00-15 min", phase: "Intro", desc: "Acolhimento" }]
        }
      };
      const res = await fetch(`${baseUrl}/api/ai/lessons/export-handout-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
    });
  });

  // =========================================================================
  // 5. SÍNTESE DE AULA POR ÁUDIO & DIÁRIO DE CLASSE
  // =========================================================================
  describe("5. Síntese de Aula por Áudio & Diário de Classe", () => {
    it("POST /api/ai/audio-diary/synthesize - Deve extrair competências SENAI, dúvidas e gerar texto formal do diário", async () => {
      const payload = {
        audio_transcript: "Hoje na aula prática criamos tabelas DDL e discutimos constraints e chaves estrangeiras.",
        class_name: "Desenvolvimento de Sistemas 1A"
      };
      const res = await fetch(`${baseUrl}/api/ai/audio-diary/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.diary).toBeDefined();
      expect(data.diary.formal_summary).toBeDefined();
      expect(Array.isArray(data.diary.competencies_covered)).toBe(true);
      expect(data.diary.suggested_homework).toBeDefined();
    });

    it("POST /api/ai/audio-diary/save-to-diary - Deve persistir registro no diário oficial", async () => {
      const payload = {
        diary: { formal_summary: "Aula prática ministrada com sucesso." }
      };
      const res = await fetch(`${baseUrl}/api/ai/audio-diary/save-to-diary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.saved_id).toBeDefined();
    });
  });

  // =========================================================================
  // 6. QUIZZES ADAPTATIVOS EM TEMPO REAL
  // =========================================================================
  describe("6. Quizzes Adaptativos Dinâmicos", () => {
    it("POST /api/ai/adaptive-quiz/start - Deve iniciar sessão adaptativa no Nível 1", async () => {
      const payload = {
        student_id: "std-01",
        student_name: "Carlos Henrique",
        topic: "Estruturas de Controle"
      };
      const res = await fetch(`${baseUrl}/api/ai/adaptive-quiz/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.first_question).toBeDefined();
      expect(data.first_question.current_step).toBe(1);
      expect(Array.isArray(data.first_question.options)).toBe(true);
    });

    it("POST /api/ai/adaptive-quiz/next-question - Deve elevar complexidade em caso de acerto", async () => {
      const payload = {
        session_id: "adapt-sess-123",
        current_step: 1,
        is_correct: true,
        current_level: "Nível 1"
      };
      const res = await fetch(`${baseUrl}/api/ai/adaptive-quiz/next-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.step).toBe(2);
      expect(data.adapted_question.level).toContain("Nível 2");
    });

    it("POST /api/ai/adaptive-quiz/finish - Deve concluir e aplicar regra de aprovação (>= 60 pts)", async () => {
      const payload = {
        session_id: "adapt-sess-123",
        student_name: "Carlos Henrique",
        correct_count: 3,
        total_count: 3
      };
      const res = await fetch(`${baseUrl}/api/ai/adaptive-quiz/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.final_grade).toBe(100);
      expect(data.is_approved).toBe(true);
      expect(data.status).toBe("Aprovado");
    });
  });
});
