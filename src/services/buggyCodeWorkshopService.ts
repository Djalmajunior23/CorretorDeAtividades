/**
 * ============================================================================
 * BUGGY CODE WORKSHOP (OFICINA DE CÓDIGOS COM DEFEITOS) SERVICE
 * ============================================================================
 * Functional Requirement 2:
 * - Challenges with intentional defects (syntax, logic, validation, exception, resource, security).
 * - Student identifies flaw, repairs code, and explains root cause.
 * - Evaluates functional repair without requiring rigid text equality.
 * ============================================================================
 */

import { executeInSandbox } from "../../sandbox";

export type BugCategory = 
  | "SINTAXE" 
  | "LOGICA_LOOP" 
  | "VALIDACAO_ENTRADA" 
  | "TRATAMENTO_EXCECOES" 
  | "VAZAMENTO_RECURSO" 
  | "SEGURANCA_INICIAL";

export interface BuggyChallenge {
  id: string;
  title: string;
  category: BugCategory;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  language: string;
  description: string;
  buggyCode: string;
  hint: string;
  expectedBehavior: string;
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
  }[];
  rubric: {
    functionalWeight: number;
    explanationWeight: number;
    cleanCodeWeight: number;
  };
}

export interface BugRepairSubmissionResult {
  passed: boolean;
  score: number;
  testsPassed: number;
  totalTests: number;
  feedback: string;
  explanationQuality: "EXCELENTE" | "BOA" | "SUPERFICIAL" | "INSUFICIENTE";
  details: string[];
}

export class BuggyCodeWorkshopService {
  private static challenges: BuggyChallenge[] = [
    {
      id: "bug-01",
      title: "Desafio 1: Erro de Índice Fora dos Limites (Off-by-One)",
      category: "LOGICA_LOOP",
      difficulty: "Iniciante",
      language: "python",
      description: "A função abaixo deveria calcular a média dos números pares de uma lista, mas lança IndexError ou inclui elementos incorretos.",
      buggyCode: `def media_pares(numeros):\n    # DEFEITO: O loop vai até len(numeros) inclusive ou divide por zero se não houver pares\n    soma = 0\n    qtd = 0\n    for i in range(len(numeros) + 1):\n        if numeros[i] % 2 == 0:\n            soma += numeros[i]\n            qtd += 1\n    return soma / qtd`,
      hint: "Verifique o limite superior do range(len(numeros)) e o tratamento para listas sem números pares.",
      expectedBehavior: "Retorna a média dos pares, ou 0.0 se a lista for vazia ou não tiver pares.",
      testCases: [
        { input: "[2, 4, 6, 8]", expectedOutput: "5.0", description: "Lista apenas com pares" },
        { input: "[1, 3, 5]", expectedOutput: "0.0", description: "Lista sem pares (deve retornar 0.0 sem divisão por zero)" },
        { input: "[10, 15, 20]", expectedOutput: "15.0", description: "Lista mista" }
      ],
      rubric: { functionalWeight: 50, explanationWeight: 30, cleanCodeWeight: 20 }
    },
    {
      id: "bug-02",
      title: "Desafio 2: Falha de Validação e Conversão de Tipos",
      category: "VALIDACAO_ENTRADA",
      difficulty: "Iniciante",
      language: "python",
      description: "A função calcula desconto em compras, mas quebra quando recebe valores nulos, negativos ou strings que não podem ser convertidas.",
      buggyCode: `def calcular_desconto(valor, cupom):\n    # DEFEITO: Não valida se valor é numérico positivo nem trata cupom None\n    taxa = 0.1 if cupom == 'SENAI10' else 0.05\n    return valor - (valor * taxa)`,
      hint: "Adicione validações para garantir que valor > 0 e trate cupom como string segura.",
      expectedBehavior: "Retorna o valor final com desconto, ou 0.0 em caso de entrada inválida.",
      testCases: [
        { input: "100, 'SENAI10'", expectedOutput: "90.0", description: "Cupom válido 10%" },
        { input: "-50, 'SENAI10'", expectedOutput: "0.0", description: "Valor negativo inválido" },
        { input: "200, None", expectedOutput: "190.0", description: "Cupom nulo usa desconto padrão" }
      ],
      rubric: { functionalWeight: 50, explanationWeight: 30, cleanCodeWeight: 20 }
    },
    {
      id: "bug-03",
      title: "Desafio 3: Fechamento Inadequado de Recursos em Exceção",
      category: "TRATAMENTO_EXCECOES",
      difficulty: "Intermediário",
      language: "python",
      description: "A função lê dados de um arquivo simulado e processa JSON, mas deixa conexões abertas se ocorrer erro de parsing.",
      buggyCode: `def processar_payload(json_str):\n    import json\n    # DEFEITO: Não usa try/except/finally e quebra o sistema em JSON malformado\n    dados = json.loads(json_str)\n    return dados.get('status', 'DESCONHECIDO')`,
      hint: "Use bloco try/except json.JSONDecodeError para capturar falhas e retornar 'ERRO_FORMATO'.",
      expectedBehavior: "Retorna o campo 'status' ou 'ERRO_FORMATO' se o JSON for inválido.",
      testCases: [
        { input: "'{\"status\": \"ATIVO\"}'", expectedOutput: "ATIVO", description: "JSON válido" },
        { input: "'{invalido: 123}'", expectedOutput: "ERRO_FORMATO", description: "JSON inválido" }
      ],
      rubric: { functionalWeight: 50, explanationWeight: 30, cleanCodeWeight: 20 }
    }
  ];

