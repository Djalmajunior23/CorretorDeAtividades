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
  student_name?: string;
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
  diagnoseResponse?: any;
}

export interface PedagogicalTrack {
  id: string;
  teacher_id: string;
  class_id?: string;
  student_id?: string;
  title: string;
  type: 'reforço' | 'recuperação' | 'aprofundamento' | 'revisão' | 'competencia';
  diagnosis?: string;
  critical_topics?: string[];
  learning_objectives?: string[];
  recommended_activities?: any;
  recommended_questions?: string[];
  recommended_labs?: string[];
  estimated_duration?: string;
  success_criteria?: string[];
  ai_recommendations?: any;
  teacher_notes?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface InterventionPlan {
  id: string;
  teacher_id: string;
  class_id?: string;
  student_id?: string;
  title: string;
  diagnosis?: string;
  objectives?: string[];
  actions?: any;
  resources?: string[];
  schedule?: string;
  success_criteria?: string[];
  monitoring_strategy?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface EducationalTemplate {
  id: string;
  teacher_id?: string;
  title: string;
  type: string;
  topic?: string;
  language?: string;
  difficulty?: string;
  target_audience?: string;
  is_system_template: boolean;
}

export interface GeneratedMaterial {
  id: string;
  teacher_id: string;
  title: string;
  type: string;
  topic: string;
  content: any;
  status: 'draft' | 'approved' | 'archived' | 'exported';
  created_at: string;
}

export interface ResourceLibraryItem {
  id: string;
  teacher_id: string;
  folder_id?: string;
  title: string;
  description?: string;
  type: string;
  topic?: string;
  language?: string;
  difficulty?: string;
  tags?: string[];
  file_url?: string;
  content?: any;
  is_favorite: boolean;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
}

export interface GeneratedReport {
  id: string;
  teacher_id: string;
  class_id?: string;
  student_id?: string;
  type: string;
  title: string;
  teacher_notes?: string;
  content: any;
  status: 'draft' | 'reviewed' | 'approved' | 'exported' | 'archived';
  created_at: string;
}

export interface TeacherLibraryItem {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  type: string; // 'activity' | 'rubric' | 'question' | 'feedback' | 'report' | 'material' | 'mock_exam' | 'file'
  topic?: string;
  language?: string;
  tags?: string[];
  content?: string;
  file_url?: string;
  is_favorite: boolean;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}


