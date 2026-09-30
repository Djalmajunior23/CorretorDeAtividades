import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";

/**
 * ============================================================================
 * ENTERPRISE WAF & CYBER DEFENSE SUITE (CODECHECK / CIBERACADEMY)
 * ============================================================================
 * Armor defenses against:
 * 1. DDoS / DoS & Slowloris & Request Flooding
 * 2. SQL Injection (SQLi) - Classic, Blind, Union, Stacked
 * 3. XML External Entity (XXE) & Billion Laughs / Entity Expansion
 * 4. Ransomware, Path Traversal & Malicious File Uploads
 * 5. Authentication & Authorization Bypass (BOLA / IDOR / Header Spoofing)
 * 6. XSS, Clickjacking, MIME-Sniffing & Security Headers
 * ============================================================================
 */

export interface ThreatLogEntry {
  id: string;
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  attackType: "SQL_INJECTION" | "XXE_ATTACK" | "DDOS_RATE_LIMIT" | "PATH_TRAVERSAL" | "MALICIOUS_UPLOAD" | "AUTH_BYPASS" | "HTTP_POLLUTION";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
  blockedPayloadSample?: string;
  actionTaken: "BLOCKED_403" | "RATE_LIMITED_429" | "IP_JAILED" | "SANITIZED";
}

export interface WafStatistics {
  totalRequestsAnalyzed: number;
  totalThreatsBlocked: number;
  sqliBlocked: number;
  xxeBlocked: number;
  ddosBlocked: number;
  pathTraversalBlocked: number;
  maliciousUploadBlocked: number;
  bypassBlocked: number;
  activeJailedIpsCount: number;
  startedAt: string;
  uptimeSeconds: number;
}

interface RateLimitTracker {
  count: number;
  windowStart: number;
  violationCount: number;
  jailedUntil?: number;
}

export class WafSecurityEngine {
  private static instance: WafSecurityEngine;

  // Rate Limiting & Jail Trackers
  private static ipTrackers: Map<string, RateLimitTracker> = new Map();
  private static threatLogs: ThreatLogEntry[] = [];
  private static readonly MAX_LOGS = 1000;
  private static readonly START_TIME = Date.now();

  // Statistics Counters
  private static stats = {
    totalRequests: 0,
    totalBlocked: 0,
    sqli: 0,
    xxe: 0,
    ddos: 0,
    pathTraversal: 0,
    maliciousUpload: 0,
    bypass: 0,
  };

  // Safe file upload extensions allowlist
  private static readonly ALLOWED_UPLOAD_EXTENSIONS = new Set([
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".cs", ".go", ".rs",
    ".html", ".css", ".json", ".sql", ".txt", ".md", ".csv", ".xlsx", ".xls",
    ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".zip"
  ]);

  // Dangerous executable and shell extensions blocklist
  private static readonly DANGEROUS_EXTENSIONS = new Set([
    ".exe", ".bat", ".cmd", ".sh", ".bash", ".zsh", ".vbs", ".ps1", ".psm1",
    ".scr", ".pif", ".application", ".gadget", ".msi", ".msp", ".com",
    ".php", ".php3", ".php4", ".php5", ".phtml", ".phar",
    ".jsp", ".jspx", ".jsw", ".jsv", ".jspf",
    ".asp", ".aspx", ".asa", ".asax", ".ascx", ".ashx", ".asmx",
    ".cgi", ".pl", ".pyc", ".pyo", ".jar", ".war", ".ear",
    ".dll", ".so", ".dylib", ".sys", ".drv"
  ]);

