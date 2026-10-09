import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { DiagramVisionRecognitionService } from "../services/diagramVisionRecognitionService";
import { DatabaseLoadBenchmarkService } from "../services/databaseLoadBenchmarkService";
import { AdaptiveLearningPathwayService } from "../services/adaptiveLearningPathwayService";
import { TeacherPedagogicalCockpitService } from "../services/teacherPedagogicalCockpitService";

// Mock pg Pool
const mockPool = {
  query: vi.fn().mockImplementation((queryText: string, params: any[]) => {
    return Promise.resolve({ rows: [] });
  }),
  on: vi.fn(),
};

describe("Evolução do Sistema: Visão Computacional, Benchmark 100k, Trilhas Adaptativas & Cockpit Docente", () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, mockPool as any);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });

  describe("1. DiagramVisionRecognitionService (Visão Computacional para Fotos)", () => {
    it("deve reconhecer entidades, cardinalidades e gerar Mermaid/DDL a partir de imagem", async () => {
      const mockBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const result = await DiagramVisionRecognitionService.recognizeDiagramFromPhoto({
        imageBase64: mockBase64,
        diagramType: "erd"
      });

      expect(result).toBeDefined();
      expect(result.visualConfidenceScore).toBeGreaterThanOrEqual(70);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relationships.length).toBeGreaterThan(0);
      expect(result.detectedMermaidERD).toContain("erDiagram");
      expect(result.generatedDdlSql).toContain("CREATE TABLE");
    }, 15000);
  });

  describe("2. DatabaseLoadBenchmarkService (Stress Test de 100.000 Registros)", () => {
    it("deve simular carga de 100k tuplas, auditar EXPLAIN ANALYZE e identificar gargalos", async () => {
      const ddl = `CREATE TABLE tb_cliente (id UUID PRIMARY KEY, nome VARCHAR(100));
CREATE TABLE tb_pedido (id UUID PRIMARY KEY, cliente_id UUID REFERENCES tb_cliente(id), total NUMERIC(10,2));`;
      
      const benchmark = await DatabaseLoadBenchmarkService.runSchemaLoadBenchmark({
        ddlSql: ddl,
        activityTitle: "E-Commerce de Alto Volume",
        targetRows: 100000
      });

      expect(benchmark).toBeDefined();
      expect(benchmark.simulatedVolumeTotalRows).toBe(100000);
      expect(benchmark.performanceScore).toBeGreaterThanOrEqual(60);
      expect(benchmark.overallThroughputTps).toBeGreaterThan(500);
      expect(benchmark.tableMetrics.length).toBeGreaterThan(0);
      expect(benchmark.queryBenchmarks.length).toBeGreaterThan(0);
    });

    it("deve exportar laudo oficial de benchmark em PDF no padrão SENAI", async () => {
      const mockResult = await DatabaseLoadBenchmarkService.runSchemaLoadBenchmark({
        ddlSql: "CREATE TABLE tb_teste (id SERIAL PRIMARY KEY);",
        targetRows: 50000
      });

      const pdfBuffer = DatabaseLoadBenchmarkService.exportBenchmarkReportPdf(mockResult);
      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(500);
    });
  });

  describe("3. AdaptiveLearningPathwayService & Live Socratic Copilot", () => {
    it("deve gerar plano de trilha adaptativa e micro-desafios gamificados baseados em lacunas", async () => {
      const pathway = await AdaptiveLearningPathwayService.generateAdaptivePathway({
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        identifiedGaps: ["Normalização 3FN", "Guard Clauses"]
      });

      expect(pathway).toBeDefined();
      expect(pathway.recommendedMicroChallenges.length).toBeGreaterThan(0);
      expect(pathway.recommendedMicroChallenges[0].xpReward).toBeGreaterThan(0);
      expect(pathway.unlockedBadge).toBeDefined();
    });

    it("deve fornecer feedback socrático e validação preliminar para o editor do aluno", async () => {
      const liveFeedback = await AdaptiveLearningPathwayService.evaluateLiveCodingSnapshot({
        code: "def filtrar(notas):\n    pass\n",
        language: "Python",
        activityTitle: "Filtro de Notas"
      });

      expect(liveFeedback).toBeDefined();
      expect(liveFeedback.status).toBeDefined();
      expect(liveFeedback.socraticQuestion).toBeDefined();
      expect(liveFeedback.testCasePreview).toBeDefined();
    });
  });

  describe("4. TeacherPedagogicalCockpitService (Heatmap e Mentoria em Duplas)", () => {
    it("deve calcular o mapa de calor de competências e formar duplas de mentoria colaborativa", async () => {
      const cockpit = await TeacherPedagogicalCockpitService.generateClassCockpit({
        classId: "turma-1a",
        className: "Desenvolvimento de Sistemas 1A",
        submissions: [
          { studentId: "st-01", studentName: "Ana Beatriz", score: 95, weaknesses: ["Indexação"] },
          { studentId: "st-02", studentName: "Mariana Costa", score: 50, weaknesses: ["Normalização 3FN"] }
        ]
      });

      expect(cockpit).toBeDefined();
      expect(cockpit.totalStudents).toBe(2);
      expect(cockpit.competencyHeatmap.length).toBeGreaterThan(0);
      expect(cockpit.peerInstructionPairings.length).toBeGreaterThan(0);
      expect(cockpit.nextClassActionPlan.length).toBeGreaterThan(0);
    });
  });

  describe("5. Endpoints de Integração API", () => {
    it("POST /api/diagrams/vision-recognize - Deve processar imagem de diagrama", async () => {
      const res = await fetch(`${baseUrl}/api/diagrams/vision-recognize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.recognitionResult).toBeDefined();
      expect(data.recognitionResult.detectedMermaidERD).toBeDefined();
    });

    it("POST /api/database/load-benchmark - Deve rodar o teste de carga de 100k", async () => {
      const res = await fetch(`${baseUrl}/api/database/load-benchmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ddlSql: "CREATE TABLE tb_exemplo (id INT PRIMARY KEY, nome VARCHAR(50));",
          targetRows: 100000
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.benchmarkResult.simulatedVolumeTotalRows).toBe(100000);
    });

    it("POST /api/adaptive/pathway-plan - Deve gerar trilha de micro-missões", async () => {
      const res = await fetch(`${baseUrl}/api/adaptive/pathway-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "st-01",
          studentName: "Carlos Eduardo",
          identifiedGaps: ["Recursão", "Chaves Estrangeiras"]
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.pathwayPlan.recommendedMicroChallenges.length).toBeGreaterThan(0);
    });

    it("POST /api/student/live-coding-socratic - Deve retornar pergunta socrática", async () => {
      const res = await fetch(`${baseUrl}/api/student/live-coding-socratic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "def somar(a, b): return a + b",
          language: "Python",
          activityTitle: "Calculadora"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.liveFeedback.socraticQuestion).toBeDefined();
    });

    it("POST /api/teacher/class-cockpit - Deve gerar painel da turma", async () => {
      const res = await fetch(`${baseUrl}/api/teacher/class-cockpit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: "turma-1a",
          className: "Turma 1A"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.cockpit.competencyHeatmap).toBeDefined();
    });
  });
});
