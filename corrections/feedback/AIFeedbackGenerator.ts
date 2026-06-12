import { aiService } from "../../src/ai/services/AIService";

export interface AIFeedbackResponse {
  resumo_desempenho: string;
  pontos_fortes: string[];
  erros_encontrados: string[];
  orientacao_melhoria: string[];
  sugestao_estudo: string[];
  proxima_etapa: string[];
}

export class AIFeedbackGenerator {
  static async generate(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    finalScore: number
  ): Promise<AIFeedbackResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            resumo_desempenho: { type: "STRING", description: "Resumo didático e conciso do desempenho do discente." },
            pontos_fortes: { type: "ARRAY", items: { type: "STRING" }, description: "1 a 3 pontos destacados positivos na construção da lógica ou sintaxe." },
            erros_encontrados: { type: "ARRAY", items: { type: "STRING" }, description: "Dificuldades reais, falhas lógicas nos testes ou inconsistências." },
            orientacao_melhoria: { type: "ARRAY", items: { type: "STRING" }, description: "Dicas de refatoração, legibilidade e conformidade com as regras impostas." },
            sugestao_estudo: { type: "ARRAY", items: { type: "STRING" }, description: "Conceitos teóricos e pedagógicos recomendados para estudo posterior." },
            proxima_etapa: { type: "ARRAY", items: { type: "STRING" }, description: "Recomendações de prática ou desafios subsequentes para fixação." }
          },
          required: [
            "resumo_desempenho",
            "pontos_fortes",
            "erros_encontrados",
            "orientacao_melhoria",
            "sugestao_estudo",
            "proxima_etapa"
          ]
        };

        const optConfig = {
          systemInstruction: "Você é um mentor acadêmico inteligente do SENAI, focado em ajudar e guiar estudantes de programação. Gere feedbacks didáticos, construtivos, claros e estimulantes."
        };

        const promptText = `
Ajude o aluno a evoluir gerando um feedback pedagógico estruturado sobre o exercício dele.
Linguagem: ${language}
Sintaxe OK: ${syntaxOk}
Testes: passou em ${testsPassed} de ${totalTests} testes unitários.
Nota final obtida: ${finalScore}/100.
Problemas de Qualidade estáticos identificados: ${JSON.stringify(qualityIssues)}
Mensagem de Erro/Logs (stderr): ${stderr}

Código submetido pelo estudante:
\`\`\`
${code}
\`\`\``;

        const payload = await aiService.generateStructuredWithRetry<AIFeedbackResponse>(promptText, schema, optConfig);
        if (payload && payload.resumo_desempenho) {
          return payload;
        }
      } catch (err: any) {
        console.warn("[AIFeedbackGenerator] Failing over to static heuristic generator:", err.message);
      }
    }

    // Static Heuristic Rule-Based Fallback
    return this.generateHeuristics(language, code, syntaxOk, totalTests, testsPassed, qualityIssues, stderr, finalScore);
  }

  private static generateHeuristics(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    finalScore: number
  ): AIFeedbackResponse {
    const isSuccess = testsPassed === totalTests && syntaxOk && totalTests > 0;

    let resumo_desempenho = "";
    if (isSuccess) {
      resumo_desempenho = `Excelente esforço! Seu programa em ${language.toUpperCase()} passou em 100% dos cenários de teste criados para o exercício, demonstrando sólida aptidão lógica.`;
    } else if (!syntaxOk) {
      resumo_desempenho = `Detectamos inconsistências gramaticais/formais no seu código em ${language.toUpperCase()}. O compilador emitiu alertas e não pôde concluir a execução.`;
    } else if (testsPassed > 0) {
      resumo_desempenho = `Bom desenvolvimento! Parte dos cenários de validação automática foram bem-sucedidos (${testsPassed}/${totalTests}), contudo, seu programa falha em cobrir casos extremos de borda.`;
    } else {
      resumo_desempenho = `O algoritmo foi executado, entretanto, as saídas produzidas não correspondem ao gabarito estipulado em nenhum dos testes programados.`;
    }

    const pontos_fortes: string[] = [];
    if (code.length > 40) pontos_fortes.push("Código completo com esforço relevante estruturado.");
    if (syntaxOk) pontos_fortes.push("Compilação inicial bem-sucedida, sugerindo boa intimidade com comandos fundamentais.");
    if (testsPassed > 0) pontos_fortes.push(`Aprovação em ${testsPassed} cenários de teste dinâmicos.`);
    if (pontos_fortes.length === 0) pontos_fortes.push("Resolução inicial submetida e no caminho de evolução.");

    const erros_encontrados: string[] = [];
    if (!syntaxOk) {
      erros_encontrados.push(`Mensagem do compilador: ${stderr.slice(0, 80) || "Erro estrutural interno"}`);
    } else if (testsPassed < totalTests) {
      erros_encontrados.push(`Divergência de valores de saída esperados nos testes automáticos (${totalTests - testsPassed} falhas).`);
    } else {
      erros_encontrados.push("Nenhum erro relevante identificado na execução lógica.");
    }

    const orientacao_melhoria = qualityIssues.length > 0 
      ? qualityIssues 
      : ["O código atende aos critérios de estilo. Continue construindo algoritmos limpos e bem alinhados."];

    const sugestao_estudo: string[] = [];
    if (!syntaxOk) {
      sugestao_estudo.push("Lógica de Compiladores e Erros de Sintaxe Comuns");
    }
    if (testsPassed < totalTests) {
      sugestao_estudo.push("Análise de Casos de Borda e Tratar Valores Nulos ou Extremos");
    }
    if (code.toLowerCase().includes("for") || code.toLowerCase().includes("while")) {
      sugestao_estudo.push("Complexidade Computacional e Estrutura de Repetição Avançada");
    }
    sugestao_estudo.push("Boas práticas de Programação Limpa e DRY (Don't Repeat Yourself)");

    const proxima_etapa: string[] = [];
    if (!syntaxOk) {
      proxima_etapa.push("Localize a linha que quebrou e verifique parênteses ou delimitadores ausentes.");
    } else if (testsPassed < totalTests) {
      proxima_etapa.push("Escreva alguns prints ou depure de forma guiada para entender o comportamento das entradas falhas.");
    } else {
      proxima_etapa.push("Tente reformular a solução aplicando outra estratégia, ex: reduzindo condições ou extraindo blocos para funções.");
    }

    return {
      resumo_desempenho,
      pontos_fortes,
      erros_encontrados,
      orientacao_melhoria,
      sugestao_estudo,
      proxima_etapa
    };
  }
}
