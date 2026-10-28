import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { generateJwtToken, verifyJwtToken, verifyPassword } from "../utils/security";
import { app } from "../../server";

const user = { id: "regression", name: "Test", email: "test@example.test", role: "ALUNO" };

describe("Validação de autenticação", () => {
  it("rejeita tokens no instante da expiração", () => {
    expect(verifyJwtToken(generateJwtToken(user, 0)).valid).toBe(false);
  });

  it("rejeita sessão sem identidade válida", () => {
    expect(verifyJwtToken(generateJwtToken({ ...user, id: "" })).valid).toBe(false);
  });

  it("rejeita tokens forjados com o segredo público antigo", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ ...user, role: "SUPER_ADMIN", exp: 9999999999 })).toString("base64url");
    const signature = crypto.createHmac("sha256", "codecheck_secure_academic_salt_key_2026_senai")
      .update(`${header}.${payload}`).digest("base64url");
    expect(verifyJwtToken(`${header}.${payload}.${signature}`).valid).toBe(false);
  });

  it("não lança exceção com senhas de tipos inválidos", () => {
    expect(verifyPassword({} as string, "legacy")).toBe(false);
  });

  it.each(["/api/classes", "/api/questions"])("exige autenticação para o catálogo %s", async path => {
    const server = app.listen(0);
    try {
      await new Promise<void>(resolve => server.once("listening", resolve));
      const address = server.address() as { port: number };
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      expect(response.status).toBe(401);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });

  it.each(["/api/classes", "/api/students", "/api/questions", "/api/grades/update"])("impede que alunos alterem %s", async path => {
    const server = app.listen(0);
    try {
      await new Promise<void>(resolve => server.once("listening", resolve));
      const address = server.address() as { port: number };
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
        method: "POST", headers: { Authorization: `Bearer ${generateJwtToken(user)}`, "Content-Type": "application/json" },
        body: "{}"
      });
      expect(response.status).toBe(403);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });

  it("retorna 400 para senha enviada como objeto, sem derrubar o servidor", async () => {
    const server = app.listen(0);
    try {
      await new Promise<void>(resolve => server.once("listening", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Porta indisponível");
      const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@codecheck.ai", password: {} })
      });
      expect(response.status).toBe(400);
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
