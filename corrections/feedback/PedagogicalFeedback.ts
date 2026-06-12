import { aiService } from "../../src/ai/services/AIService";

export interface FeedbackStructure {
  summary: string;
  strengths: string[];
  errors: string[];
  improvements: string[];
  concepts_to_review: string[];
  next_steps: string[];
}

export class PedagogicalFeedback {
  /**
   * Generates feedback structure.
   */
  static async generate(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    securityOk: boolean,
    securityReason: string | null
  ): Promise<FeedbackStructure> {
    
    // Check if security blocked
    if (!securityOk) {
      return {
        summary: "Seu exercício foi bloqueado na validação de segurança automática devido a diretivas arriscadas integradas.",
        strengths: ["Uso de palavras reservadas avançadas (embora não permitidas)"],
        errors: [`Ação de segurança: ${securityReason || "Código potencialmente perigoso"}`],
        improvements: ["Remova importações de sistema operacional ou bibliotecas de manipulação de rede/arquivos", "Conserte a lógica para seguir estritamente o escopo do algoritmo proposto"],
        concepts_to_review: ["Sanitização de Código", "Ambientes Sandbox de Compilação", "Boas Práticas de Desenvolvimento Seguro"],
        next_steps: ["Revise as palavras-chave do código", "Submeta uma solução puramente algorítmica"]
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING", description: "Resumo pedagógico geral da resolução do aluno." },
            strengths: { type: "ARRAY", items: { type: "STRING" }, description: "Lista de 1 a 3 pontos fortes do código escrito pelo aluno." },
            errors: { type: "ARRAY", items: { type: "STRING" }, description: "O erro principal observado ou potenciais falhas em testes." },
            improvements: { type: "ARRAY", items: { type: "STRING" }, description: "Melhorias de legibilidade, indentação ou nomes sugeridas." },
            concepts_to_review: { type: "ARRAY", items: { type: "STRING" }, description: "Quais tópicos acadêmicos o aluno deve estudar para dominar isso." },
            next_steps: { type: "ARRAY", items: { type: "STRING" }, description: "Próximos passos imediatos sugeridos (ex: testar caso limite)." }
          },
          required: ["summary", "strengths", "errors", "improvements", "concepts_to_review", "next_steps"]
        };

        const optConfig = {
          systemInstruction: "Você é um professor tutor de algoritmos e programação sênior, super carinhoso, didático e motivador. Seu papel é corrigir e explicar trechos de códigos estudantis sem entregar a resposta final de bandeja."
        };

        const promptText = `Analise as seguintes métricas de correção de código e gere o feedback pedagógico estruturado:
Linguagem: ${language}
Sintaxe OK: ${syntaxOk}
Métricas de testes: passou em ${testsPassed} de ${totalTests} testes unitários.
Problemas estáticos de qualidade sinalizados: ${JSON.stringify(qualityIssues)}
Mensagem de erro de compilação/execução (stderr): ${stderr}

Código submetido pelo discente:
\`\`\`
${code}
\`\`\``;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        
        if (payload) {
          return {
            summary: payload.summary || "Revisão gerada com sucesso pela IA de Ensino.",
            strengths: payload.strengths || [],
            errors: payload.errors || [],
            improvements: payload.improvements || [],
            concepts_to_review: payload.concepts_to_review || [],
            next_steps: payload.next_steps || []
          };
        }
      } catch (err: any) {
        console.warn("Failing over to rule-based feedback generator due to AI service issue:", err.message);
      }
    }

    // Heuristics Static Fallback Generator (Rule-Based)
    return this.generateHeuristicFeedback(language, code, syntaxOk, totalTests, testsPassed, qualityIssues, stderr);
  }

  private static generateHeuristicFeedback(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string
  ): FeedbackStructure {
    const isSuccess = testsPassed === totalTests && syntaxOk && totalTests > 0;
    
    // Strengths Heuristics
    const strengths: string[] = [];
    if (code.length > 50) strengths.push("Estrutura do código consistente e completa.");
    if (syntaxOk) strengths.push("Sintaxe limpa, sem erros de compilação iniciais.");
    if (testsPassed > 0) strengths.push(`${testsPassed} casos de teste validados com sucesso.`);
    if (strengths.length === 0) strengths.push("Esforço sincero para resolver a atividade.");

    // Errors Heuristics
    const errors: string[] = [];
    if (!syntaxOk) {
      errors.push(`Erro de sintaxe detectado. Verifique os pontos e vírgulas: ${stderr.slice(0, 80)}`);
    } else if (testsPassed < totalTests) {
      errors.push(`Seu algoritmo falhou em cobrir as saídas desejadas para alguns casos de teste.`);
    }

    // Improvements Heuristics
    const improvements = qualityIssues.length > 0 
      ? qualityIssues 
      : ["Seu código já apresenta excelente nível! Continue praticando estruturas limpas."];

    // Concepts to Review
    const concepts_to_review: string[] = [];
    if (!syntaxOk) {
      concepts_to_review.push("Regras de Sintaxe e Erros de Compilador");
    }
    if (testsPassed < totalTests) {
      concepts_to_review.push("Lógica de Condicionais e Estruturas de Loops");
      concepts_to_review.push("Validação de Casos de Borda (Corner Cases)");
    }
    if (code.toLowerCase().includes("for") || code.toLowerCase().includes("while")) {
      concepts_to_review.push("Complexidade e Estruturas de Repetição");
    }
    if (concepts_to_review.length === 0) {
      concepts_to_review.push("Otimização de Algoritmos", "Lógica Avançada");
    }

    // Next Steps
    const next_steps: string[] = [];
    if (!syntaxOk) {
      next_steps.push("Conserte o erro na linha sinalizada no log de erros do compilador.");
    } else if (testsPassed < totalTests) {
      next_steps.push("Simule a execução do código com papel e caneta para as entradas que falharam.");
    } else {
      next_steps.push("Experimente resolver o mesmo problema utilizando uma abordagem diferente (ex: recursão vs loops).");
    }

    // Prepare pedagogical Teacher Summary
    let summary = "";
    if (isSuccess) {
      summary = `Parabéns! Seu código passou em todos os testes unitários da avaliação. A lógica está excelente, o código está muito limpo na linguagem ${language.toUpperCase()} e você demonstrou completo domínio do conceito estudado.`;
    } else if (!syntaxOk) {
      summary = `Detectei problemas na estrutura gramatical do seu código na linguagem ${language.toUpperCase()}. O compilador não conseguiu executar o programa devido a erros de formatação (ex: falta de fechamento de blocos ou erro de digitação).`;
    } else if (testsPassed > 0) {
      summary = `Bom trabalho! Algumas partes da sua implementação de código funcionam corretamente (foram aprovados ${testsPassed} testes de ${totalTests}), mas há cenários específicos onde a resposta fornecida diverge do esperado pelo professor tutor.`;
    } else {
      summary = `O algoritmo foi executado, mas nenhum dos testes foi completado com a saída desejável. Vamos revisar e ajustar a lógica de processamento de entrada e saída juntas de forma pedagógica.`;
    }

    return {
      summary,
      strengths,
      errors: errors.length > 0 ? errors : ["Nenhum erro grave detectado."],
      improvements,
      concepts_to_review,
      next_steps
    };
  }
}
