export interface AIConfig {
    provider: string; // "gemini", "openai", "local", etc.
    model: string;
    apiKey?: string;
    baseUrl?: string;
}

export abstract class BaseProvider {
    protected config: AIConfig;

    constructor(config: AIConfig) {
        this.config = config;
    }

    /**
     * Gera conteúdo baseado no prompt, opcionalmente com dados de imagem base64
     */
    abstract generateContent(prompt: string, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<string>;
    
    /**
     * Extrai estrutura JSON de resposta
     */
    abstract generateStructured<T>(prompt: string, schema: any, optConfig?: any, imageData?: { mimeType: string, base64: string }): Promise<T>;
}
