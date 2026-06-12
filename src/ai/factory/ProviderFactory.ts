import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { OllamaProvider } from "../providers/OllamaProvider";

export class ProviderFactory {
    static createProvider(): BaseProvider {
        const providerName = process.env.AI_PROVIDER || "gemini";
        const modelName = process.env.AI_MODEL || "gemini-3.5-flash";
        const config: AIConfig = {
            provider: providerName,
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY, // Default picking up API key from global
        };

        switch (providerName.toLowerCase()) {
            case "gemini":
                return new GeminiProvider(config);
            case "ollama":
                const ollamaConfig: AIConfig = {
                    ...config,
                    apiKey: process.env.OLLAMA_API_KEY,
                    baseUrl: process.env.OLLAMA_BASE_URL
                };
                return new OllamaProvider(ollamaConfig);
            case "openai":
                throw new Error("OpenAI provider not fully implemented yet. Please use Gemini.");
            default:
                console.warn(`Provider ${providerName} is not natively mapped, falling back to Gemini.`);
                return new GeminiProvider(config);
        }
    }
}
