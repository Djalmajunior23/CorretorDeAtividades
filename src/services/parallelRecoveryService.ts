import { ProviderFactory } from "../ai/factory/ProviderFactory";

export interface ParallelRecoveryStudentTarget {
  studentId: string;
  studentName: string;
  currentScore: number;
  identifiedGaps: string[];
}

export interface ParallelRecoveryChallenge {
  id: string;
  title: string;
  competencyArea: string;
  difficulty: "Facil" | "Medio" | "Avancado";
  instructionMarkdown: string;
  starterCode: string;
  expectedBehavior: string;
  rubricEvaluation: Array<{ criterion: string; weightPercentage: number; passCriteria: string }>;
}

export interface ParallelRecoveryPlan {
  planId: string;
  classId: string;
  className: string;
  generationDate: string;
  targetedStudents: ParallelRecoveryStudentTarget[];
  challenges: ParallelRecoveryChallenge[];
  recommendedDeadlineDays: number;
  pedagogicalDirective: string;
}

export class ParallelRecoveryService {
  /**
   * Identifica alunos com desempenho abaixo do threshold e gera plano de nivelamento sob medida.
   */
  static async generateRecoveryPlan(params: {
    classId: string;
    className: string;
    students: Array<{ id: string; name: string; score?: number; notes?: string }>;
    scoreThreshold?: number; // default 60
    subjectFocus?: string;
  }): Promise<ParallelRecoveryPlan> {
    const threshold = params.scoreThreshold ?? 60;
    const planId = "recov-" + Date.now().toString(36);
    const generationDate = new Date().toISOString();

    // Filtra alunos abaixo da nota de corte
    const targetStudents: ParallelRecoveryStudentTarget[] = params.students
      .filter((s) => (s.score !== undefined ? s.score < threshold : true))
      .slice(0, 10)
      .map((s) => ({
        studentId: s.id,
        studentName: s.name,
        currentScore: s.score ?? 54.0,
        identifiedGaps: [
          "Dificuldade na declaração de estruturas de repetição e loops condicionais",
          "Falhas em testes de limites (edge-cases com parâmetros nulos)",
          "Baixa cobertura de testes e modularização"
        ]
      }));

    // Se nenhum aluno estiver formalmente abaixo de 60, usa os alunos selecionados como reforço
    if (targetStudents.length === 0 && params.students.length > 0) {
      targetStudents.push({
        studentId: params.students[0].id,
        studentName: params.students[0].name,
        currentScore: params.students[0].score ?? 65.0,
        identifiedGaps: ["Aprofundamento técnico e otimização de código"]
      });
    }

    const focusArea = params.subjectFocus || "Lógica de Programação, Estruturas de Dados e Resiliência em Código";

    const prompt = `Você é o Coordenador Pedagógico do SENAI especialista em Recuperação Paralela Contínua.
Gere um Plano de Nivelamento Técnico para os seguintes estudantes da turma "${params.className}" que necessitam de intervenção pedagógica:
Estudantes: ${JSON.stringify(targetStudents.map(s => ({ nome: s.studentName, nota: s.currentScore })))}
Foco Temático: ${focusArea}

Sua tarefa:
Gere exatamente 3 desafios de código de recuperação gradual:
1. Desafio 1 (Nível Fácil): Reconstrução do fundamento básico com scaffolding claro.
2. Desafio 2 (Nível Médio): Aplicação prática com regras de negócio e validação de entrada.
3. Desafio 3 (Nível Médio/Avançado): Resolução de caso de borda e tratamento de exceções.

Retorne estritamente um JSON no seguinte formato:
{
  "pedagogicalDirective": "Diretriz pedagógica resumida para o docente orientando a aplicação em bancada.",
  "recommendedDeadlineDays": 7,
  "challenges": [
    {
      "id": "chal-01",
      "title": "Título do desafio 1",
      "competencyArea": "Área de competência SENAI",
      "difficulty": "Facil",
      "instructionMarkdown": "Instruções claras para o aluno resolver o problema...",
      "starterCode": "// Código esqueleto para iniciar...",
      "expectedBehavior": "Descrição do comportamento esperado",
      "rubricEvaluation": [
        { "criterion": "Lógica do algoritmo", "weightPercentage": 50, "passCriteria": "Resolve o problema principal" },
        { "criterion": "Tratamento de dados", "weightPercentage": 50, "passCriteria": "Valida entradas corretamente" }
      ]
    }
  ]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider();
      const rawAi = await provider.generateContent(prompt, { temperature: 0.25, max_tokens: 3500 });
      const cleanJson = rawAi.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        planId,
        classId: params.classId,
        className: params.className,
        generationDate,
        targetedStudents: targetStudents,
        challenges: Array.isArray(parsed.challenges) && parsed.challenges.length > 0 
          ? parsed.challenges 
          : ParallelRecoveryService.getDefaultChallenges(focusArea),
        recommendedDeadlineDays: parsed.recommendedDeadlineDays || 7,
        pedagogicalDirective: parsed.pedagogicalDirective || 
          "Aplicação recomendada em regime de bancada assistida com mentoria pontual nos primeiros 15 minutos."
      };
    } catch {
      return {
        planId,
        classId: params.classId,
        className: params.className,
        generationDate,
        targetedStudents: targetStudents,
        challenges: ParallelRecoveryService.getDefaultChallenges(focusArea),
        recommendedDeadlineDays: 7,
        pedagogicalDirective: 
          "Intervenção orientada pelo padrão SENAI: aplicação de scaffold progressivo para resgatar a autonomia técnica dos estudantes."
      };
    }
  }

  private static getDefaultChallenges(focus: string): ParallelRecoveryChallenge[] {
    return [
      {
        id: "recov-chal-01",
        title: "Nivelamento 01: Validação de Limites e Sanitização de Entrada",
        competencyArea: "Lógica e Algoritmos Defensivos",
        difficulty: "Facil",
        instructionMarkdown: `### Desafio 01 - Sanitização Básica
Implemente a função \`sanitizarEntradas(lista)\` que recebe uma lista de números inteiros e:
1. Remove valores negativos ou nulos (\`null\` / \`undefined\`).
2. Retorna a soma dos elementos válidos restantes. Se a lista estiver vazia, deve retornar \`0\`.`,
        starterCode: `function sanitizarEntradas(lista) {
  // TODO: Implemente a lógica defensiva
  if (!Array.isArray(lista) || lista.length === 0) {
    return 0;
  }
  
  return lista
    .filter(item => typeof item === "number" && item >= 0)
    .reduce((acc, curr) => acc + curr, 0);
}`,
        expectedBehavior: "Retorna a soma apenas dos valores numéricos maiores ou iguais a zero.",
        rubricEvaluation: [
          { criterion: "Tratamento de Array Vazio/Nulo", weightPercentage: 40, passCriteria: "Não lança TypeError com entradas inválidas" },
          { criterion: "Soma e Filtragem Correta", weightPercentage: 60, passCriteria: "Calcula a soma precisa dos elementos positivos" }
        ]
      },
      {
        id: "recov-chal-02",
        title: "Nivelamento 02: Consulta e Agrupamento com Filtragem Condicional",
        competencyArea: "Manipulação de Dados e Coleções",
        difficulty: "Medio",
        instructionMarkdown: `### Desafio 02 - Agrupamento por Categoria
Dada uma lista de objetos de estudantes com formato \`{ nome: string, nota: number }\`, implemente \`classificarDesempenho(estudantes)\` que retorna um objeto com dois arrays:
* \`aprovados\`: estudantes com nota >= 60.
* \`reforco\`: estudantes com nota < 60.`,
        starterCode: `function classificarDesempenho(estudantes) {
  const resultado = {
    aprovados: [],
    reforco: []
  };
  
  if (!Array.isArray(estudantes)) return resultado;

  for (const aluno of estudantes) {
    if (aluno && typeof aluno.nota === "number") {
      if (aluno.nota >= 60) {
        resultado.aprovados.push(aluno.nome);
      } else {
        resultado.reforco.push(aluno.nome);
      }
    }
  }

  return resultado;
}`,
        expectedBehavior: "Segrega corretamente os nomes dos estudantes em duas categorias distintas com base na nota de corte.",
        rubricEvaluation: [
          { criterion: "Iteração e Validação de Objetos", weightPercentage: 50, passCriteria: "Verifica a integridade do objeto antes de acessar a propriedade" },
          { criterion: "Agrupamento Categórico", weightPercentage: 50, passCriteria: "Retorna as chaves 'aprovados' e 'reforco' devidamente povoadas" }
        ]
      },
      {
        id: "recov-chal-03",
        title: "Nivelamento 03: Tratamento de Exceções e Resiliência em Chamadas Assíncronas",
        competencyArea: "Boas Práticas e Arquitetura de Software",
        difficulty: "Avancado",
        instructionMarkdown: `### Desafio 03 - Execução Segura com Retry Automático
Crie uma função \`executarComRetry(funcaoOperacao, maxTentativas)\` que tenta executar uma promessa assíncrona até \`maxTentativas\` vezes antes de lançar o erro definitivo.`,
        starterCode: `async function executarComRetry(funcaoOperacao, maxTentativas = 3) {
  let ultimaFalha = null;
  
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      return await funcaoOperacao();
    } catch (erro) {
      ultimaFalha = erro;
      if (tentativa === maxTentativas) {
        throw new Error(\`Falha após \${maxTentativas} tentativas: \${erro.message}\`);
      }
    }
  }
}`,
        expectedBehavior: "Garante resiliência tolerando falhas transitórias até o limite estipulado.",
        rubricEvaluation: [
          { criterion: "Loop Assíncrono com Try/Catch", weightPercentage: 60, passCriteria: "Captura erros transitórios sem travar o runtime" },
          { criterion: "Mensagem de Erro Clara na Exaustão", weightPercentage: 40, passCriteria: "Lança mensagem detalhada quando todas as tentativas falham" }
        ]
      }
    ];
  }
}
