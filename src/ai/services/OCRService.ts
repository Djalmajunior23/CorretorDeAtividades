import Tesseract from "tesseract.js";
import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class OCRService {
    static isBase64Str(str: string) {
        return /^[a-zA-Z0-9+/]+={0,2}$/.test(str);
    }

    static async extractTextFromImage(base64Image: string): Promise<{ text: string; aiAnalysisAvailable: boolean; aiError?: string; error?: string }> {
        let extractedText = "";
        
        try {
            // Primeiro: OCR local com Tesseract
            const isBase64 = this.isBase64Str(base64Image);
            const source = isBase64 && !base64Image.startsWith('data:') 
                ? `data:image/png;base64,${base64Image}` 
                : base64Image;

            const result = await Tesseract.recognize(source, 'por+eng');
            extractedText = result.data.text;
        } catch (tesseractError) {
            console.error("[OCRService] Tesseract failed:", tesseractError);
            return {
                text: "",
                aiAnalysisAvailable: false,
                error: "OCR local (Tesseract) falhou na extração do texto."
            };
        }

        try {
            // Segundo: uso opcional da IA
            const prompt = "Corrija formatação e erros do código extraído pela imagem. ATENÇÃO: Retorne APENAS o código fonte extraído e corrigido de forma limpa, sem qualquer introdução, explicação, texto em markdown ou delimitadores de código (como ```). O resultado deve ser diretamente executável.\n\nCódigo extraído:\n" + extractedText;
            const imageData = {
                mimeType: "image/png", 
                base64: base64Image.replace(/^data:image\/\w+;base64,/, "")
            };
            
            const aiResult = await AIGateway.executeTask<string>(
                AITask.IMAGE_OCR,
                prompt,
                undefined,
                imageData
            ) as string;

            if (aiResult && aiResult.trim().length > 10) {
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
                // Strip any loose backticks if any remain
                cleanedResult = cleanedResult.replace(/^```[a-zA-Z0-9+#-]*\n?/, "").replace(/```$/, "").trim();
                
                return { text: cleanedResult, aiAnalysisAvailable: true };
            }
            throw new Error("AI Vision returned insufficient results");
        } catch (error: any) {
            console.warn("[OCRService] AI Vision failed or Ollama unavailable, returning Tesseract result.");
            return { 
                text: extractedText, 
                aiAnalysisAvailable: false,
                aiError: error.message || "IA local indisponível no momento."
            };
        }
    }
}
