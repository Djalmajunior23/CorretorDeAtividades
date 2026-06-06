import { spawn } from "child_process";

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
  weight?: number;
  name?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeUsed: number; // ms
}

export interface TestResultItem {
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  is_hidden?: boolean;
}

export class BaseExecutor {
  /**
   * Spawns a background process and writes stdin. Kills the process if it goes beyond timeoutMs.
   */
  static runProcess(command: string, args: string[], stdin: string, timeoutMs = 3000): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn(command, args);
      let stdout = "";
      let stderr = "";
      let completed = false;

      const limitTimer = setTimeout(() => {
        if (completed) return;
        completed = true;
        try {
          child.kill("SIGKILL");
        } catch (err) {}
        resolve({
          stdout: stdout.trim(),
          stderr: (stderr + "\n[Execução Interrompida: Limite de tempo de " + (timeoutMs/1000) + "s excedido]").trim(),
          exitCode: -9,
          timeUsed: Date.now() - startTime
        });
      }, timeoutMs);

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        if (completed) return;
        completed = true;
        clearTimeout(limitTimer);
        resolve({
          stdout: stdout.trim(),
          stderr: (stderr + "\nError: " + err.message).trim(),
          exitCode: -2,
          timeUsed: Date.now() - startTime
        });
      });

      child.on("close", (code) => {
        if (completed) return;
        completed = true;
        clearTimeout(limitTimer);
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? 0,
          timeUsed: Date.now() - startTime
        });
      });

      if (stdin) {
        try {
          child.stdin.write(stdin + "\n");
          child.stdin.end();
        } catch (err) {}
      } else {
        try {
          child.stdin.end();
        } catch (err) {}
      }
    });
  }
}
