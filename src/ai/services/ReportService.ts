import { AIGateway } from "./AIGateway";
import { AITask } from "../types";

export class ReportService {
    static async generateReport(classData: any): Promise<string> {
        const prompt = `
        Gere um relatório de desempenho da turma para o professor.
        Analise a cobertura de competências, pontos críticos de erro e sugestões de intervenção pedagógica.
        
        Dados da Turma:
        ${JSON.stringify(classData, null, 2)}
        
        O relatório deve ser profissional, estruturado em markdown e pronto para uma reunião pedagógica.
        `;

        return await AIGateway.executeTask<string>(
            AITask.REPORT_GENERATION,
            prompt
        ) as string;
    }
}
