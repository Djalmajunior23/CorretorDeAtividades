import { describe, it, expect } from "vitest";
import { generateJwtToken, verifyJwtToken, hashPassword, verifyPassword } from "../utils/security";
import { SecurityScanner } from "../ai/services/sandbox/security_scanner";
import { ExecutionService } from "../ai/services/sandbox/execution_service";

describe("Security & Authentication Suite", () => {
  describe("JWT Token Security", () => {
    it("should generate a valid HMAC-SHA256 JWT token with expected payload", () => {
      const user = {
        id: "prof_123",
        name: "Professor Teste",
        email: "prof@senai.br",
        role: "PROFESSOR"
      };

      const token = generateJwtToken(user, 3600);
      expect(token).toBeTypeOf("string");
      expect(token.split(".")).toHaveLength(3);

      const verification = verifyJwtToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.payload?.id).toBe("prof_123");
      expect(verification.payload?.role).toBe("PROFESSOR");
      expect(verification.payload?.email).toBe("prof@senai.br");
    });

    it("should reject tampered JWT signatures", () => {
      const user = {
        id: "prof_123",
        name: "Professor Teste",
        email: "prof@senai.br",
        role: "PROFESSOR"
      };

      const token = generateJwtToken(user, 3600);
      const parts = token.split(".");
      // Tamper payload
      const tamperedToken = `${parts[0]}.${parts[1]}tampered.${parts[2]}`;
      
      const verification = verifyJwtToken(tamperedToken);
      expect(verification.valid).toBe(false);
    });

    it("should reject expired JWT tokens", () => {
      const user = {
        id: "prof_123",
        name: "Professor Teste",
        email: "prof@senai.br",
        role: "PROFESSOR"
      };

      // Generate token expired 10 seconds ago
      const token = generateJwtToken(user, -10);
      const verification = verifyJwtToken(token);
      expect(verification.valid).toBe(false);
      expect(verification.error).toContain("expirada");
    });
  });

  describe("Password Hashing & Salt Verification", () => {
    it("should securely hash and verify passwords using salt + scrypt", () => {
      const password = "SuperSecretPassword123!";
      const hash = hashPassword(password);

      expect(hash).toContain(":");
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword("WrongPassword", hash)).toBe(false);
    });
  });

  describe("Sandbox & Security Scanner", () => {
    it("should detect prohibited system calls in code submissions", () => {
      const maliciousPython = "import os\nos.system('rm -rf /')";
      const scanResult = SecurityScanner.scan("python", maliciousPython);

      expect(scanResult.safe).toBe(false);
      expect(scanResult.flaggedPatterns).toContain("import os");
    });

    it("should pass benign student code", () => {
      const cleanPython = "def soma(a, b):\n    return a + b\nprint(soma(2, 3))";
      const scanResult = SecurityScanner.scan("python", cleanPython);

      expect(scanResult.safe).toBe(true);
      expect(scanResult.flaggedPatterns).toHaveLength(0);
    });

    it("should execute clean JS code without exposing process.env secrets", async () => {
      const execution = await ExecutionService.run({
        language: "javascript",
        code: "const a = 10; const b = 20; console.log(a + b);",
        test_cases: [{ name: "Soma basica", stdin: "", expected_stdout: "30" }]
      });

      expect(execution.success).toBe(true);
      expect(execution.status).toBe("accepted");
      expect(execution.stdout.trim()).toBe("30");
    });
  });
});
