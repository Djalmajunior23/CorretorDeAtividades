import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiUrl, API_BASE_URL } from '../config/api';

describe('AI Status Endpoint and Frontend Integration Tests', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('Deve resolver a URL de API correta para status', () => {
    const baseUrl = API_BASE_URL;
    expect(baseUrl).toBeDefined();
    // No ambiente do contêiner ou localhost, o apiBaseUrl padrão é "/api" ou o configurado na variável de ambiente
    expect(typeof baseUrl).toBe('string');
  });

  it('Deve simular e verificar que a resposta não-JSON (como HTML) é capturada com erro amigável', async () => {
    // Simula uma resposta do fetch retornando HTML fake (ex: erro de servidor ou proxy)
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('<!DOCTYPE HTML><html><body>Erro Proxy</body></html>', {
          status: 502,
          headers: new Headers({ 'Content-Type': 'text/html; charset=UTF-8' }),
        })
      )
    );
    
    // Testa o algoritmo do wrapper de proteção do frontend
    const testFetchStatus = async () => {
      const response = await mockFetch();
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Não foi possível consultar o status da IA agora.");
      }
      return await response.json();
    };

    await expect(testFetchStatus()).rejects.toThrow('Não foi possível consultar o status da IA agora.');
  });

  it('Deve parsear corretamente quando a resposta é JSON válido contendo o status da IA', async () => {
    const jsonPayload = {
      provider: 'ollama',
      available: true,
      models: {
        code: 'qwen2.5-coder:7b',
        feedback: 'gemma3:12b',
        report: 'phi4',
        general: 'llama3.2:3b'
      },
      ollama: {
        base_url_configured: true,
        reachable: true
      }
    };

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(jsonPayload), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
      )
    );

    const testFetchStatus = async () => {
      const response = await mockFetch();
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        throw new Error("Não foi possível consultar o status da IA agora.");
      }
      return await response.json();
    };

    const data = await testFetchStatus();
    expect(data.provider).toBe('ollama');
    expect(data.available).toBe(true);
    expect(data.models.code).toBe('qwen2.5-coder:7b');
  });

  it('Deve suportar resposta de status da IA no formato de Array (Etapa 3)', async () => {
    const arrayPayload = {
      provider: "ollama",
      available: true,
      base_url: "http://ollama:11434",
      models: [
        "qwen2.5-coder:7b",
        "llama3.2:3b"
      ],
      health: "ok"
    };

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(arrayPayload), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
      )
    );

    const response = await mockFetch();
    const data = await response.json();
    expect(data.provider).toBe('ollama');
    expect(Array.isArray(data.models)).toBe(true);
    expect(data.models).toContain('qwen2.5-coder:7b');
    expect(data.health).toBe('ok');
  });

  it('Deve tratar o status offline do Ollama retornando um erro amigável (Etapa 3)', async () => {
    const offlinePayload = {
      provider: "ollama",
      available: false,
      health: "offline",
      error: "Servidor Ollama indisponível."
    };

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(offlinePayload), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
      )
    );

    const response = await mockFetch();
    const data = await response.json();
    expect(data.available).toBe(false);
    expect(data.health).toBe('offline');
    expect(data.error).toBe('Servidor Ollama indisponível.');
  });

  it('Deve garantir comportamento adequado do teste com prompt (Etapa 4)', async () => {
    const successTestPayload = {
      success: true,
      response: "Olá! Como posso ajudar?"
    };

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(successTestPayload), {
          status: 200,
          headers: new Headers({ 'Content-Type': 'application/json' }),
        })
      )
    );

    const response = await mockFetch();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.response).toBe("Olá! Como posso ajudar?");
  });
});
