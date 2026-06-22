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
            const prompt = "Corrija formatação e erros do código/texto extraído:\n\n" + extractedText;
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
                return { text: aiResult, aiAnalysisAvailable: true };
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
