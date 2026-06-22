import { LocalRuleEngine } from "../../services/localRuleEngine";
import { AITask } from "../types";
import { ProviderFactory } from "../factory/ProviderFactory";

export class AIGateway {
    static async executeTask<T>(task: string, prompt: string, options?: any, imageData?: any): Promise<T> {
        try {
            // Tenta chamar o provedor principal (ex: Ollama)
            const provider = ProviderFactory.createProvider(task);
            if (!provider) throw new Error("A IA local (Ollama) está indisponível ou falhou no momento.");
            
                        if (task === AITask.IMAGE_OCR || task === AITask.GENERAL_ANALYSIS) {
                return (await provider.generateContent(prompt, options, imageData)) as any as T;
            }
            return await provider.generateStructured(prompt, null, options, imageData);
        } catch (error: any) {
            console.warn("[AIGateway] Ollama falhou. Erro:", error.message);
            console.warn("[AIGateway] Iniciando Fallback Local do CodeCheck.");

            if (task === AITask.IMAGE_OCR) {
                // Deixa falhar para que o OCRService assuma apenas com Tesseract
                throw new Error("A IA local (Ollama) está indisponível no momento.");
            }

            // O LocalRuleEngine é acionado caso seja uma correção/validação.
            // Extraímos a linguagem e o código do prompt para a análise básica.
            let lang = 'python';
            if (prompt.toLowerCase().includes('java')) lang = 'java';
            else if (prompt.toLowerCase().includes('javascript') || prompt.toLowerCase().includes('typescript')) lang = 'javascript';

            // Usamos uma heurística para pegar o que parece ser código do prompt, ou enviamos tudo
            const fallbackResult = LocalRuleEngine.analyzeCode(lang, prompt);
            
            return fallbackResult as any as T;
        }
    }
}
