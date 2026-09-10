import { AIConfig, BaseProvider } from "../providers/BaseProvider";
import { OllamaProvider } from "../providers/OllamaProvider";
import { GeminiProvider } from "../providers/GeminiProvider";
import { OpenAICompatibleProvider } from "../providers/OpenAICompatibleProvider";
import { getModelForTask } from "../../services/aiRouter";

export interface CustomAIRequestOptions {
    provider?: "ollama" | "gemini" | "openai" | "groq" | "deepseek" | "auto" | string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
}

class MultiFallbackProvider extends BaseProvider {
    constructor(private providers: BaseProvider[]) {
        super(providers[0]?.config || { provider: "fallback" });
    }

    async generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<string> {
        let lastError: any = null;
        for (const p of this.providers) {
            try {
                return await p.generateContent(prompt, optConfig, imageData);
            } catch (err: any) {
                lastError = err;
                console.warn(`[MultiFallbackProvider] Provider (${p.config.provider} - ${p.config.model}) failed: ${err.message}. Trying next fallback...`);
            }
        }
        throw lastError || new Error("Todos os provedores de IA falharam.");
    }

    async generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string; base64: string }): Promise<T> {
        let lastError: any = null;
        for (const p of this.providers) {
            try {
                return await p.generateStructured<T>(prompt, schema, optConfig, imageData);
            } catch (err: any) {
                lastError = err;
                console.warn(`[MultiFallbackProvider] Provider (${p.config.provider} - ${p.config.model}) failed: ${err.message}. Trying next fallback...`);
            }
        }
        throw lastError || new Error("Todos os provedores de IA falharam ao gerar saída estruturada.");
    }
}

export class ProviderFactory {
    static createProvider(task?: string): BaseProvider {
        const providerName = (process.env.AI_PROVIDER || "ollama").toLowerCase();
        const modelName = getModelForTask(task);

        return this.createCustomProvider({
            provider: providerName,
            model: modelName
        });
    }

    static createCustomProvider(options?: CustomAIRequestOptions): BaseProvider {
        const reqProvider = (options?.provider || process.env.AI_PROVIDER || "ollama").toLowerCase();
        const reqModel = options?.model;

        // 1. Instancia Ollama Provider
        const ollamaBaseUrl = options?.baseUrl || process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";
        const ollamaProvider = new OllamaProvider({
            provider: "ollama",
            model: reqModel || process.env.AI_CODE_MODEL || "qwen2.5-coder:3b",
            baseUrl: ollamaBaseUrl,
            apiKey: options?.apiKey || process.env.OLLAMA_PROXY_TOKEN
        });

        // 2. Instancia Gemini Provider se chave existir
        const geminiKey = options?.apiKey || process.env.GEMINI_API_KEY;
        const geminiProvider = geminiKey ? new GeminiProvider({
            provider: "gemini",
            model: reqModel?.includes("gemini") ? reqModel : (process.env.AI_ACTIVITY_MODEL || "gemini-2.5-flash"),
            apiKey: geminiKey
        }) : null;

        // 3. Instancia OpenAI / Groq / DeepSeek Provider se configurado
        const openaiKey = options?.apiKey || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY;
        let openaiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
        if (reqProvider === "groq") openaiBaseUrl = "https://api.groq.com/openai/v1";
        if (reqProvider === "deepseek") openaiBaseUrl = "https://api.deepseek.com/v1";

        const openaiProvider = openaiKey ? new OpenAICompatibleProvider({
            provider: reqProvider === "groq" ? "groq" : (reqProvider === "deepseek" ? "deepseek" : "openai"),
            model: reqModel || (reqProvider === "groq" ? "llama-3.3-70b-versatile" : (reqProvider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini")),
            baseUrl: options?.baseUrl || openaiBaseUrl,
            apiKey: openaiKey
        }) : null;

        // Roteamento explícito
        if (reqProvider === "gemini" && geminiProvider) {
            return geminiProvider;
        }

        if ((reqProvider === "openai" || reqProvider === "groq" || reqProvider === "deepseek") && openaiProvider) {
            return openaiProvider;
        }

        if (reqProvider === "ollama") {
            // Em caso de fallback configurado: Ollama -> Gemini -> OpenAI
            const chain: BaseProvider[] = [ollamaProvider];
            if (geminiProvider) chain.push(geminiProvider);
            if (openaiProvider) chain.push(openaiProvider);
            return chain.length > 1 ? new MultiFallbackProvider(chain) : ollamaProvider;
        }

        // Modo "auto": Tenta Ollama VPS -> Gemini -> OpenAI
        const autoChain: BaseProvider[] = [ollamaProvider];
        if (geminiProvider) autoChain.push(geminiProvider);
        if (openaiProvider) autoChain.push(openaiProvider);

        return autoChain.length > 1 ? new MultiFallbackProvider(autoChain) : ollamaProvider;
    }
}
