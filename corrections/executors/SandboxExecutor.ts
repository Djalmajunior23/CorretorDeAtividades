import { TestCase } from "./BaseExecutor.ts";
import { executeInSandbox } from "../../sandbox.ts"; // Points to the one I created at root

export class SandboxExecutor {
  static async execute(code: string, language: string, testCases: TestCase[]) {
    let passed = 0;
    let totalTime = 0;
    let stdouts: string[] = [];
    let stderrs: string[] = [];
    let results: Array<{
      input: string;
      expected_output: string;
      actual_output: string;
      passed: boolean;
      is_hidden?: boolean;
    }> = [];
    let globalStatus: string = "CORRECTED";
    let compiled = true;

    for (const tc of testCases) {
      const res = await executeInSandbox(code, language, tc.input);
      
      const isPass = res.status === "ACCEPTED" && res.stdout.trim() === tc.expected_output.trim();
      if (isPass) passed++;
      
      if (res.status === "COMPILATION_ERROR") {
        compiled = false;
        globalStatus = "COMPILE_ERROR";
      } else if (res.status === "RUNTIME_ERROR") {
        globalStatus = "RUNTIME_ERROR";
      } else if (res.status === "TIME_LIMIT_EXCEEDED") {
        globalStatus = "TIMEOUT";
      }

      totalTime += res.executionTimeMs;
      stdouts.push(res.stdout);
      if (res.stderr) stderrs.push(res.stderr);

      results.push({
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: res.stdout.trim() || res.stderr.trim(),
        passed: isPass,
        is_hidden: tc.is_hidden
      });

      if (!compiled) break; // Don't run rest if it doesn't compile
    }

    return {
      status: globalStatus as any,
      compiled,
      syntaxOk: compiled, 
      testsPassed: passed,
      totalTests: testCases.length,
      executionTimeMs: totalTime,
      testResults: results,
      stdout: stdouts.join("\\n---\\n"),
      stderr: stderrs.join("\\n")
    };
  }
}
