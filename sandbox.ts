import { spawn, execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type ExecutionResult = {
  status: "ACCEPTED" | "WRONG_ANSWER" | "COMPILATION_ERROR" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "MEMORY_LIMIT_EXCEEDED" | "INTERNAL_ERROR";
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryUsedKb?: number;
};

export async function executeInSandbox(
  code: string,
  language: string,
  inputData: string,
  timeLimitMs: number = 3000,
  memoryLimitMb: number = 128
): Promise<ExecutionResult> {
  const sessionId = crypto.randomUUID();
  const tmpDir = path.join(process.cwd(), "tmp_sandbox", sessionId);
  
  await fs.mkdir(tmpDir, { recursive: true });

  let cmd = "";
  let args: string[] = [];
  let fileExt = "";

  if (language === "python" || language === "python3") {
    fileExt = "py";
    cmd = "python3";
    args = ["main.py"];
  } else if (language === "javascript" || language === "js" || language === "nodejs") {
    fileExt = "js";
    cmd = "node";
    args = ["main.js"];
  } else if (language === "c") {
    fileExt = "c";
    cmd = "sh";
    args = ["-c", "gcc main.c -o main && ./main"];
  } else if (language === "cpp" || language === "c++") {
    fileExt = "cpp";
    cmd = "sh";
    args = ["-c", "g++ main.cpp -o main && ./main"];
  } else {
    // Default fallback mock for unsupported runtime or quick tests
    return {
      status: "INTERNAL_ERROR",
      stdout: "",
      stderr: "Language not fully supported in Sandbox yet.",
      executionTimeMs: 0
    };
  }

  const filePath = path.join(tmpDir, `main.${fileExt}`);
  await fs.writeFile(filePath, code);

  return new Promise((resolve) => {
    const start = Date.now();
    let stdout = "";
    let stderr = "";

    const processSpawn = spawn(cmd, args, { 
      cwd: tmpDir, 
      timeout: timeLimitMs,
      // Detached loosely, but standard io
    });

    if (inputData) {
      processSpawn.stdin.write(inputData);
      processSpawn.stdin.end();
    }

    processSpawn.stdout.on("data", (data) => {
      stdout += data.toString().slice(0, 10000); // truncate max safety
    });

    processSpawn.stderr.on("data", (data) => {
      stderr += data.toString().slice(0, 5000);
    });

    processSpawn.on("error", (err: any) => {
      resolve({
        status: "INTERNAL_ERROR",
        stdout,
        stderr: stderr + "\\n" + err.message,
        executionTimeMs: Date.now() - start
      });
    });

    processSpawn.on("close", async (code, signal) => {
      const executionTimeMs = Date.now() - start;
      const result: ExecutionResult = {
        status: "ACCEPTED",
        stdout,
        stderr,
        executionTimeMs
      };

      if (signal === "SIGTERM" || executionTimeMs >= timeLimitMs) {
        result.status = "TIME_LIMIT_EXCEEDED";
        result.stderr = "Process was terminated for exceeding time limits.";
      } else if (code !== 0) {
        // Simple compiler/runtime heuristic
        if (stderr.toLowerCase().includes("error: ") || stderr.toLowerCase().includes("syntaxerror")) {
           result.status = "COMPILATION_ERROR";
        } else {
           result.status = "RUNTIME_ERROR";
        }
      }

      // Cleanup
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {}

      resolve(result);
    });
  });
}
