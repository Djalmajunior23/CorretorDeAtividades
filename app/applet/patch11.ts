import { ExecutionStatus } from "./types";
import { ProviderFactory } from "../factory/ProviderFactory";

export class AIExecutor {
  static async simulate(language: string, code: string, stdin: string = ""): Promise<{ stdout: string; stderr: string; status: ExecutionStatus }> {
    try {
      const prompt = `
      You are a specialized code execution sandbox simulator for a classroom platform.
      Simulate the execution of the following ${language} code.
      
      CODE:
      \`\`\`${language}
      ${code}
      \`\`\`
      
      INPUT (STDIN):
      ${stdin}
      
      Rules:
      1. If the code has syntax errors, provide stderr and status "compilation_error".
      2. If it crashes at runtime (e.g. division by zero, null pointer), provide stdout until the crash, stderr with the error, and status "runtime_error".
      3. If it runs successfully, provide stdout and status "accepted".
      4. If the code looks infinite, status "timeout".
      
      Return ONLY a JSON object:
      {
        "stdout": "string",
        "stderr": "string",
        "status": "accepted" | "runtime_error" | "compilation_error" | "timeout"
      }
      `;

      const provider = ProviderFactory.createProvider("reasoning");
      const resultStr = await provider.generateContent(prompt, { responseMimeType: "application/json" });
      
      // Attempt to parse JSON even if inside markdown bloack
      let jsonStr = resultStr.trim();
      if (jsonStr.startsWith("```json")) {
          jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
      } else if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
      }

      const result = JSON.parse(jsonStr || "{}");
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        status: result.status || "accepted"
      };
    } catch (err: any) {
      console.error("AI Simulation failed:", err);
      return {
        stdout: "",
        stderr: "AI Simulation failed: " + err.message,
        status: "internal_error" as ExecutionStatus
      };
    }
  }
}
