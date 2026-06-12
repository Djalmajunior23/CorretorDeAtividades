import { BaseProvider, AIConfig } from "./BaseProvider";

export class OllamaProvider extends BaseProvider {
    private baseUrl: string;

    constructor(config: AIConfig) {
        super(config);
        this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
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

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || "";
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
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

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.response) {
            throw new Error("Empty response from OllamaProvider");
        }
        
        return JSON.parse(data.response) as T;
    }
}
