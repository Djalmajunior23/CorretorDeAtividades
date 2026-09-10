import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { AssessmentAiService } from "../services/assessmentAiService";

describe("Assessment Generation Engine & Multi-LLM Suite", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    setupTeacherAPIs(app, null);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as any).port;
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

  describe("AssessmentAiService Core Engine", () => {
    it("Deve gerar avaliação contextualizada com 5 questões detalhadas", async () => {
      const result = await AssessmentAiService.generateContextualAssessment({
        theme: "Estruturas de Repetição e Vetores",
        unitCurricular: "Lógica de Programação e Algoritmos",
        contextScenario: "Sistema de Gestão Hospitalar & Triagem de Emergência",
        competencies: ["COMP-01", "COMP-02", "COMP-03"],
        difficulty: "Média",
        language: "python",
        questionsCount: 5,
        generateVariants: false
      });

      expect(result).toBeDefined();
      expect(result.questions.length).toBe(5);
      expect(result.total_points).toBe(100);
      expect(result.context_scenario).toContain("Hospitalar");
      expect(result.unit_curricular).toBe("Lógica de Programação e Algoritmos");

      // Validar que temos questões de múltiplos tipos com rubricas e gabarito
      const hasMultipleChoice = result.questions.some(q => q.type === "multiple_choice");
      const hasCodeTracing = result.questions.some(q => q.type === "code_tracing");
      const hasHandsOn = result.questions.some(q => q.type === "hands_on_coding");

      expect(hasMultipleChoice).toBe(true);
      expect(hasCodeTracing).toBe(true);
      expect(hasHandsOn).toBe(true);

      const firstQ = result.questions[0];
      expect(firstQ.points).toBeGreaterThan(0);
      expect(firstQ.context_intro).toBeDefined();
      expect(firstQ.enunciado).toBeDefined();
    });

    it("Deve gerar 3 Variantes Anti-Cola (A, B e C) permutadas para aplicação em laboratório", async () => {
      const result = await AssessmentAiService.generateContextualAssessment({
        theme: "Pesquisa e Ordenação em Grafos",
        contextScenario: "Logística Portuária de Contêineres",
        language: "python",
        questionsCount: 3,
        generateVariants: true
      });

      expect(result.variants).toBeDefined();
      expect(result.variants?.length).toBe(3);
      expect(result.variants?.[0].variant).toBe("A");
      expect(result.variants?.[1].variant).toBe("B");
      expect(result.variants?.[2].variant).toBe("C");

      expect(result.variants?.[0].questions.length).toBe(3);
      expect(result.variants?.[1].questions.length).toBe(3);
      expect(result.variants?.[2].questions.length).toBe(3);
    });

    it("Deve aplicar fallback contextual robusto quando IA estiver offline", () => {
      const fallback = AssessmentAiService.generateContextualFallback({
        theme: "APIs RESTful e Microsserviços",
        uc: "Desenvolvimento Web Back-End",
        contextScenario: "Plataforma de Fintech e Pagamentos Pix",
        competencies: ["COMP-04", "COMP-06"],
        difficulty: "Difícil",
        language: "javascript",
        count: 6,
        questionTypes: ["multiple_choice", "code_tracing", "hands_on_coding"],
        generateVariants: true
      });

      expect(fallback.questions_count).toBe(6);
      expect(fallback.questions.length).toBe(6);
      expect(fallback.total_points).toBe(100);
      expect(fallback.variants?.length).toBe(3);
      expect(fallback.ai_metadata.fallback_applied).toBe(true);
    });
  });

  describe("API Endpoints & Multi-LLM Management", () => {
    it("POST /api/assessments/test-ai-connection - Deve testar conectividade com provedor Ollama/Auto", async () => {
      const res = await fetch(`${baseUrl}/api/assessments/test-ai-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "ollama",
          baseUrl: "http://host.docker.internal:11434",
          model: "qwen2.5-coder:3b"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.provider).toBe("ollama");
      expect(Array.isArray(data.models)).toBe(true);
    });

    it("POST /api/assessments/test-ai-connection - Deve testar provedor Gemini e OpenAI", async () => {
      const res = await fetch(`${baseUrl}/api/assessments/test-ai-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "gemini"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.provider).toBe("gemini");
      expect(data.models).toContain("gemini-2.5-flash");
    });

    it("POST /api/assessments/generate-contextual - Deve gerar avaliação completa com metadados", async () => {
      const res = await fetch(`${baseUrl}/api/assessments/generate-contextual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "Programação Orientada a Objetos",
          unit_curricular: "Programação Orientada a Objetos I",
          context_scenario: "Sistema de Prontuário Eletrônico Hospitalar",
          competencies: ["COMP-05"],
          difficulty: "Média",
          language: "java",
          questions_count: 5,
          generate_variants: true
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.assessment).toBeDefined();
      expect(data.assessment.questions_count).toBe(5);
      expect(data.assessment.total_points).toBe(100);
      expect(data.assessment.variants?.length).toBe(3);
    });

    it("POST /api/assessments/export-student-exam-pdf - Deve gerar PDF oficial do caderno do aluno", async () => {
      const fakeAssessment = AssessmentAiService.generateContextualFallback({
        theme: "Algoritmos e Estruturas de Dados",
        uc: "Desenvolvimento de Sistemas",
        contextScenario: "Telemetria Industrial 4.0",
        competencies: ["COMP-01", "COMP-02"],
        difficulty: "Média",
        language: "python",
        count: 3,
        questionTypes: ["multiple_choice", "hands_on_coding"],
        generateVariants: true
      });

      const res = await fetch(`${baseUrl}/api/assessments/export-student-exam-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: fakeAssessment,
          variant: "A"
        })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/assessments/export-teacher-guide-pdf - Deve gerar PDF do guia do professor com gabarito", async () => {
      const fakeAssessment = AssessmentAiService.generateContextualFallback({
        theme: "Algoritmos e Estruturas de Dados",
        uc: "Desenvolvimento de Sistemas",
        contextScenario: "Telemetria Industrial 4.0",
        competencies: ["COMP-01", "COMP-02"],
        difficulty: "Média",
        language: "python",
        count: 3,
        questionTypes: ["multiple_choice", "hands_on_coding"],
        generateVariants: false
      });

      const res = await fetch(`${baseUrl}/api/assessments/export-teacher-guide-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: fakeAssessment
        })
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      const buffer = await res.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(500);
    });

    it("POST /api/exams/generate-variants - Deve responder com variantes contextualizadas", async () => {
      const res = await fetch(`${baseUrl}/api/exams/generate-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "Estruturas Condicionais e Loops",
          language: "python",
          context_scenario: "Automação de Linha de Montagem"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.variants.length).toBe(3);
      expect(data.variants[0].variant).toBe("A");
      expect(data.variants[1].variant).toBe("B");
      expect(data.variants[2].variant).toBe("C");
    });
  });
});
