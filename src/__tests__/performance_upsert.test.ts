import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import { setupTeacherAPIs } from "../../server-apis-addon";

// Mock PostgreSQL pool
const mockQuery = vi.fn().mockImplementation((_sql?: string, _params?: any[]) => {
  return Promise.resolve({ rows: [] });
});
const mockConnect = vi.fn();
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockPool: any = {
  query: mockQuery,
  connect: mockConnect,
  on: vi.fn(),
};

describe("Performance UPSERT & Batch Operations Suite", () => {
  let app: express.Express;
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
    mockClient.query.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO d_student_grades")) {
        return {
          rows: [
            {
              id: "grade-uuid-123",
              inserted: true,
            },
          ],
        };
      }
      return { rows: [] };
    });

    app = express();
    app.use(express.json());
    setupTeacherAPIs(app, mockPool);

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

  describe("POST /api/grades/update (Atomic Batch UPSERT)", () => {
    it("Deve rejeitar requisição sem array de notas", async () => {
      const res = await fetch(`${baseUrl}/api/grades/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades: "invalid" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("array 'grades'");
    });

    it("Deve processar array vazio retornando sucesso imediato", async () => {
      const res = await fetch(`${baseUrl}/api/grades/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades: [] }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.results).toEqual([]);
    });

    it("Deve executar transação atômica BEGIN ... COMMIT e batch UPSERT para múltiplas notas", async () => {
      const payload = {
        grades: [
          {
            student_id: "student-1",
            class_id: "class-a",
            activity_name: "Atividade 1",
            grade: 9.5,
            feedback: "Excelente raciocínio algorítmico",
          },
          {
            student_id: "student-2",
            class_id: "class-a",
            activity_name: "Atividade 1",
            grade: 8.0,
            feedback: "Bom código, atenção aos comentários",
          },
        ],
      };

      const res = await fetch(`${baseUrl}/api/grades/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
      expect(mockConnect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("Deve realizar ROLLBACK em caso de erro na transação", async () => {
      mockClient.query.mockImplementation(async (sql: string) => {
        if (sql === "BEGIN") return { rows: [] };
        if (sql.includes("INSERT INTO d_student_grades")) {
          throw new Error("DB Constraint Violation");
        }
        if (sql === "ROLLBACK") return { rows: [] };
        return { rows: [] };
      });

      const res = await fetch(`${baseUrl}/api/grades/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grades: [
            {
              student_id: "student-fail",
              class_id: "class-a",
              activity_name: "Atividade Erro",
              grade: 5.0,
            },
          ],
        }),
      });

      expect(res.status).toBe(500);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("POST /api/grades (Atomic Single UPSERT)", () => {
    it("Deve rejeitar inserção de nota com campos obrigatórios ausentes", async () => {
      const res = await fetch(`${baseUrl}/api/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: 10 }),
      });

      expect(res.status).toBe(400);
    });

    it("Deve executar UPSERT atômico com ON CONFLICT", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "grade-single-uuid", inserted: true }],
      });

      const res = await fetch(`${baseUrl}/api/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: "student-10",
          class_id: "class-b",
          activity_name: "Prova Semestral",
          grade: 10.0,
          feedback: "Gabarito perfeito",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.id).toBe("grade-single-uuid");
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe("GET & POST /api/diagrams (Diagram Assessment Engine)", () => {
    it("GET /api/diagrams/templates - Deve listar os templates pedagógicos de DER e UML", async () => {
      const res = await fetch(`${baseUrl}/api/diagrams/templates`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("sampleCode");
    });

    it("POST /api/diagrams/generate-reference - Deve gerar referência com base no cenário", async () => {
      const res = await fetch(`${baseUrl}/api/diagrams/generate-reference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "Crie um banco para controle de pedidos de e-commerce com clientes, pedidos e itens.",
          diagramType: "erDiagram",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.referenceMermaid).toContain("erDiagram");
    });

    it("POST /api/diagrams/assess - Deve avaliar modelo relacional identificando conformidade 3NF", async () => {
      const res = await fetch(`${baseUrl}/api/diagrams/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagramType: "erDiagram",
          code: `erDiagram
            CLIENTE ||--o{ PEDIDO : "realiza"
            CLIENTE {
              int id PK
              string nome
              string cpf
            }
            PEDIDO {
              int id PK
              int cliente_id FK
              date data
              decimal total
            }`,
          scenario: "Modelagem de vendas",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty("totalGrade");
      expect(data).toHaveProperty("rubrics");
      expect(data).toHaveProperty("normalizationNotes");
    });
  });
});