  public static getChallenges(): BuggyChallenge[] {
    return this.challenges;
  }

  public static getChallengeById(id: string): BuggyChallenge | undefined {
    return this.challenges.find(c => c.id === id);
  }

  /**
   * Evaluates student's repaired code and root-cause explanation
   */
  public static async evaluateRepair(
    challengeId: string,
    repairedCode: string,
    studentExplanation: string
  ): Promise<BugRepairSubmissionResult> {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) {
      return {
        passed: false,
        score: 0,
        testsPassed: 0,
        totalTests: 0,
        feedback: "Desafio não encontrado.",
        explanationQuality: "INSUFICIENTE",
        details: ["ID inválido."]
      };
    }

    // Quality check on explanation (metacognition)
    let explanationScore = 10;
    let quality: BugRepairSubmissionResult["explanationQuality"] = "INSUFICIENTE";

    const expl = (studentExplanation || "").trim().toLowerCase();
    if (expl.length >= 30) {
      if (expl.includes("erro") || expl.includes("índice") || expl.includes("range") || expl.includes("zero") || expl.includes("try") || expl.includes("valida")) {
        explanationScore = 30;
        quality = "EXCELENTE";
      } else {
        explanationScore = 20;
        quality = "BOA";
      }
    } else if (expl.length >= 10) {
      explanationScore = 15;
      quality = "SUPERFICIAL";
    }

    // Wrap python code with test driver
    let runnable = repairedCode;
    if (challenge.language === "python" && !runnable.includes("input(")) {
      const fnMatch = runnable.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (fnMatch) {
        const fn = fnMatch[1];
        runnable = `${runnable}\n\nif __name__ == '__main__':\n    import sys\n    inp = sys.stdin.read().strip()\n    try:\n        res = ${fn}(eval(inp))\n        print(str(float(res) if isinstance(res, (int, float)) else res))\n    except Exception as e:\n        print('ERRO_FORMATO')\n`;
      }
    }

    let passedTests = 0;
    const details: string[] = [];

    for (let i = 0; i < challenge.testCases.length; i++) {
      const tc = challenge.testCases[i];
      try {
        const res = await executeInSandbox(runnable, challenge.language, tc.input, 2500);
        const actual = (res.stdout || "").trim();
        const expected = tc.expectedOutput.trim();

        if (actual === expected || actual.startsWith(expected)) {
          passedTests++;
          details.push(`✓ Teste ${i + 1} (${tc.description}): Aprovado`);
        } else {
          details.push(`✗ Teste ${i + 1} (${tc.description}): Esperado "${expected}", obtido "${actual}"`);
        }
      } catch (err: any) {
        details.push(`✗ Teste ${i + 1} (${tc.description}): Erro de execução (${err.message})`);
      }
    }

    const functionalScore = Math.round((passedTests / challenge.testCases.length) * challenge.rubric.functionalWeight);
    const cleanCodeScore = repairedCode.includes("#") || repairedCode.length < 500 ? challenge.rubric.cleanCodeWeight : 10;
    const finalScore = functionalScore + explanationScore + cleanCodeScore;
    const isPassed = passedTests === challenge.testCases.length && explanationScore >= 20;

    return {
      passed: isPassed,
      score: finalScore,
      testsPassed: passedTests,
      totalTests: challenge.testCases.length,
      explanationQuality: quality,
      feedback: isPassed
        ? "Excelente cirurgia de código! O defeito foi eliminado e a justificativa demonstra domínio da causa raiz."
        : "A correção ainda não resolve todos os casos de teste ou a explicação do defeito precisa ser aprofundada.",
      details
    };
  }
}
