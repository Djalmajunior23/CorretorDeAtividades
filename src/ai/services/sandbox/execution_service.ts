
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { ExecutionRequest, ExecutionResponse, TestCase, TestCaseResult, ExecutionStatus } from "./types";
import { SecurityScanner } from "./security_scanner";
import { AIExecutor } from "./AIExecutor";

export class ExecutionService {
  private static TEMP_DIR = path.join(os.tmpdir(), "codecheck-sandbox");

  static async run(request: ExecutionRequest): Promise<ExecutionResponse> {
    const language = request.language.toLowerCase();
    
    // 1. Initial Scan
    const scanResult = SecurityScanner.scan(language, request.code);
    if (!scanResult.safe) {
      return this.createErrorResponse(request.language, "security_blocked", "O código contém comandos proibidos.", scanResult.flaggedPatterns);
    }

    // 2. Determine execution mode (Local vs AI Simulation)
    // Only Python and JS/Node are typically available in standard serverless containers
    const localInterpreters = ["python", "javascript", "node", "typescript"];
    const needsAI = !localInterpreters.includes(language);

    if (needsAI) {
      return this.runAISimulation(request);
    }

    // 3. Prepare workspace for local execution
    if (!fs.existsSync(this.TEMP_DIR)) fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    const jobId = Math.random().toString(36).substring(7);
    const jobDir = path.join(this.TEMP_DIR, jobId);
    fs.mkdirSync(jobDir);

    try {
      const fileName = this.getFileName(request.language);
      const filePath = path.join(jobDir, fileName);
      fs.writeFileSync(filePath, request.code);

      const testResults: TestCaseResult[] = [];
      let totalPassed = 0;
      let totalTime = 0;
      let lastStdout = "";
      let lastStderr = "";
      let finalStatus: ExecutionStatus = "accepted";

      const testCases = request.test_cases || (request.stdin !== undefined ? [{ name: "Teste Manual", stdin: request.stdin, expected_stdout: "" }] : []);

      if (testCases.length === 0) {
        // Run once without stdin if none provided
        const result = await this.execute(request.language, jobDir, fileName, "");
        totalTime = result.time;
        lastStdout = result.stdout;
        lastStderr = result.stderr;
        finalStatus = result.status;
      } else {
        for (const tc of testCases) {
          const result = await this.execute(request.language, jobDir, fileName, tc.stdin, request.timeout_seconds);
          
          let passed = false;
          if (result.status === "accepted") {
            passed = tc.expected_stdout ? result.stdout.trim() === tc.expected_stdout.trim() : true;
          }

          testResults.push({
            name: tc.name,
            passed,
            expected_stdout: tc.expected_stdout,
            actual_stdout: result.stdout,
            execution_time_ms: result.time
          });

          if (passed) totalPassed++;
          totalTime += result.time;
          lastStdout = result.stdout;
          lastStderr = result.stderr;
          
          if (result.status !== "accepted") {
            finalStatus = result.status;
            break;
          }
        }
      }

      if (testCases.length > 0 && finalStatus === "accepted" && totalPassed < testCases.length) {
        finalStatus = "wrong_answer";
      }

      const score = testCases.length > 0 ? Math.round((totalPassed / testCases.length) * 100) : 100;

      return {
        success: true,
        language: request.language,
        status: finalStatus,
        score,
        stdout: lastStdout,
        stderr: lastStderr,
        execution_time_ms: totalTime,
        memory_used_mb: 24, // Simulated for now
        test_results: testResults,
        security_flags: [],
        teacher_summary: finalStatus === "accepted" ? "Código executado com sucesso e passou nos testes." : `Falha na execução: ${this.getStatusLabel(finalStatus)}`
      };

    } catch (e: any) {
      console.error("Sandbox Execution Error:", e);
      return this.createErrorResponse(request.language, "internal_error", e.message);
    } finally {
      // Cleanup
      try {
        if (fs.existsSync(jobDir)) fs.rmSync(jobDir, { recursive: true, force: true });
      } catch (err) {}
    }
  }

