import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class FeedbackService {
    static async generateFeedback(correctionData: any): Promise<string> {
        const prompt = `
        Atue como um Mentor Pedagógico especializado em Computação.
        Sua missão é gerar um feedback humano, motivador e extremamente didático para o aluno.
        
        REGRAS DO FEEDBACK:
        1. Comece validando o que o aluno fez de correto (Acolhimento).
        2. Explique os erros de forma técnica mas gentil, usando analogias se necessário.
        3. Incentive a persistência.
        4. NÃO seja agressivo ou meramente corretivo.
        5. Sugira próximos passos claros.
        
        Dados da Correção Técnica:
        ${JSON.stringify(correctionData, null, 2)}
        
        Formate em Markdown elegante.
        `;

        return await AIGateway.executeTask<string>(
            AITask.PEDAGOGICAL_FEEDBACK,
            prompt
        ) as string;
    }
}
