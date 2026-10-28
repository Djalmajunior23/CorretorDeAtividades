import type { ExecutionRequest, ExecutionResponse, ExecutionStatus } from "./types";

export function isolatedWorkerConfigured() {
  const base = process.env.ISOLATED_WORKER_URL?.replace(/\/$/, "");
  return Boolean(base && workerToken(base));
}
function workerToken(base: string) {
  // A single gateway has a single bearer credential. Only reuse the Ollama key
  // when its URL is exactly this worker's own /ollama route.
  const sameGateway = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") === base + "/ollama";
  return (sameGateway ? process.env.OLLAMA_PROXY_TOKEN : undefined) || process.env.ISOLATED_WORKER_TOKEN;
}
function config() {
  const url = new URL(process.env.ISOLATED_WORKER_URL || "");
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("Worker exige URL HTTPS sem credenciais.");
  const token = workerToken(url.href.replace(/\/$/, ""));
  if (!token) throw new Error("Credencial do worker ausente.");
  return { base: url.href.replace(/\/$/, ""), token };
}
const statuses: ExecutionStatus[] = ["accepted", "wrong_answer", "runtime_error", "compilation_error", "timeout", "memory_limit_exceeded", "security_blocked", "unsupported_language", "internal_error"];
export async function workerHealth(): Promise<boolean> {
  if (!isolatedWorkerConfigured()) return false;
  try {
    const { base, token } = config();
    const response = await fetch(base + "/health", { headers: { Authorization: `Bearer ${token}` }, redirect: "error", signal: AbortSignal.timeout(5000) });
    const result = await response.json();
    return response.ok && result.status === "ready" && result.isolation === "docker" && result.network === "none";
  } catch { return false; }
}
export async function runIsolated(request: ExecutionRequest): Promise<ExecutionResponse> {
  const response: ExecutionResponse = { success: false, language: request?.language || "", status: "internal_error", score: 0, stdout: "", stderr: "", execution_time_ms: 0, memory_used_mb: 0, test_results: [], security_flags: [], teacher_summary: "Execução isolada indisponível." };
  try {
    if (!request || typeof request.code !== "string" || typeof request.language !== "string") throw new Error("Código e linguagem devem ser textos.");
    if (!["javascript", "js", "node", "nodejs", "typescript", "python", "py", "python3"].includes(request.language.toLowerCase().trim())) {
      response.status = "unsupported_language"; response.stderr = "O worker suporta JavaScript, TypeScript e Python."; return response;
    }
    if (Buffer.byteLength(request.code) > 100000) throw new Error("Código excede 100 KB.");
    if (request.test_cases !== undefined && !Array.isArray(request.test_cases)) throw new Error("Casos de teste inválidos.");
    const tests = request.test_cases?.length ? request.test_cases : [{ name: "Execução manual", stdin: request.stdin ?? "", expected_stdout: "" }];
    if (tests.length > 10) throw new Error("Limite de dez testes por execução.");
    const { base, token } = config();
    const timeout_ms = Math.max(100, Math.min(5000, Number(request.timeout_seconds || 3) * 1000));
    const deadline = Date.now() + 90000;
    let passed = 0;
    for (const test of tests) {
      if (typeof test.stdin !== "string" || Buffer.byteLength(test.stdin) > 50000 || typeof test.expected_stdout !== "string") throw new Error("Entrada ou saída esperada inválida.");
      const remaining = deadline - Date.now();
      if (remaining < 1000) throw new Error("Tempo total dos testes excedido.");
      const http = await fetch(base + "/run", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ language: request.language.toLowerCase().trim(), code: request.code, stdin: test.stdin, timeout_ms }), redirect: "error", signal: AbortSignal.timeout(Math.min(20000, remaining)) });
      if (!http.ok) throw new Error(`Worker respondeu HTTP ${http.status}.`);
      const data = await http.json();
      if (data.isolation_guaranteed !== true || !statuses.includes(data.status) || typeof data.stdout !== "string" || typeof data.stderr !== "string" || data.stdout.length + data.stderr.length > 100000 || !Number.isFinite(data.execution_time_ms) || data.execution_time_ms < 0) throw new Error("Resposta inválida do executor isolado.");
      const correct = data.status === "accepted" && (!request.test_cases?.length || data.stdout.trim() === test.expected_stdout.trim());
      if (correct) passed++;
      response.stdout = data.stdout; response.stderr = data.stderr; response.execution_time_ms += data.execution_time_ms;
      response.test_results.push({ name: test.name, passed: correct, expected_stdout: test.expected_stdout, actual_stdout: data.stdout, execution_time_ms: data.execution_time_ms });
      if (data.status !== "accepted") { response.status = data.status; break; }
      response.status = "accepted";
    }
    if (response.status === "accepted" && passed < tests.length) response.status = "wrong_answer";
    response.success = response.status !== "internal_error";
    response.score = request.test_cases?.length ? Math.round(passed / tests.length * 100) : 0;
    response.teacher_summary = response.status === "accepted" ? "Programa executado em contêiner isolado e testes aprovados." : "Programa executado em contêiner isolado; confira os resultados dos testes.";
  } catch (error) {
    response.success = false; response.status = "internal_error"; response.score = 0;
    response.stderr = error instanceof Error ? error.message : "Falha no executor isolado.";
  }
  return response;
}
