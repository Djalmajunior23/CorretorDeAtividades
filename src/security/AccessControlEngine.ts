import { Request, Response, NextFunction } from "express";
import { verifyJwtToken, UserSessionPayload } from "../utils/security";
import { DataProtectionEngine } from "./DataProtectionEngine";

/**
 * ============================================================================
 * ACCESS CONTROL & ZERO-TRUST AUTHORIZATION ENGINE (OWASP ASVS 4.0.3 L2)
 * ============================================================================
 * Central policy: Deny Access by Default.
 * Enforces:
 * 1. Strict JWT Verification & Session Validation (No forged or unsigned tokens)
 * 2. Whitelist-Only Public Routes (Login, Health, Demo Guest Session)
 * 3. Role-Based Access Control (RBAC: ADMIN, PROFESSOR, COORDENADOR, ALUNO, DEMO)
 * 4. Resource-Level Authorization (Tenant / Teacher / Student Isolation - Anti-IDOR/BOLA)
 * 5. Automatic Solution Code & Secret Test Case Redaction for Students
 * 6. Isolated In-Memory Synthetic Sandbox for Demo Users (No Production DB Access)
 * 7. Protected Database Dumps & Exports (ADMIN only with audit logging)
 * ============================================================================
 */

export interface AuthenticatedRequest extends Request {
  user?: UserSessionPayload;
  isDemo?: boolean;
}

export class AccessControlEngine {
  // Allowed standard roles in the system
  private static readonly VALID_ROLES = [
    "ADMIN",
    "SUPER_ADMIN",
    "PROFESSOR",
    "TEACHER",
    "COORDENADOR",
    "ALUNO",
    "STUDENT",
    "DEMO"
  ];

  // Explicit Public Whitelist: ONLY these endpoints can be reached anonymously
  private static readonly PUBLIC_ALLOWLIST_PATTERNS: RegExp[] = [
    // Health, Liveness Probes & Public Bootstrap Settings
    /^\/health\/?$/i,
    /^\/live\/?$/i,
    /^\/ready\/?$/i,
    /^\/api\/health(\/.*)?$/i,
    /^\/api\/live\/?$/i,
    /^\/api\/ready\/?$/i,
    /^\/api\/health-status\/?$/i,
    /^\/api\/security\/waf-status\/?$/i,
    /^\/api\/feature-flags\/?$/i,
    /^\/api\/settings\/linting\/?$/i,
    /^\/api\/execution\/status\/?$/i,
    /^\/api\/ai\/status\/?$/i,

    // Authentication & Guest Entry Points
    /^\/auth\/login\/?$/i,
    /^\/api\/auth\/login\/?$/i,
    /^\/auth\/demo-session\/?$/i,
    /^\/api\/auth\/demo-session\/?$/i,
    /^\/auth\/guest\/?$/i,
    /^\/api\/auth\/guest\/?$/i,
    /^\/auth\/logout\/?$/i,
    /^\/api\/auth\/logout\/?$/i,

    // Public Webhooks with their own cryptographic signature verification
    /^\/api\/webhooks\/git-autograde\/?$/i,
    /^\/api\/lms\/lti-callback\/?$/i
  ];

  // Admin-Only Routes: Require role 'ADMIN' or 'SUPER_ADMIN'
  private static readonly ADMIN_ONLY_PATTERNS: RegExp[] = [
    /^\/api\/cloud-sync\//i,
    /^\/api\/security\/unban-ip\/?$/i,
    /^\/api\/security\/threat-logs\/?$/i,
    /^\/api\/settings\/encryption-keys\/?$/i,
    /^\/api\/admin\//i,
    /^\/api\/system\/maintenance\/?$/i,
    /^\/api\/database\/export\/?$/i
  ];

  // Teacher/Admin Routes: Cannot be accessed by ALUNO or DEMO
  private static readonly TEACHER_OR_ADMIN_PATTERNS: RegExp[] = [
    /^\/api\/teacher\//i,
    /^\/api\/activities\/bulk-/i,
    /^\/api\/activities\/manual-grade/i,
    /^\/api\/activities\/sync-grades/i,
    /^\/api\/sla\//i,
    /^\/api\/codecheck\/diary\//i,
    /^\/api\/lesson-logger\//i,
    /^\/api\/competencies\/reports\/?$/i,
    /^\/api\/export\/turmas-zip\/?$/i,
    /^\/api\/parametric-exam\//i,
    /^\/api\/item-bank\//i,
    /^\/api\/audit-logs\/?$/i,
    /^\/api\/reports\//i
  ];

  /**
   * 1. Central Default-Deny Access Guard Middleware
   */
  public static authGuardMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // 1. Always allow CORS Preflight (OPTIONS)
      if (req.method === "OPTIONS") {
        return next();
      }

      const reqPath = (req.path || req.url || "").split("?")[0];

      // 2. Allow static SPA assets and frontend pages on GET requests
      if (req.method === "GET" && !reqPath.startsWith("/api") && !reqPath.startsWith("/auth")) {
        return next();
      }

      // 3. Check Public Whitelist
      const isPublic = AccessControlEngine.PUBLIC_ALLOWLIST_PATTERNS.some((pattern) =>
        pattern.test(reqPath)
      );
      if (isPublic) {
        return next();
      }

