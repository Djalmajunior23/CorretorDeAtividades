import { BaseProvider, AIConfig } from "./BaseProvider";

export class OllamaProvider extends BaseProvider {
    private baseUrl: string;

    constructor(config: AIConfig) {
        super(config);
        const baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    private async isAvailable(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: "GET",
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (err) {
            return false;
        }
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        if (!(await this.isAvailable())) {
             throw new Error("Servidor Ollama indisponível.");
        }
        
        let images: string[] = [];
        if (imageData) {
            images.push(imageData.base64);
        }

        const payload = {
            model: this.config.model || "llama3",
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
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout for generation

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
             throw new Error("Servidor Ollama indisponível.");
        }
        
        let images: string[] = [];
        if (imageData) {
            images.push(imageData.base64);
        }

        const payload = {
            model: this.config.model || "llama3",
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
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout for generation

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
                throw new Error("Empty response from OllamaProvider");
            }
            
            return JSON.parse(data.response) as T;
        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error(`[OllamaProvider] Structured extraction failed for model ${this.config.model} at ${this.baseUrl}:`, err.message);
            throw new Error(`Ollama fetch failed [${this.baseUrl}]: ${err.message}`);
        }
    }
}