  private static async runAISimulation(request: ExecutionRequest): Promise<ExecutionResponse> {
    const testResults: TestCaseResult[] = [];
    let totalPassed = 0;
    let finalStatus: ExecutionStatus = "accepted";
    let lastStdout = "";
    let lastStderr = "";
    
    const testCases = request.test_cases || (request.stdin !== undefined ? [{ name: "Teste Manual", stdin: request.stdin, expected_stdout: "" }] : []);

    for (const tc of testCases) {
      const result = await AIExecutor.simulate(request.language, request.code, tc.stdin);
      
      let passed = false;
      if (result.status === "accepted") {
        passed = tc.expected_stdout ? result.stdout.trim() === tc.expected_stdout.trim() : true;
      }

      testResults.push({
        name: tc.name,
        passed,
        expected_stdout: tc.expected_stdout,
        actual_stdout: result.stdout,
        execution_time_ms: 100 // Simulated AI overhead
      });

      if (passed) totalPassed++;
      lastStdout = result.stdout;
      lastStderr = result.stderr;
      
      if (result.status !== "accepted") {
        finalStatus = result.status;
        break;
      }
    }

    if (testCases.length > 0 && finalStatus === "accepted" && totalPassed < testCases.length) {
      finalStatus = "wrong_answer";
    }

    const score = testCases.length > 0 ? Math.round((totalPassed / testCases.length) * 100) : 100;

    return {
      success: true,
      language: request.language,
      status: finalStatus,
      score,
      stdout: lastStdout,
      stderr: lastStderr,
      execution_time_ms: 500,
      memory_used_mb: 0,
      test_results: testResults,
      security_flags: [],
      teacher_summary: `Validado via Sandbox IA (Simulação determinística): ${this.getStatusLabel(finalStatus)}`
    };
  }

  private static getFileName(language: string): string {
    const langs: Record<string, string> = {
      python: "script.py",
      javascript: "script.js",
      java: "Main.java",
      cpp: "main.cpp",
      c: "main.c",
      php: "script.php",
      sql: "query.sql"
    };
    return langs[language.toLowerCase()] || "code.txt";
  }

  private static getStatusLabel(status: ExecutionStatus): string {
    const labels: Record<string, string> = {
      accepted: "Aceito",
      wrong_answer: "Resposta Incorreta",
      runtime_error: "Erro em Tempo de Execução",
      compilation_error: "Erro de Compilação",
      timeout: "Tempo Limite Excedido",
      security_blocked: "Bloqueado por Segurança",
      internal_error: "Erro Interno"
    };
    return labels[status] || status;
  }

  private static async execute(language: string, cwd: string, fileName: string, stdin: string, timeoutSec: number = 5): Promise<{ status: ExecutionStatus; stdout: string; stderr: string; time: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";
      let status: ExecutionStatus = "accepted";

      const command = this.getCommand(language, fileName);
      if (!command) {
        resolve({ status: "unsupported_language", stdout: "", stderr: "Linguagem não suportada no ambiente.", time: 0 });
        return;
      }

      // Handle Compilation if needed
      if (language === "cpp" || language === "c" || language === "java") {
         // This is a simplified version. A real sandbox would compile separately.
         // For now, let's assume we use a wrapper or the environment has it.
         // To keep it simple and safe for the agent, I'll focus on scripting languages 
         // which are more likely to be present in the container.
      }

      const child = spawn(command.cmd, command.args, { cwd, env: { ...process.env, NODE_ENV: "production" } });

      const timeout = setTimeout(() => {
        child.kill();
        status = "timeout";
      }, timeoutSec * 1000);

      if (stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });

      child.on("close", (code) => {
        clearTimeout(timeout);
        const time = Date.now() - startTime;
        if (status === "timeout") {
          resolve({ status: "timeout", stdout, stderr, time });
        } else if (code !== 0) {
          resolve({ status: "runtime_error", stdout, stderr, time });
        } else {
          resolve({ status: "accepted", stdout, stderr, time });
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ status: "internal_error", stdout, stderr: err.message, time: Date.now() - startTime });
      });
    });
  }

  private static getCommand(language: string, fileName: string): { cmd: string; args: string[] } | null {
    switch (language.toLowerCase()) {
      case "python": return { cmd: "python3", args: [fileName] };
      case "javascript": return { cmd: "node", args: [fileName] };
      case "php": return { cmd: "php", args: [fileName] };
      // Note: Real JIT compilation for C/C++/Java requires a build step. 
      // For this sandbox, we stick to common interpreters found in many standard Linux environments.
      default: return null;
    }
  }

  private static createErrorResponse(language: string, status: ExecutionStatus, message: string, flags: string[] = []): ExecutionResponse {
    return {
      success: false,
      language,
      status,
      score: 0,
      stdout: "",
      stderr: message,
      execution_time_ms: 0,
      memory_used_mb: 0,
      test_results: [],
      security_flags: flags,
      teacher_summary: `Falha: ${message}`
    };
  }
}
