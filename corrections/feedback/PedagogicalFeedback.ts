import { aiService } from "../../src/ai/services/AIService";
import { CustomAIRequestOptions } from "../../src/ai/factory/ProviderFactory";

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
   * Generates feedback structure faithful to the student's actual code.
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
    securityReason: string | null,
    providerConfig?: CustomAIRequestOptions
  ): Promise<FeedbackStructure> {
    
    // Check if security blocked
    if (!securityOk) {
      return {
        summary: "Seu exercício foi bloqueado na validação de segurança automática devido a diretivas potencialmente arriscadas.",
        strengths: ["Tentativa de uso de bibliotecas de sistema"],
        errors: [`Bloqueio de segurança: ${securityReason || "Código não permitido no ambiente educacional."}`],
        improvements: ["Remova importações de sistema operacional ou bibliotecas de rede/arquivos.", "Mantenha o código estritamente focado no escopo do algoritmo proposto."],
        concepts_to_review: ["Sanitização de Código", "Ambientes Sandbox de Compilação", "Boas Práticas de Desenvolvimento Seguro"],
        next_steps: ["Revise as palavras-chave do código", "Submeta uma solução puramente algorítmica"]
      };
    }

    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER || providerConfig?.apiKey);
    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING", description: "Resumo pedagógico geral da resolução real do aluno citando o que ele fez." },
            strengths: { type: "ARRAY", items: { type: "STRING" }, description: "Lista de 1 a 3 pontos fortes específicos citando funções, variáveis ou trechos reais do código." },
            errors: { type: "ARRAY", items: { type: "STRING" }, description: "Erros específicos com citação de linhas ou cláusulas (especialmente para SQL ou lógica falha em testes)." },
            improvements: { type: "ARRAY", items: { type: "STRING" }, description: "Melhorias práticas e concretas de refatoração para o código do aluno." },
            concepts_to_review: { type: "ARRAY", items: { type: "STRING" }, description: "Tópicos didáticos específicos que o aluno precisa reforçar." },
            next_steps: { type: "ARRAY", items: { type: "STRING" }, description: "Próximos passos imediatos sugeridos (ex: testar caso limite específico)." }
          },
          required: ["summary", "strengths", "errors", "improvements", "concepts_to_review", "next_steps"]
        };

        const isSql = language.toLowerCase() === "sql";

        const optConfig = {
          systemInstruction: `Você é um professor tutor sênior do SENAI de programação e banco de dados.
Seu feedback deve ser extremamente fiel à REALIDADE do que o aluno escreveu.
CITE nomes de variáveis, nomes de funções, tabelas e trechos reais do código dele.
${isSql ? "Para scripts e queries SQL, verifique cláusulas SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, tipos de dados, chaves primárias e estrangeiras." : ""}
Nunca use respostas genéricas de шаблон. Seja acolhedor, didático e aponte exatamente onde melhorar.`
        };

        const promptText = `
Analise o código submetido pelo estudante e gere um feedback pedagógico e técnico de máxima fidelidade:

Linguagem: ${language}
Sintaxe OK: ${syntaxOk}
Métricas de testes: passou em ${testsPassed} de ${totalTests} testes unitários.
Problemas estáticos de qualidade sinalizados: ${JSON.stringify(qualityIssues)}
Mensagem de erro de compilação/execução (stderr): ${stderr || "Nenhum erro de compilação."}

Código real escrito pelo aluno:
\`\`\`${language}
${code}
\`\`\`
`;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        
        if (payload && payload.summary) {
          return {
            summary: payload.summary,
            strengths: Array.isArray(payload.strengths) && payload.strengths.length > 0 ? payload.strengths : ["Estruturação do algoritmo na linguagem " + language],
            errors: Array.isArray(payload.errors) && payload.errors.length > 0 ? payload.errors : ["Nenhum erro crítico detectado."],
            improvements: Array.isArray(payload.improvements) && payload.improvements.length > 0 ? payload.improvements : ["Praticar mais exercícios semelhantes."],
            concepts_to_review: Array.isArray(payload.concepts_to_review) && payload.concepts_to_review.length > 0 ? payload.concepts_to_review : ["Algoritmos e Estrutura de Dados"],
            next_steps: Array.isArray(payload.next_steps) && payload.next_steps.length > 0 ? payload.next_steps : ["Testar casos limites adicionais."]
          };
        }
      } catch (err: any) {
        console.warn("[PedagogicalFeedback] Failing over to rule-based feedback generator:", err.message);
      }
    }

    // Heuristics Realistic Fallback Generator (Rule-Based com extração estática de tokens)
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
    const langLower = language.toLowerCase();
    const isSql = langLower === "sql";

    // 1. Extração de elementos reais do código do aluno
    const functionsFound = Array.from(code.matchAll(/(?:def|function|public\s+(?:static\s+)?[a-zA-Z0-9_<>]+\s+)\s*([a-zA-Z0-9_]+)/g)).map(m => m[1]);
    const tablesFound = Array.from(code.matchAll(/(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+([a-zA-Z0-9_]+)/gi)).map(m => m[1].toUpperCase());
    const hasLoops = /\b(for|while|forEach|loop)\b/i.test(code);
    const hasConditions = /\b(if|elif|else|switch|case|WHERE)\b/i.test(code);
    const hasGroupBy = /\bGROUP\s+BY\b/i.test(code);
    const hasJoin = /\b(JOIN|INNER\s+JOIN|LEFT\s+JOIN)\b/i.test(code);

    // Strengths Heuristics
    const strengths: string[] = [];
    if (isSql) {
      if (tablesFound.length > 0) strengths.push(`Manipulação de tabelas relacionais identificada: ${tablesFound.slice(0, 3).join(", ")}.`);
      if (hasJoin) strengths.push("Utilização de junções relacionais (JOIN) para conectar dados de múltiplas entidades.");
      if (hasGroupBy) strengths.push("Aplicação de agrupamento de dados com cláusula GROUP BY.");
      if (strengths.length === 0) strengths.push("Comandos SQL estruturados com sintaxe relacional.");
    } else {
      if (functionsFound.length > 0) strengths.push(`Modularização do algoritmo através de função(ões): ${functionsFound.slice(0, 2).map(f => `\`${f}()\``).join(", ")}.`);
      if (hasLoops) strengths.push("Implementação de estruturas de repetição para iteração de dados.");
      if (hasConditions) strengths.push("Controle de fluxo condicional implementado para tomada de decisões.");
      if (syntaxOk) strengths.push(`Sintaxe limpa e compilável na linguagem ${language.toUpperCase()}.`);
    }

    if (testsPassed > 0) {
      strengths.push(`${testsPassed} caso(s) de teste passaram com sucesso.`);
    }
    if (strengths.length === 0) {
      strengths.push("Tentativa de resolução do problema com estruturação inicial.");
    }

    // Errors Heuristics
    const errors: string[] = [];
    if (!syntaxOk) {
      errors.push(`Erro de compilação/sintaxe: ${stderr ? stderr.slice(0, 100) : "Instrução incompleta ou símbolo ausente."}`);
    } else if (testsPassed < totalTests) {
      const failedCount = totalTests - testsPassed;
      errors.push(`O algoritmo falhou em ${failedCount} de ${totalTests} casos de teste (saída obtida divergiu da saída esperada).`);
    }

    if (isSql && !code.toUpperCase().includes("SELECT") && !code.toUpperCase().includes("CREATE") && !code.toUpperCase().includes("INSERT")) {
      errors.push("Comando SQL incompleto: Verifique a declaração de SELECT, CREATE TABLE ou INSERT.");
    }

    // Improvements Heuristics
    const improvements: string[] = [];
    if (qualityIssues.length > 0) {
      improvements.push(...qualityIssues);
    }
    if (isSql) {
      if (!code.toUpperCase().includes("WHERE") && code.toUpperCase().includes("SELECT") && !code.toUpperCase().includes("COUNT")) {
        improvements.push("Avaliar se é necessário filtrar os registros com a cláusula WHERE para evitar Full Table Scan.");
      }
      if (hasJoin && !code.toUpperCase().includes(" ON ")) {
        improvements.push("Garantir que todo JOIN possua a condição ON especificando a chave de relacionamento.");
      }
    } else {
      if (code.includes("print(") || code.includes("console.log(")) {
        improvements.push("Certifique-se de que as saídas exibidas correspondem exatamente ao formato exigido (sem textos extras não solicitados).");
      }
    }
    if (improvements.length === 0) {
      improvements.push("Código bem estruturado. Pratique a inclusão de comentários descritivos e tratamento de casos limites.");
    }

    // Concepts to Review
    const concepts_to_review: string[] = [];
    if (isSql) {
      concepts_to_review.push("Álgebra Relacional & Consultas SQL (DQL/DDL)");
      if (hasJoin) concepts_to_review.push("Tipos de JOIN (INNER, LEFT, RIGHT) e Integridade Referencial");
      if (hasGroupBy) concepts_to_review.push("Funções de Agregação (COUNT, SUM, AVG) e HAVING");
    } else {
      if (!syntaxOk) concepts_to_review.push("Sintaxe Básica e Delimitadores da Linguagem");
      if (testsPassed < totalTests) {
        concepts_to_review.push("Lógica de Algoritmos e Raciocínio Computacional");
        concepts_to_review.push("Teste de Mesa e Casos de Borda (Corner Cases)");
      }
      if (hasLoops) concepts_to_review.push("Estruturas de Repetição e Condições de Parada");
    }
    if (concepts_to_review.length === 0) {
      concepts_to_review.push("Estrutura de Dados e Otimização");
    }

    // Next Steps
    const next_steps: string[] = [];
    if (!syntaxOk) {
      next_steps.push("Conserte a linha indicada no log de compilação e tente executar novamente.");
    } else if (testsPassed < totalTests) {
      next_steps.push("Faça um teste de mesa manual com as entradas que falharam para identificar onde a variável muda de valor indevidamente.");
    } else {
      next_steps.push("Excelente domínio! Experimente refatorar o código para uma versão ainda mais concisa ou modular.");
    }

    // Summary
    let summary = "";
    if (isSuccess) {
      summary = `Parabéns! Sua solução em ${language.toUpperCase()} foi aprovada em 100% dos testes unitários (${testsPassed}/${totalTests}). A lógica está correta e demonstra domínio dos conceitos de programação.`;
    } else if (!syntaxOk) {
      summary = `Identifiquei um erro impeditivo de compilação/sintaxe no seu código ${language.toUpperCase()}. O programa não pôde ser executado até o final.`;
    } else if (testsPassed > 0) {
      summary = `Bom trabalho! Sua implementação atendeu parcialmente aos requisitos (passou em ${testsPassed} de ${totalTests} testes), mas há divergências em cenários específicos.`;
    } else {
      summary = `O algoritmo foi executado, mas não produziu a saída correta para os testes aplicados. Vamos revisar a lógica e os tipos de dados juntos.`;
    }

    return {
      summary,
      strengths,
      errors: errors.length > 0 ? errors : ["Nenhum erro impeditivo encontrado."],
      improvements,
      concepts_to_review,
      next_steps
    };
  }
}

