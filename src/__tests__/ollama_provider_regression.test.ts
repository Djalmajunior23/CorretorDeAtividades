import { createServer, RequestListener } from "node:http";
import { describe, expect, it } from "vitest";
import { OllamaProvider } from "../ai/providers/OllamaProvider";

async function withServer(handler: RequestListener, test: (url: string) => Promise<void>) {
  const server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  try { await test(`http://127.0.0.1:${address.port}`); }
  finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("Contrato HTTP do provedor Ollama (servidor de teste)", () => {
  it("não reutiliza uma falha de autenticação para outra credencial", async () => {
    await withServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.headers.authorization !== "Bearer configured") { res.writeHead(401); res.end("{}"); }
      else res.end(JSON.stringify({ models: [{ name: "test-model" }] }));
    }, async baseUrl => {
      const bad = new OllamaProvider({ provider: "ollama", model: "test-model", baseUrl });
      const good = new OllamaProvider({ provider: "ollama", model: "test-model", baseUrl, apiKey: "configured" });
      expect(await bad.isAvailable()).toBe(false);
      expect(await good.isAvailable()).toBe(true);
      expect(await OllamaProvider.listModels(baseUrl, "configured")).toEqual(["test-model"]);
    });
  });

  it("não considera HTML de um proxy como Ollama disponível", async () => {
    await withServer((_req, res) => res.end("<html>proxy</html>"), async baseUrl => {
      expect(await new OllamaProvider({ provider: "ollama", model: "test", baseUrl }).isAvailable()).toBe(false);
    });
  });

  it("traduz limite de tokens e separa timeout das opções do modelo", async () => {
    let payload: any;
    await withServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/api/tags") { res.end('{"models":[]}'); return; }
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", () => {
        payload = JSON.parse(body);
        res.end(JSON.stringify({ response: '```json\n{"ok":true}\n```' }));
      });
    }, async baseUrl => {
      const provider = new OllamaProvider({ provider: "ollama", model: "test", baseUrl });
      expect(await provider.generateStructured("prompt", {}, { timeout: 1000, max_tokens: 200, temperature: 0.1 }))
        .toEqual({ ok: true });
      expect(payload.options).toEqual({ num_predict: 200, temperature: 0.1 });
      expect(payload.format).toBe("json");
    });
  });

  it("rejeita respostas vazias sem apresentá-las como geração bem-sucedida", async () => {
    await withServer((req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(req.url === "/api/tags" ? '{"models":[]}' : '{"response":""}');
    }, async baseUrl => {
      const provider = new OllamaProvider({ provider: "ollama", model: "test", baseUrl });
      await expect(provider.generateContent("prompt")).rejects.toThrow("Resposta vazia");
    });
  });

  it("rejeita URLs com credenciais embutidas", () => {
    expect(() => new OllamaProvider({ provider: "ollama", model: "test", baseUrl: "https://user:password@example.test" }))
      .toThrow("sem credenciais embutidas");
  });
});
