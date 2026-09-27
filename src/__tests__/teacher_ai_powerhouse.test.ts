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

  // =========================================================================
  // 7. TEACHER POWERHOUSE: RADAR, DIÁRIO, DEFESA ORAL, PRI E PROVAS
  // =========================================================================
  describe("7. Teacher Powerhouse: Radar, Diário, Defesa Oral & PRI", () => {
    it("GET /api/teacher/class-radar - Deve retornar diagnóstico antecipado (Early Warning) da turma", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/class-radar/turma-ds-1a`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.radar).toHaveProperty("totalStudents");
      expect(data.radar).toHaveProperty("atRiskCount");
      expect(Array.isArray(data.radar.students)).toBe(true);
      expect(data.radar.students.length).toBeGreaterThan(0);
      expect(data.radar.students[0]).toHaveProperty("riskLevel");
    });

    it("GET /api/teacher/skill-heatmap - Deve retornar mapa de calor de competências da turma", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/skill-heatmap/turma-ds-1a`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.heatmap.competencies)).toBe(true);
      expect(data.heatmap.competencies.length).toBeGreaterThan(0);
      expect(data.heatmap.competencies[0]).toHaveProperty("masteryPercent");
    });

    it("GET /api/teacher/classes/:classId/export-diary-xlsx - Deve exportar diário de classe formatado em Excel", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/classes/turma-ds-1a/export-diary-xlsx`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("spreadsheetml.sheet");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(100);
    });

    it("POST /api/teacher/oral-defense/session - Deve gerar sessão de arguição presencial com 3 perguntas", async () => {
      const payload = {
        studentName: "Matheus Pereira",
        studentId: "st-02",
        exerciseTitle: "Fila de Atendimento em Python",
        code: "def atender_cliente(fila): return fila.pop(0) if fila else None",
        language: "python"
      };
      const res = await fetch(`${baseUrl}/api/teacher/oral-defense/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.questions.length).toBe(3);
      expect(data.session.questions[0]).toHaveProperty("focusArea");
    });

    it("POST /api/teacher/oral-defense/export-pdf - Deve exportar laudo oficial de arguição oral em PDF", async () => {
      const payload = {
        evaluation: {
          sessionId: "socr_123",
          studentName: "Matheus Pereira",
          exerciseTitle: "Fila de Atendimento em Python",
          language: "python",
          questions: [
            { question: "Como você tratou fila vazia?", focusArea: "Tratamento de Exceções", teacherScore: 90, teacherNotes: "Excelente" },
            { question: "Explique a complexidade do pop(0)", focusArea: "Complexidade Algorítmica", teacherScore: 85, teacherNotes: "Correto" },
            { question: "Como escalaria para concorrência?", focusArea: "Decisão Arquitetural", teacherScore: 95, teacherNotes: "Muito bom" }
          ],
          overallOralScore: 90,
          teacherGeneralFeedback: "O estudante demonstrou pleno domínio do código submetido.",
          evaluatedAt: new Date().toISOString()
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/oral-defense/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/teacher/recovery-plan/export-pdf - Deve exportar Plano de Recuperação Individual (PRI) em PDF", async () => {
      const payload = {
        plan: {
          studentId: "st-01",
          studentName: "Lucas Mendes",
          enrollmentCode: "20261011",
          className: "Desenvolvimento de Sistemas 2A",
          courseName: "Técnico em Desenvolvimento de Sistemas - SENAI",
          unitCurricular: "Lógica de Programação",
          currentGrade: 45.0,
          deficienciesIdentified: ["Estruturas de Repetição (Loops)", "Normalização 3FN"],
          learningObjectives: ["Dominar laços for/while", "Decomposição em 3FN"],
          studyRoadmap: [
            { topic: "Iteradores", recommendedReading: "Cap. 4", practicalFocus: "Acumuladores" }
          ],
          levelingExercises: [
            { id: 1, title: "Loop Seguro", enunciado: "Crie um loop seguro", dicaDidatica: "Verifique parada", gabaritoComentado: "while n > 0" }
          ],
          deadlineDate: "15/10/2026",
          teacherName: "Prof. Djalma Batista"
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/recovery-plan/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/teacher/exam-variants/generate - Deve gerar variantes de prova A/B/C/D", async () => {
      const payload = {
        examTitle: "Avaliação de Algoritmos",
        basePrompt: "Escreva uma função para validar descontos",
        language: "python",
        variantCount: 4
      };
      const res = await fetch(`${baseUrl}/api/teacher/exam-variants/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.exam.variants.length).toBe(4);
      expect(data.exam.variants[0].variantId).toBe("A");
    });

    // -------------------------------------------------------------
    // ADVANCED SUITE: 6 NEW TEACHER FEATURES
    // -------------------------------------------------------------
    it("GET /api/teacher/live-lab/status - Deve retornar status das máquinas do laboratório ao vivo", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/live-lab/status/turma-ds-1a`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.status).toHaveProperty("totalMachines");
      expect(Array.isArray(data.status.machines)).toBe(true);
      expect(data.status.machines.length).toBeGreaterThan(0);
      expect(data.status.machines[0]).toHaveProperty("needsTeacherHelp");
    });

    it("POST /api/teacher/live-lab/intervene - Deve registrar intervenção na carteira do estudante", async () => {
      const payload = {
        classId: "turma-ds-1a",
        studentId: "st-01",
        action: "Orientação sobre IndexError em laço for",
        teacherNote: "Explicado conceito de índices 0 a N-1"
      };
      const res = await fetch(`${baseUrl}/api/teacher/live-lab/intervene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result.success).toBe(true);
    });

    it("GET /api/teacher/code-playback/:submissionId - Deve retornar linha do tempo e telemetria de digitação", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/code-playback/sub_123`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.playback).toHaveProperty("authorshipConfidenceScore");
      expect(data.playback).toHaveProperty("totalPasteBursts");
      expect(Array.isArray(data.playback.snapshots)).toBe(true);
      expect(data.playback.snapshots.length).toBeGreaterThan(0);
    });

    it("GET /api/teacher/saep-arena/leaderboard - Deve retornar ranking ao vivo do simulado SAEP", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/saep-arena/leaderboard/turma-ds-1a`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.leaderboard).toHaveProperty("classSaepReadinessPct");
      expect(Array.isArray(data.leaderboard.leaderboard)).toBe(true);
      expect(data.leaderboard.leaderboard.length).toBeGreaterThan(0);
      expect(data.leaderboard.leaderboard[0]).toHaveProperty("saepReadiness");
    });

    it("POST /api/teacher/team-audit/evaluate - Deve auditar contribuição e notas individuais da equipe", async () => {
      const payload = {
        teamName: "Squad DevSecOps",
        projectTitle: "Portal de Vendas e Estoque",
        members: [
          { id: "st-01", name: "Lucas Mendes", declaredRole: "Backend Lead" },
          { id: "st-02", name: "Matheus Pereira", declaredRole: "DBA & SQL" },
          { id: "st-03", name: "Camila Rocha", declaredRole: "Frontend" }
        ],
        commitsCountByMember: {
          "st-01": 35,
          "st-02": 22,
          "st-03": 8
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/team-audit/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.evaluation.members.length).toBe(3);
      expect(data.evaluation.members[0]).toHaveProperty("contributionPct");
      expect(data.evaluation.members[0]).toHaveProperty("individualScore");
    });

    it("POST /api/teacher/lesson-generator/generate - Deve gerar plano de aula prático com slides e exercícios", async () => {
      const payload = {
        topic: "Recursão e Estruturas de Árvores",
        durationMinutes: 90,
        targetLevel: "Intermediário"
      };
      const res = await fetch(`${baseUrl}/api/teacher/lesson-generator/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.lesson.slides)).toBe(true);
      expect(data.lesson.slides.length).toBeGreaterThan(0);
      expect(data.lesson.graduatedExercises.length).toBe(3);
    });

    it("POST /api/teacher/dispatch-alerts - Deve formatar mensagem WhatsApp e payload de comunicação para o aluno", async () => {
      const payload = {
        studentName: "Ana Beatriz",
        studentPhone: "(31) 98765-4321",
        studentEmail: "ana.beatriz@aluno.senai.br",
        score: 95,
        activityTitle: "Modelagem DER e SQL DDL",
        feedbackSummary: "Excelente modelagem e 100% de conformidade com a 3FN.",
        isRecoveryRequired: false
      };
      const res = await fetch(`${baseUrl}/api/teacher/dispatch-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.result.whatsappFormattedUrl).toContain("api.whatsapp.com");
      expect(data.result.emailPayload).toHaveProperty("subject");
    });

    // =========================================================================
    // 8. COPILOTO DE AULA AO VIVO (LIVE CLASSROOM INTERVENTION)
    // =========================================================================
    it("POST /api/teacher/live-copilot/intervene - Deve gerar intervenção didática com analogia 30s, código Jeito Errado vs Certo e desafio 5min", async () => {
      const payload = {
        topic: "Recursão vs Iteração e Pilha de Chamadas",
        programmingLanguage: "Python",
        classDifficultyLevel: "Intermediário",
        studentDoubtContext: "Alunos esquecendo o caso base gerando StackOverflow"
      };
      const res = await fetch(`${baseUrl}/api/teacher/live-copilot/intervene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.intervention).toBeDefined();
      expect(data.intervention.immediateAnalogy.length).toBeGreaterThan(15);
      expect(data.intervention.wrongVsRightCode).toHaveProperty("wrongCode");
      expect(data.intervention.wrongVsRightCode).toHaveProperty("rightCode");
      expect(Array.isArray(data.intervention.socraticQuestions)).toBe(true);
      expect(data.intervention.socraticQuestions.length).toBeGreaterThanOrEqual(3);
      expect(data.intervention.fiveMinChallenge).toHaveProperty("challengeTitle");
      expect(data.intervention.fiveMinChallenge).toHaveProperty("verificationKey");
    });

    it("POST /api/teacher/live-copilot/export-pdf - Deve exportar PDF do guia de intervenção em tempo real", async () => {
      const payload = {
        intervention: {
          conceptKey: "Recursão e Árvores",
          targetLevel: "Intermediário",
          programmingLanguage: "Python",
          immediateAnalogy: "Linha de montagem com parada de segurança.",
          wrongVsRightCode: {
            wrongCode: "def f(n): return f(n)",
            wrongExplanation: "Sem caso base",
            rightCode: "def f(n): return 1 if n<=1 else n*f(n-1)",
            rightExplanation: "Com caso base seguro"
          },
          socraticQuestions: [
            { question: "Onde o caso base para?", targetInsight: "Pilha", expectedDifficulty: "Iniciante" }
          ],
          fiveMinChallenge: {
            challengeTitle: "Desafio Relâmpago",
            challengePrompt: "Implemente fatorial",
            starterSnippet: "def fat(n): pass",
            verificationKey: "Verifique n<=1"
          },
          cheatSheetTips: ["Fail fast", "Clean code"],
          generatedAt: new Date().toISOString()
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/live-copilot/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    // =========================================================================
    // 9. AUDITOR TRI & ANTI-COLA IA DE PROVAS
    // =========================================================================
    it("POST /api/teacher/exam-tri-audit - Deve auditar itens com parâmetros TRI (a,b,c) e distratores A-D", async () => {
      const payload = {
        examTitle: "Avaliação Oficial de Backend",
        targetSubject: "Desenvolvimento de Sistemas",
        questions: [
          {
            prompt: "Qual cláusula garante integridade referencial ON DELETE CASCADE?",
            options: [
              { letter: "A", text: "ON DELETE RESTRICT", isCorrect: false },
              { letter: "B", text: "ON DELETE CASCADE", isCorrect: true },
              { letter: "C", text: "ON UPDATE NO ACTION", isCorrect: false },
              { letter: "D", text: "ON DELETE SET NULL", isCorrect: false }
            ],
            topic: "SQL DDL"
          }
        ]
      };
      const res = await fetch(`${baseUrl}/api/teacher/exam-tri-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.audit.antiLeakScore).toBeGreaterThanOrEqual(50);
      expect(data.audit.triCalibration).toHaveProperty("overallDifficultyMean");
      expect(Array.isArray(data.audit.auditedQuestions)).toBe(true);
      expect(data.audit.auditedQuestions[0]).toHaveProperty("triDifficultyParam_b");
      expect(data.audit.auditedQuestions[0].distractorAudits.length).toBe(4);
    });

    it("POST /api/teacher/exam-tri-audit/export-pdf - Deve exportar PDF do laudo TRI & Anti-Cola", async () => {
      const payload = {
        audit: {
          examTitle: "Avaliação Oficial de Backend",
          targetSubject: "Desenvolvimento de Sistemas",
          antiLeakScore: 88,
          antiLeakSummary: "Excelente blindagem contra IAs externas e calibração TRI precisa.",
          triCalibration: {
            overallDifficultyMean: 585,
            discriminationQuality: "Excelente",
            guessingVulnerabilityRisk: "Baixo"
          },
          auditedQuestions: [
            {
              questionIndex: 1,
              promptExcerpt: "Qual comando DDL...",
              triDifficultyParam_b: 0.45,
              triDiscriminationParam_a: 1.80,
              triGuessingParam_c: 0.25,
              antiAiLeakVulnerability: "Blindada",
              antiAiVulnerabilityReason: "Cenário industrial contextualizado",
              distractorAudits: [
                { letter: "A", text: "RESTRICT", isCorrect: false, pedagogicalDiagnostic: "Bloqueia deleção", plausibilityRating: "Alta" },
                { letter: "B", text: "CASCADE", isCorrect: true, pedagogicalDiagnostic: "Gabarito", plausibilityRating: "Alta" },
                { letter: "C", text: "NO ACTION", isCorrect: false, pedagogicalDiagnostic: "Padrão", plausibilityRating: "Média" },
                { letter: "D", text: "SET NULL", isCorrect: false, pedagogicalDiagnostic: "Nulifica", plausibilityRating: "Média" }
              ]
            }
          ],
          generalTeacherRecommendations: ["Manter 4 alternativas", "Usar logs industriais"]
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/exam-tri-audit/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    // =========================================================================
    // 10. FICHA FAID SENAI & TRILHA ADAPTATIVA DE RECUPERAÇÃO
    // =========================================================================
    it("POST /api/teacher/faid/generate - Deve gerar ficha FAID com critérios 60/40 e menção oficial", async () => {
      const payload = {
        studentName: "Lucas Mendes de Oliveira",
        enrollmentCode: "20261011",
        className: "Desenvolvimento de Sistemas 2A",
        courseName: "Técnico em Desenvolvimento de Sistemas",
        unitCurricular: "Lógica e Estrutura de Dados",
        teacherNotes: "Excelente assiduidade e bom domínio de algoritmos iterativos."
      };
      const res = await fetch(`${baseUrl}/api/teacher/faid/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.faid.technicalCriteria.length).toBe(4);
      expect(data.faid.attitudinalCriteria.length).toBe(3);
      expect(data.faid.finalGradeCalculated).toBeGreaterThanOrEqual(0);
      expect(data.faid.finalMention).toBeDefined();
      expect(data.faid.aiDescriptiveOpinion.length).toBeGreaterThan(20);
    });

    it("POST /api/teacher/faid/export-pdf - Deve exportar Ficha FAID SENAI em PDF", async () => {
      const payload = {
        faid: {
          recordId: "faid-123",
          studentId: "st-01",
          studentName: "Lucas Mendes de Oliveira",
          enrollmentCode: "20261011",
          courseName: "Técnico em Desenvolvimento de Sistemas",
          className: "DS 2A",
          unitCurricular: "Lógica de Programação",
          evaluatorTeacherName: "Prof. Djalma Batista",
          assessmentDate: "27/09/2026",
          technicalCriteria: [
            { criterion: "Lógica", weight: 20, scoreObtained: 18, maxScore: 20, performanceLevel: "Adequado", evidenceNotes: "Ótimo" }
          ],
          attitudinalCriteria: [
            { attitude: "Pontualidade/Compromisso", scoreObtained: 14, maxScore: 15, performanceLevel: "Adequado", observation: "Assíduo" }
          ],
          finalGradeCalculated: 88,
          finalMention: "Apto com Excelência",
          aiDescriptiveOpinion: "Discente com excelente aproveitamento técnico e atitudinal no curso.",
          recommendedInterventions: ["Continuar estudos avançados"]
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/faid/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/teacher/adaptive-remedial/generate - Deve gerar trilha de recuperação em 3 níveis", async () => {
      const payload = {
        studentName: "Lucas Mendes",
        className: "DS 2A",
        courseName: "Técnico em DS",
        unitCurricular: "Lógica",
        failedTopics: ["Laços de Repetição", "Normalização 3FN"],
        currentGrade: 52
      };
      const res = await fetch(`${baseUrl}/api/teacher/adaptive-remedial/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.pack.microLearningRoadmap.length).toBeGreaterThanOrEqual(1);
      expect(data.pack.graduatedExerciseSet.length).toBeGreaterThanOrEqual(1);
      expect(data.pack.studentPactTerms).toContain("Lucas Mendes");
    });

    it("POST /api/teacher/adaptive-remedial/export-pdf - Deve exportar PDF da Trilha de Recuperação", async () => {
      const payload = {
        pack: {
          packId: "rem-123",
          studentId: "st-01",
          studentName: "Lucas Mendes",
          className: "DS 2A",
          courseName: "Técnico em DS",
          unitCurricular: "Lógica",
          currentGrade: 52,
          diagnosedGaps: [{ concept: "Loops", severity: "Alta", diagnosedRootCause: "Condição de parada" }],
          microLearningRoadmap: [{ stepNumber: 1, title: "Revisão", targetConcept: "While", durationEstimatedMinutes: 20, studyGuidance: "Pratique", quickSelfCheckQuestion: "O que é while?" }],
          graduatedExerciseSet: [{ level: "Nível 1 - Fixação", questionPrompt: "Crie um loop", stepByStepHints: ["for n in list"], modelSolution: "def f(): pass" }],
          studentPactTerms: "Eu, Lucas Mendes, comprometo-me a cumprir a trilha de recuperação."
        }
      };
      const res = await fetch(`${baseUrl}/api/teacher/adaptive-remedial/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });
  });
});
