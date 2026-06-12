import { ProviderFactory } from "../factory/ProviderFactory";
import { BaseProvider } from "../providers/BaseProvider";

export class AIService {
    private provider: BaseProvider;

    constructor() {
        this.provider = ProviderFactory.createProvider();
    }

    /**
     * Executes generation with retries and failover rules
     */
    async generateWithRetry(prompt: string, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<string> {
        const maxRetries = 3;
        let attempt = 1;
        
        while (attempt <= maxRetries) {
            try {
                return await this.provider.generateContent(prompt, optConfig, imageData);
            } catch (err: any) {
                console.warn(`[AIService] Attempt ${attempt} failed:`, err.message);
                if (attempt === maxRetries || (err?.status && err.status !== 503 && err.status !== 429)) {
                    throw err;
                }
                await new Promise(res => setTimeout(res, 1000 * attempt));
                attempt++;
            }
        }
        throw new Error("AIService: Exhausted maximum retries.");
    }

    async generateStructuredWithRetry<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<T> {
        const maxRetries = 3;
        let attempt = 1;

        while (attempt <= maxRetries) {
            try {
                return await this.provider.generateStructured<T>(prompt, schema, optConfig, imageData);
            } catch (err: any) {
                console.warn(`[AIService] Structured API Attempt ${attempt} failed:`, err.message);
                if (attempt === maxRetries || (err?.status && err.status !== 503 && err.status !== 429)) {
                    throw err;
                }
                await new Promise(res => setTimeout(res, 1000 * attempt));
                attempt++;
            }
        }
        throw new Error("AIService: Exhausted maximum retries on structured endpoint.");
    }
}

export const aiService = new AIService();
