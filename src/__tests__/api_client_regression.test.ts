import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Credenciais e requisições do cliente HTTP", () => {
  let nativeFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "");
    nativeFetch = vi.fn(async () => new Response('{"ok":true}', {
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("window", { location: { href: "https://codecheck.test/dashboard" }, fetch: nativeFetch });
    vi.stubGlobal("localStorage", { getItem: () => "session-token" });
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("envia o token somente para os endpoints da aplicação", async () => {
    await import("../config/api");
    await window.fetch("/api/classes");
    expect(new Headers(nativeFetch.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer session-token");
    await window.fetch("https://external.test/api/upload");
    expect(nativeFetch.mock.calls[1][1]).toBeUndefined();
    await window.fetch("//external.test/auth/login");
    expect(nativeFetch.mock.calls[2][1]).toBeUndefined();
  });

  it("preserva autorização e cabeçalhos de um Request existente", async () => {
    await import("../config/api");
    const request = new Request("https://codecheck.test/api/classes", {
      headers: { Authorization: "Bearer explicit", "X-Custom": "kept" }
    });
    await window.fetch(request);
    const headers = new Headers(nativeFetch.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer explicit");
    expect(headers.get("X-Custom")).toBe("kept");
  });

  it("suporta base terminada em /api sem duplicar o caminho", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.test/api/");
    const { apiUrl, isTrustedApiUrl } = await import("../config/api");
    expect(apiUrl("/api/classes")).toBe("https://backend.test/api/classes");
    expect(isTrustedApiUrl("https://backend.test/api/classes")).toBe(true);
    expect(isTrustedApiUrl("https://backend.test.evil.test/api/classes")).toBe(false);
  });

  it("preserva Headers e deixa o navegador definir o boundary de upload", async () => {
    vi.stubGlobal("fetch", nativeFetch);
    const { apiFetch } = await import("../config/api");
    const body = new FormData();
    body.set("file", "example");
    await apiFetch("/api/upload", { method: "POST", body, headers: new Headers({ "X-Custom": "kept" }) });
    const headers = new Headers(nativeFetch.mock.calls[0][1]?.headers);
    expect(headers.get("X-Custom")).toBe("kept");
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("Authorization")).toBe("Bearer session-token");
  });

  it("continua funcionando quando o navegador bloqueia localStorage", async () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("SecurityError"); } });
    await import("../config/api");
    await expect(window.fetch("/api/classes")).resolves.toBeInstanceOf(Response);
    expect(nativeFetch).toHaveBeenCalledOnce();
  });
});
