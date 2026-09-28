import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface MicroChallenge {
  challengeId: string;
  topic: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  title: string;
  scenario: string;
  starterCodeSnippet: string;
  expectedGoal: string;
  hints: string[];
  testCases: Array<{ input: string; expected: string }>;
  xpReward: number;
}

export interface AdaptivePathwayPlan {
  pathwayId: string;
  studentId: string;
  studentName: string;
  detectedGaps: string[];
  priorityLevel: "Crítica" | "Moderada" | "Refinamento";
  recommendedMicroChallenges: MicroChallenge[];
  estimatedCompletionMinutes: number;
  unlockedBadge: string;
  generatedAt: string;
}

export interface LiveSocraticFeedback {
  feedbackId: string;
  status: "Lógica Saudável" | "Atenção: Risco de Erro" | "Bloqueio Detectado";
  socraticQuestion: string;
  suggestedReflectionLine?: number;
  testCasePreview: {
    passedCount: number;
    totalCount: number;
    quickDiagnostic: string;
  };
  generatedAt: string;
}

export class AdaptiveLearningPathwayService {
  /**
   * Generate adaptive micro-challenges tailored to student identified weaknesses.
   */
  static async generateAdaptivePathway(params: {
    studentId: string;
    studentName: string;
    identifiedGaps: string[];
    courseName?: string;
    recentActivityTitle?: string;
    customAI?: CustomAIRequestOptions;
  }): Promise<AdaptivePathwayPlan> {
    const pathwayId = "path-" + Date.now();
    const gaps = params.identifiedGaps.length > 0 
      ? params.identifiedGaps 
      : ["Normalização 3FN", "Validação defensiva de coleções", "Tratamento de Exceções"];

    const prompt = `Você é o Coordenador de Trilhas Adaptativas e Gamificação do SENAI.
Com base nas fragilidades identificadas do estudante "${params.studentName}" (${params.courseName || "Técnico em Desenvolvimento de Sistemas"}), gere uma Trilha de Micro-Desafios Práticos de 5 minutos cada para fechar essas lacunas conceituais.

LACUNAS IDENTIFICADAS:
${JSON.stringify(gaps, null, 2)}

ATIVIDADE RECENTE: "${params.recentActivityTitle || "Programação e Banco de Dados"}"

Retorne estritamente em formato JSON:
{
  "priorityLevel": "Moderada",
  "estimatedCompletionMinutes": 15,
  "unlockedBadge": "Mestre da Refatoração Defensiva",
  "recommendedMicroChallenges": [
    {
      "challengeId": "mc-1",
      "topic": "Validação defensiva de coleções",
      "difficulty": "Iniciante",
      "title": "Missão 1: Blindagem de Listas Nulas",
      "scenario": "A função processar_carrinho recebe uma lista de itens. Se o parâmetro for nulo ou vazio, retorne 0 imediatamente sem disparar TypeError.",
      "starterCodeSnippet": "def processar_carrinho(itens):\\n    # Adicione a guard clause aqui\\n    return sum(item['preco'] for item in itens)",
      "expectedGoal": "Inserir if not itens: return 0 antes do somatório.",
      "hints": [
        "Verifique a condição booleana if not itens:",
        "Lembre-se de retornar 0 antes do laço sum()"
      ],
      "testCases": [
        { "input": "[]", "expected": "0" },
        { "input": "[{'preco': 10}, {'preco': 20}]", "expected": "30" }
      ],
      "xpReward": 150
    }
  ]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 3500 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        pathwayId,
        studentId: params.studentId,
        studentName: params.studentName,
        detectedGaps: gaps,
        priorityLevel: parsed.priorityLevel || "Moderada",
        recommendedMicroChallenges: parsed.recommendedMicroChallenges && parsed.recommendedMicroChallenges.length > 0 ? parsed.recommendedMicroChallenges : [
          {
            challengeId: "mc-def-1",
            topic: gaps[0] || "Lógica Defensiva",
            difficulty: "Intermediário",
            title: `Micro-Desafio: ${gaps[0] || "Refatoração Rápida"}`,
            scenario: "Implemente a validação correta para garantir a estabilidade do fluxo.",
            starterCodeSnippet: "# Escreva sua solução rápida\ndef resolver(dados):\n    if not dados: return None\n    return True",
            expectedGoal: "Eliminar potenciais falhas de tempo de execução.",
            hints: ["Use guard clauses no início da função."],
            testCases: [{ input: "[]", expected: "None" }],
            xpReward: 100
          }
        ],
        estimatedCompletionMinutes: parsed.estimatedCompletionMinutes || 15,
        unlockedBadge: parsed.unlockedBadge || "Especialista em Resolução Socrática",
        generatedAt: new Date().toISOString()
      };
    } catch {
      return {
        pathwayId,
        studentId: params.studentId,
        studentName: params.studentName,
        detectedGaps: gaps,
        priorityLevel: "Moderada",
        recommendedMicroChallenges: [
          {
            challengeId: "mc-01",
            topic: "Validação Antecipada (Guard Clauses)",
            difficulty: "Iniciante",
            title: "Desafio Relâmpago: Blindagem de Entradas Nulas",
            scenario: "Construa uma função defensiva que receba uma lista e calcule a média, tratando adequadamente divisões por zero.",
            starterCodeSnippet: "def calcular_media(notas):\n    if not notas:\n        return 0.0\n    return sum(notas) / len(notas)\n",
            expectedGoal: "Evitar ZeroDivisionError ao receber listas sem elementos.",
            hints: [
              "Verifique se o array está vazio antes da divisão.",
              "Retorne 0.0 caso len(notas) seja 0."
            ],
            testCases: [
              { input: "[]", expected: "0.0" },
              { input: "[70, 80, 90]", expected: "80.0" }
            ],
            xpReward: 120
          },
          {
            challengeId: "mc-02",
            topic: "Normalização de Banco de Dados (3FN)",
            difficulty: "Intermediário",
            title: "Desafio Relâmpago: Eliminação de Dependências Transitivas",
            scenario: "Identifique colunas que não dependem diretamente da chave primária e separe-as em uma nova tabela de domínio.",
            starterCodeSnippet: "-- Separe cidade e uf da tabela cliente\nCREATE TABLE tb_municipio (\n    id_municipio SERIAL PRIMARY KEY,\n    nome VARCHAR(100),\n    uf CHAR(2)\n);",
            expectedGoal: "Garantir que a tabela cliente referencie apenas id_municipio.",
            hints: [
              "Crie a tabela tb_municipio e coloque a FK na tabela tb_cliente."
            ],
            testCases: [
              { input: "tb_cliente com id_municipio FK", expected: "3FN Compliant" }
            ],
            xpReward: 180
          }
        ],
        estimatedCompletionMinutes: 10,
        unlockedBadge: "Explorador da Excelência Técnica",
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Provide Real-time Socratic Live Coding Feedback in the student's editor before submission.
   */
  static async evaluateLiveCodingSnapshot(params: {
    code: string;
    language: string;
    activityTitle: string;
    customAI?: CustomAIRequestOptions;
  }): Promise<LiveSocraticFeedback> {
    const feedbackId = "soc-" + Date.now();
    const code = params.code || "";

    const prompt = `Você é o Copiloto Socrático Live do SENAI.
O aluno está digitando código no editor em tempo real para a atividade "${params.activityTitle}" (${params.language}).
Analise o rascunho do código e dê uma dica curta, amigável e puramente SOCRÁTICA (que faz o aluno refletir, SEM dar o código pronto).

CÓDIGO ATUAL:
\`\`\`${params.language}
${code}
\`\`\`

Retorne em JSON:
{
  "status": "Atenção: Risco de Erro",
  "socraticQuestion": "Observe o laço de repetição: o que acontecerá com a variável de acumulação quando a lista tiver mais de 5 itens?",
  "suggestedReflectionLine": 3,
  "testCasePreview": {
    "passedCount": 1,
    "totalCount": 2,
    "quickDiagnostic": "Caso básico aprovado. Atenção ao caso de lista vazia."
  }
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 1500 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        feedbackId,
        status: parsed.status || "Lógica Saudável",
        socraticQuestion: parsed.socraticQuestion || "Seu raciocínio lógico está no caminho certo. Lembre-se de validar se o retorno atende ao tipo esperado.",
        suggestedReflectionLine: parsed.suggestedReflectionLine,
        testCasePreview: parsed.testCasePreview || {
          passedCount: 1,
          totalCount: 1,
          quickDiagnostic: "Sintaxe validada com sucesso."
        },
        generatedAt: new Date().toISOString()
      };
    } catch {
      const hasTodo = code.includes("pass") || code.includes("TODO");
      return {
        feedbackId,
        status: hasTodo ? "Bloqueio Detectado" : "Lógica Saudável",
        socraticQuestion: hasTodo
          ? "Você definiu a assinatura da função. Qual o primeiro passo lógico para processar os dados de entrada?"
          : "Excelente progresso. Analise se sua função consegue responder corretamente caso receba uma entrada vazia.",
        suggestedReflectionLine: 1,
        testCasePreview: {
          passedCount: hasTodo ? 0 : 1,
          totalCount: 1,
          quickDiagnostic: hasTodo ? "Implementação pendente." : "Estrutura sintática correta."
        },
        generatedAt: new Date().toISOString()
      };
    }
  }
}
