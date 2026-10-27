import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ initialize: vi.fn(async () => {}) }));
vi.mock("../../server-apis-addon", () => ({
  setupTeacherAPIs: vi.fn(), initializeDatabase: vi.fn(), initializeTeacherSchema: mocks.initialize,
}));

beforeEach(() => { vi.resetModules(); mocks.initialize.mockReset(); mocks.initialize.mockResolvedValue(undefined); });

describe("Inicialização compartilhada entre servidor e funções serverless", () => {
  it("compartilha a migração entre requisições concorrentes", async () => {
    const { initializeApplicationDatabase } = await import("../../server");
    const first = initializeApplicationDatabase();
    const second = initializeApplicationDatabase();
    expect(first === second).toBe(true);
    await Promise.all([first, second]);
    expect(mocks.initialize).toHaveBeenCalledOnce();
  });

  it("permite nova tentativa após falha sem registrar prontidão", async () => {
    mocks.initialize.mockRejectedValueOnce(new Error("offline"));
    const { initializeApplicationDatabase } = await import("../../server");
    await expect(initializeApplicationDatabase()).rejects.toThrow("offline");
    await expect(initializeApplicationDatabase()).resolves.toBeUndefined();
    expect(mocks.initialize).toHaveBeenCalledTimes(2);
  });
});
