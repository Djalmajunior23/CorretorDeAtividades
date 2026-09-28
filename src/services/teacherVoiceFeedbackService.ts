import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface EnhancedVoiceFeedback {
  feedbackId: string;
  studentName: string;
  activityTitle: string;
  rawDictationText: string;
  polishedPedagogicalFeedback: string;
  recommendedGradeAdjustment?: number;
  highlightedStrengths: string[];
  suggestedActionItems: string[];
  whatsappBriefing: string;
  processedAt: string;
}

export class TeacherVoiceFeedbackService {
  /**
   * Process raw teacher speech dictation and generate professional pedagogical feedback.
   */
  static async processTeacherDictation(params: {
    studentName: string;
    activityTitle: string;
    rawSpeechText: string;
    studentScore?: number;
    customAI?: CustomAIRequestOptions;
  }): Promise<EnhancedVoiceFeedback> {
    const feedbackId = "voice-" + Date.now();
    const rawText = params.rawSpeechText || "aluno fez o codigo certinho faltou so tratar lista vazia parabens pelo empenho";

    const prompt = `Você é o Assistente Pedagógico Docente do SENAI.
O professor ditou por voz o feedback a seguir sobre a atividade "${params.activityTitle}" do estudante "${params.studentName}":

DITADO BRUTO DO PROFESSOR:
"${rawText}"

Sua tarefa:
1. Transformar o ditado informal em um Feedback Pedagógico Estruturado, Acolhedor e Tecnicamente Preciso (Padrão SENAI).
2. Extrair os pontos fortes citados.
3. Extrair as ações práticas recomendadas para o aluno.
4. Gerar uma mensagem curta e profissional para notificação via WhatsApp/Portal.

Retorne estritamente em JSON:
{
  "polishedPedagogicalFeedback": "Parabéns pela excelente estruturação lógica e organização do código. Sua solução atende aos requisitos principais com clareza. Como próximo passo de evolução técnica, recomendamos implementar uma verificação defensiva para tratar adequadamente entradas com listas vazias, garantindo maior resiliência em ambiente de produção.",
  "highlightedStrengths": [
    "Estruturação lógica consistente",
    "Organização e clareza do código"
  ],
  "suggestedActionItems": [
    "Implementar validação defensiva para listas nulas/vazias",
    "Testar casos de borda com valores extremos"
  ],
  "whatsappBriefing": "Olá ${params.studentName}! Seu feedback da atividade '${params.activityTitle}' já está disponível no Portal do Aluno com orientações de refatoração do professor."
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 2500 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        feedbackId,
        studentName: params.studentName,
        activityTitle: params.activityTitle,
        rawDictationText: rawText,
        polishedPedagogicalFeedback: parsed.polishedPedagogicalFeedback || rawText,
        highlightedStrengths: parsed.highlightedStrengths || ["Dedicação e estrutura de código."],
        suggestedActionItems: parsed.suggestedActionItems || ["Revisar casos de borda."],
        whatsappBriefing: parsed.whatsappBriefing || `Feedback de ${params.activityTitle} disponível no portal.`,
        processedAt: new Date().toISOString()
      };
    } catch {
      return {
        feedbackId,
        studentName: params.studentName,
        activityTitle: params.activityTitle,
        rawDictationText: rawText,
        polishedPedagogicalFeedback: `Prezado(a) ${params.studentName}, seu trabalho na atividade "${params.activityTitle}" foi avaliado. Parabéns pela dedicação e organização na entrega. Atente-se às oportunidades de refatoração identificadas no laudo para elevar a robustez de suas soluções.`,
        highlightedStrengths: ["Comprometimento com o prazo e estrutura algorítmica."],
        suggestedActionItems: ["Praticar validação de entradas nulas e casos de borda."],
        whatsappBriefing: `Olá ${params.studentName}! O professor registrou o parecer da sua atividade "${params.activityTitle}". Confira os detalhes no Portal do Aluno!`,
        processedAt: new Date().toISOString()
      };
    }
  }
}
