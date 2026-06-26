import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { OllamaProvider } from "../providers/OllamaProvider";
import { getModelForTask } from "../../services/aiRouter";

export class ProviderFactory {
    static createProvider(task?: string): BaseProvider {
        const providerName = process.env.AI_PROVIDER || "ollama";
        
        const modelName = getModelForTask(task);

        const config: AIConfig = {
            provider: providerName,
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY, 
        };

        switch (providerName.toLowerCase()) {
            case "gemini":
                // return new GeminiProvider(config);
                // Gemini code removed to ensure local inference as requested
            case "ollama":
            default:
                const ollamaConfig: AIConfig = {
                    ...config,
                    apiKey: process.env.OLLAMA_PROXY_TOKEN,
                    baseUrl: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434"
                };
                return new OllamaProvider(ollamaConfig);
        }
    }
}
