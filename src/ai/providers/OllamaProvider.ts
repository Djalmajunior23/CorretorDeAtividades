import { BaseProvider, AIConfig } from "./BaseProvider";

export class OllamaProvider extends BaseProvider {
    private baseUrl: string;

    constructor(config: AIConfig) {
        super(config);
        const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";
        const parsed = new URL(baseUrl);
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
            throw new Error("Use uma URL HTTP(S) do Ollama sem credenciais embutidas.");
        }
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    private static timeout(value: unknown, fallback: number): number {
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric > 0 ? Math.min(Math.ceil(numeric), 300000) : fallback;
    }

    private static modelOptions(config?: Record<string, unknown>) {
        const { timeout, max_tokens, maxOutputTokens, responseMimeType, ...options } = config || {};
        const maxTokens = max_tokens ?? maxOutputTokens;
        if (maxTokens !== undefined && options.num_predict === undefined) options.num_predict = maxTokens;
        return options;
    }

    private static availabilityCache = new Map<string, { available: boolean; timestamp: number }>();

    public async isAvailable(): Promise<boolean> {
        // Fast-fail em ambientes serverless (Vercel/AWS Lambda) quando aponta para host interno inacessível
        const isServerless = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
        const isInternalHost = this.baseUrl.includes("host.docker.internal") || this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1");

        if (isServerless && isInternalHost) {
            return false;
        }

        const now = Date.now();
        const cacheKey = `${this.baseUrl}\0${this.config.apiKey || ""}`;
        const cached = OllamaProvider.availabilityCache.get(cacheKey);
        if (cached && (now - cached.timestamp < 30000)) {
            return cached.available;
        }

        try {
            const signal = AbortSignal.timeout(OllamaProvider.timeout(process.env.AI_HEALTH_TIMEOUT_MS, 800));

            const headers: Record<string, string> = {};
            if (this.config.apiKey) {
                headers["Authorization"] = `Bearer ${this.config.apiKey}`;
            }

            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: "GET",
                headers,
                signal
            });
            const data = response.ok ? await response.json() : null;
            const isOk = response.ok && Array.isArray(data?.models);
            OllamaProvider.availabilityCache.set(cacheKey, { available: isOk, timestamp: now });
            return isOk;
        } catch (err) {
            OllamaProvider.availabilityCache.set(cacheKey, { available: false, timestamp: now });
            return false;
        }
    }

    static async listModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
        const url = (baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434").replace(/\/$/, "");
        try {
            const signal = AbortSignal.timeout(7000);
            const headers: Record<string, string> = {};
            if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

            const response = await fetch(`${url}/api/tags`, { headers, signal });
            if (response.ok) {
                const data = await response.json();
                return (Array.isArray(data.models) ? data.models : [])
                    .map((m: any) => m?.name || m?.model)
                    .filter((name: unknown): name is string => typeof name === "string" && name.length > 0);
            }
        } catch (e) {
            console.warn(`[OllamaProvider] Failed to list tags from ${url}:`, e);
        }
        return [];
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        if (!(await this.isAvailable())) {
             throw new Error(`Servidor Ollama indisponível em ${this.baseUrl}. Verifique se a VPS está online.`);
        }

        let images: string[] = [];
        if (imageData) {
            images.push(imageData.base64);
        }

        const payload = {
            model: this.config.model || "qwen2.5-coder:3b",
            prompt: prompt,
            images: images.length > 0 ? images : undefined,
            stream: false,
            options: OllamaProvider.modelOptions(optConfig)
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }

        const timeoutMs = OllamaProvider.timeout(optConfig?.timeout ?? process.env.AI_TIMEOUT_MS, 30000);
        const signal = AbortSignal.timeout(timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal
            });


            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (typeof data.response !== "string" || !data.response.trim()) {
                throw new Error("Resposta vazia ou inválida do OllamaProvider");
            }
            return data.response;
        } catch (err: any) {
            console.error(`[OllamaProvider] Request failed for model ${this.config.model} at ${this.baseUrl}:`, err.message);
            throw new Error(`Ollama fetch failed [${this.baseUrl}]: ${err.message}`);
        }
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
        if (!(await this.isAvailable())) {
             throw new Error(`Servidor Ollama indisponível em ${this.baseUrl}. Verifique se a VPS está online.`);
        }

        let images: string[] = [];
        if (imageData) {
            images.push(imageData.base64);
        }

        const payload = {
            model: this.config.model || "qwen2.5-coder:3b",
            prompt: prompt,
            images: images.length > 0 ? images : undefined,
            stream: false,
            format: "json",
            options: OllamaProvider.modelOptions(optConfig)
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }

        const timeoutMs = OllamaProvider.timeout(optConfig?.timeout ?? process.env.AI_TIMEOUT_MS, 30000);
        const signal = AbortSignal.timeout(timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal
            });


            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (typeof data.response !== "string" || !data.response.trim()) {
                throw new Error("Resposta vazia do OllamaProvider");
            }

            let rawText = data.response.trim();
            // Clean reasoning tags (<think>...</think>) if present from DeepSeek-R1 models
            rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

            // Clean markdown codeblocks
            if (rawText.startsWith("```json")) {
                rawText = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (rawText.startsWith("```")) {
                rawText = rawText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }

            try {
                return JSON.parse(rawText) as T;
            } catch (jsonErr) {
                const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]) as T;
                }
                throw jsonErr;
            }
        } catch (err: any) {
            console.error(`[OllamaProvider] Structured extraction failed for model ${this.config.model} at ${this.baseUrl}:`, err.message);
            throw new Error(`Ollama fetch failed [${this.baseUrl}]: ${err.message}`);
        }
    }
}
