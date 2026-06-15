import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class AIService {
    /**
     * Executes generation with retries and failover rules
     */
    async generateWithRetry(prompt: string, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<string> {
        // Default to General Analysis task if not specified
        return await AIGateway.executeTask<string>(AITask.GENERAL_ANALYSIS, prompt, undefined, imageData) as string;
    }

    async generateStructuredWithRetry<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<T> {
        // Default to General Analysis task if not specified
        return await AIGateway.executeTask<T>(AITask.GENERAL_ANALYSIS, prompt, schema, imageData) as T;
    }
}

export const aiService = new AIService();
