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
        const providerName = (process.env.AI_PROVIDER || "auto").toLowerCase();
        const modelName = getModelForTask(task);

        return this.createCustomProvider({
            provider: providerName,
            model: modelName
        });
    }

    static createCustomProvider(options?: CustomAIRequestOptions): BaseProvider {
        const reqProvider = (options?.provider || process.env.AI_PROVIDER || "auto").toLowerCase();
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
        const geminiKey = (reqProvider === "gemini" ? options?.apiKey : undefined) || process.env.GEMINI_API_KEY;
        const geminiProvider = geminiKey ? new GeminiProvider({
            provider: "gemini",
            model: reqModel?.includes("gemini") ? reqModel : (process.env.AI_ACTIVITY_MODEL || "gemini-2.5-flash"),
            apiKey: geminiKey
        }) : null;

        // 3. Instancia Groq Provider (Ultra-rápido LPU)
        const groqKey = (reqProvider === "groq" ? options?.apiKey : undefined) || process.env.GROQ_API_KEY;
        const groqProvider = groqKey ? new OpenAICompatibleProvider({
            provider: "groq",
            model: reqModel || "llama-3.3-70b-versatile",
            baseUrl: "https://api.groq.com/openai/v1",
            apiKey: groqKey
        }) : null;

        // 4. Instancia DeepSeek Provider
        const deepseekKey = (reqProvider === "deepseek" ? options?.apiKey : undefined) || process.env.DEEPSEEK_API_KEY;
        const deepseekProvider = deepseekKey ? new OpenAICompatibleProvider({
            provider: "deepseek",
            model: reqModel || "deepseek-chat",
            baseUrl: "https://api.deepseek.com/v1",
            apiKey: deepseekKey
        }) : null;

        // 5. Instancia OpenAI Provider
        const openaiKey = (reqProvider === "openai" ? options?.apiKey : undefined) || process.env.OPENAI_API_KEY;
        const openaiProvider = openaiKey ? new OpenAICompatibleProvider({
            provider: "openai",
            model: reqModel || "gpt-4o-mini",
            baseUrl: options?.baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
            apiKey: openaiKey
        }) : null;

        // Roteamento explícito
        if (reqProvider === "gemini" && geminiProvider) return geminiProvider;
        if (reqProvider === "groq" && groqProvider) return groqProvider;
        if (reqProvider === "deepseek" && deepseekProvider) return deepseekProvider;
        if (reqProvider === "openai" && openaiProvider) return openaiProvider;
        if (reqProvider === "ollama") {
            const chain: BaseProvider[] = [ollamaProvider];
            if (geminiProvider) chain.push(geminiProvider);
            if (groqProvider) chain.push(groqProvider);
            if (openaiProvider) chain.push(openaiProvider);
            return chain.length > 1 ? new MultiFallbackProvider(chain) : ollamaProvider;
        }

        // Modo "auto": prioriza os provedores mais rápidos com credenciais disponíveis
        const autoChain: BaseProvider[] = [];
        if (geminiProvider) autoChain.push(geminiProvider);
        if (groqProvider) autoChain.push(groqProvider);
        if (openaiProvider) autoChain.push(openaiProvider);
        if (deepseekProvider) autoChain.push(deepseekProvider);
        autoChain.push(ollamaProvider);

        return autoChain.length > 1 ? new MultiFallbackProvider(autoChain) : ollamaProvider;
    }
}
