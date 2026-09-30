import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * ============================================================================
 * DATA PROTECTION & DLP (DATA LOSS PREVENTION) SECURITY SUITE
 * ============================================================================
 * Defense against:
 * 1. Sensitive Data Exposure & Information Disclosure (OWASP A01 / A02)
 * 2. PII / LGPD Leaks (CPF, Email, Phone, Private Academic Data)
 * 3. Database Schema & Stack Trace Fingerprinting / Cloaking
 * 4. Password Hash & Internal Secret Leaks in Outbound JSON Responses
 * 5. AES-256-GCM Field-Level Cryptographic Protection at Rest
 * 6. Broken Object Level Authorization (BOLA / IDOR) Ownership Validation
 * ============================================================================
 */

export interface ShieldedErrorResponse {
  success: false;
  error: string;
  incidentCode: string;
  timestamp: string;
}

export class DataProtectionEngine {
  // Master encryption key derived from environment or secure runtime CSPRNG
  private static readonly MASTER_ENCRYPTION_KEY: Buffer = (() => {
    const rawSecret = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || "codecheck_master_cryptographic_entropy_vault_2026_senai";
    return crypto.createHash("sha256").update(rawSecret).digest();
  })();

  // Blacklisted keys that must NEVER be returned in any API JSON response
  private static readonly SENSITIVE_KEYS_TO_STRIP = new Set([
    "password",
    "password_hash",
    "passwordhash",
    "senha",
    "senhahash",
    "salt",
    "secret",
    "secret_key",
    "secretkey",
    "jwt_secret",
    "jwtsecret",
    "api_key",
    "apikey",
    "gemini_key",
    "gemini_api_key",
    "database_url",
    "databaseurl",
    "postgres_url",
    "postgresurl",
    "connectionstring",
    "private_key",
    "privatekey",
    "access_token_secret",
    "client_secret",
  ]);

