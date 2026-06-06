import fs from "fs";
import path from "path";
import crypto from "crypto";
import { BaseExecutor, ExecutionResult } from "./BaseExecutor.ts";

export class JavaScriptExecutor {
  static async execute(code: string, stdin: string): Promise<ExecutionResult> {
    const subId = crypto.randomUUID();
    const tempFile = path.join("/tmp", `runner_${subId}.js`);
    fs.writeFileSync(tempFile, code);

    try {
      const res = await BaseExecutor.runProcess("node", [tempFile], stdin);
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
