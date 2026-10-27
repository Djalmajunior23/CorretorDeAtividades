import { describe, expect, it, vi } from "vitest";
import { initializeDatabase, initializeTeacherSchema } from "../../server-apis-addon";

describe("Migrações seguras na inicialização", () => {
  it("não apaga registros acadêmicos ao inicializar ou repetir o schema", async () => {
    const query = vi.fn(async (_sql: string) => ({ rows: [] }));
    const pool = { query } as any;
    await initializeDatabase(pool);
    await initializeDatabase(pool);
    expect(query).toHaveBeenCalled();
    for (const [sql] of query.mock.calls) {
      expect(sql).not.toMatch(/\b(DELETE\s+FROM|TRUNCATE)\b/i);
    }
  });

  it("aguarda a criação de tabelas antes das migrações de colunas", async () => {
    const completed: string[] = [];
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("ALTER TABLE correction_vault")) {
        expect(completed.some(previous => previous.includes("CREATE TABLE IF NOT EXISTS correction_vault"))).toBe(true);
      }
      await Promise.resolve();
      completed.push(sql);
      return { rows: [] };
    });
    await initializeTeacherSchema(null, { query } as any);
    expect(completed.some(sql => sql.includes("ALTER TABLE correction_vault"))).toBe(true);
  });

  it("propaga falhas de migração para impedir prontidão falsa", async () => {
    const query = vi.fn().mockRejectedValue(new Error("database unavailable"));
    await expect(initializeTeacherSchema(null, { query } as any)).rejects.toThrow("database unavailable");
  });
});
