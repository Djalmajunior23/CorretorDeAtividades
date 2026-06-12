import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave de API Gemini (GEMINI_API_KEY) não está configurada nas variáveis de ambiente. Por favor, adicione-a para habilitar esta funcionalidade.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export async function generateActivityWithIA(params: any) {
  const prompt = `
  Você é um professor sênior de Ciência da Computação.
  Sua tarefa é criar uma atividade de programação (exercício prático) perfeitamente estruturada para o estudante.
  
  Parâmetros da Atividade:
  - Tema: ${params.theme || "Lógica de Programação"}
  - Linguagem: ${params.language || "Agnóstica ou Python"}
  - Dificuldade: ${params.difficulty || "Iniciante"}
  - Competência: ${params.competence || "Algoritmos básicos"}
  - Tipo: ${params.type || "Desafio Prático"}
  - Contexto: ${params.context || "Programação voltada ao mercado de trabalho"}

  Você deve gerar a saída no formato JSON com as seguintes chaves (MANTENHA EXATAMENTE ESTES NOMES NO JSON. NENHUM CAMPO DEVE FALTAR):
  - title (string): Título criativo e prático
  - problem_description (string): Enunciado contextualizado explicando o que o aluno deve fazer.
  - inputs_desc (string): O que o programa recebe.
  - outputs_desc (string): A resposta esperada do programa.
  - constraints (string): Restrições (ex: tamanho dos números, tempo).
  - test_cases (array de objetos): Gere no mínimo ${params.testCasesCount || 4} casos de teste.
      -- No json do test case deve haver 'input_data' (string), 'expected_output' (string) e 'is_hidden' (boolean, deixe ao menos 2 ocultos).
  - solution_code (string): O código gabarito na linguagem especificada.
  - rubric_suggested (string): Critérios para avaliação desta tarefa (ex: complexidade, legibilidade, etc).
  - tags (array of strings): Tags técnicas (ex: for-loop, math).

  Responda DE FORMA ESTILIZADA ESTREITAMENTE COM JSON VÁLIDO. NÃO adicione \`\`\`json ou marcações de bloco. Apenas o objeto JSON puro.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    let rawText = response.text || "{}";
    rawText = rawText.replace(/\\`\\`\\`json/g, '').replace(/\\`\\`\\`/g, '').trim();
    
    const activityData = JSON.parse(rawText);
    return activityData;
  } catch (error: any) {
    console.error("AI Activity Generation Error:", error.message);
    throw new Error(error.message || "Falha ao gerar atividade com IA. Detalhes no console.");
  }
}
