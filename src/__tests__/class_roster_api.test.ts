import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import type { Pool } from "pg";
import { setupTeacherAPIs } from "../../server-apis-addon";

let server: Server | undefined;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server!.close(err => err ? reject(err) : resolve()));
    server = undefined;
  }
});

async function start(pool: Pool | null = null) {
  const app = express();
  app.use(express.json());
  setupTeacherAPIs(app, pool);
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server!.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing HTTP port");
  const base = `http://127.0.0.1:${address.port}`;
  return (path: string, body?: object) => fetch(base + path, body ? {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : undefined);
}

describe("Teacher class and student APIs", () => {
  it("keeps student counts and class filters consistent after enrollment", async () => {
    const request = await start();
    const a = await (await request("/api/classes", { name: "Turma A" })).json();
    const b = await (await request("/api/classes", { name: "Turma B" })).json();
    await request("/api/students", { name: "Aluno A", class_id: a.id, enrollment_code: "A001" });
    await request("/api/students", { name: "Aluno B", class_id: b.id, enrollment_code: "B001" });
    const classes = await (await request("/api/classes")).json();
    expect(classes.find((c: { id: string }) => c.id === a.id).students_count).toBe(1);
    const students = await (await request(`/api/students?class_id=${a.id}`)).json();
    expect(students.map((s: { name: string }) => s.name)).toEqual(["Aluno A"]);
  });

  it("rejects blank names instead of creating unusable records", async () => {
    const request = await start();
    expect((await request("/api/classes", { name: "  " })).status).toBe(400);
    expect((await request("/api/students", { name: "" })).status).toBe(400);
    expect(await (await request("/api/classes")).json()).toEqual([]);
    expect(await (await request("/api/students")).json()).toEqual([]);
  });

  it("distinguishes database outages from empty class and student lists", async () => {
    const pool = { query: vi.fn().mockRejectedValue(new Error("database unavailable")) } as unknown as Pool;
    const request = await start(pool);
    for (const path of ["/api/classes", "/api/students"]) {
      const res = await request(path);
      expect(res.status).toBe(503);
      expect((await res.json()).error).toContain("Não foi possível carregar");
    }
  });
});
