import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class AIService {
    /**
     * Executes generation with retries and failover rules
     */
    async generateWithRetry(prompt: string, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<string> {
        return await AIGateway.executeTask<string>(AITask.GENERAL_ANALYSIS, prompt, undefined, imageData, optConfig) as string;
    }

    async generateStructuredWithRetry<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<T> {
        return await AIGateway.executeTask<T>(AITask.PEDAGOGICAL_FEEDBACK, prompt, schema, imageData, optConfig) as T;
    }
}

export const aiService = new AIService();