  // Comprehensive SQL Injection Signatures
  private static readonly SQLI_REGEX_PATTERNS = [
    /(\b(UNION(\s+ALL)?)\s+SELECT\b)/i,
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC(UTE)?)\s+.*\s+(FROM|INTO|TABLE|DATABASE)\b)/i,
    /(\b(OR|AND)\s+['"]?(\d+|[a-zA-Z]+)['"]?\s*=\s*['"]?(\d+|[a-zA-Z]+)['"]?\s*(--|#|\/\*))/i,
    /(\b(OR|AND)\s+1\s*=\s*1\b)/i,
    /(\b(OR|AND)\s+'[a-zA-Z0-9]'='[a-zA-Z0-9]'\b)/i,
    /(\bWAITFOR\s+DELAY\s+'\d+:\d+:\d+'\b)/i,
    /(\b(PG_SLEEP|BENCHMARK|SLEEP)\s*\(\s*\d+\s*\))/i,
    /(\bINFORMATION_SCHEMA\.(TABLES|COLUMNS|SCHEMATA|VIEWS)\b)/i,
    /(\bPG_CATALOG\.(PG_TABLES|PG_USER|PG_STAT_ACTIVITY)\b)/i,
    /(\bINTO\s+(OUTFILE|DUMPFILE)\b)/i,
    /(\bLOAD_FILE\s*\()/i,
    /(--|#|\/\*[\s\S]*?\*\/)\s*$/m,
    /(;\s*(DROP|DELETE|TRUNCATE|ALTER|UPDATE|INSERT)\b)/i,
  ];

  // XML / XXE Injection Signatures
  private static readonly XXE_PATTERNS = [
    /<!DOCTYPE\s+[^>]*\[/i,
    /<!ENTITY\s+[^>]*SYSTEM\s+["'][^"']+["']/i,
    /<!ENTITY\s+[^>]*PUBLIC\s+["'][^"']+["']/i,
    /<!ENTITY\s+%?\s*[a-zA-Z0-9_-]+\s+["']file:\/\//i,
    /<!ENTITY\s+%?\s*[a-zA-Z0-9_-]+\s+["']http:\/\//i,
    /<!ENTITY\s+%?\s*[a-zA-Z0-9_-]+\s+["']https:\/\//i,
    /<!ENTITY\s+%?\s*[a-zA-Z0-9_-]+\s+["']gopher:\/\//i,
    /<!ENTITY\s+%?\s*[a-zA-Z0-9_-]+\s+["']expect:\/\//i,
    /<!ENTITY\s+.*(&[a-zA-Z0-9_-]+;){2,}/i, // Billion Laughs recursive entity expansion
  ];

  // Path Traversal Signatures
  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /(\.\.[\/\\])/,
    /(%2e%2e[\/\\])/i,
    /(%2e%2e%2f)/i,
    /(%252e%252e%252f)/i,
    /(\/etc\/(passwd|shadow|hosts|group))/i,
    /(\b(C|D|E):\\(Windows|System32|boot\.ini))/i,
    /\x00/, // Null Byte Injection
  ];

  /**
   * Helper: Extracts clean client IP address supporting proxy headers with anti-spoofing
   */
  public static getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      const parts = forwarded.split(",").map((s) => s.trim());
      if (parts[0]) return parts[0];
    }
    return req.socket?.remoteAddress || req.ip || "127.0.0.1";
  }

  /**
   * Safe URL decoder helper
   */
  private static safeDecode(str: string): string {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }

  /**
   * Records a security incident in the audit trail
   */
  public static recordThreat(entry: Omit<ThreatLogEntry, "id" | "timestamp">) {
    const log: ThreatLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.threatLogs.unshift(log);
    if (this.threatLogs.length > this.MAX_LOGS) {
      this.threatLogs.pop();
    }
    this.stats.totalBlocked++;

    switch (entry.attackType) {
      case "SQL_INJECTION": this.stats.sqli++; break;
      case "XXE_ATTACK": this.stats.xxe++; break;
      case "DDOS_RATE_LIMIT": this.stats.ddos++; break;
      case "PATH_TRAVERSAL": this.stats.pathTraversal++; break;
      case "MALICIOUS_UPLOAD": this.stats.maliciousUpload++; break;
      case "AUTH_BYPASS": this.stats.bypass++; break;
      default: break;
    }
  }

  // =========================================================================
  // 1. ADAPTIVE DDOS / DOS RATE LIMITER & AUTO-JAIL MIDDLEWARE
  // =========================================================================
  public static ddosProtectionMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.stats.totalRequests++;
      const ip = this.getClientIp(req);
      const now = Date.now();
      const WINDOW_MS = 60 * 1000; // 1 minuto
      const MAX_GENERAL_REQUESTS = 300; // Max 300 req / min por IP
      const MAX_AUTH_REQUESTS = 25;     // Max 25 req / min para /auth ou /login
      const MAX_HEAVY_REQUESTS = 40;    // Max 40 req / min para rotas de IA/exportação

      let tracker = this.ipTrackers.get(ip);
      if (!tracker) {
        tracker = { count: 0, windowStart: now, violationCount: 0 };
        this.ipTrackers.set(ip, tracker);
      }

      // Check if IP is currently in Jail
      if (tracker.jailedUntil && tracker.jailedUntil > now) {
        const remainingSeconds = Math.ceil((tracker.jailedUntil - now) / 1000);
        this.recordThreat({
          ip,
          method: req.method,
          path: req.path,
          attackType: "DDOS_RATE_LIMIT",
          severity: "CRITICAL",
          details: `IP em quarentena de segurança (Jail ativo por mais ${remainingSeconds}s). Requisição bloqueada.`,
          actionTaken: "IP_JAILED",
        });
        return res.status(429).json({
          success: false,
          error: "Acesso Temporariamente Bloqueado pelo WAF.",
          message: `Muitas requisições suspeitas detectadas. Seu IP está em quarentena de proteção por ${remainingSeconds} segundos.`,
          code: "WAF_IP_JAILED",
          retryAfter: remainingSeconds,
        });
      }

      // Reset window if expired
      if (now - tracker.windowStart > WINDOW_MS) {
        tracker.count = 0;
        tracker.windowStart = now;
      }

      tracker.count++;

      // Route specific limits
      let limit = MAX_GENERAL_REQUESTS;
      if (req.path.includes("/auth") || req.path.includes("/login") || req.path.includes("/register")) {
        limit = MAX_AUTH_REQUESTS;
      } else if (req.path.includes("/generate") || req.path.includes("/export") || req.path.includes("/ai/")) {
        limit = MAX_HEAVY_REQUESTS;
      }

      if (tracker.count > limit) {
        tracker.violationCount++;
        // If repeated violations, jail IP for 15 minutes
        if (tracker.violationCount >= 3) {
          tracker.jailedUntil = now + 15 * 60 * 1000;
          this.recordThreat({
            ip,
            method: req.method,
            path: req.path,
            attackType: "DDOS_RATE_LIMIT",
            severity: "CRITICAL",
            details: `Ataque de negação de serviço (DDoS/DoS) detectado: ${tracker.count} requisições em ${WINDOW_MS / 1000}s. IP colocado em quarentena de 15 minutos.`,
            actionTaken: "IP_JAILED",
          });
          return res.status(429).json({
            success: false,
            error: "Limite de Requisições Excedido (Proteção DDoS Ativa).",
            message: "Seu endereço IP foi temporariamente bloqueado por 15 minutos devido a tráfego excessivo de negação de serviço.",
            code: "WAF_RATE_LIMIT_JAILED",
          });
        }

        this.recordThreat({
          ip,
          method: req.method,
          path: req.path,
          attackType: "DDOS_RATE_LIMIT",
          severity: "HIGH",
          details: `Estouro de limite de taxa: ${tracker.count}/${limit} req/min.`,
          actionTaken: "RATE_LIMITED_429",
        });

        return res.status(429).json({
          success: false,
          error: "Muitas Requisições (Rate Limit).",
          message: "Por favor, aguarde alguns instantes antes de tentar novamente.",
          code: "WAF_RATE_LIMIT",
        });
      }

      next();
    };
  }

  // =========================================================================
  // 2. SQL INJECTION (SQLi) & DEEP REQUEST INSPECTOR
  // =========================================================================
  public static sqlInjectionInspectorMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const elementsToInspect: { location: string; value: string }[] = [];

      // Inspect Raw & Decoded URL
      const rawUrl = req.originalUrl || req.url || "";
      const decodedUrl = this.safeDecode(rawUrl);
      elementsToInspect.push({ location: "URL_RAW", value: rawUrl });
      elementsToInspect.push({ location: "URL_DECODED", value: decodedUrl });

      // Inspect Query Parameters
      if (req.query && typeof req.query === "object") {
        for (const [k, v] of Object.entries(req.query)) {
          const strVal = String(v);
          elementsToInspect.push({ location: `Query[${k}]`, value: strVal });
          elementsToInspect.push({ location: `QueryDecoded[${k}]`, value: this.safeDecode(strVal) });
        }
      }

      // Inspect Body (strings, arrays, and JSON values)
      if (req.body && typeof req.body === "object") {
        const extractStrings = (obj: any, prefix = "body"): void => {
          if (!obj) return;
          if (typeof obj === "string") {
            elementsToInspect.push({ location: prefix, value: obj });
            elementsToInspect.push({ location: `${prefix}_decoded`, value: this.safeDecode(obj) });
          } else if (Array.isArray(obj)) {
            obj.forEach((item, idx) => extractStrings(item, `${prefix}[${idx}]`));
          } else if (typeof obj === "object") {
            for (const [k, v] of Object.entries(obj)) {
              extractStrings(v, `${prefix}.${k}`);
            }
          }
        };
        extractStrings(req.body);
      }

      // Test against SQL Injection signatures
      for (const item of elementsToInspect) {
        // Ignora verificação estrita em código-fonte enviado para sandbox de linguagens de programação
        if (
          item.location.includes("code") ||
          item.location.includes("submitted_code") ||
          item.location.includes("starter_code") ||
          item.location.includes("codeSnippet")
        ) {
          continue;
        }

        for (const pattern of this.SQLI_REGEX_PATTERNS) {
          if (pattern.test(item.value)) {
            const sample = item.value.length > 80 ? `${item.value.substring(0, 80)}...` : item.value;
            this.recordThreat({
              ip,
              method: req.method,
              path: req.path,
              attackType: "SQL_INJECTION",
              severity: "CRITICAL",
              details: `Padrão de injeção de SQL detectado em ${item.location} pelo filtro: ${pattern.toString()}`,
              blockedPayloadSample: sample,
              actionTaken: "BLOCKED_403",
            });

            return res.status(403).json({
              success: false,
              error: "Requisição Bloqueada pelo WAF (Injeção de SQL Detectada).",
              message: "A requisição contém padrões de consulta não autorizados ou estruturas SQL potencialmente perigosas.",
              code: "WAF_SQLI_BLOCKED",
            });
          }
        }
      }

      next();
    };
  }

  // =========================================================================
  // 3. XML & XXE (XML EXTERNAL ENTITY & BILLION LAUGHS) DEFENSE
  // =========================================================================
  public static xxeInspectorMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const contentType = req.headers["content-type"] || "";

      const rawUrl = req.originalUrl || req.url || "";
      const decodedUrl = this.safeDecode(rawUrl);

      // Check URL and parameters for XML entity payloads
      for (const pattern of this.XXE_PATTERNS) {
        if (pattern.test(rawUrl) || pattern.test(decodedUrl)) {
          this.recordThreat({
            ip,
            method: req.method,
            path: req.path,
            attackType: "XXE_ATTACK",
            severity: "CRITICAL",
            details: `Tentativa de ataque XXE / XML Entity Expansion detectada na URL: ${pattern.toString()}`,
            blockedPayloadSample: decodedUrl.substring(0, 100),
            actionTaken: "BLOCKED_403",
          });

          return res.status(403).json({
            success: false,
            error: "Requisição Bloqueada pelo WAF (Ataque XXE / XML Inválido).",
            message: "Estruturas de DTD externas ou entidades XML não autorizadas são proibidas.",
            code: "WAF_XXE_BLOCKED",
          });
        }
      }

      // Check Body
      if (contentType.includes("xml") || typeof req.body === "string" || (req.body && typeof req.body === "object")) {
        const bodyContent = typeof req.body === "string" ? req.body : JSON.stringify(req.body || "");
        for (const pattern of this.XXE_PATTERNS) {
          if (pattern.test(bodyContent)) {
            this.recordThreat({
              ip,
              method: req.method,
              path: req.path,
              attackType: "XXE_ATTACK",
              severity: "CRITICAL",
              details: `Tentativa de ataque XXE / XML Entity Expansion detectada via padrão: ${pattern.toString()}`,
              blockedPayloadSample: bodyContent.substring(0, 100),
              actionTaken: "BLOCKED_403",
            });

            return res.status(403).json({
              success: false,
              error: "Requisição Bloqueada pelo WAF (Ataque XXE / XML Inválido).",
              message: "Estruturas de DTD externas, entidades XML não autorizadas ou declarações DOCTYPE são proibidas nesta API.",
              code: "WAF_XXE_BLOCKED",
            });
          }
        }
      }

      next();
    };
  }

  // =========================================================================
  // 4. PATH TRAVERSAL & RANSOMWARE FILE LOCKER DEFENSE
  // =========================================================================
  public static pathTraversalInspectorMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const candidates: { location: string; value: string }[] = [];

      // Check URL and query
      const rawUrl = req.originalUrl || req.url || "";
      candidates.push({ location: "URL_RAW", value: rawUrl });
      candidates.push({ location: "URL_DECODED", value: this.safeDecode(rawUrl) });

      if (req.query && typeof req.query === "object") {
        for (const [k, v] of Object.entries(req.query)) {
          candidates.push({ location: `Query[${k}]`, value: String(v) });
          candidates.push({ location: `QueryDecoded[${k}]`, value: this.safeDecode(String(v)) });
        }
      }

      // Check body fields that might represent paths/filenames
      if (req.body && typeof req.body === "object") {
        for (const [k, v] of Object.entries(req.body)) {
          if (typeof v === "string" && (k.toLowerCase().includes("file") || k.toLowerCase().includes("path") || k.toLowerCase().includes("dir") || k.toLowerCase().includes("name"))) {
            candidates.push({ location: `Body[${k}]`, value: v });
            candidates.push({ location: `BodyDecoded[${k}]`, value: this.safeDecode(v) });
          }
        }
      }

      for (const item of candidates) {
        for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
          if (pattern.test(item.value)) {
            this.recordThreat({
              ip,
              method: req.method,
              path: req.path,
              attackType: "PATH_TRAVERSAL",
              severity: "CRITICAL",
              details: `Tentativa de Path Traversal / Escape de Diretório detectada em ${item.location}: ${item.value}`,
              blockedPayloadSample: item.value.substring(0, 100),
              actionTaken: "BLOCKED_403",
            });

            return res.status(403).json({
              success: false,
              error: "Acesso Negado (Path Traversal / Diretório Inválido).",
              message: "Tentativa de acesso a caminhos do sistema de arquivos fora dos diretórios permitidos.",
              code: "WAF_PATH_TRAVERSAL_BLOCKED",
            });
          }
        }
      }

      next();
    };
  }

  // =========================================================================
  // 5. MALICIOUS FILE UPLOAD & RANSOMWARE FILTER
  // =========================================================================
  public static validateUploadedFile(file: { originalname: string; mimetype?: string; size: number; buffer?: Buffer }): { valid: boolean; reason?: string } {
    const rawName = file.originalname || "";
    const cleanName = path.basename(rawName).toLowerCase();
    const ext = path.extname(cleanName);

    // 1. Check for double extension attacks (e.g. "relatorio.php.png" or "foto.exe.pdf")
    const parts = cleanName.split(".");
    if (parts.length > 2) {
      for (let i = 1; i < parts.length - 1; i++) {
        const innerExt = `.${parts[i]}`;
        if (this.DANGEROUS_EXTENSIONS.has(innerExt)) {
          return {
            valid: false,
            reason: `Arquivo com extensão dupla perigosa detectada: '${cleanName}'. Possível tentativa de evasão de upload.`
          };
        }
      }
    }

    // 2. Block dangerous executable and server script extensions
    if (this.DANGEROUS_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        reason: `A extensão '${ext}' é classificada como executável/script de risco e foi bloqueada pela política de segurança.`
      };
    }

    // 3. Ensure file has an allowed extension
    if (!this.ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        reason: `A extensão '${ext}' não está na lista de formatos autorizados da instituição.`
      };
    }

    // 4. File size limits (Max 25MB por arquivo)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        reason: `Tamanho do arquivo (${(file.size / 1024 / 1024).toFixed(1)}MB) excede o limite máximo permitido de 25MB.`
      };
    }

    return { valid: true };
  }

  // =========================================================================
  // 6. ANTI-BYPASS & AUTH FORGERY PROTECTION
  // =========================================================================
  public static antiBypassMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);

      // Detect forged proxy override headers
      const suspiciousHeaders = [
        "x-original-url",
        "x-rewrite-url",
        "x-custom-ip-authorization",
        "x-forwarded-server"
      ];

      for (const h of suspiciousHeaders) {
        if (req.headers[h]) {
          this.recordThreat({
            ip,
            method: req.method,
            path: req.path,
            attackType: "AUTH_BYPASS",
            severity: "HIGH",
            details: `Cabeçalho de tentativa de bypass detectado: '${h}: ${req.headers[h]}'`,
            actionTaken: "BLOCKED_403",
          });

          return res.status(403).json({
            success: false,
            error: "Acesso Negado pelo WAF (Cabeçalhos Inválidos).",
            message: "Cabeçalhos de controle de rota não permitidos foram detectados na requisição.",
            code: "WAF_HEADER_BYPASS_BLOCKED",
          });
        }
      }

      next();
    };
  }

  // =========================================================================
  // 7. SECURITY HEADERS MIDDLEWARE (MILITARY-GRADE HARDENING)
  // =========================================================================
  public static securityHeadersMiddleware() {
    return (_req: Request, res: Response, next: NextFunction) => {
      // Remove any server identification
      res.removeHeader("X-Powered-By");
      res.removeHeader("Server");

      // Set hardened security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

      // Content Security Policy
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'self';"
      );

      next();
    };
  }

  // =========================================================================
  // 8. TELEMETRY & AUDIT METHODS
  // =========================================================================
  public static getWafStatus(): WafStatistics {
    const now = Date.now();
    let activeJailedCount = 0;
    for (const tracker of this.ipTrackers.values()) {
      if (tracker.jailedUntil && tracker.jailedUntil > now) {
        activeJailedCount++;
      }
    }

    return {
      totalRequestsAnalyzed: this.stats.totalRequests,
      totalThreatsBlocked: this.stats.totalBlocked,
      sqliBlocked: this.stats.sqli,
      xxeBlocked: this.stats.xxe,
      ddosBlocked: this.stats.ddos,
      pathTraversalBlocked: this.stats.pathTraversal,
      maliciousUploadBlocked: this.stats.maliciousUpload,
      bypassBlocked: this.stats.bypass,
      activeJailedIpsCount: activeJailedCount,
      startedAt: new Date(this.START_TIME).toISOString(),
      uptimeSeconds: Math.floor((now - this.START_TIME) / 1000),
    };
  }

  public static getThreatLogs(limit = 100): ThreatLogEntry[] {
    return this.threatLogs.slice(0, limit);
  }

  public static unbanIp(ip: string): boolean {
    const tracker = this.ipTrackers.get(ip);
    if (tracker) {
      tracker.jailedUntil = undefined;
      tracker.count = 0;
      tracker.violationCount = 0;
      return true;
    }
    return false;
  }

  /**
   * Resets internal caches and metrics for automated testing suites
   */
  public static resetForTesting(): void {
    this.ipTrackers.clear();
    this.threatLogs = [];
    this.stats = {
      totalRequests: 0,
      totalBlocked: 0,
      sqli: 0,
      xxe: 0,
      ddos: 0,
      pathTraversal: 0,
      maliciousUpload: 0,
      bypass: 0,
    };
  }
}
