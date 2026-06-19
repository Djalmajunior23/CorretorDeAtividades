import { AIGateway } from "./AIGateway";
import { AITask } from "../types";
import Tesseract from "tesseract.js";

export class OCRService {
    static async extractTextFromImage(base64Image: string): Promise<{ text: string; aiAnalysisAvailable: boolean; error?: string }> {
        try {
            // First attempt: use AI Vision (Ollama or Gemini)
            const prompt = "Extraia todo o texto desta imagem. Se houver código, preserve a indentação e a estrutura. Retorne apenas o texto extraído.";
            const imageData = {
                mimeType: "image/png", // Assuming PNG, but should be dynamic in a real app
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
        } catch (error) {
            console.warn("[OCRService] AI Vision failed or Ollama unavailable, falling back to Tesseract.");
            
            try {
                // Fallback: Tesseract.js
                const result = await Tesseract.recognize(base64Image, 'por+eng');
                
                return { 
                    text: result.data.text, 
                    aiAnalysisAvailable: false 
                };
            } catch (tesseractError) {
                console.error("[OCRService] Tesseract also failed:", tesseractError);
                return {
                    text: "",
                    aiAnalysisAvailable: false,
                    error: "Tanto a IA quanto o Tesseract falharam na extração do texto."
                };
            }
        }
    }
}
