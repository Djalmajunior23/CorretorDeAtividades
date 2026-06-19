import { AITask } from "../types";
import { ProviderFactory } from "../factory/ProviderFactory";
import { BaseProvider } from "../providers/BaseProvider";
import { OllamaProvider } from "../providers/OllamaProvider";

export class AIGateway {
    static async executeTask<T>(task: AITask, prompt: string, schema?: any, imageData?: { mimeType: string, base64: string }): Promise<T | string> {
        const provider = ProviderFactory.createProvider(task);
        
        try {
            if (schema) {
                return await provider.generateStructured<T>(prompt, schema, {}, imageData);
            } else {
                return await provider.generateContent(prompt, {}, imageData);
            }
        } catch (error: any) {
            // Only log if it's not the "indisponível" error, to reduce noise
            if (!error.message.includes("indisponível")) {
                console.error(`[AIGateway] Error executing task ${task}:`, error.message);
            }
            
            // If error is about server indisponibilidade, don't fallback
            if (error.message.includes("indisponível") || provider instanceof OllamaProvider) {
                if (provider instanceof OllamaProvider) {
                   throw new Error("A IA local (Ollama) está indisponível ou falhou no momento.");
                }
                throw error;
            }
            
            // Fallback strategy: Always try Ollama if primary fails
            try {
                const baseUrl = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
                const ollamaConfig = {
                    provider: "ollama",
                    model: process.env.AI_ACTIVITY_MODEL || "qwen2.5-coder:3b",
                    apiKey: process.env.OLLAMA_PROXY_TOKEN,
                    baseUrl: baseUrl
                };
                const fallbackProvider = new OllamaProvider(ollamaConfig);
                if (schema) {
                    return await fallbackProvider.generateStructured<T>(prompt, schema, {}, imageData);
                } else {
                    return await fallbackProvider.generateContent(prompt, {}, imageData);
                }
            } catch (fallbackError: any) {
                 console.error(`[AIGateway] Fallback also failed for task ${task}:`, fallbackError.message);
                 throw new Error("A IA local está indisponível no momento. Verifique a conexão com o Ollama.");
            }
        }
    }
}
