import { BaseProvider, AIConfig } from "./BaseProvider";

export class OllamaProvider extends BaseProvider {
    private baseUrl: string;

    constructor(config: AIConfig) {
        super(config);
        const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    public async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);
            
            const headers: Record<string, string> = {};
            if (this.config.apiKey) {
                headers["Authorization"] = `Bearer ${this.config.apiKey}`;
            }

            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: "GET",
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (err) {
            return false;
        }
    }

    static async listModels(baseUrl?: string, apiKey?: string): Promise<string[]> {
        const url = (baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434").replace(/\/$/, "");
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);
            const headers: Record<string, string> = {};
            if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

            const response = await fetch(`${url}/api/tags`, { headers, signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                return (data.models || []).map((m: any) => m.name || m.model);
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
            options: optConfig
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutMs = optConfig?.timeout ?? 120000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || "";
        } catch (err: any) {
            clearTimeout(timeoutId);
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
            options: optConfig
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }

        const controller = new AbortController();
        const timeoutMs = optConfig?.timeout ?? 120000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.response) {
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
            clearTimeout(timeoutId);
            console.error(`[OllamaProvider] Structured extraction failed for model ${this.config.model} at ${this.baseUrl}:`, err.message);
            throw new Error(`Ollama fetch failed [${this.baseUrl}]: ${err.message}`);
        }
    }
}
