import { AIGateway } from "./AIGateway";
import { AITask, CodeCorrectionRequest, CodeCorrectionResponse } from "../types";

export class CodeAnalysisService {
    static async correctCode(request: CodeCorrectionRequest): Promise<CodeCorrectionResponse> {
        const prompt = `
        Atue como um Arquiteto de Software Sênior e Especialista em IA Educacional.
        Sua missão é realizar uma correção inteligente e pedagógica do código enviado pelo aluno.
        
        Linguagem: ${request.language}
        Nível: ${request.level}
        Enunciado: ${request.statement}
        Rubrica de Avaliação (Critérios e Pesos): ${request.rubric}
        
        Código do Aluno:
        \`\`\`${request.language}
        ${request.code}
        \`\`\`
        
        REGRAS DE AVALIAÇÃO:
        1. Calcule a NOTA FINAL (0-100) baseada nos critérios da rubrica.
        2. Seja construtivo e motivador no feedback.
        3. Identifique pontos fortes e pontos de melhoria com linguagem educacional.
        4. Gere recomendações de estudo específicas para as lacunas detectadas.
        
        Sua resposta deve ser estritamente em JSON seguindo este formato:
        {
          "final_score": número (0-100),
          "criteria_scores": { "nome_criterio": nota_obtida, ... },
          "summary": "resumo pedagógico conciso das conquistas do aluno",
          "strengths": ["ponto forte 1", "ponto forte 2"],
          "weaknesses": ["lacuna 1", "lacuna 2"],
          "errors_found": ["erro técnico 1", "erro técnico 2"],
          "recommendations": ["sujestão de estudo 1", "sujestão de estudo 2"],
          "teacher_summary": "resumo técnico de alto nível para o professor",
          "suggested_solution": "código completo da solução otimizada e comentada"
        }
        `;

        const schema = {
            type: "object",
            properties: {
                final_score: { type: "number" },
                criteria_scores: { type: "object", additionalProperties: { type: "number" } },
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                errors_found: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                teacher_summary: { type: "string" },
                suggested_solution: { type: "string" }
            },
            required: ["final_score", "criteria_scores", "summary", "strengths", "weaknesses", "errors_found", "recommendations", "teacher_summary", "suggested_solution"]
        };

        return await AIGateway.executeTask<CodeCorrectionResponse>(
            AITask.CODE_CORRECTION,
            prompt,
            schema
        ) as CodeCorrectionResponse;
    }
}
