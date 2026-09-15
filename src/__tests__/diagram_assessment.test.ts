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

describe("Módulo de Correção de Diagramas e Modelagem de Sistemas", () => {
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

  it("GET /api/diagrams/templates - Deve retornar templates de DER e UML pré-configurados", async () => {
    const res = await fetch(`${baseUrl}/api/diagrams/templates`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(4);

    const erdTemplate = data.find((t: any) => t.category === "database");
    expect(erdTemplate).toBeDefined();
    expect(erdTemplate.sampleCode).toContain("erDiagram");

    const umlTemplate = data.find((t: any) => t.category === "uml");
    expect(umlTemplate).toBeDefined();
  });

  it("POST /api/diagrams/generate-reference - Deve gerar gabarito de referência com IA a partir de enunciado", async () => {
    const res = await fetch(`${baseUrl}/api/diagrams/generate-reference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: "Sistema de gerenciamento de biblioteca com livros e empréstimos",
        diagramType: "erDiagram"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.referenceMermaid).toContain("erDiagram");
    expect(data.keyRequirements.length).toBeGreaterThan(0);
  });

  it("POST /api/diagrams/assess - Deve aprovar (>=60 pts) DER com PKs, FKs e cardinalidades corretas", async () => {
    const validERD = `erDiagram
      CLIENTE ||--o{ PEDIDO : "realiza"
      PEDIDO ||--|{ ITEM_PEDIDO : "contem"
      PRODUTO ||--o{ ITEM_PEDIDO : "pertence"

      CLIENTE {
          uuid id PK
          string nome
          string email UK
      }
      PEDIDO {
          uuid id PK
          uuid cliente_id FK
          datetime data_pedido
          decimal total
      }
      ITEM_PEDIDO {
          uuid id PK
          uuid pedido_id FK
          uuid produto_id FK
          int quantidade
          decimal preco_unitario
      }
      PRODUTO {
          uuid id PK
          string nome
          decimal preco
      }`;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: validERD,
        scenario: "E-commerce com pedidos e produtos"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalGrade).toBeGreaterThanOrEqual(60);
    expect(data.isApproved).toBe(true);
    expect(data.status).toBe("Aprovado");
    expect(data.rubrics.length).toBe(4);
    expect(data.strengths.length).toBeGreaterThan(0);
    expect(data.normalizationNotes.length).toBeGreaterThan(0);
  });

  it("POST /api/diagrams/assess - Deve penalizar e identificar falhas em diagramas incompletos sem PKs/FKs", async () => {
    const incompleteERD = `erDiagram
      CLIENTE -- PEDIDO
      PEDIDO -- PRODUTO`;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: incompleteERD,
        scenario: "E-commerce simplificado"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalGrade).toBeLessThan(70);
    expect(data.modelingIssues.length).toBeGreaterThan(0);
  });

  it("POST /api/diagrams/assess - Deve avaliar Diagrama de Classes UML com modificadores de visibilidade", async () => {
    const validUML = `classDiagram
      class Conta {
          -String numero
          #BigDecimal saldo
          +depositar(valor: BigDecimal): boolean
          +sacar(valor: BigDecimal): boolean
      }
      class ContaCorrente {
          -BigDecimal limite
          +sacar(valor: BigDecimal): boolean
      }
      Conta <|-- ContaCorrente : herda`;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "classDiagram",
        format: "code",
        code: validUML,
        scenario: "Modelagem bancária com herança"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalGrade).toBeGreaterThanOrEqual(60);
    expect(data.isApproved).toBe(true);
    expect(data.strengths.some((s: string) => s.includes("visibilidade") || s.includes("Encapsulamento"))).toBe(true);
  });

  it("POST /api/diagrams/assess - Deve retornar 400 se nenhum código ou imagem for fornecido", async () => {
    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        code: ""
      })
    });

    expect(res.status).toBe(400);
  });

  it("POST /api/diagrams/assess - Deve avaliar Modelo Lógico de Banco de Dados submetido por IMAGEM (Base64)", async () => {
    const mockImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "logical",
        format: "image",
        imageBase64: mockImageBase64,
        scenario: "Sistema de E-commerce com Clientes, Pedidos e Produtos"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.modelCategory).toBe("logical");
    expect(data.inputFormat).toBe("image");
    expect(data.totalGrade).toBeGreaterThanOrEqual(60);
    expect(data.normalizationAudit.firstNormalForm).toBeDefined();
    expect(data.generatedDdlSql).toContain("CREATE TABLE");
    expect(data.suggestedCorrectedDiagram).toContain("erDiagram");
  });

  it("POST /api/diagrams/assess - Deve avaliar Modelo Físico com validação de tipos SGBD (PostgreSQL)", async () => {
    const validPhysicalDdl = `
      CREATE TABLE tb_usuario (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome VARCHAR(150) NOT NULL,
          email VARCHAR(150) NOT NULL UNIQUE
      );

      CREATE TABLE tb_conta (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          usuario_id UUID NOT NULL,
          saldo NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (saldo >= 0),
          CONSTRAINT fk_conta_usuario FOREIGN KEY (usuario_id) REFERENCES tb_usuario(id) ON DELETE RESTRICT
      );
    `;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "physical",
        format: "code",
        code: validPhysicalDdl,
        targetSgbd: "postgresql",
        scenario: "Módulo financeiro transacional"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.modelCategory).toBe("physical");
    expect(data.totalGrade).toBeGreaterThanOrEqual(70);
    expect(data.physicalAudit).toBeDefined();
    expect(data.physicalAudit.sgbdTarget).toBe("postgresql");
    expect(data.physicalAudit.constraintsCheck.notNullCompliance).toBe(true);
    expect(data.generatedDdlSql).toContain("CREATE TABLE");
  });

  it("POST /api/database-models/export-pdf - Deve exportar PDF completo com parecer técnico de modelagem", async () => {
    const mockAssessment = {
      assessmentId: "test_db_001",
      modelCategory: "physical",
      inputFormat: "image",
      targetSgbd: "postgresql",
      totalGrade: 92,
      status: "Aprovado",
      isApproved: true,
      passingGrade: 60,
      rubrics: [
        { name: "Sintaxe DDL", score: 20, maxScore: 20, weight: 20, status: "EXCELENTE", feedback: "OK", pedagogicalRationale: "R1" },
        { name: "Tipagem", score: 28, maxScore: 30, weight: 30, status: "EXCELENTE", feedback: "OK", pedagogicalRationale: "R2" }
      ],
      strengths: ["PKs e FKs completas"],
      modelingIssues: [],
      normalizationAudit: {
        firstNormalForm: { compliant: true, issues: [], explanation: "1FN OK" },
        secondNormalForm: { compliant: true, issues: [], explanation: "2FN OK" },
        thirdNormalForm: { compliant: true, issues: [], explanation: "3FN OK" }
      },
      extractedTables: [],
      pedagogicalRecommendations: ["Criar índices em colunas FK"],
      extractedMermaidCode: "erDiagram",
      suggestedCorrectedDiagram: "erDiagram",
      generatedDdlSql: "CREATE TABLE tb_teste (id INT PRIMARY KEY);",
      evaluatedAt: new Date().toISOString()
    };

    const res = await fetch(`${baseUrl}/api/database-models/export-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessment: mockAssessment,
        studentName: "Lucas de Castro",
        className: "Turma TDS-2026"
      })
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    const arrayBuffer = await res.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(1000);
  });
});
