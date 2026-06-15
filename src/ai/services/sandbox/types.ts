
export type ExecutionStatus = 
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "compilation_error"
  | "timeout"
  | "memory_limit_exceeded"
  | "security_blocked"
  | "unsupported_language"
  | "internal_error";

export interface TestCase {
  name: string;
  stdin: string;
  expected_stdout: string;
}

export interface TestCaseResult {
  name: string;
  passed: boolean;
  expected_stdout: string;
  actual_stdout: string;
  execution_time_ms: number;
}

export interface ExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
  test_cases?: TestCase[];
  timeout_seconds?: number;
}

export interface ExecutionResponse {
  success: boolean;
  id?: string;
  language: string;
  status: ExecutionStatus;
  score: number;
  stdout: string;
  stderr: string;
  execution_time_ms: number;
  memory_used_mb: number;
  test_results: TestCaseResult[];
  security_flags: string[];
  teacher_summary: string;
}
