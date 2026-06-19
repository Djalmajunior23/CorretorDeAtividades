import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { OllamaProvider } from "../providers/OllamaProvider";

export class ProviderFactory {
    static createProvider(task?: string): BaseProvider {
        const providerName = process.env.AI_PROVIDER || "ollama";
        
        let modelName = process.env.AI_ACTIVITY_MODEL || "qwen2.5-coder:3b";
        if (task) {
            switch (task) {
                case "code_correction":
                case "code":
                    modelName = process.env.AI_CODE_MODEL || "qwen2.5-coder:3b";
                    break;
                case "pedagogical_feedback":
                case "feedback":
                case "pedagogical_analysis":
                    modelName = process.env.AI_FEEDBACK_MODEL || "qwen2.5-coder:3b";
                    break;
                case "report_generation":
                case "report":
                    modelName = process.env.AI_REPORT_MODEL || "llama3.2:3b";
                    break;
                case "reasoning":
                    modelName = process.env.AI_REASONING_MODEL || "llama3.2:3b";
                    break;
                case "general_analysis":
                case "chat":
                    modelName = process.env.AI_GENERAL_MODEL || "llama3.2:3b";
                    break;
                case "question_generation":
                    modelName = process.env.AI_QUESTION_GENERATION_MODEL || "qwen2.5:3b";
                    break;
                case "ocr_analysis":
                    modelName = process.env.AI_OCR_ANALYSIS_MODEL || "qwen2.5-coder:3b";
                    break;
            }
        }

        const config: AIConfig = {
            provider: providerName,
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY, 
        };

        switch (providerName.toLowerCase()) {
            case "gemini":
                return new GeminiProvider(config);
            case "ollama":
            default:
                const ollamaConfig: AIConfig = {
                    ...config,
                    apiKey: process.env.OLLAMA_PROXY_TOKEN,
                    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434"
                };
                return new OllamaProvider(ollamaConfig);
        }
    }
}
