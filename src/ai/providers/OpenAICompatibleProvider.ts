import { BaseProvider, AIConfig } from "./BaseProvider";

export interface OpenAICompatibleConfig {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
}

export class OpenAICompatibleProvider extends BaseProvider {
    private baseUrl: string;

    constructor(config: OpenAICompatibleConfig) {
        const fullConfig: AIConfig = {
            provider: config.provider || "openai",
            model: config.model || "gpt-4o-mini",
            apiKey: config.apiKey,
            baseUrl: config.baseUrl
        };
        super(fullConfig);
        const baseUrl = config.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    private getApiKey(): string {
        return this.config.apiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY || "";
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey && !this.baseUrl.includes("localhost") && !this.baseUrl.includes("127.0.0.1") && !this.baseUrl.includes("docker")) {
            throw new Error("Chave de API não configurada para provedor OpenAI/Groq/DeepSeek.");
        }

        const messages: any[] = [];
        if (imageData) {
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${imageData.mimeType};base64,${imageData.base64}`
                        }
                    }
                ]
            });
        } else {
            messages.push({
                role: "user",
                content: prompt
            });
        }

        const model = this.config.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
        const payload: any = {
            model,
            messages,
            temperature: optConfig?.temperature ?? 0.4,
            max_tokens: optConfig?.max_tokens ?? 4000
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const controller = new AbortController();
        const timeoutMs = optConfig?.timeout ?? 90000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`OpenAI-compatible API error (${response.status}): ${errBody}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "";
            return text;
        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error(`[OpenAICompatibleProvider] Error with model ${model} at ${this.baseUrl}:`, err.message);
            throw err;
        }
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
        const enhancedPrompt = `${prompt}\n\nIMPORTANTE: Retorne estritamente um objeto JSON válido correspondente ao schema solicitado. Não inclua blocos markdown como \`\`\`json. Responda apenas o JSON puro.`;
        const rawContent = await this.generateContent(enhancedPrompt, { ...optConfig, temperature: 0.2 }, imageData);
        
        let cleaned = rawContent.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        try {
            return JSON.parse(cleaned) as T;
        } catch (e: any) {
            const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as T;
            }
            throw new Error(`Falha ao converter resposta da IA em JSON: ${e.message}. Conteúdo: ${cleaned.slice(0, 200)}...`);
        }
    }
}
