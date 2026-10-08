import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import { app } from "../../server";

describe("Djalma Junior - Multi-Role User Access Tests (Super Admin, Admin, Professor)", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 3001;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("1. Deve autenticar Djalma Junior como SUPER_ADMIN com sucesso", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "djalma.superadmin@codecheck.ai",
        password: "admin123"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe("Djalma Junior");
    expect(data.user.role).toBe("SUPER_ADMIN");

    // Test /api/auth/me validation
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.role).toBe("SUPER_ADMIN");
    expect(meData.name).toBe("Djalma Junior");
  });

  it("2. Deve autenticar Djalma Junior como ADMIN com sucesso", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "djalma.admin@codecheck.ai",
        password: "admin123"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe("Djalma Junior");
    expect(data.user.role).toBe("ADMIN");

    // Test /api/auth/me validation
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.role).toBe("ADMIN");
    expect(meData.name).toBe("Djalma Junior");
  });

  it("3. Deve autenticar Djalma Junior como PROFESSOR com sucesso", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "djalma.professor@codecheck.ai",
        password: "senha123"
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBe("Djalma Junior");
    expect(data.user.role).toBe("PROFESSOR");

    // Test /api/auth/me validation
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.role).toBe("PROFESSOR");
    expect(meData.name).toBe("Djalma Junior");
  });

  it("4. Deve rejeitar credenciais inválidas com status 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "djalma.admin@codecheck.ai",
        password: "senha_errada_123"
      })
    });

    expect(res.status).toBe(401);
  });
});
