import { TestCase } from "./BaseExecutor.ts";
import { ExecutionService } from "../../src/ai/services/sandbox/execution_service.ts";

export class SandboxExecutor {
  static async execute(code: string, language: string, testCases: TestCase[]) {
    // Adapter mapping our generic TestCase to ExecutionService's TestCase
    const mappedTestCases = testCases.map((tc, idx) => ({
      name: `Teste #${idx + 1}${tc.is_hidden ? " (Oculto)" : ""}`,
      stdin: tc.input || "",
      expected_stdout: tc.expected_output || ""
    }));

    const response = await ExecutionService.run({
      language,
      code,
      test_cases: mappedTestCases,
      timeout_seconds: 5
    });

    const statusMap: Record<string, string> = {
      "accepted": "CORRECTED",
      "compilation_error": "COMPILE_ERROR",
      "runtime_error": "RUNTIME_ERROR",
      "timeout": "TIMEOUT",
      "security_blocked": "SECURITY_BLOCKED"
    };

    return {
      status: (statusMap[response.status] || "CORRECTED") as any,
      compiled: response.status !== "compilation_error",
      syntaxOk: response.status !== "compilation_error",
      testsPassed: response.test_results.filter(r => r.passed).length,
      totalTests: testCases.length,
      executionTimeMs: response.execution_time_ms,
      testResults: response.test_results.map((tr, idx) => ({
         input: testCases[idx].input,
         expected_output: testCases[idx].expected_output,
         actual_output: tr.actual_stdout,
         passed: tr.passed,
         is_hidden: testCases[idx].is_hidden
      })),
      stdout: response.stdout,
      stderr: response.stderr,
      memoryUsed: response.memory_used_mb,
      securityFlags: response.security_flags,
      sandboxMetrics: {
        cpu_limit_ghz: 1.5,
        ram_limit_mb: 128,
        timeout_ms: 5000,
        network_firewall: "BLOCKED" as const,
        os_sandbox: "CONTAINER_SECURE" as const
      }
    };
  }
}
