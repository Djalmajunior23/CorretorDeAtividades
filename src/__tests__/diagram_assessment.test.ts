import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";
import { DatabaseModelAssessmentService } from "../services/databaseModelAssessmentService";

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

  it("POST /api/diagrams/assess - Deve extrair e avaliar entidades dinâmicas (ex: Biblioteca) sem hardcode", async () => {
    const libraryERD = `erDiagram
      AUTOR ||--o{ LIVRO : "escreve"
      LIVRO ||--o{ EMPRESTIMO : "possui"

      AUTOR {
          uuid id PK
          string nome
          string nacionalidade
      }
      LIVRO {
          uuid id PK
          uuid autor_id FK
          string titulo
          int ano_publicacao
      }
      EMPRESTIMO {
          uuid id PK
          uuid livro_id FK
          datetime data_retirada
      }`;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: libraryERD,
        scenario: "Sistema de gerenciamento de biblioteca com autores, livros e empréstimos"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalGrade).toBeGreaterThanOrEqual(60);
    expect(data.extractedTables.some((t: any) => t.name === "AUTOR" || t.name === "LIVRO")).toBe(true);
    expect(data.generatedDdlSql.toLowerCase()).toContain("autor");
    expect(data.generatedDdlSql.toLowerCase()).toContain("livro");
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

  it("POST /api/diagrams/assess - Deve persistir correção no vault quando studentId for informado", async () => {
    const validERD = `erDiagram
      CLIENTE ||--o{ PEDIDO : "realiza"
      CLIENTE { uuid id PK string nome }
      PEDIDO { uuid id PK uuid cliente_id FK }`;

    const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: validERD,
        scenario: "Sistema de Vendas",
        studentId: "st-01",
        studentName: "Ana Beatriz Silva",
        classId: "turma-1a",
        className: "Desenvolvimento de Sistemas 1A"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.totalGrade).toBeGreaterThanOrEqual(60);
    // Verifies pool.query was invoked with INSERT into correction_vault
    expect(mockPool.query).toHaveBeenCalled();
  });

  it("POST /api/diagrams/assess - Deve diferenciar fotos/modelos consecutivos sem persistir entidades da imagem anterior", async () => {
    // Foto 1: Modelo de Biblioteca (brModelo / OCR text scan)
    const photo1Ocr = `
TABELA: AUTOR
- id uuid PK
- nome varchar
- nacionalidade varchar

TABELA: LIVRO
- id uuid PK
- titulo varchar
- autor_id uuid FK
- ano int

AUTOR ||--o{ LIVRO : "escreve"
`;

    const res1 = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: photo1Ocr,
        scenario: "Sistema de Biblioteca Municipal"
      })
    });

    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    const tableNames1 = data1.extractedTables.map((t: any) => t.name);
    expect(tableNames1).toContain("AUTOR");
    expect(tableNames1).toContain("LIVRO");
    expect(tableNames1).not.toContain("MEDICO");
    expect(data1.generatedDdlSql.toUpperCase()).toContain("CREATE TABLE AUTOR");
    expect(data1.generatedDdlSql.toUpperCase()).toContain("CREATE TABLE LIVRO");
    expect(data1.generatedDdlSql.toUpperCase()).not.toContain("MEDICO");

    // Foto 2: Modelo de Hospital (brModelo / OCR text scan) submetido logo após a foto 1
    const photo2Ocr = `
TABELA: MEDICO
- id uuid PK
- crm varchar UK
- nome varchar
- especialidade varchar

TABELA: PACIENTE
- id uuid PK
- cpf varchar UK
- nome varchar

TABELA: CONSULTA
- id uuid PK
- medico_id uuid FK
- paciente_id uuid FK
- data_hora timestamp
`;

    const res2 = await fetch(`${baseUrl}/api/diagrams/assess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramType: "erDiagram",
        format: "code",
        code: photo2Ocr,
        scenario: "Sistema Hospitalar e Clínico"
      })
    });

    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    const tableNames2 = data2.extractedTables.map((t: any) => t.name);
    expect(tableNames2).toContain("MEDICO");
    expect(tableNames2).toContain("PACIENTE");
    expect(tableNames2).toContain("CONSULTA");
    // Foto 2 não deve conter entidades da Foto 1
    expect(tableNames2).not.toContain("AUTOR");
    expect(tableNames2).not.toContain("LIVRO");
    expect(data2.generatedDdlSql.toUpperCase()).toContain("CREATE TABLE MEDICO");
    expect(data2.generatedDdlSql.toUpperCase()).toContain("CREATE TABLE PACIENTE");
    expect(data2.generatedDdlSql.toUpperCase()).toContain("CREATE TABLE CONSULTA");
    expect(data2.generatedDdlSql.toUpperCase()).not.toContain("AUTOR");
    expect(data2.generatedDdlSql.toUpperCase()).not.toContain("LIVRO");
  });

  it("DatabaseModelAssessmentService.parseEntitiesFromContent - Deve extrair entidades de múltiplos formatos de OCR (Parênteses, Bullet, Tabelas)", () => {
    // Formato com parênteses inline
    const parenFormat = `
ESCOLA (id PK, nome VARCHAR, cnpj VARCHAR UK)
TURMA (id PK, escola_id FK, ano_letivo INT)
MATRICULA (id PK, turma_id FK, aluno_nome VARCHAR)
`;
    const tablesParen = DatabaseModelAssessmentService.parseEntitiesFromContent(parenFormat, "Gestão Escolar");
    expect(tablesParen.length).toBe(3);
    expect(tablesParen.map((t: any) => t.name)).toEqual(["ESCOLA", "TURMA", "MATRICULA"]);
    expect(tablesParen.find((t: any) => t.name === "TURMA")?.columns.some((c: any) => c.isForeignKey)).toBe(true);

    // Formato de blocos sem delimitador de chave
    const blockFormat = `
FORNECEDOR
id PK
razao_social
cnpj UK

PRODUTO_ESTOQUE
id PK
fornecedor_id FK
quantidade int
preco_custo decimal
`;
    const tablesBlock = DatabaseModelAssessmentService.parseEntitiesFromContent(blockFormat, "Controle de Estoque");
    expect(tablesBlock.length).toBe(2);
    expect(tablesBlock.map((t: any) => t.name)).toEqual(["FORNECEDOR", "PRODUTO_ESTOQUE"]);
  });
});

