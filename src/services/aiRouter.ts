export const AI_MODEL_ROUTING = {
  fast_code: process.env.AI_FAST_CODE_MODEL || "qwen2.5-coder:1.5b",
  code: process.env.AI_CODE_MODEL || "qwen2.5-coder:3b",
  advanced_code: process.env.AI_ADVANCED_CODE_MODEL || "qwen2.5-coder:7b",
  general: process.env.AI_GENERAL_MODEL || "llama3.2:3b",
  pedagogical: process.env.AI_PEDAGOGICAL_MODEL || "gemma3:4b",
  report: process.env.AI_REPORT_MODEL || "phi3:mini",
  reasoning: process.env.AI_REASONING_MODEL || "deepseek-r1:8b",
  vision: process.env.AI_VISION_MODEL || "llava:7b",
  fallback: process.env.AI_FALLBACK_MODEL || "codegemma:2b"
};

export function getModelForTask(task?: string): string {
  if (!task) return AI_MODEL_ROUTING.general;

  const normalized = task.toLowerCase().trim();

  switch (normalized) {
    case "fast_code":
    case "correcao_rapida":
    case "correcao-rapida":
    case "code_fast":
      return AI_MODEL_ROUTING.fast_code;

    case "code":
    case "code_correction":
    case "correcao_normal":
    case "correcao-normal":
    case "ocr_analysis":
      return AI_MODEL_ROUTING.code;

    case "advanced_code":
    case "correcao_avancada":
    case "correcao-avancada":
    case "code_advanced":
      return AI_MODEL_ROUTING.advanced_code;

    case "pedagogical":
    case "pedagogical_feedback":
    case "feedback":
    case "pedagogical_analysis":
    case "question_generation":
      return AI_MODEL_ROUTING.pedagogical;

    case "report":
    case "report_generation":
      return AI_MODEL_ROUTING.report;

    case "reasoning":
    case "complex_reasoning":
      return AI_MODEL_ROUTING.reasoning;

    case "vision":
    case "image_ocr":
      return AI_MODEL_ROUTING.vision;

    case "fallback":
      return AI_MODEL_ROUTING.fallback;

    case "general":
    case "general_analysis":
    case "chat":
    default:
      return AI_MODEL_ROUTING.general;
  }
}
