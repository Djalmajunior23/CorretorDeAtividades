import { AITask } from "../types";
import { ProviderFactory } from "../factory/ProviderFactory";
import { BaseProvider } from "../providers/BaseProvider";

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
            console.error(`[AIGateway] Error executing task ${task}:`, error.message);
            // Fallback strategy: Try with default model if specialized fails
            try {
                const fallbackProvider = ProviderFactory.createProvider();
                if (schema) {
                    return await fallbackProvider.generateStructured<T>(prompt, schema, {}, imageData);
                } else {
                    return await fallbackProvider.generateContent(prompt, {}, imageData);
                }
            } catch (fallbackError: any) {
                 console.error(`[AIGateway] Fallback also failed for task ${task}:`, fallbackError.message);
                 throw new Error(`AI Gateway error: ${error.message}. Fallback also failed.`);
            }
        }
    }
}
