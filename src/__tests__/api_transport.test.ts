import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function setup() {
  const nativeFetch = vi.fn().mockResolvedValue(new Response('{"ok":true}', {
    headers: { "Content-Type": "application/json" },
  }));
  vi.stubGlobal("localStorage", { getItem: () => "session-token" });
  vi.stubGlobal("window", { location: { origin: "https://school.example" }, fetch: nativeFetch });
  const api = await import("../config/api");
  return { api, nativeFetch };
}

describe("API authentication boundaries", () => {
  it("injects authentication for the application API without leaking it to other hosts", async () => {
    const { nativeFetch } = await setup();
    await window.fetch("/api/classes");
    expect(new Headers(nativeFetch.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer session-token");
    await window.fetch("https://external.example/api/classes");
    expect(nativeFetch.mock.calls[1][1]?.headers).toBeUndefined();
    await window.fetch("https://school.example/image?next=/api/classes");
    expect(nativeFetch.mock.calls[2][1]?.headers).toBeUndefined();
  });

  it("preserves explicit authentication and Request headers", async () => {
    const { nativeFetch } = await setup();
    await window.fetch(new Request("https://school.example/api/classes", {
      headers: { Authorization: "Bearer explicit", "X-Custom": "retained" },
    }));
    const headers = new Headers(nativeFetch.mock.calls[0][1].headers);
    expect(headers.get("Authorization")).toBe("Bearer explicit");
    expect(headers.get("X-Custom")).toBe("retained");
  });

  it("apiFetch accepts Headers and leaves multipart content types to the browser", async () => {
    const { api, nativeFetch } = await setup();
    vi.stubGlobal("fetch", nativeFetch);
    const form = new FormData();
    form.append("name", "Turma A");
    await api.apiFetch("/api/classes", {
      method: "POST", body: form, headers: new Headers({ "X-Custom": "retained" }),
    });
    const headers = new Headers(nativeFetch.mock.calls[0][1].headers);
    expect(headers.get("X-Custom")).toBe("retained");
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("Authorization")).toBe("Bearer session-token");
  });
});
