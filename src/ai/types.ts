export enum AITask {
    CODE_CORRECTION = "code_correction",
    PEDAGOGICAL_FEEDBACK = "pedagogical_feedback",
    REPORT_GENERATION = "report_generation",
    IMAGE_OCR = "image_ocr",
    GENERAL_ANALYSIS = "general_analysis",
    CODE = "code",
    FEEDBACK = "feedback",
    REPORT = "report",
    REASONING = "reasoning",
    CHAT = "chat",
    QUESTION_GENERATION = "question_generation",
    OCR_ANALYSIS = "ocr_analysis",
    PEDAGOGICAL_ANALYSIS = "pedagogical_analysis"
}

export interface CodeCorrectionRequest {
    language: string;
    code: string;
    statement: string;
    rubric: string;
    level: string;
}

export interface CodeCorrectionResponse {
    final_score: number;
    criteria_scores: Record<string, number>;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    errors_found: string[];
    recommendations: string[];
    teacher_summary: string;
    suggested_solution: string;
}

export interface AIStatusResponse {
    provider: string;
    available: boolean;
    models: {
        code: string;
        feedback: string;
        report: string;
        general: string;
    } | string[];
    base_url?: string;
    health?: string;
    error?: string;
}