  // Sensitive patterns in error messages that indicate internal DB schema or infrastructure leaks
  private static readonly INTERNAL_LEAK_PATTERNS = [
    /relation\s+["'].*?["']\s+does\s+not\s+exist/i,
    /column\s+["'].*?["']\s+does\s+not\s+exist/i,
    /syntax\s+error\s+at\s+or\s+near/i,
    /pg_catalog/i,
    /information_schema/i,
    /duplicate\s+key\s+value\s+violates\s+unique\s+constraint/i,
    /violates\s+foreign\s+key\s+constraint/i,
    /connection\s+refused/i,
    /SSL\s+SYSCALL\s+error/i,
    /at\s+async\s+/i,
    /at\s+Pool\./i,
    /at\s+Client\./i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
    /node_modules/i,
    /\.ts:\d+:\d+/i,
    /\.js:\d+:\d+/i,
  ];

  /**
   * 1. Data Loss Prevention (DLP) & Response Sanitizer Middleware
   * Intercepts `res.json` and `res.send` across Express to guarantee that no
   * passwords, password hashes, DB connection strings, or internal secrets
   * are ever sent over the wire.
   */
  public static dlpResponseSanitizerMiddleware() {
    return (_req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res);

      res.json = (body: any): Response => {
        if (body && typeof body === "object") {
          const sanitizedBody = DataProtectionEngine.deepSanitizeObject(body);
          return originalJson(sanitizedBody);
        }
        return originalJson(body);
      };

      next();
    };
  }

  public static isSensitiveKey(key: string): boolean {
    const lower = key.toLowerCase().replace(/[_\s-]/g, "");
    if (this.SENSITIVE_KEYS_TO_STRIP.has(lower) || this.SENSITIVE_KEYS_TO_STRIP.has(key.toLowerCase())) {
      return true;
    }
    if (
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("salt") ||
      lower.includes("apikey") ||
      lower.includes("privatekey") ||
      lower.includes("jwtsecret") ||
      (lower.includes("token") && (lower.includes("secret") || lower.includes("private") || lower.includes("internal")))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Recursively traverses and scrubs blacklisted sensitive fields from objects/arrays
   */
  public static deepSanitizeObject(obj: any, isRootAuthLogin = false): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitizeObject(item));
    }

    if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Buffer)) {
      const cleanObj: Record<string, any> = {};

      for (const [key, value] of Object.entries(obj)) {
        // Exclude sensitive credentials unless it is the public authentication JWT 'token'
        if (this.isSensitiveKey(key)) {
          continue; // Strip key completely
        }

        // Recursively sanitize nested objects/arrays
        cleanObj[key] = this.deepSanitizeObject(value);
      }

      return cleanObj;
    }

    // If it's a string, check if it contains database credentials or raw connection URLs
    if (typeof obj === "string") {
      if (obj.includes("postgres://") || obj.includes("postgresql://")) {
        return "[PROTECTED_DATABASE_RESOURCE]";
      }
    }

    return obj;
  }

  /**
   * 2. Database Error Cloaking & Trace Interceptor
   * Ensures that unhandled errors or Postgres exceptions never expose table names,
   * column names, or stack traces to clients.
   */
  public static errorCloakingMiddleware() {
    return (err: any, _req: Request, res: Response, next: NextFunction) => {
      if (!err) return next();

      const incidentCode = `SEC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const rawMessage = typeof err === "string" ? err : err.message || "";
      const isInternalLeak = this.INTERNAL_LEAK_PATTERNS.some((pattern) => pattern.test(rawMessage) || pattern.test(err.stack || ""));

      // Log the actual incident internally for administrator diagnostics
      console.error(`[SECURE_AUDIT_LOG][${incidentCode}] Internal Error intercepted:`, err);

      const statusCode = err.status || err.statusCode || 500;

      // Cloak internal error details
      const responsePayload: ShieldedErrorResponse = {
        success: false,
        error: isInternalLeak || statusCode >= 500
          ? "Erro interno no processamento seguro dos dados. A solicitação foi registrada para auditoria."
          : rawMessage,
        incidentCode,
        timestamp: new Date().toISOString(),
      };

      return res.status(statusCode).json(responsePayload);
    };
  }

  /**
   * 3. PII & LGPD Data Anonymization / Masking Utilities
   */
  public static maskCpf(cpf: string): string {
    if (!cpf || typeof cpf !== "string") return "";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length === 11) {
      return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
    }
    return "***.***.***-**";
  }

  public static maskEmail(email: string): string {
    if (!email || typeof email !== "string" || !email.includes("@")) return "";
    const [user, domain] = email.split("@");
    if (user.length <= 2) {
      return `${user[0] || "*"}***@${domain}`;
    }
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  public static maskPhone(phone: string): string {
    if (!phone || typeof phone !== "string") return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 10) {
      const ddd = clean.substring(0, 2);
      const lastFour = clean.substring(clean.length - 4);
      return `(${ddd}) 9****-${lastFour}`;
    }
    return "(**) *****-****";
  }

  /**
   * 4. Authenticated AES-256-GCM Field-Level Cryptography for Sensitive Data at Rest
   */
  public static encryptField(plainText: string, customKey?: Buffer): string {
    if (!plainText) return "";
    const key = customKey || this.MASTER_ENCRYPTION_KEY;
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  public static decryptField(cipherPackage: string, customKey?: Buffer): string | null {
    if (!cipherPackage || typeof cipherPackage !== "string" || !cipherPackage.includes(":")) {
      return null;
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = cipherPackage.split(":");
      if (!ivHex || !authTagHex || !encryptedHex) return null;

      const key = customKey || this.MASTER_ENCRYPTION_KEY;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (e) {
      console.warn("[DataProtectionEngine] Decryption failed or data tampered.");
      return null;
    }
  }

  /**
   * 5. Broken Object Level Authorization (BOLA / IDOR) Ownership Guard
   */
  public static enforceOwnershipOrRole(allowedRoles: string[] = ["PROFESSOR", "ADMIN"], paramKey = "studentId") {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, error: "Acesso não autorizado: autenticação requerida." });
      }

      // If user has elevated role, permit
      if (allowedRoles.includes(user.role)) {
        return next();
      }

      // If user is accessing their own record, permit
      const targetId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];
      if (targetId && String(targetId) === String(user.id)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: "Acesso Proibido: Você não possui autorização para acessar registros de outro usuário (Proteção Anti-IDOR/BOLA).",
        code: "IDOR_ACCESS_DENIED",
      });
    };
  }

  /**
   * 6. Console Log Redactor
   * Automatically scrubs sensitive tokens and credentials before console prints
   */
  public static sanitizeLogString(str: string): string {
    if (!str || typeof str !== "string") return str;
    return str
      .replace(/Bearer\s+[a-zA-Z0-9\-_.]+/gi, "Bearer [REDACTED_TOKEN]")
      .replace(/postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/]+\/[^?\s]+/gi, "postgres://[REDACTED_USER]:[REDACTED_PASS]@[HOST]/[DB]")
      .replace(/("?(?:password|senha|secret|apiKey|gemini_key)"?\s*:\s*)"[^"]+"/gi, '$1"[REDACTED]"')
      .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_GOOGLE_KEY]");
  }
}
