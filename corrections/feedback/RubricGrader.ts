import { aiService } from "../../src/ai/services/AIService";

export interface RubricCriterion {
  nome: string;
  descricao: string;
  peso: number;
  nota_obtida: number;
  observacao: string;
  status: "Excelente" | "Aprovado" | "Atenção" | "Pendente" | "Falhou";
}

export interface RubricEvaluationResult {
  criteria: RubricCriterion[];
  overall_feedback: string;
}

export class RubricGrader {
  private static CRITERIA_METADATA = [
    { nome: "Lógica de programação", peso: 20, descricao: "Domínio conceitual de estruturas lógicas na resolução do problema sugerido." },
    { nome: "Sintaxe", peso: 15, descricao: "Correção ortográfica/gramatical e acerto gramatical de instruções na linguagem escolhida." },
    { nome: "Organização do código", peso: 15, descricao: "Formatação correta do script de forma a assegurar legibilidade acadêmica." },
    { nome: "Boas práticas", peso: 15, descricao: "Ausência de variáveis genéricas ou repetitivas e eliminação de duplicações estruturais." },
    { nome: "Eficiência", peso: 15, descricao: "Razoabilidade de consumo e escassez de laços infinitos ou aninhamentos nocivos." },
    { nome: "Segurança", peso: 10, descricao: "Utilização cuidadosa de escopos e prevenção de injeções de comandos maliciosos." },
    { nome: "Clareza da solução", peso: 10, descricao: "Expressividade lógica do algoritmo e inclusão didática de comentários estruturantes." }
  ];

  static async evaluate(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    finalScore: number,
    customRubricCriteria?: Record<string, number>
  ): Promise<RubricEvaluationResult> {
    const hasAI = !!(process.env.GEMINI_API_KEY || process.env.AI_PROVIDER);
    
    // If we have custom criteria, we use them instead of the default 7
    const activeCriteria = customRubricCriteria 
        ? Object.entries(customRubricCriteria).map(([nome, peso]) => ({ nome, peso, descricao: `Critério definido pelo professor: ${nome}` }))
        : this.CRITERIA_METADATA;

    if (hasAI) {
      try {
        const schema = {
          type: "OBJECT",
          properties: {
            criteria: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  nome: { type: "STRING" },
                  descricao: { type: "STRING" },
                  peso: { type: "INTEGER" },
                  nota_obtida: { type: "INTEGER" },
                  observacao: { type: "STRING" },
                  status: { type: "STRING", enum: ["Excelente", "Aprovado", "Atenção", "Pendente", "Falhou"] }
                },
                required: ["nome", "descricao", "peso", "nota_obtida", "observacao", "status"]
              }
            },
            overall_feedback: { type: "STRING" }
          },
          required: ["criteria", "overall_feedback"]
        };

        const optConfig = {
          systemInstruction: "Você é um auditor de avaliação acadêmica computacional. Seu papel é atribuir pontuações precisas às rubricas estruturadas dos alunos sem divergir da nota agregada final que já foi auferida por testes."
        };

        const promptText = `
Avalie o seguinte código segundo as rubricas de avaliação estruturadas pelo professor:
Linguagem: ${language}
Sintaxe OK: ${syntaxOk}
Testes: passou em ${testsPassed} de ${totalTests} testes unitários.
Nota calculada pelo avaliador automático: ${finalScore}/100.
Questões de Qualidade: ${JSON.stringify(qualityIssues)}
Mensagem de Erro (stderr): ${stderr}

A soma total de todas as 'nota_obtida' dos critérios DEVE ser exatamente igual a ${finalScore}. Divida a nota proporcionalmente entre os critérios.
Não atribua notas maiores que os respectivos pesos:
${activeCriteria.map(c => `- ${c.nome} (Peso: ${c.peso})`).join("\n")}

Código-fonte do aluno:
\`\`\`
${code}
\`\`\``;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && Array.isArray(payload.criteria) && payload.criteria.length === activeCriteria.length) {
          // Normalize sub-grades dynamically to match overall grade exactly
          let sum = payload.criteria.reduce((acc: number, c: any) => acc + c.nota_obtida, 0);
          if (sum !== finalScore) {
            const ratio = finalScore / (sum || 1);
            payload.criteria.forEach((c: any) => {
              c.nota_obtida = Math.min(c.peso, Math.round(c.nota_obtida * ratio));
            });
          }
          return payload as RubricEvaluationResult;
        }
      } catch (err: any) {
        console.warn("[RubricGrader] Failing over to high-precision heuristic evaluator:", err.message);
      }
    }

    // High-precision rule-based heuristic evaluator fallback (Limited when dynamic)
    return this.evaluateHeuristics(language, code, syntaxOk, totalTests, testsPassed, qualityIssues, stderr, finalScore, activeCriteria);
  }

  private static evaluateHeuristics(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    finalScore: number,
    activeMetadata: any[]
  ): RubricEvaluationResult {
    const isSecurityOk = finalScore > 0;
    
    const scale = finalScore / 100;
    
    const criteria: RubricCriterion[] = activeMetadata.map((meta) => {
      let nota_obtida = Math.round(meta.peso * scale);
      
      let status: RubricCriterion["status"] = "Excelente";
      const pct = nota_obtida / (meta.peso || 1);
      if (pct >= 0.85) status = "Excelente";
      else if (pct >= 0.6) status = "Aprovado";
      else if (pct >= 0.35) status = "Atenção";
      else status = "Falhou";

      if (!syntaxOk) status = "Falhou";

      return {
        nome: meta.nome,
        descricao: meta.descricao,
        peso: meta.peso,
        nota_obtida,
        observacao: `Avaliação proporcional de ${nota_obtida}/${meta.peso} pontos.`,
        status
      };
    });

    // Final alignment enforcement
    let adjustedSum = criteria.reduce((sum, c) => sum + c.nota_obtida, 0);
    let diff = finalScore - adjustedSum;
    if (diff !== 0) {
      for (let i = 0; i < criteria.length && diff !== 0; i++) {
        const c = criteria[i];
        if (diff > 0 && c.nota_obtida < c.peso) {
          c.nota_obtida += 1;
          diff -= 1;
        } else if (diff < 0 && c.nota_obtida > 0) {
          c.nota_obtida -= 1;
          diff += 1;
        }
      }
    }

    return {
      criteria,
      overall_feedback: `Análise estruturada por rubricas para ${language.toUpperCase()}.`
    };
  }
}
