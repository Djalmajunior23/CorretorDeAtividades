import { GoogleGenAI, Type } from "@google/genai";
import { BaseProvider, AIConfig } from "./BaseProvider";

export class GeminiProvider extends BaseProvider {
    private client: GoogleGenAI | null = null;

    constructor(config: AIConfig) {
        super(config);
        if (config.apiKey) {
            this.client = new GoogleGenAI({
                apiKey: config.apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build',
                    }
                }
            });
        }
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        if (!this.client) {
            throw new Error("A chave de API Gemini (GEMINI_API_KEY) não está configurada. Por favor, configure-a nas variáveis de ambiente (.env) para utilizar esta funcionalidade de IA.");
        }
        let contents: any[] = [];
        if (imageData) {
            contents.push({
                inlineData: {
                    data: imageData.base64,
                    mimeType: imageData.mimeType
                }
            });
            contents.push({ text: prompt });
        } else {
            contents.push(prompt);
        }

        const defaultModel = process.env.AI_ACTIVITY_MODEL || "gemini-1.5-flash";
        const primaryModel = this.config.model && this.config.model !== defaultModel ? this.config.model : defaultModel;
        const modelsToTry = Array.from(new Set([
            primaryModel,
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ]));

        let lastError: any = null;
        for (const modelName of modelsToTry) {
            try {
                const response = await this.client.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: optConfig
                });
                return response.text || "";
            } catch (err: any) {
                lastError = err;
                console.error(`[GeminiProvider] Request failed for model ${modelName}:`, err.message);
                
                // Check for 503, 429, or 404 (model not found)
                const isRetryable = err?.status === 503 || err?.status === 429 || err?.status === 404 ||
                    err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("404") ||
                    err?.message?.includes("not found") ||
                    err?.message?.includes("high demand") || err?.message?.includes("temporary") ||
                    err?.message?.includes("UNAVAILABLE") || err?.message?.includes("Resource exhausted") ||
                    err?.message?.includes("fetch failed");
                
                if (isRetryable) {
                    console.warn(`[GeminiProvider] Model ${modelName} failed (status ${err.status}). Trying next fallback model...`);
                    await new Promise(res => setTimeout(res, 500));
                    continue;
                }
                throw err;
            }
        }
        throw lastError || new Error("All fallback models failed.");
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
        if (!this.client) {
            throw new Error("A chave de API Gemini (GEMINI_API_KEY) não está configurada. Por favor, configure-a nas variáveis de ambiente (.env) para utilizar esta funcionalidade de IA.");
        }
        let contents: any[] = [];
        if (imageData) {
            contents.push({
                inlineData: {
                    data: imageData.base64,
                    mimeType: imageData.mimeType
                }
            });
            contents.push({ text: prompt });
        } else {
            contents.push(prompt);
        }

        const defaultModel = process.env.AI_ACTIVITY_MODEL || "gemini-1.5-flash";
        const primaryModel = this.config.model && this.config.model !== defaultModel ? this.config.model : defaultModel;
        const modelsToTry = Array.from(new Set([
            primaryModel,
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp"
        ]));

        let lastError: any = null;
        for (const modelName of modelsToTry) {
            try {
                const response = await this.client.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: {
                        ...optConfig,
                        responseMimeType: "application/json",
                        responseSchema: schema
                    }
                });

                if (!response.text) {
                    throw new Error("Empty structured response from GeminiProvider");
                }

                return JSON.parse(response.text) as T;
            } catch (err: any) {
                lastError = err;
                console.error(`[GeminiProvider] Structured extraction failed for model ${modelName}:`, err.message);
                
                // Check for 503, 429, or 404 (model not found)
                const isRetryable = err?.status === 503 || err?.status === 429 || err?.status === 404 ||
                    err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("404") ||
                    err?.message?.includes("not found") ||
                    err?.message?.includes("high demand") || err?.message?.includes("temporary") ||
                    err?.message?.includes("UNAVAILABLE") || err?.message?.includes("Resource exhausted") ||
                    err?.message?.includes("fetch failed");
                
                if (isRetryable) {
                    console.warn(`[GeminiProvider] Structured extraction failed with status ${err.status} on model ${modelName}. Trying next fallback model...`);
                    await new Promise(res => setTimeout(res, 500));
                    continue;
                }
                throw err;
            }
        }
        throw lastError || new Error("All structured fallback models failed.");
    }
}
