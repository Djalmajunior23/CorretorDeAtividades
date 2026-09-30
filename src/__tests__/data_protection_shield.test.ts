import { describe, it, expect } from "vitest";
import { DataProtectionEngine } from "../security/DataProtectionEngine";
import { generateJwtToken, verifyJwtToken, verifyPassword, hashPassword } from "../utils/security";
import type { Request, Response } from "express";

function createMockReqRes() {
  let statusCode = 200;
  let jsonResponse: any = null;
  let nextCalled = false;

  const req: Partial<Request> = {
    method: "GET",
    url: "/api/test",
    params: {},
    body: {},
    query: {},
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
    isNextCalled: () => nextCalled,
  };
}

describe("Data Protection, DLP & Anti-Pentest Shield Suite", () => {
  describe("1. Data Loss Prevention (DLP) - Response Sanitization", () => {
    it("should strip passwords, password hashes, salts, and secrets from JSON responses", () => {
      const rawUserRecord = {
        id: "student_001",
        name: "Carlos Eduardo",
        email: "carlos@senai.br",
        password: "SuperSecretPassword123!",
        password_hash: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
        salt: "f7c3bc1d808e04732adf679965ccc34ca7ae3441",
        secret_key: "internal_api_secret_key_prod",
        jwt_secret: "my_master_jwt_secret",
        database_url: "postgres://admin:topsecret@cloud-db.internal:5432/main",
        metadata: {
          role: "ALUNO",
          internal_token_secret: "hidden_token_abc",
          grades: [85, 90, 95]
        }
      };

      const sanitized = DataProtectionEngine.deepSanitizeObject(rawUserRecord);

      expect(sanitized.id).toBe("student_001");
      expect(sanitized.name).toBe("Carlos Eduardo");
      expect(sanitized.email).toBe("carlos@senai.br");
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.password_hash).toBeUndefined();
      expect(sanitized.salt).toBeUndefined();
      expect(sanitized.secret_key).toBeUndefined();
      expect(sanitized.jwt_secret).toBeUndefined();
      expect(sanitized.database_url).toBeUndefined();
      expect(sanitized.metadata.role).toBe("ALUNO");
      expect(sanitized.metadata.internal_token_secret).toBeUndefined();
      expect(sanitized.metadata.grades).toEqual([85, 90, 95]);
    });

    it("should sanitize raw postgres database connection strings in arrays or nested objects", () => {
      const payload = {
        services: [
          { name: "analytics", uri: "postgres://user:pass@host:5432/analytics_db" },
          { name: "auth", uri: "https://auth.senai.br" }
        ]
      };

      const sanitized = DataProtectionEngine.deepSanitizeObject(payload);
      expect(sanitized.services[0].uri).toBe("[PROTECTED_DATABASE_RESOURCE]");
      expect(sanitized.services[1].uri).toBe("https://auth.senai.br");
    });
  });

  describe("2. Database Error Cloaking & Schema Shielding", () => {
    const errorMiddleware = DataProtectionEngine.errorCloakingMiddleware();

    it("should cloak PostgreSQL syntax errors and table schema details into a secure incident code", () => {
      const mock = createMockReqRes();
      const rawPostgresError = new Error(`relation "d_student_record" does not exist at character 15 in SELECT * FROM d_student_record`);

      errorMiddleware(rawPostgresError, mock.req, mock.res, mock.next);

      expect(mock.getStatusCode()).toBe(500);
      const json = mock.getJsonResponse();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Erro interno no processamento seguro");
      expect(json.error).not.toContain("d_student_record");
      expect(json.error).not.toContain("SELECT");
      expect(json.incidentCode).toMatch(/^SEC-/);
    });

    it("should cloak internal connection failure messages and stack traces", () => {
      const mock = createMockReqRes();
      const connectionError = new Error("connect ECONNREFUSED 10.0.0.5:5432 at Pool.connect");

      errorMiddleware(connectionError, mock.req, mock.res, mock.next);

      expect(mock.getStatusCode()).toBe(500);
      const json = mock.getJsonResponse();
      expect(json.error).not.toContain("ECONNREFUSED");
      expect(json.error).not.toContain("10.0.0.5:5432");
      expect(json.incidentCode).toBeDefined();
    });
  });

  describe("3. LGPD & PII Data Masking", () => {
    it("should mask CPF in compliance with LGPD requirements", () => {
      expect(DataProtectionEngine.maskCpf("123.456.789-00")).toBe("***.456.789-**");
      expect(DataProtectionEngine.maskCpf("12345678900")).toBe("***.456.789-**");
    });

    it("should mask email addresses preserving domain structure", () => {
      expect(DataProtectionEngine.maskEmail("djalma.junior@senai.br")).toBe("d***r@senai.br");
      expect(DataProtectionEngine.maskEmail("aluno@email.com")).toBe("a***o@email.com");
    });

    it("should mask phone numbers", () => {
      expect(DataProtectionEngine.maskPhone("31987654321")).toBe("(31) 9****-4321");
    });
  });

  describe("4. Field-Level AES-256-GCM Cryptographic Protection", () => {
    it("should encrypt and decrypt sensitive fields with authenticated encryption", () => {
      const sensitiveText = "Dados ultra-secretos de auditoria e avaliacao do SENAI";
      const encrypted = DataProtectionEngine.encryptField(sensitiveText);

      expect(encrypted).toContain(":");
      expect(encrypted).not.toBe(sensitiveText);

      const decrypted = DataProtectionEngine.decryptField(encrypted);
      expect(decrypted).toBe(sensitiveText);
    });

    it("should reject tampered cipher packages when Auth Tag verification fails", () => {
      const original = DataProtectionEngine.encryptField("Segredo Institucional");
      const parts = original.split(":");
      // Tamper ciphertext byte
      const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}ff`;

      const decrypted = DataProtectionEngine.decryptField(tampered);
      expect(decrypted).toBeNull();
    });
  });

  describe("5. Anti-IDOR / Broken Object Level Authorization Guard", () => {
    const ownershipGuard = DataProtectionEngine.enforceOwnershipOrRole(["PROFESSOR", "ADMIN"], "studentId");

    it("should permit professor or admin to access any student report", () => {
      const mock = createMockReqRes();
      (mock.req as any).user = { id: "prof_1", role: "PROFESSOR" };
      mock.req.params = { studentId: "student_99" };

      ownershipGuard(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
    });

    it("should permit student to access their own student report", () => {
      const mock = createMockReqRes();
      (mock.req as any).user = { id: "student_42", role: "ALUNO" };
      mock.req.params = { studentId: "student_42" };

      ownershipGuard(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(true);
    });

    it("should block student attempting to access another student's report (IDOR)", () => {
      const mock = createMockReqRes();
      (mock.req as any).user = { id: "student_42", role: "ALUNO" };
      mock.req.params = { studentId: "student_99" }; // Target belongs to someone else!

      ownershipGuard(mock.req, mock.res, mock.next);

      expect(mock.isNextCalled()).toBe(false);
      expect(mock.getStatusCode()).toBe(403);
      expect(mock.getJsonResponse().code).toBe("IDOR_ACCESS_DENIED");
    });
  });

  describe("6. Cryptographic Token & Backdoor Elimination", () => {
    it("should strictly reject any simulated or forged token prefix", () => {
      const fakeToken = "admin_jwt_token_simulated_hacker_bypass";
      const result = verifyJwtToken(fakeToken);

      expect(result.valid).toBe(false);
    });

    it("should verify valid HMAC-SHA256 tokens using constant-time comparison", () => {
      const user = { id: "prof_real", name: "Docente", email: "docente@senai.br", role: "PROFESSOR" };
      const token = generateJwtToken(user);
      const result = verifyJwtToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.id).toBe("prof_real");
    });
  });

  describe("7. Console Log Redactor", () => {
    it("should redact bearer tokens and database passwords from log strings", () => {
      const dirtyLog = 'User login successful with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... db: postgres://admin:superSecretPassword@db.neon.tech/main';
      const cleanLog = DataProtectionEngine.sanitizeLogString(dirtyLog);

      expect(cleanLog).toContain("Bearer [REDACTED_TOKEN]");
      expect(cleanLog).toContain("postgres://[REDACTED_USER]:[REDACTED_PASS]@[HOST]/[DB]");
      expect(cleanLog).not.toContain("superSecretPassword");
    });
  });
});
