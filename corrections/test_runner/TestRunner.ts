import { TestCase, TestResultItem } from "../executors/BaseExecutor.ts";

export interface TestSuiteResult {
  tests_passed: number;
  total_tests: number;
  scorePercentage: number; // 0 to 100 based on pass rate or weights
  test_results: TestResultItem[];
}

export class TestRunner {
  /**
   * Normalizes and compares expected and actual outputs with float tolerances and whitespace/case insensitivity.
   */
  static compareOutputs(expected: string, actual: string): boolean {
    const eNorm = expected.replace(/\r\n/g, "\n").trim();
    const aNorm = actual.replace(/\r\n/g, "\n").trim();

    if (eNorm === aNorm) return true;

    // Case-insensitive check
    if (eNorm.toLowerCase() === aNorm.toLowerCase()) return true;

    // Direct comparison as overall floats
    const numE = Number(eNorm);
    const numA = Number(aNorm);
    if (!isNaN(numE) && !isNaN(numA)) {
      return Math.abs(numE - numA) < 0.001; // float threshold tolerance
    }

    // List/array of space-separated or comma-separated elements comparison
    const expectedTokens = eNorm.split(/[\s,;\n]+/).filter(t => t.length > 0);
    const actualTokens = aNorm.split(/[\s,;\n]+/).filter(t => t.length > 0);

    if (expectedTokens.length === actualTokens.length && expectedTokens.length > 0) {
      let isAllMatch = true;
      for (let i = 0; i < expectedTokens.length; i++) {
        const tokenE = expectedTokens[i];
        const tokenA = actualTokens[i];

        const valE = Number(tokenE);
        const valA = Number(tokenA);

        if (!isNaN(valE) && !isNaN(valA)) {
          if (Math.abs(valE - valA) >= 0.001) {
            isAllMatch = false;
            break;
          }
        } else {
          if (tokenE.toLowerCase() !== tokenA.toLowerCase()) {
            isAllMatch = false;
            break;
          }
        }
      }
      if (isAllMatch) return true;
    }

    return false;
  }

  /**
   * Runs the test cases on the executor and prepares the score.
   */
  static async runTests(
    code: string,
    testCases: (TestCase & { is_hidden?: boolean; weight?: number })[],
    executorFn: (code: string, stdin: string) => Promise<{ stdout: string; stderr: string; exitCode: number; timeUsed: number }>
  ): Promise<TestSuiteResult> {
    const results: TestResultItem[] = [];
    let tests_passed = 0;
    
    let totalWeight = 0;
    let earnedWeight = 0;

    const cases = Array.isArray(testCases) ? testCases : [];

    for (const tc of cases) {
      const tcWeight = tc.weight ?? 1;
      totalWeight += tcWeight;

      const runRes = await executorFn(code, tc.input);
      const passed = this.compareOutputs(tc.expected_output, runRes.stdout) && runRes.exitCode === 0;

      if (passed) {
        tests_passed++;
        earnedWeight += tcWeight;
      }

      results.push({
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: runRes.stdout || (runRes.stderr ? `[Erro: ${runRes.stderr.slice(0, 150)}]` : ""),
        passed,
        is_hidden: tc.is_hidden || false
      });
    }

    const scorePercentage = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;

    return {
      tests_passed,
      total_tests: cases.length,
      scorePercentage,
      test_results: results
    };
  }
}
