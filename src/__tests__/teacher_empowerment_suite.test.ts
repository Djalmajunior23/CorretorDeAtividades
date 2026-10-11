import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { TeacherCopilotService } from "../services/teacherCopilotService";
import { ParallelRecoveryService } from "../services/parallelRecoveryService";
import { AcademicExportService } from "../services/academicExportService";
import { ClassCouncilDossierService } from "../services/classCouncilDossierService";
import { TeacherVivaVoceScriptService } from "../services/teacherVivaVoceScriptService";

describe("Teacher Empowerment & Pedagogical Copilot Suite", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    // In-memory pool simulation (null)
    setupTeacherAPIs(app, null);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe("1. TeacherCopilotService Unit Tests", () => {
    it("deve responder a consultas sobre estudantes em risco", async () => {
      const response = await TeacherCopilotService.askCopilot({
        query: "Quais alunos estão com nota baixa e precisam de recuperação?",
        className: "Técnico em Desenvolvimento de Sistemas"
      });

      expect(response).toHaveProperty("answerMarkdown");
      expect(response.answerMarkdown).toContain("Risco Pedagógico");
      expect(response.suggestedAction).toBeDefined();
      expect(response.suggestedAction?.type).toBe("create_recovery");
      expect(Array.isArray(response.followUpQuestions)).toBe(true);
      expect(response.keyIndicators.length).toBeGreaterThan(0);
    });

    it("deve sugerir roteiro de aula em 5 blocos baseado no modelo SENAI", async () => {
      const response = await TeacherCopilotService.askCopilot({
        query: "Sugira um roteiro de aula prática para a próxima aula",
        className: "Técnico em Redes e Cibersegurança"
      });

      expect(response.answerMarkdown).toContain("5 Blocos");
      expect(response.answerMarkdown).toContain("Bancada");
      expect(response.suggestedAction?.type).toBe("schedule_class");
    });
  });

  describe("2. ParallelRecoveryService Unit Tests", () => {
    it("deve filtrar estudantes com nota abaixo da média e formular desafios", async () => {
      const mockStudents = [
        { id: "st-01", name: "Lucas Gabriel", score: 50 },
        { id: "st-02", name: "Beatriz Helena", score: 45 },
        { id: "st-03", name: "Ana Clara", score: 85 }
      ];

      const plan = await ParallelRecoveryService.generateRecoveryPlan({
        classId: "turma-1",
        className: "TDS 1º Termo",
        students: mockStudents,
        scoreThreshold: 60
      });

      expect(plan.targetedStudents.length).toBe(2);
      expect(plan.challenges.length).toBe(3);
      expect(plan.challenges[0].difficulty).toBe("Facil");
      expect(plan.challenges[1].difficulty).toBe("Medio");
      expect(plan.challenges[2].difficulty).toBe("Avancado");
      expect(plan.challenges[0].starterCode).toContain("function");
    });
  });

  describe("3. AcademicExportService Unit Tests", () => {
    const mockStudents = [
      { id: "st-01", name: "Carlos Eduardo", enrollment_code: "2026-01", email: "carlos@aluno.senai.br", class_name: "TDS-1" },
      { id: "st-02", name: "Mariana Costa", enrollment_code: "2026-02", email: "mariana@aluno.senai.br", class_name: "TDS-1" }
    ];

    it("deve gerar linhas estruturadas com cálculo de conceito e situação", () => {
      const rows = AcademicExportService.generateRows(mockStudents, {
        "st-01": { n1: 90, n2: 95 },
        "st-02": { n1: 50, n2: 55, rec: 70 }
      });

      expect(rows.length).toBe(2);
      expect(rows[0].academicConcept).toBe("A");
      expect(rows[0].status).toBe("APROVADO");
      expect(rows[1].finalAverage).toBe(70);
      expect(rows[1].academicConcept).toBe("B");
    });

    it("deve formatar nos layouts Totvs, Moodle e SGE", () => {
      const rows = AcademicExportService.generateRows(mockStudents, {});
      
      const totvsCsv = AcademicExportService.toTotvsCsv(rows);
      expect(totvsCsv).toContain("MATRICULA_SENAI");
      expect(totvsCsv).toContain("ETAPA_1_AVALIACAO");

      const moodleCsv = AcademicExportService.toMoodleCsv(rows);
      expect(moodleCsv).toContain("Número de identificação");

      const sgeCsv = AcademicExportService.toSgeCsv(rows);
      expect(sgeCsv).toContain("FREQ_PERCENTUAL");
    });
  });

  describe("4. ClassCouncilDossierService Unit Tests", () => {
    it("deve instanciar documento PDF A4 com metadados do estudante", () => {
      const doc = ClassCouncilDossierService.generateDossierPdf({
        id: "st-01",
        name: "Lucas Gabriel Santos",
        enrollmentCode: "2026-DS-01",
        className: "Técnico em Desenvolvimento de Sistemas - 1º Termo",
        courseName: "Desenvolvimento de Sistemas",
        semester: "2026/1",
        shift: "Noturno",
        averageScore: 84.5,
        attendanceRate: 96.0,
        timelinessRate: 92.0,
        completedActivitiesCount: 14,
        totalActivitiesCount: 15,
        competencies: [
          { name: "Lógica de Programação", score: 85, status: "SUPERIOR" },
          { name: "Banco de Dados SQL", score: 80, status: "ADEQUADO" }
        ],
        aiSynthesis: "Estudante com bom aproveitamento e postura colaborativa.",
        teacherObservation: "Recomendado para projeto de extensão em monitoria.",
        recommendation: "APROVAR"
      });

      expect(doc).toBeDefined();
      expect(typeof doc.output).toBe("function");
    });
  });

  describe("5. TeacherVivaVoceScriptService Unit Tests", () => {
    it("deve gerar 5 questões com rubrica de autoria para banca oral", async () => {
      const script = await TeacherVivaVoceScriptService.generateDefenseScript({
        projectTitle: "API de Pagamento PIX com Postgres",
        studentName: "Rafael Souza Dias",
        codeSnippet: "async function pagar() { return true; }"
      });

      expect(script.questions.length).toBe(5);
      expect(script.questions[0]).toHaveProperty("scoringGuide");
      expect(script.authorshipTrapTip).toBeDefined();
    });
  });

  describe("6. Express Endpoints Integration Tests (/api/teacher/*)", () => {
    it("POST /api/teacher/copilot/ask - Deve processar pergunta e retornar insights", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/copilot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Qual o panorama geral da turma?",
          className: "Turma TDS 2026"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("answerMarkdown");
    });

    it("POST /api/teacher/parallel-recovery/generate - Deve gerar plano de recuperação", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/parallel-recovery/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: "class-1",
          className: "Técnico em Redes",
          scoreThreshold: 60
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan.challenges.length).toBeGreaterThan(0);
    });

    it("POST /api/teacher/voice-feedback/structure - Deve receber ditado e retornar rubrica", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/voice-feedback/structure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: "Lucas Santos",
          activityTitle: "Desafio 01",
          rawSpeechText: "aluno fez o codigo certinho faltou so tratar lista vazia"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.feedback).toHaveProperty("polishedPedagogicalFeedback");
    });

    it("POST /api/teacher/academic-export - Deve retornar arquivo Totvs exportado", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/academic-export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: "class-1",
          format: "totvs"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.csvContent).toContain("MATRICULA_SENAI");
    });

    it("POST /api/teacher/viva-voce/generate-script - Deve retornar roteiro de arguição", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/viva-voce/generate-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: "Microsserviço de Autenticação",
          studentName: "Beatriz Lima"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.script.questions.length).toBe(5);
    });

    it("GET /api/teacher/class-council-dossier/:studentId - Deve retornar dados para o dossiê", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/class-council-dossier/stu-001`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.dossier).toHaveProperty("competencies");
    });
  });
});
