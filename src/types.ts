export interface TestCase {
  input: string;
  expected_output: string;
}

export interface CorrectionPayload {
  language: string;
  code: string;
  test_cases: TestCase[];
}

export interface CorrectionResult {
  language: string;
  syntax_ok: boolean;
  tests_passed: number;
  total_tests: number;
  stdout: string;
  stderr: string;
  final_score: number;
  feedback: string;
  execution_time?: number; // ms
  quality_score?: number; // 0-100
  code_size?: number; // chars
}

export interface CorrectionSubmission {
  id: string; // uuid
  teacher_id: string;
  language: string;
  code: string;
  status: 'success' | 'failed';
  created_at: string;
}

export interface DatabaseCorrectionResult {
  id: string;
  submission_id: string;
  syntax_ok: boolean;
  tests_passed: number;
  total_tests: number;
  stdout: string;
  stderr: string;
  final_score: number;
  feedback: string;
  created_at: string;
}

export interface SubmissionLog {
  submission: CorrectionSubmission;
  result: DatabaseCorrectionResult;
  executionTime?: number;
}
