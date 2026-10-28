import { describe, expect, it, vi } from "vitest";
import { AIExecutor } from "../ai/services/sandbox/AIExecutor";
import { ExecutionService } from "../ai/services/sandbox/execution_service";
import { SecurityScanner } from "../ai/services/sandbox/security_scanner";

describe("Regressões na execução de exercícios", () => {
  it("fecha stdin vazio para programas que aguardam EOF", async () => {
    const result = await ExecutionService.run({ language: "javascript", code:
      "process.stdin.resume(); process.stdin.on('end', () => console.log('done'));", timeout_seconds: 1 });
    expect(result.status).toBe("accepted");
    expect(result.stdout.trim()).toBe("done");
  });

  it("não considera saída inesperada correta quando o gabarito é vazio", async () => {
    const result = await ExecutionService.run({ language: "js", code: "console.log('extra')",
      test_cases: [{ name: "silencioso", stdin: "", expected_stdout: "" }] });
    expect(result.status).toBe("wrong_answer");
    expect(result.score).toBe(0);
  });

  it("executa entrada manual sem exigir gabarito", async () => {
    const result = await ExecutionService.run({ language: "node", code: "console.log('ok')", stdin: "" });
    expect(result.status).toBe("accepted");
    expect(result.score).toBe(100);
  });

  it("respeita timeout também sem casos de teste e não atribui nota máxima", async () => {
    const result = await ExecutionService.run({ language: "javascript", code: "while (true) {}", timeout_seconds: 0.1 });
    expect(result.status).toBe("timeout");
    expect(result.score).toBe(0);
    expect(result.execution_time_ms).toBeLessThan(2000);
  });

  it("limita uma única escrita grande na saída", async () => {
    const result = await ExecutionService.run({ language: "javascript", code: "console.log('x'.repeat(200000))" });
    expect(result.status).toBe("accepted");
    expect(result.stdout.length).toBeLessThanOrEqual(100000);
  });

  it("aplica as mesmas restrições aos aliases de linguagem", () => {
    for (const language of ["javascript", "js", "node", "typescript"]) {
      expect(SecurityScanner.scan(language, "console.log(process.env)").safe).toBe(false);
    }
    expect(SecurityScanner.scan("sql", "drop table students").safe).toBe(false);
    expect(SecurityScanner.scan("cpp", "#include <iostream>").safe).toBe(true);
  });

  it("não aprova uma linguagem simulada sem sequer executar o simulador", async () => {
    const simulate = vi.spyOn(AIExecutor, "simulate").mockResolvedValue({ stdout: "", stderr: "invalid", status: "compilation_error" });
    try {
      const result = await ExecutionService.run({ language: "java", code: "invalid" });
      expect(simulate).toHaveBeenCalledOnce();
      expect(result.status).toBe("compilation_error");
      expect(result.score).toBe(0);
    } finally { simulate.mockRestore(); }
  });
});
