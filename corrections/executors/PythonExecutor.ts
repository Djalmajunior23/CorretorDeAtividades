import fs from "fs";
import path from "path";
import crypto from "crypto";
import { BaseExecutor, ExecutionResult } from "./BaseExecutor.ts";

export class PythonExecutor {
  static async execute(code: string, stdin: string): Promise<ExecutionResult> {
    const subId = crypto.randomUUID();
    const tempFile = path.join("/tmp", `runner_${subId}.py`);
    fs.writeFileSync(tempFile, code);

    try {
      const res = await BaseExecutor.runProcess("python3", [tempFile], stdin);
      return res;
    } catch (err: any) {
      return {
        stdout: "",
        stderr: err.message,
        exitCode: -1,
        timeUsed: 0
      };
    } finally {
      if (fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {}
      }
    }
  }
}
