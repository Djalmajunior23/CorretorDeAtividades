import Tesseract from "tesseract.js";
import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class OCRService {
    static isBase64Str(str: string) {
        return /^[a-zA-Z0-9+/]+={0,2}$/.test(str);
    }

    static async extractTextFromImage(base64Image: string, skipAiCorrection = false): Promise<{ text: string; aiAnalysisAvailable: boolean; aiError?: string; error?: string }> {
        // 1. Tenta PRIMEIRO Visão Multimodal com IA (Gemini 2.5 Flash / Groq / OpenAI / Ollama Vision)
        // Isso executa em < 1 segundo e tem precisão superior ao OCR CPU
        if (!skipAiCorrection) {
            try {
                const prompt = "Transcreva com máxima precisão todo o código-fonte ou texto/diagrama presente nesta imagem. Retorne EXCLUSIVAMENTE o texto/código transcrito limpo, sem introduções, sem explicações e sem delimitadores de markdown adicionais.";
                const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
                const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                
                const imageData = {
                    mimeType,
                    base64: rawBase64
                };
                
                const aiResult = await AIGateway.executeTask<string>(
                    AITask.IMAGE_OCR,
                    prompt,
                    { timeout: 12000 },
                    imageData
                ) as string;

                if (aiResult && aiResult.trim().length > 5) {
                    let cleanedResult = aiResult.trim();
                    if (cleanedResult.includes("```")) {
                        const regex = /```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)```/g;
                        let match;
                        let extractedCode = "";
                        while ((match = regex.exec(cleanedResult)) !== null) {
                            extractedCode += match[1] + "\n";
                        }
                        if (extractedCode.trim()) {
                            cleanedResult = extractedCode.trim();
                        } else {
                            const parts = cleanedResult.split("```");
                            if (parts.length >= 3) {
                                cleanedResult = parts[1].replace(/^[a-zA-Z0-9+#-]+\n/, "").trim();
                            }
                        }
                    }
                    cleanedResult = cleanedResult.replace(/^```[a-zA-Z0-9+#-]*\n?/, "").replace(/```$/, "").trim();
                    
                    return { text: cleanedResult, aiAnalysisAvailable: true };
                }
            } catch (aiErr: any) {
                console.warn("[OCRService] Multimodal AI Vision indisponível ou falhou, acionando fallback Tesseract:", aiErr.message);
            }
        }

        // 2. Fallback: OCR local com Tesseract se a IA Multimodal falhar ou estiver offline
        let extractedText = "";
        try {
            const isBase64 = this.isBase64Str(base64Image);
            const source = isBase64 && !base64Image.startsWith('data:') 
                ? `data:image/png;base64,${base64Image}` 
                : base64Image;

            const result = await Tesseract.recognize(source, 'por+eng');
            extractedText = result.data.text || "";
            return {
                text: extractedText,
                aiAnalysisAvailable: false
            };
        } catch (tesseractError: any) {
            console.error("[OCRService] Tesseract failed:", tesseractError);
            return {
                text: "",
                aiAnalysisAvailable: false,
                error: "OCR local (Tesseract) falhou na extração do texto."
            };
        }
    }
}
