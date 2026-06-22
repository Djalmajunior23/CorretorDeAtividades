export enum AITask {
    GENERAL_ANALYSIS = 'general_analysis',
    IMAGE_OCR = 'image_ocr',
    CODE_CORRECTION = 'code_correction',
    REPORT_GENERATION = 'report_generation',
    QUESTION_GENERATION = 'question_generation',
    PEDAGOGICAL_FEEDBACK = 'pedagogical_feedback'
}

export interface CodeCorrectionRequest {
  level?: string;
  statement?: string;
  rubric?: string;
  code: string;
  language: string;
  prompt?: string;
  options?: any;
}

export interface CodeCorrectionResponse {
  success: boolean;
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  errors_found: string[];
}

export interface AIStatusResponse {
  provider: string;
  available: boolean;
  base_url: string;
  models: any;
  health: string;
  error?: string;
}