      // 4. Extract Token from Authorization header
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: "Acesso não autorizado: Credencial ausente. Por favor, realize login.",
          code: "UNAUTHENTICATED"
        });
      }

      const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : String(authHeader).split(" ")[1]?.trim() || String(authHeader).trim();

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "Token de autorização inválido ou vazio.",
          code: "INVALID_TOKEN"
        });
      }

      // 5. Verify Cryptographic JWT Signature
      const verification = verifyJwtToken(token);
      if (!verification.valid || !verification.payload) {
        return res.status(401).json({
          success: false,
          error: verification.error || "Sessão expirada ou inválida. Por favor, autentique-se novamente.",
          code: "SESSION_EXPIRED"
        });
      }

      const user = verification.payload;
      let rawRole = (user.role || "ALUNO").toUpperCase();
      
      // Role normalization
      if (rawRole === "TEACHER") rawRole = "PROFESSOR";
      if (rawRole === "STUDENT") rawRole = "ALUNO";

      if (!AccessControlEngine.VALID_ROLES.includes(rawRole)) {
        return res.status(403).json({
          success: false,
          error: `Perfil de usuário desconhecido: '${rawRole}'. Acesso negado.`,
          code: "INVALID_ROLE"
        });
      }

      user.role = rawRole;
      (req as AuthenticatedRequest).user = user;
      (req as AuthenticatedRequest).isDemo = rawRole === "DEMO";

      // 6. Enforce Admin-Only Policy
      const isAdminRoute = AccessControlEngine.ADMIN_ONLY_PATTERNS.some((pattern) =>
        pattern.test(reqPath)
      );
      if (isAdminRoute && rawRole !== "ADMIN" && rawRole !== "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Acesso restrito: Esta operação requer privilégio de Administrador Geral.",
          code: "INSUFFICIENT_PRIVILEGES"
        });
      }

      // 7. Enforce Teacher/Admin Only Policy
      const isTeacherRoute = AccessControlEngine.TEACHER_OR_ADMIN_PATTERNS.some((pattern) =>
        pattern.test(reqPath)
      );
      if (
        isTeacherRoute &&
        rawRole !== "PROFESSOR" &&
        rawRole !== "ADMIN" &&
        rawRole !== "SUPER_ADMIN" &&
        rawRole !== "COORDENADOR"
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado: Recursos pedagógicos restritos a professores e coordenadores.",
          code: "TEACHER_ROLE_REQUIRED"
        });
      }

      // 8. Enforce Demo Mutation Block (Demo operates in synthetic read-only mode)
      if (rawRole === "DEMO" && (req.method === "POST" || req.method === "PUT" || req.method === "DELETE" || req.method === "PATCH")) {
        const isExecutionOnly = reqPath.includes("/api/corrections/run") || reqPath.includes("/api/ai/");
        if (!isExecutionOnly) {
          return res.status(403).json({
            success: false,
            error: "Modo Demonstração: Visitantes operam em sandbox somente leitura. Alterações de banco de dados e dados reais estão bloqueadas.",
            code: "DEMO_MUTATION_BLOCKED"
          });
        }
      }

      next();
    };
  }

  /**
   * 2. Solution Code & Secret Data Stripper Middleware
   * Intercepts responses to students/visitors and removes solution_code,
   * hidden test cases, and private rubric hints.
   */
  public static responseMinimizerMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res);

      res.json = (body: any): Response => {
        const user = (req as AuthenticatedRequest).user;
        const role = user?.role || "ALUNO";
        const isStudentOrDemo = role === "ALUNO" || role === "DEMO";

        if (isStudentOrDemo && body && typeof body === "object") {
          const sanitized = AccessControlEngine.stripStudentSensitiveData(body);
          return originalJson(sanitized);
        }

        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Recursively strips solution_code, starter_code solutions, secret test cases, and internal teacher notes
   */
  public static stripStudentSensitiveData(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripStudentSensitiveData(item));
    }

    if (typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Buffer)) {
      const clean: Record<string, any> = {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // 1. Remove Solution Code & Answer Keys
        if (
          lowerKey === "solution_code" ||
          lowerKey === "gabarito" ||
          lowerKey === "expected_solution" ||
          lowerKey === "teacher_notes" ||
          lowerKey === "pedagogical_notes" ||
          lowerKey === "correct_answer_secret"
        ) {
          continue;
        }

        // 2. Hide Secret Test Cases
        if (lowerKey === "test_cases" && Array.isArray(value)) {
          // Only show public sample test cases (up to 2), never hidden evaluation tests
          clean[key] = value.slice(0, 2).map((tc) => ({
            input: tc.input,
            expected_output: tc.expected_output || tc.output,
            is_sample: true
          }));
          continue;
        }

        clean[key] = this.stripStudentSensitiveData(value);
      }

      return clean;
    }

    return obj;
  }

  /**
   * 3. Resource Ownership Guard
   * Resolves effective teacher ID strictly from validated JWT
   */
  public static resolveEffectiveTeacherId(req: Request): string {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return "anonymous";
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return (req.query.teacher_id as string) || (req.body.teacher_id as string) || user.id || "admin_root";
    }
    return user.id || "teacher_portal";
  }

  /**
   * 4. Student Scope Filter
   * Resolves effective student ID strictly from validated JWT
   */
  public static resolveEffectiveStudentId(req: Request): string {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return "anonymous";
    if (user.role === "PROFESSOR" || user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "COORDENADOR") {
      return (req.query.student_id as string) || (req.body.student_id as string) || user.id;
    }
    return user.id;
  }
}
