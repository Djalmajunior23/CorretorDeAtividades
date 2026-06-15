import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { OllamaProvider } from "../providers/OllamaProvider";

export class ProviderFactory {
    static createProvider(task?: string): BaseProvider {
        const providerName = process.env.AI_PROVIDER || "gemini";
        
        let modelName = process.env.AI_MODEL || "gemini-1.5-flash";
        if (task) {
            switch (task) {
                case "code_correction":
                    modelName = process.env.AI_CODE_MODEL || "qwen2.5-coder:7b";
                    break;
                case "pedagogical_feedback":
                    modelName = process.env.AI_FEEDBACK_MODEL || "gemma3:12b";
                    break;
                case "report_generation":
                    modelName = process.env.AI_REPORT_MODEL || "phi4-mini";
                    break;
                case "general_analysis":
                    modelName = process.env.AI_GENERAL_MODEL || "llama3.2:3b";
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
                const ollamaConfig: AIConfig = {
                    ...config,
                    apiKey: process.env.OLLAMA_PROXY_TOKEN,
                    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434"
                };
                return new OllamaProvider(ollamaConfig);
            case "openai":
                throw new Error("OpenAI provider not fully implemented yet. Please use Gemini.");
            default:
                return new GeminiProvider(config);
        }
    }
}
