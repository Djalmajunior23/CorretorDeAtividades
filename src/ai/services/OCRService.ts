import { AIGateway } from "./AIGateway";
import { AITask } from "../types";
import Tesseract from "tesseract.js";

export class OCRService {
    static async extractTextFromImage(base64Image: string): Promise<string> {
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
                return aiResult;
            }
            throw new Error("AI Vision returned insufficient results");
        } catch (error) {
            console.warn("[OCRService] AI Vision failed, falling back to Tesseract:", error);
            // Fallback: Tesseract.js
            const result = await Tesseract.recognize(base64Image, 'por+eng', {
                logger: m => console.log(m)
            });
            return result.data.text;
        }
    }
}
