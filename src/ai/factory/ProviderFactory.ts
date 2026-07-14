import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { OllamaProvider } from "../providers/OllamaProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { getModelForTask } from "../../services/aiRouter";

class FallbackProvider extends BaseProvider {
    constructor(private primary: BaseProvider, private secondary: BaseProvider) {
        super(primary.config);
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        try {
            return await this.primary.generateContent(prompt, optConfig, imageData);
        } catch (err: any) {
            console.warn(`[FallbackProvider] Primary provider (${this.primary.config.provider}) failed: ${err.message}. Trying secondary provider...`);
            return await this.secondary.generateContent(prompt, optConfig, imageData);
        }
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
        try {
            return await this.primary.generateStructured<T>(prompt, schema, optConfig, imageData);
        } catch (err: any) {
            console.warn(`[FallbackProvider] Primary provider (${this.primary.config.provider}) failed: ${err.message}. Trying secondary provider...`);
            return await this.secondary.generateStructured<T>(prompt, schema, optConfig, imageData);
        }
    }
}

export class ProviderFactory {
    static createProvider(task?: string): BaseProvider {
        const providerName = process.env.AI_PROVIDER || "ollama";
        const modelName = getModelForTask(task);

        const config: AIConfig = {
            provider: providerName,
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY, 
        };

        const geminiConfig: AIConfig = {
            ...config,
            provider: "gemini",
            apiKey: process.env.GEMINI_API_KEY
        };

        const ollamaConfig: AIConfig = {
            ...config,
            provider: "ollama",
            apiKey: process.env.OLLAMA_PROXY_TOKEN,
            baseUrl: process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434"
        };

        const ollamaProvider = new OllamaProvider(ollamaConfig);
        const geminiProvider = process.env.GEMINI_API_KEY ? new GeminiProvider(geminiConfig) : null;

        if (providerName.toLowerCase() === "gemini") {
            return geminiProvider || ollamaProvider;
        }

        // Default to ollama, with gemini fallback if key is available
        if (geminiProvider) {
            return new FallbackProvider(ollamaProvider, geminiProvider);
        }

        return ollamaProvider;
    }
}
