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
});
