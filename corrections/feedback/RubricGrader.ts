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
    finalScore: number
  ): Promise<RubricEvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
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
          systemInstruction: "Você é um auditor de avaliação acadêmica computacional. Seu papel é atribuir pontuações precisas às 7 rubricas estruturadas dos alunos sem divergir da nota agregada final que já foi auferida por testes."
        };

        const promptText = `
Avalie o seguinte código segundo as 7 rubricas de avaliação estruturadas pelo professor:
Linguagem: ${language}
Sintaxe OK: ${syntaxOk}
Testes: passou em ${testsPassed} de ${totalTests} testes unitários.
Nota calculada pelo avaliador automático: ${finalScore}/100.
Questões de Qualidade: ${JSON.stringify(qualityIssues)}
Mensagem de Erro (stderr): ${stderr}

A soma total de todas as 'nota_obtida' dos 7 critérios DEVE ser exatamente igual a ${finalScore} ou no máximo diferir por 1 ponto. Divida a nota proporcionalmente entre os critérios.
Não atribua notas maiores que os respectivos pesos:
- Lógica de programação (Peso: 20)
- Sintaxe (Peso: 15)
- Organização do código (Peso: 15)
- Boas práticas (Peso: 15)
- Eficiência (Peso: 15)
- Segurança (Peso: 10)
- Clareza da solução (Peso: 10)

Código-fonte do aluno:
\`\`\`
${code}
\`\`\``;

        const payload = await aiService.generateStructuredWithRetry<any>(promptText, schema, optConfig);
        if (payload && Array.isArray(payload.criteria) && payload.criteria.length === 7) {
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

    // High-precision rule-based heuristic evaluator fallback
    return this.evaluateHeuristics(language, code, syntaxOk, totalTests, testsPassed, qualityIssues, stderr, finalScore);
  }

  private static evaluateHeuristics(
    language: string,
    code: string,
    syntaxOk: boolean,
    totalTests: number,
    testsPassed: number,
    qualityIssues: string[],
    stderr: string,
    finalScore: number
  ): RubricEvaluationResult {
    const isSecurityOk = finalScore > 0; // if final score is 0, security or syntax failed catastrophically

    // Let's formulate raw scores
    const rawScores: Record<string, number> = {
      "Lógica de programação": syntaxOk ? Math.round((testsPassed / (totalTests || 1)) * 20) : 0,
      "Sintaxe": syntaxOk ? 15 : 0,
      "Organização do código": qualityIssues.some(i => i.includes("linhas") || i.includes("indentação")) ? 10 : 15,
      "Boas práticas": qualityIssues.some(i => i.includes("nomes") || i.includes("duplicidade")) ? 10 : 15,
      "Eficiência": qualityIssues.some(i => i.includes("complexidade")) ? 10 : 15,
      "Segurança": isSecurityOk ? 10 : 0,
      "Clareza da solução": code.includes("#") || code.includes("//") || code.includes("/*") || code.includes("--") ? 10 : 7
    };

    // Correct if syntax went wrong
    if (!syntaxOk) {
      rawScores["Organização do código"] = 5;
      rawScores["Boas práticas"] = 5;
      rawScores["Eficiência"] = 5;
      rawScores["Clareza da solução"] = 5;
    }

    // Scale precisely so that the sum matches the finalScore
    const rawSum = Object.values(rawScores).reduce((a, b) => a + b, 0);
    const scale = finalScore / (rawSum || 1);
    
    const criteria: RubricCriterion[] = this.CRITERIA_METADATA.map((meta) => {
      let nota_obtida = Math.round(rawScores[meta.nome] * scale);
      if (nota_obtida > meta.peso) {
        nota_obtida = meta.peso;
      }
      
      let status: RubricCriterion["status"] = "Excelente";
      const pct = nota_obtida / meta.peso;
      if (pct >= 0.85) status = "Excelente";
      else if (pct >= 0.6) status = "Aprovado";
      else if (pct >= 0.35) status = "Atenção";
      else status = "Falhou";

      if (!syntaxOk) status = "Falhou";

      let observacao = `Critério avaliado com desempenho de ${nota_obtida}/${meta.peso} pts.`;
      if (meta.nome === "Lógica de programação" && testsPassed < totalTests) {
        observacao = `Lógica necessita ajustes. Falha em ${totalTests - testsPassed} dos cenários propostos.`;
      } else if (meta.nome === "Sintaxe" && !syntaxOk) {
        observacao = `Erro de formatação impede execução segura: ${stderr.slice(0, 50)}...`;
      } else if (meta.nome === "Organização do código" && qualityIssues.some(i => i.includes("indentação"))) {
        observacao = "Indique melhor as aberturas de escopos de controle e formatações de classe.";
      } else if (meta.nome === "Clareza da solução" && nota_obtida < meta.peso) {
        observacao = "Adicione comentários explicando a finalidade das variáveis críticas e decisões de loops.";
      }

      return {
        nome: meta.nome,
        descricao: meta.descricao,
        peso: meta.peso,
        nota_obtida,
        observacao,
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
      overall_feedback: `Análise estruturada e correção por rubricas realizada para a linguagem ${language.toUpperCase()}.`
    };
  }
}
