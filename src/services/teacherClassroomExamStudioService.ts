import { jsPDF } from "jspdf";
import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { ConfidentialFileVault, EncryptedFilePackage } from "../security/ConfidentialFileVault";

export type { CustomAIRequestOptions };

export interface ExamQuestionOption {
  id: string; // "A", "B", "C", "D", "E"
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ExamQuestionMaster {
  id: string;
  index: number;
  type: "MULTIPLE_CHOICE" | "DISCURSIVE" | "CODE_ANALYSIS" | "TRUE_FALSE" | "CASE_STUDY";
  subjectArea?: string; // Ex: "Algoritmos & Estruturas", "Banco de Dados", "Segurança & LGPD"
  statement: string;
  codeSnippet?: string;
  options?: ExamQuestionOption[]; // Para múltipla escolha / V-F
  correctAnswerText?: string;     // Para discursiva / código
  rubricCriteria?: {
    criterion: string;
    points: number;
    description: string;
  }[];
  bloomTaxonomyLevel: "Lembrar" | "Entender" | "Aplicar" | "Analisar" | "Avaliar" | "Criar";
  competencyCode: string; // Ex: BNCC-EM13MAT301, SENAI-DS-04
  difficulty: "FÁCIL" | "MÉDIO" | "DIFÍCIL";
  points: number;
  pedagogicalTip: string;
  commonDistractorReasoning?: string;
}

export interface ExamVariantQuestion {
  variantIndex: number;
  originalQuestionId: string;
  subjectArea?: string;
  statement: string;
  codeSnippet?: string;
  options?: ExamQuestionOption[];
  correctOptionId?: string; // e.g. "C" in Variant B (even if was "A" in Master)
  type: "MULTIPLE_CHOICE" | "DISCURSIVE" | "CODE_ANALYSIS" | "TRUE_FALSE" | "CASE_STUDY";
  points: number;
}

export interface ExamVariant {
  variantCode: string; // "A", "B", "C", "D"
  variantTitle: string;
  antiCheatSeed: string;
  qrCodeSignature: string;
  questions: ExamVariantQuestion[];
  answerKeyMap: Record<number, string>; // { 1: "B", 2: "D", 3: "A", ... }
}

export interface TeacherExamSuite {
  id: string;
  title: string;
  subject: string;
  multiSubjects?: string[]; // Múltiplas disciplinas integradas (ex: 40+ questões multiassunto)
  subjectBreakdown?: { subject: string; questionCount: number; percentage: number }[];
  courseName: string;
  targetAudience: string; // Ex: "Técnico em Desenvolvimento de Sistemas - SENAI", "Engenharia de Software"
  totalPoints: number;
  durationMinutes: number;
  instructions: string[];
  masterQuestions: ExamQuestionMaster[];
  variants: ExamVariant[];
  createdAt: string;
  institutionHeader: {
    institution: string;
    department: string;
    teacherName: string;
    academicPeriod: string;
  };
}

export interface StudentOmrSubmission {
  studentId: string;
  studentName: string;
  variantCode: string; // "A", "B", "C", "D"
  markedAnswers: Record<number, string>; // { 1: "A", 2: "C", 3: "D" ... }
  timestamp?: string;
}

export interface StudentOmrGradingResult {
  studentId: string;
  studentName: string;
  variantCode: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  isApproved: boolean; // SENAI >= 60%
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  itemDetails: {
    questionIndex: number;
    marked: string;
    expected: string;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    competency: string;
    subjectArea?: string;
  }[];
  competencyMastery: Record<string, { earned: number; total: number; percentage: number }>;
  pedagogicalFeedback: string;
}

export interface ClassOmrBatchReport {
  examTitle: string;
  totalSubmissions: number;
  classAverage: number;
  approvalRate: number; // Percentual >= 60%
  highestScore: number;
  lowestScore: number;
  hardestQuestions: {
    questionIndex: number;
    errorRatePercentage: number;
    mostCommonWrongAnswer: string;
    topicDescription: string;
  }[];
  studentResults: StudentOmrGradingResult[];
  recommendedInterventions: string[];
}

export class TeacherClassroomExamStudioService {
  /**
   * Helper unificado para salvar no navegador ou gerar Buffer no Node.js
   */
  private static formatPdfOutput(doc: jsPDF, saveFilename?: string): Buffer {
    if (typeof window !== "undefined" && saveFilename) {
      doc.save(saveFilename);
    }
    const arrayBuffer = doc.output("arraybuffer");
    return typeof Buffer !== "undefined" ? Buffer.from(arrayBuffer) : (new Uint8Array(arrayBuffer) as any);
  }

  // =========================================================================
  // 1. GERADOR HIPER-PARAMÉTRICO DE SUÍTE DE PROVAS MULTIVERSÃO COM IA
  //    SUPORTE A 40+ QUESTÕES MULTIASSUNTO / MULTIDISCIPLINARES
  // =========================================================================
  static async generateExamSuite(params: {
    subject: string;
    topic: string;
    multiSubjects?: string[]; // Ex: ["Algoritmos", "Banco de Dados", "Engenharia de Software", "Segurança & LGPD"]
    courseName?: string;
    targetAudience?: string;
    educationLevel?: "SENAI_TECNICO" | "SUPERIOR" | "ENSINO_MEDIO" | "CONCURSO_ENADE";
    questionCount?: number; // Suporta 40, 50, 60, 80, 100+ questões
    variantCount?: number; // Ex: 4 (A, B, C, D)
    questionTypes?: ("MULTIPLE_CHOICE" | "DISCURSIVE" | "CODE_ANALYSIS" | "TRUE_FALSE" | "CASE_STUDY")[];
    difficultyDistribution?: { easy: number; medium: number; hard: number }; // Ex: 30%, 50%, 20%
    customInstructions?: string;
    teacherName?: string;
    academicPeriod?: string;
    customAI?: CustomAIRequestOptions;
  }): Promise<TeacherExamSuite> {
    const subject = params.subject || "Desenvolvimento de Software";
    const topic = params.topic || "Estruturas de Dados e Algoritmos";
    const multiSubjects = params.multiSubjects && params.multiSubjects.length > 0
      ? params.multiSubjects
      : [subject, "Banco de Dados & SQL", "Engenharia de Software & Clean Code", "Segurança da Informação & LGPD"];
    
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas";
    const targetAudience = params.targetAudience || "SENAI - Formação Profissional Técnica";
    // Permite de 3 até 100 questões (padrão 40 para simulados multiassunto)
    const questionCount = Math.max(3, Math.min(100, params.questionCount || 40));
    const variantCount = Math.max(1, Math.min(6, params.variantCount || 4));
    const teacherName = params.teacherName || "Prof. Especialista";
    const academicPeriod = params.academicPeriod || "2026/1";

    const prompt = `Você é um Especialista em Avaliação Educacional Técnica e Metodologia SENAI / BNCC / ENADE.
Crie um conjunto mestre de ${questionCount} questões avaliativas profissionais MULTIASSUNTO / MULTIDISCIPLINARES, contextualizadas no cenário real da indústria e tecnologia.

INFORMAÇÕES DA AVALIAÇÃO:
- Disciplina Principal: "${subject}"
- Tópico / Ementa Geral: "${topic}"
- Eixos Temáticos / Disciplinas Integradas: ${multiSubjects.map((s, idx) => `${idx + 1}. ${s}`).join("; ")}
- Curso: "${courseName}"
- Público-Alvo: "${targetAudience}"
- Nível: "${params.educationLevel || "SENAI_TECNICO"}"
- Quantidade Total de Questões: ${questionCount} (Distribua as questões de forma equilibrada entre os eixos temáticos acima)
- Tipos de Questão Permitidos: ${(params.questionTypes || ["MULTIPLE_CHOICE", "CODE_ANALYSIS"]).join(", ")}
${params.customInstructions ? `- Instruções Adicionais: "${params.customInstructions}"` : ""}

DIRETRIZES DE ELABORAÇÃO:
1. As questões devem cobrir proporcionalmente os ${multiSubjects.length} eixos temáticos fornecidos.
2. Cada questão de múltipla escolha DEVE ter 4 opções (A, B, C, D) com alternativas plausíveis (distratores inteligentes baseados em equívocos comuns).
3. Cada questão deve ter competência associada (ex: SENAI-DS-01, SENAI-BD-02, SENAI-SEC-03), área temática (subjectArea), nível de taxonomia de Bloom e pontuação.
4. Explicação detalhada do gabarito e justificativa pedagógica para cada distrator.

RETORNE ESTRITAMENTE UM JSON VÁLIDO no seguinte formato:
{
  "title": "Simulado Integrado Multiassunto — ${topic}",
  "instructions": [
    "Leia atentamente cada enunciado antes de responder.",
    "Para questões de múltipla escolha, apenas uma alternativa é correta.",
    "Preencha o cartão-resposta com caneta azul ou preta sem rasuras.",
    "Duração máxima de 180 minutos."
  ],
  "questions": [
    {
      "index": 1,
      "subjectArea": "${multiSubjects[0]}",
      "type": "MULTIPLE_CHOICE",
      "statement": "Texto claro e contextualizado do problema...",
      "codeSnippet": "// Código opcional caso seja questão de análise de software",
      "bloomTaxonomyLevel": "Aplicar",
      "competencyCode": "SENAI-TEC-01",
      "difficulty": "MÉDIO",
      "points": 2.5,
      "pedagogicalTip": "Dica de fixação conceitual para o professor trabalhar após a prova.",
      "commonDistractorReasoning": "Distrator C é escolhido quando o aluno confunde indexação 0-based com 1-based.",
      "options": [
        { "id": "A", "text": "Texto da alternativa A", "isCorrect": true, "explanation": "Por que esta é a correta." },
        { "id": "B", "text": "Texto da alternativa B", "isCorrect": false, "explanation": "Por que está incorreta." },
        { "id": "C", "text": "Texto da alternativa C", "isCorrect": false, "explanation": "Erro conceitual típico." },
        { "id": "D", "text": "Texto da alternativa D", "isCorrect": false, "explanation": "Distrator de desatenção." }
      ]
    }
  ]
}`;

    let parsedResult: any = null;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 8192 });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      // Fallback algorítmico determinístico robusto caso a IA esteja offline
      parsedResult = this.generateDeterministicMasterQuestions(subject, topic, questionCount, multiSubjects);
    }

    if (!parsedResult || !Array.isArray(parsedResult.questions) || parsedResult.questions.length === 0) {
      parsedResult = this.generateDeterministicMasterQuestions(subject, topic, questionCount, multiSubjects);
    }

    // Normalizar questões mestre
    const rawQuestions: any[] = parsedResult.questions;
    // Se a IA gerou menos questões que o solicitado (ex: 40), completar com o gerador determinístico
    if (rawQuestions.length < questionCount) {
      const fallback = this.generateDeterministicMasterQuestions(subject, topic, questionCount, multiSubjects);
      const needed = questionCount - rawQuestions.length;
      rawQuestions.push(...fallback.questions.slice(0, needed));
    }

    const actualQuestions = rawQuestions.slice(0, questionCount);
    const pointsPerQuestion = Number((100 / actualQuestions.length).toFixed(2));

    const masterQuestions: ExamQuestionMaster[] = actualQuestions.map((q, idx) => {
      const assignedSubject = q.subjectArea || multiSubjects[idx % multiSubjects.length] || subject;
      const options: ExamQuestionOption[] = (q.options || [
        { id: "A", text: "Opção correta principal", isCorrect: true, explanation: "Atende perfeitamente ao requisito técnico." },
        { id: "B", text: "Opção com inconsistência lógica", isCorrect: false, explanation: "Falha na validação de limites operacionais." },
        { id: "C", text: "Opção com complexidade assintótica inadequada", isCorrect: false, explanation: "Gera sobrecarga de memória desnecessária." },
        { id: "D", text: "Opção conceitualmente errônea", isCorrect: false, explanation: "Viola as boas práticas da arquitetura." },
      ]).map((opt: any, optIdx: number) => ({
        id: opt.id || String.fromCharCode(65 + optIdx),
        text: opt.text || `Alternativa ${String.fromCharCode(65 + optIdx)}`,
        isCorrect: Boolean(opt.isCorrect),
        explanation: opt.explanation || "",
      }));

      // Garantir que pelo menos uma opção é correta
      if (!options.some((o) => o.isCorrect)) {
        options[0].isCorrect = true;
      }

      return {
        id: `QM-${idx + 1}-${Date.now().toString(36)}`,
        index: idx + 1,
        type: q.type || "MULTIPLE_CHOICE",
        subjectArea: assignedSubject,
        statement: q.statement || `Questão #${idx + 1} sobre ${assignedSubject} no contexto de ${topic}`,
        codeSnippet: q.codeSnippet || undefined,
        options,
        correctAnswerText: q.correctAnswerText || undefined,
        bloomTaxonomyLevel: q.bloomTaxonomyLevel || (idx % 3 === 0 ? "Aplicar" : idx % 3 === 1 ? "Analisar" : "Avaliar"),
        competencyCode: q.competencyCode || `SENAI-CP-${100 + (idx % 20)}`,
        difficulty: q.difficulty || (idx % 4 === 0 ? "FÁCIL" : idx % 4 === 3 ? "DIFÍCIL" : "MÉDIO"),
        points: q.points || pointsPerQuestion,
        pedagogicalTip: q.pedagogicalTip || `Reforce o conceito de ${assignedSubject} em aula prática com exemplos incrementais.`,
        commonDistractorReasoning: q.commonDistractorReasoning || "Atenção a armadilhas comuns de sintaxe e semântica.",
      };
    });

    // Ajustar soma dos pontos para exatamente 100
    const currentSum = Number(masterQuestions.reduce((acc, q) => acc + q.points, 0).toFixed(2));
    if (currentSum !== 100 && masterQuestions.length > 0) {
      const diff = Number((100 - currentSum).toFixed(2));
      masterQuestions[masterQuestions.length - 1].points = Number((masterQuestions[masterQuestions.length - 1].points + diff).toFixed(2));
    }

    // Calcular breakdown por assunto
    const subjectCounts: Record<string, number> = {};
    masterQuestions.forEach((q) => {
      const sa = q.subjectArea || subject;
      subjectCounts[sa] = (subjectCounts[sa] || 0) + 1;
    });

    const subjectBreakdown = Object.entries(subjectCounts).map(([sub, count]) => ({
      subject: sub,
      questionCount: count,
      percentage: Math.round((count / masterQuestions.length) * 100),
    }));

    // Gerar as variantes (A, B, C, D...) com permutação determinística e preservação do gabarito
    const variants: ExamVariant[] = this.generatePermutatedVariants(masterQuestions, variantCount);

    const examSuiteId = `EXAM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      id: examSuiteId,
      title: parsedResult.title || `Simulado Integrado Multiassunto — ${topic}`,
      subject,
      multiSubjects,
      subjectBreakdown,
      courseName,
      targetAudience,
      totalPoints: 100,
      durationMinutes: questionCount >= 40 ? 180 : 90,
      instructions: parsedResult.instructions || [
        "Leia atentamente cada enunciado antes de assinalar a resposta.",
        "Apenas uma alternativa é correta para cada questão de múltipla escolha.",
        "Preencha o Cartão-Resposta oficial com caneta esferográfica preta ou azul.",
        `Esta avaliação contém ${questionCount} questões multidisciplinares. Duração máxima: ${questionCount >= 40 ? "180" : "90"} minutos.`,
      ],
      masterQuestions,
      variants,
      createdAt: new Date().toISOString(),
      institutionHeader: {
        institution: "SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI",
        department: "Departamento Regional • Coordenação de Educação Profissional",
        teacherName,
        academicPeriod,
      },
    };
  }

  /**
   * Gera variantes A, B, C, D... permutando a ordem das questões e a ordem das alternativas.
   */
  private static generatePermutatedVariants(
    masterQuestions: ExamQuestionMaster[],
    variantCount: number
  ): ExamVariant[] {
    const variantCodes = ["A", "B", "C", "D", "E", "F"].slice(0, variantCount);
    const variants: ExamVariant[] = [];

    variantCodes.forEach((code, vIdx) => {
      // Semente de permutação estável por variante
      const shiftedQuestions = this.permuteArrayWithSeed([...masterQuestions], vIdx * 3 + 1);

      const variantQuestions: ExamVariantQuestion[] = [];
      const answerKeyMap: Record<number, string> = {};

      shiftedQuestions.forEach((origQ, qIdx) => {
        const questionNum = qIdx + 1;

        if (origQ.options && origQ.options.length > 0) {
          // Permutar as alternativas
          const permutedOpts = this.permuteArrayWithSeed([...origQ.options], vIdx * 7 + qIdx * 5 + 2);

          // Reatribuir letras A, B, C, D para as opções reordenadas
          const remappedOptions: ExamQuestionOption[] = permutedOpts.map((opt, optIdx) => {
            const newLetter = String.fromCharCode(65 + optIdx);
            return {
              id: newLetter,
              text: opt.text,
              isCorrect: opt.isCorrect,
              explanation: opt.explanation,
            };
          });

          // Encontrar qual nova letra é a correta
          const correctOpt = remappedOptions.find((o) => o.isCorrect);
          const correctLetter = correctOpt ? correctOpt.id : "A";

          variantQuestions.push({
            variantIndex: questionNum,
            originalQuestionId: origQ.id,
            subjectArea: origQ.subjectArea,
            statement: origQ.statement,
            codeSnippet: origQ.codeSnippet,
            options: remappedOptions,
            correctOptionId: correctLetter,
            type: origQ.type,
            points: origQ.points,
          });

          answerKeyMap[questionNum] = correctLetter;
        } else {
          // Questão discursiva / aberta
          variantQuestions.push({
            variantIndex: questionNum,
            originalQuestionId: origQ.id,
            subjectArea: origQ.subjectArea,
            statement: origQ.statement,
            codeSnippet: origQ.codeSnippet,
            type: origQ.type,
            points: origQ.points,
          });

          answerKeyMap[questionNum] = "DISCURSIVA";
        }
      });

      const qrCodeSignature = ConfidentialFileVault.generateExamQrSignature({
        examId: "SUITE-EXAM",
        variantCode: code,
        studentId: "ALL_STUDENTS"
      });

      variants.push({
        variantCode: code,
        variantTitle: `Caderno de Prova — Versão ${code}`,
        antiCheatSeed: `VAR-${code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        qrCodeSignature,
        questions: variantQuestions,
        answerKeyMap,
      });
    });

    return variants;
  }

  /**
   * Permutação determinística usando Pseudo-Random LCG
   */
  private static permuteArrayWithSeed<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let currentSeed = seed;

    for (let i = result.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const rnd = currentSeed / 233280;
      const j = Math.floor(rnd * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    return result;
  }

  /**
   * Fallback offline com um banco enciclopédico de 50+ questões industriais
   * distribuídas em 8 eixos temáticos para gerar provas de 40 a 100+ questões.
   */
  private static generateDeterministicMasterQuestions(
    subject: string,
    topic: string,
    count: number,
    multiSubjects: string[] = []
  ): any {
    const masterPool: any[] = [
      // -------------------------------------------------------------
      // EIXO 1: ALGORITMOS E ESTRUTURAS DE DADOS (1-7)
      // -------------------------------------------------------------
      {
        subjectArea: "Algoritmos & Estruturas de Dados",
        statement: `Em um sistema de manufatura integrada da Indústria 4.0, uma esteira automatizada envia eventos de telemetria para processamento concorrente. Ao implementar uma fila de prioridade para alarmes críticos em tempo real, qual estrutura de dados e estratégia garante menor latência assintótica de inserção e extração no pior caso?`,
        bloomTaxonomyLevel: "Analisar",
        competencyCode: "SENAI-ALGO-01",
        difficulty: "MÉDIO",
        pedagogicalTip: "Demonstre no laboratório o consumo de CPU entre Heap Binário e Array Linear em alta taxa de eventos.",
        commonDistractorReasoning: "Alunos frequentemente sugerem Listas Encadeadas simples sem considerar o custo O(N) de ordenação.",
        options: [
          { id: "A", text: "Heap Binário balanceado (Priority Queue) com tempo assintótico O(log N) para inserção e extração do evento prioritário.", isCorrect: true, explanation: "Garante eficiência máxima sem necessidade de varredura linear de todos os alarmes." },
          { id: "B", text: "Array estático linear varrido com ordenação Bubble Sort a cada nova leitura de sensor.", isCorrect: false, explanation: "Apresenta complexidade O(N^2), inaceitável para sistemas de tempo real." },
          { id: "C", text: "Pilha LIFO sem verificação de prioridade, processando apenas o evento mais recente.", isCorrect: false, explanation: "Pode deixar alarmes críticos bloqueados indefinidamente na base da pilha." },
          { id: "D", text: "Tabela Hash sem suporte a ordenação de chaves prioritárias.", isCorrect: false, explanation: "Tabelas hash diretas não possuem ordem natural para extrair o elemento de maior prioridade em O(1)." }
        ]
      },
      {
        subjectArea: "Algoritmos & Estruturas de Dados",
        statement: `Deseja-se verificar a existência de um elemento em um conjunto com 10 milhões de CPFs cadastrados com tempo de busca O(1) médio. Qual estrutura é a mais indicada?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-ALGO-02",
        difficulty: "FÁCIL",
        pedagogicalTip: "Explique como funções de dispersão (hash functions) distribuem os registros em buckets.",
        commonDistractorReasoning: "Confundir Tabela Hash com Busca Binária em Array Ordenado O(log N).",
        options: [
          { id: "A", text: "Tabela Hash (HashSet / HashMap) com função de espalhamento uniforme e tratamento de colisões.", isCorrect: true, explanation: "Acesso indexado em O(1) no caso médio através do valor hash da chave." },
          { id: "B", text: "Lista Simplesmente Encadeada percorrida a partir do nó cabeça.", isCorrect: false, explanation: "Exige varredura sequencial linear O(N)." },
          { id: "C", text: "Árvore de Busca Binária degenerada em lista linear.", isCorrect: false, explanation: "Degenera para O(N) no pior caso." },
          { id: "D", text: "Pilha LIFO com desempilhamento iterativo.", isCorrect: false, explanation: "Destrói a estrutura e exige O(N) operações." }
        ]
      },
      {
        subjectArea: "Algoritmos & Estruturas de Dados",
        statement: `Ao calcular a rota mais curta com pesos não-negativos entre sensores em uma rede de malha industrial (Mesh Network), qual algoritmo clássico de grafos deve ser selecionado?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-ALGO-03",
        difficulty: "MÉDIO",
        pedagogicalTip: "Simule o algoritmo de Dijkstra usando uma fila de prioridade para os vértices.",
        commonDistractorReasoning: "Confundir Dijkstra com Busca em Largura simples (BFS sem pesos).",
        options: [
          { id: "A", text: "Algoritmo de Dijkstra utilizando fila de prioridade (Min-Heap) com complexidade O((V + E) log V).", isCorrect: true, explanation: "Encontra o caminho ótimo de menor custo em grafos ponderados com arestas não-negativas." },
          { id: "B", text: "Busca em Profundidade (DFS) sem controle de pesos.", isCorrect: false, explanation: "Não garante o caminho de menor custo, apenas explora os ramos até as folhas." },
          { id: "C", text: "Ordenação Topológica com Kahn's Algorithm.", isCorrect: false, explanation: "Serve para ordenar dependências de tarefas em DAGs, não para calcular menor caminho." },
          { id: "D", text: "QuickSort recursivo nas arestas.", isCorrect: false, explanation: "Apenas ordena elementos, não calcula caminhos em grafos." }
        ]
      },
      {
        subjectArea: "Algoritmos & Estruturas de Dados",
        statement: `Qual é a complexidade de tempo assintótica no pior caso para o algoritmo QuickSort quando a escolha do pivô é ineficiente (ex: array já ordenado com pivô no primeiro elemento)?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-ALGO-04",
        difficulty: "MÉDIO",
        pedagogicalTip: "Mostre como pivôs aleatórios ou Mediana de Três evitam o pior caso O(N^2).",
        commonDistractorReasoning: "Achar que QuickSort é sempre O(N log N) em todos os cenários.",
        options: [
          { id: "A", text: "O(N^2), devido a partições altamente desbalanceadas de tamanho 1 e N-1.", isCorrect: true, explanation: "Sem pivô balanceado, a árvore de recursão atinge profundidade N." },
          { id: "B", text: "O(N log N) constante e imutável.", isCorrect: false, explanation: "Essa é a complexidade média, não do pior caso sem pivô mediano." },
          { id: "C", text: "O(N) linear com particionamento em única passada.", isCorrect: false, explanation: "Inviável para ordenação baseada em comparação." },
          { id: "D", text: "O(1) instantâneo.", isCorrect: false, explanation: "Impossível para ordenação de coleções arbitrárias." }
        ]
      },
      {
        subjectArea: "Algoritmos & Estruturas de Dados",
        statement: `Para resolver o problema da Mochila Fracionária (Fractional Knapsack), onde itens podem ser divididos, qual paradigma algorítmico produz a solução ótima comprovada?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-ALGO-05",
        difficulty: "MÉDIO",
        pedagogicalTip: "Compare a Mochila Fracionária (Gulosa) com a Mochila 0/1 (Programação Dinâmica).",
        commonDistractorReasoning: "Acreditar que a Mochila Fracionária requer Programação Dinâmica complexa.",
        options: [
          { id: "A", text: "Algoritmo Guloso (Greedy Choice) ordenando os itens pela razão valor/peso decrescente.", isCorrect: true, explanation: "A escolha gulosa garante a maximização do valor para itens divisíveis." },
          { id: "B", text: "Backtracking exaustivo com poda alfa-beta.", isCorrect: false, explanation: "Gera complexidade exponencial desnecessária para o caso fracionário." },
          { id: "C", text: "Busca Aleatória Monte Carlo.", isCorrect: false, explanation: "Não é determinístico nem garante a solução ótima estrita." },
          { id: "D", text: "Algoritmo de Floyd-Warshall de todos os pares.", isCorrect: false, explanation: "Destinado a distâncias em grafos, não problemas de otimização de itens." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 2: BANCO DE DADOS RELACIONAL & SQL (6-11)
      // -------------------------------------------------------------
      {
        subjectArea: "Banco de Dados & SQL",
        statement: `Durante a homologação de um banco PostgreSQL para um sistema de rastreabilidade de peças, constatou-se que consultas que filtram pelo código de barras e data de fabricação apresentavam gargalos de I/O em tabelas com 5 milhões de registros. Qual índice é a solução mais performática recomendada?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-BD-01",
        difficulty: "DIFÍCIL",
        pedagogicalTip: "Ensine os alunos a utilizar 'EXPLAIN ANALYZE' para comparar Index Scan vs Sequential Scan.",
        commonDistractorReasoning: "Criar dois índices B-Tree separados em vez de um índice composto multicoluna.",
        options: [
          { id: "A", text: "Índice Composto B-Tree cobrindo as colunas (codigo_barras, data_fabricacao) para viabilizar Index Only Scan.", isCorrect: true, explanation: "Permite que a engine localize e ordene os registros com um único salto no índice." },
          { id: "B", text: "Desativação de chaves primárias e estrangeiras para acelerar leitura de disco.", isCorrect: false, explanation: "Compromete a integridade referencial sem otimizar a velocidade de busca das consultas." },
          { id: "C", text: "Conversão de todas as colunas numéricas para formato de texto VARCHAR longo.", isCorrect: false, explanation: "Aumenta o consumo de espaço em disco e torna as comparações mais lentas." },
          { id: "D", text: "Substituição completa do banco de dados por arquivos de texto plano CSV.", isCorrect: false, explanation: "Inviabiliza concorrência, transações ACID e consultas indexadas." }
        ]
      },
      {
        subjectArea: "Banco de Dados & SQL",
        statement: `Qual nível de isolamento transacional SQL ANSI/ISO impede anomalias de 'Dirty Read', 'Non-Repeatable Read' e 'Phantom Read' de forma estrita?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-BD-02",
        difficulty: "MÉDIO",
        pedagogicalTip: "Explique como o isolamento SERIALIZABLE utiliza bloqueios de predicado ou MVCC com SSI.",
        commonDistractorReasoning: "Confundir Read Committed com Serializable.",
        options: [
          { id: "A", text: "SERIALIZABLE, que garante execução concorrente equivalente a uma ordem estritamente sequencial.", isCorrect: true, explanation: "É o nível mais alto de isolamento transacional, eliminando todas as anomalias de leitura." },
          { id: "B", text: "READ UNCOMMITTED, que permite leitura suja de dados não confirmados.", isCorrect: false, explanation: "É o nível mais permissivo e suscetível a todas as anomalias." },
          { id: "C", text: "READ COMMITTED, que ainda permite leituras não-repetíveis e fantasmas.", isCorrect: false, explanation: "Não impede leituras fantasmas de novas linhas inseridas por outras transações." },
          { id: "D", text: "AUTOCOMMIT OFF sem controle de lock.", isCorrect: false, explanation: "Não é um nível de isolamento transacional, apenas uma diretiva de sessão." }
        ]
      },
      {
        subjectArea: "Banco de Dados & SQL",
        statement: `Uma tabela relacional possui atributos não-chave que dependem transitivamente da chave primária (ex: Chave -> Atributo A -> Atributo B). Qual forma normal é violada nessa estrutura?`,
        bloomTaxonomyLevel: "Analisar",
        competencyCode: "SENAI-BD-03",
        difficulty: "MÉDIO",
        pedagogicalTip: "Desenhe o diagrama de dependências funcionais mostrando a dependência transitiva A -> B.",
        commonDistractorReasoning: "Confundir 2FN (dependência parcial de chave composta) com 3FN (dependência transitiva).",
        options: [
          { id: "A", text: "Terceira Forma Normal (3FN), que proíbe dependências transitivas entre atributos não-chave.", isCorrect: true, explanation: "Para estar na 3FN, a tabela deve estar na 2FN e não conter dependências transitivas." },
          { id: "B", text: "Primeira Forma Normal (1FN), que trata apenas de valores atômicos e ausência de vetores repetitivos.", isCorrect: false, explanation: "1FN lida com atomicidade de colunas, não transitividade." },
          { id: "C", text: "Segunda Forma Normal (2FN), que trata de dependência funcional total em relação à chave primária composta.", isCorrect: false, explanation: "2FN lida com dependências parciais de chaves compostas." },
          { id: "D", text: "Forma Normal de Boyce-Codd (BCNF) exclusivamente para chaves candidatas sobrepostas.", isCorrect: false, explanation: "A violação de transitividade básica já é tratada diretamente pela 3FN." }
        ]
      },
      {
        subjectArea: "Banco de Dados & SQL",
        statement: `Em um banco NoSQL orientado a documentos (MongoDB), quando a modelagem 'Embedded Documents' (Documentos Embutidos) é superior ao padrão 'Referenced Documents' (Relacionamento por ID)?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-BD-04",
        difficulty: "DIFÍCIL",
        pedagogicalTip: "Analise a proporção 1:1 e 1:Poucos com operações de leitura atômica em documento único.",
        commonDistractorReasoning: "Tentar embutir arrays infinitos que ultrapassam o limite de 16MB do BSON.",
        options: [
          { id: "A", text: "Em relacionamentos 1:1 ou 1:Poucos com alta frequência de leitura conjunta atômica em única operação de I/O.", isCorrect: true, explanation: "Evita múltiplos roundtrips de rede e lookups/joins custosos." },
          { id: "B", text: "Em coleções onde o array de filhos cresce indefinidamente sem qualquer limite de tamanho.", isCorrect: false, explanation: "Pode estourar o limite de 16MB por documento do MongoDB e causar fragmentação." },
          { id: "C", text: "Quando é obrigatório realizar transações distribuídas com locks de múltiplas coleções heterogêneas.", isCorrect: false, explanation: "Documentos embutidos servem para manter o escopo local no documento pai." },
          { id: "D", text: "Para forçar normalização estrita igual à 3FN de bancos relacionais.", isCorrect: false, explanation: "Documentos embutidos são desnormalizados por definição." }
        ]
      },
      {
        subjectArea: "Banco de Dados & SQL",
        statement: `Ao executar 'EXPLAIN ANALYZE' no PostgreSQL, o que significa a presença do operador 'Seq Scan on pedidos (cost=0.00..18450.00 rows=500000 width=32)'?`,
        bloomTaxonomyLevel: "Analisar",
        competencyCode: "SENAI-BD-05",
        difficulty: "FÁCIL",
        pedagogicalTip: "Mostre a diferença visual entre Sequential Scan e Index Scan no terminal psql.",
        commonDistractorReasoning: "Achar que Sequential Scan é o modo mais rápido por ler blocos contíguos de disco.",
        options: [
          { id: "A", text: "O banco de dados realizou uma varredura completa da tabela bloco por bloco por não encontrar índice seletivo aplicável.", isCorrect: true, explanation: "Seq Scan lê todas as páginas da tabela, gerando alto custo em tabelas volumosas." },
          { id: "B", text: "A consulta utilizou o cache de memória RAM sem tocar no disco.", isCorrect: false, explanation: "Seq Scan não indica leitura de cache, mas sim estratégia de varredura sequencial." },
          { id: "C", text: "Houve uso de índice Hash com tempo O(1).", isCorrect: false, explanation: "Uso de índice seria reportado como 'Index Scan' ou 'Bitmap Index Scan'." },
          { id: "D", text: "O banco abortou a execução por timeout.", isCorrect: false, explanation: "O plano de execução descreve a estratégia física executada com sucesso." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 3: ENGENHARIA DE SOFTWARE, CLEAN CODE & TDD (11-16)
      // -------------------------------------------------------------
      {
        subjectArea: "Engenharia de Software & Clean Code",
        statement: `Considere o seguinte trecho de código para validação de integridade de dados em uma API RESTful de sensores:\n\nfunction validarLeitura(payload) {\n  if (!payload || typeof payload.temperatura !== 'number') return false;\n  if (payload.temperatura < -50 || payload.temperatura > 150) return false;\n  return true;\n}\n\nQual princípio de Clean Code e Defesa em Profundidade está sendo aplicado corretamente neste padrão?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-ENG-01",
        difficulty: "FÁCIL",
        pedagogicalTip: "Mostre como Early Return (Guard Clauses) reduz o aninhamento ciclomático do código.",
        commonDistractorReasoning: "Confusão entre tratamento de exceções (try/catch) e validação preventiva com cláusulas de guarda.",
        options: [
          { id: "A", text: "Cláusulas de Guarda (Early Return) com validação de tipo e faixa operacional (Boundary Value Checking).", isCorrect: true, explanation: "Evita aninhamento profundo de if/else e garante falha rápida (Fail-Fast)." },
          { id: "B", text: "Padrão Singleton para instanciação de serviços globais.", isCorrect: false, explanation: "Não há relação com ciclo de vida de objetos ou padrões criacionais." },
          { id: "C", text: "Programação Orientada a Aspectos (AOP) com injeção dinâmica de interceptores.", isCorrect: false, explanation: "Trata-se de uma função pura de validação síncrona simples." },
          { id: "D", text: "Recursividade de cauda para otimização de pilha de chamadas.", isCorrect: false, explanation: "A função não possui auto-invocação recursiva." }
        ]
      },
      {
        subjectArea: "Engenharia de Software & Clean Code",
        statement: `De acordo com os princípios SOLID, o Princípio da Responsabilidade Única (SRP) estabelece que uma classe ou módulo deve:`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-ENG-02",
        difficulty: "FÁCIL",
        pedagogicalTip: "Reforce a definição de Robert C. Martin: 'Um módulo deve ter apenas uma razão para mudar (um único ator)'.",
        commonDistractorReasoning: "Pensar que SRP significa que uma classe só pode ter um único método público.",
        options: [
          { id: "A", text: "Possuir apenas um motivo para mudar, respondendo a um único ator ou contexto de negócio.", isCorrect: true, explanation: "Concentra coesão e isola impactos de futuras alterações de regras de negócio." },
          { id: "B", text: "Conter apenas um método público de no máximo 10 linhas de código.", isCorrect: false, explanation: "SRP não impõe restrição arbitrária de quantidade de métodos, mas sim de coesão de responsabilidades." },
          { id: "C", text: "Implementar todas as interfaces do sistema em uma única classe mestra.", isCorrect: false, explanation: "Isso cria uma 'God Class', o oposto exato de SRP e ISP." },
          { id: "D", text: "Executar obrigatoriamente em uma única thread síncrona do sistema operacional.", isCorrect: false, explanation: "Não tem relação com concorrência ou threads de SO." }
        ]
      },
      {
        subjectArea: "Engenharia de Software & Clean Code",
        statement: `No ciclo de Test-Driven Development (TDD), qual é a sequência canônica de etapas conhecida como 'Red-Green-Refactor'?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-ENG-03",
        difficulty: "FÁCIL",
        pedagogicalTip: "Pratique o ciclo em sala: escrever o teste que falha, código mínimo que passa, e refatoração limpa.",
        commonDistractorReasoning: "Escrever todo o código de produção primeiro e depois criar testes retrospectivos.",
        options: [
          { id: "A", text: "1. Escrever teste que falha (Red) -> 2. Escrever o código mais simples para passar (Green) -> 3. Melhorar o design do código sem alterar o comportamento (Refactor).", isCorrect: true, explanation: "Garante cobertura preventiva e evolução do design guiada por testes unitários." },
          { id: "B", text: "1. Criar banco de dados -> 2. Desenvolver front-end -> 3. Rodar testes manuais em produção.", isCorrect: false, explanation: "Não é a metodologia TDD." },
          { id: "C", text: "1. Refatorar código legado -> 2. Desativar testes com falha -> 3. Publicar em homologação.", isCorrect: false, explanation: "Desativar testes viola a integridade do ciclo." },
          { id: "D", text: "1. Compilar o código -> 2. Enviar para aprovação do cliente -> 3. Escrever documentação.", isCorrect: false, explanation: "Fluxo convencional de entrega manual, não TDD." }
        ]
      },
      {
        subjectArea: "Engenharia de Software & Clean Code",
        statement: `Qual padrão de projeto criacional GoF é o mais indicado quando a criação de um objeto exige a configuração passo a passo de múltiplos parâmetros opcionais complexos?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-ENG-04",
        difficulty: "MÉDIO",
        pedagogicalTip: "Mostre o problema do 'Telescoping Constructor' e como o padrão Builder resolve elegantemente.",
        commonDistractorReasoning: "Usar Singleton ou Abstract Factory para configuração fluente de parâmetros.",
        options: [
          { id: "A", text: "Builder Pattern, com interface fluente encadeada (.setA().setB().build()).", isCorrect: true, explanation: "Separa a construção de um objeto complexo da sua representação final." },
          { id: "B", text: "Singleton Pattern com instância estática imutável global.", isCorrect: false, explanation: "Garante instância única, não a construção flexível passo a passo." },
          { id: "C", text: "Adapter Pattern para converter interfaces incompatíveis.", isCorrect: false, explanation: "É um padrão estrutural de compatibilidade de contratos, não de criação." },
          { id: "D", text: "Observer Pattern para notificações de eventos publish/subscribe.", isCorrect: false, explanation: "É um padrão comportamental de eventos." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 4: ARQUITETURA DE SOFTWARE & MICROSSERVIÇOS (16-20)
      // -------------------------------------------------------------
      {
        subjectArea: "Arquitetura & Microsserviços",
        statement: `Em uma arquitetura de microsserviços para logística, um serviço consumidor fica inoperante devido à instabilidade temporária de um serviço de frete externo. Qual padrão de resiliência deve ser implementado para evitar falhas em cascata e degradação de todo o ecossistema?`,
        bloomTaxonomyLevel: "Criar",
        competencyCode: "SENAI-ARC-01",
        difficulty: "MÉDIO",
        pedagogicalTip: "Configure um dashboard de métricas com estados Closed, Open e Half-Open no simulador.",
        commonDistractorReasoning: "Confundir Circuit Breaker com balanceamento de carga de rede (Load Balancer).",
        options: [
          { id: "A", text: "Circuit Breaker (Disjuntor de Circuito) com Fallback gracioso e política de Retry exponencial com Jitter.", isCorrect: true, explanation: "Interrompe requisições a serviços instáveis, permitindo sua recuperação e mantendo a operação local estável." },
          { id: "B", text: "Laço infinito de requisições síncronas bloqueantes até que o serviço responda.", isCorrect: false, explanation: "Esgota as threads do servidor e derruba a aplicação consumidora por completo." },
          { id: "C", text: "Eliminação total de logs e métricas para economizar conexões de rede.", isCorrect: false, explanation: "Torna o sistema uma caixa-preta sem diagnóstico de incidentes." },
          { id: "D", text: "Transferência de todo o processamento de regras de negócio para a camada visual do front-end.", isCorrect: false, explanation: "Gera vulnerabilidades de segurança e inconsistência de dados." }
        ]
      },
      {
        subjectArea: "Arquitetura & Microsserviços",
        statement: `Para garantir transações distribuídas consistentes entre múltiplos microsserviços sem uso de bloqueios 2PC (Two-Phase Commit) pesados, qual padrão arquitetural é o padrão de mercado recomendado?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-ARC-02",
        difficulty: "DIFÍCIL",
        pedagogicalTip: "Apresente os dois estilos do padrão Saga: Coreografia (Eventos) e Orquestração (Coordenador Central).",
        commonDistractorReasoning: "Tentar usar transações XA/2PC em ambientes distribuídos na nuvem com alta latência.",
        options: [
          { id: "A", text: "Padrão Saga (por Orquestração ou Coreografia) com Ações Compensatórias para reversão em caso de falha.", isCorrect: true, explanation: "Mantém a consistência eventual particionando a transação em etapas locais com reversões compensatórias." },
          { id: "B", text: "Compartilhamento direto do mesmo banco de dados relacional físico por todos os microsserviços.", isCorrect: false, explanation: "Cria acoplamento severo e quebra a independência de deploy dos microsserviços." },
          { id: "C", text: "Uso de transações 2PC síncronas bloqueantes em conexões WAN públicas.", isCorrect: false, explanation: "Apresenta alto risco de bloqueio distribuído e baixa tolerância a partições de rede." },
          { id: "D", text: "Descarte silencioso de falhas sem registro ou notificação.", isCorrect: false, explanation: "Gera corrupção irreversível de estado financeiro/operacional." }
        ]
      },
      {
        subjectArea: "Arquitetura & Microsserviços",
        statement: `O que caracteriza uma operação idempotente em uma API RESTful de pagamentos?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-ARC-03",
        difficulty: "MÉDIO",
        pedagogicalTip: "Mostre o cabeçalho 'Idempotency-Key' utilizado por gateways como Stripe e Mercado Pago.",
        commonDistractorReasoning: "Achar que requisições repetidas devem sempre criar novos recursos duplicados.",
        options: [
          { id: "A", text: "A execução da mesma requisição múltiplas vezes produz exatamente o mesmo estado final no servidor sem duplicar efeitos colaterais.", isCorrect: true, explanation: "Essencial para resiliência a reenvios automáticos em redes instáveis." },
          { id: "B", text: "A API responde em tempo zero sem acessar o banco de dados.", isCorrect: false, explanation: "Idempotência trata de consistência de estado, não de tempo de resposta nulo." },
          { id: "C", text: "Apenas requisições GET podem ser executadas pelo cliente.", isCorrect: false, explanation: "Operações PUT, DELETE e POST com chaves de idempotência também são idempotentes." },
          { id: "D", text: "O servidor reinicia automaticamente a cada nova chamada.", isCorrect: false, explanation: "Não tem relação com a definição matemática e técnica de idempotência." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 5: SEGURANÇA DA INFORMAÇÃO, DEVSECOPS & LGPD (21-26)
      // -------------------------------------------------------------
      {
        subjectArea: "Segurança da Informação & LGPD",
        statement: `No contexto de segurança e conformidade com a LGPD (Lei Geral de Proteção de Dados), ao armazenar credenciais de usuários e operadores, qual é o procedimento criptográfico mandatório de acordo com as normas técnicas vigentes?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-SEC-01",
        difficulty: "FÁCIL",
        pedagogicalTip: "Apresente o conceito de Rainbow Tables e como o Salt individual impede ataques de dicionário pré-computados.",
        commonDistractorReasoning: "Acreditar que algoritmos obsoletos como MD5 ou SHA-1 ainda oferecem proteção suficiente.",
        options: [
          { id: "A", text: "Aplicação de função de derivação de chave com Salt criptográfico único e fator de trabalho adaptável (Argon2id ou BCrypt).", isCorrect: true, explanation: "Protege contra ataques de força bruta, tabelas arco-íris e aceleração por GPU." },
          { id: "B", text: "Criptografia reversível com chave estática gravada diretamente no código-fonte.", isCorrect: false, explanation: "Violação grave de segurança (Hardcoded Secret)." },
          { id: "C", text: "Hash MD5 simples sem qualquer adição de salt.", isCorrect: false, explanation: "Vulnerável a colisões e tabelas pré-computadas instantâneas." },
          { id: "D", text: "Codificação em Base64 para ocultação visual da senha no banco de dados.", isCorrect: false, explanation: "Base64 é apenas um formato de codificação facilmente reversível, não uma cifra ou hash." }
        ]
      },
      {
        subjectArea: "Segurança da Informação & LGPD",
        statement: `Um desenvolvedor concatena parâmetros de formulário diretamente na string de consulta SQL: 'SELECT * FROM usuarios WHERE email = '' + email + ''''. Qual vulnerabilidade crítica do OWASP Top 10 está presente e como mitigá-la?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-SEC-02",
        difficulty: "FÁCIL",
        pedagogicalTip: "Demonstre no laboratório como o input '' OR '1'='1' contorna autenticação se não houver Prepared Statement.",
        commonDistractorReasoning: "Acreditar que apenas substituir aspas simples por duplas resolve o SQL Injection.",
        options: [
          { id: "A", text: "SQL Injection (CWE-89); deve ser mitigada com o uso estrito de Consultas Parametrizadas (Prepared Statements / Parameterized Queries).", isCorrect: true, explanation: "Separa a estrutura sintática do comando SQL dos dados fornecidos pelo usuário." },
          { id: "B", text: "Cross-Site Scripting (XSS); mitigada apenas aumentando o tamanho da coluna no banco.", isCorrect: false, explanation: "A vulnerabilidade em questão é SQL Injection no banco de dados, não injeção de script no navegador." },
          { id: "C", text: "CSRF (Cross-Site Request Forgery); mitigada com uso de cookies HTTPOnly.", isCorrect: false, explanation: "CSRF explora confiança de sessão, não concatenação de queries SQL." },
          { id: "D", text: "Buffer Overflow; mitigada desligando o firewall.", isCorrect: false, explanation: "Buffer overflow ocorre em linguagens de baixo nível como C sem checagem de limites de ponteiro." }
        ]
      },
      {
        subjectArea: "Segurança da Informação & LGPD",
        statement: `De acordo com o Art. 18 da LGPD (Lei 13.709/2018), qual dos seguintes direitos é assegurado ao titular dos dados pessoais perante o controlador?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-SEC-03",
        difficulty: "FÁCIL",
        pedagogicalTip: "Apresente o papel do DPO (Encarregado) no atendimento a solicitações de eliminação e portabilidade de dados.",
        commonDistractorReasoning: "Achar que a empresa pode reter dados pessoais indefinidamente mesmo após revogação do consentimento.",
        options: [
          { id: "A", text: "Confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos e eliminação dos dados tratados com consentimento.", isCorrect: true, explanation: "Garante transparência, autodeterminação informativa e controle do titular sobre seus dados." },
          { id: "B", text: "Venda obrigatória dos seus dados para parceiros comerciais sem consentimento prévio.", isCorrect: false, explanation: "A comercialização de dados sem base legal é estritamente proibida." },
          { id: "C", text: "Proibição de qualquer empresa pública de manter registros cadastrais de cidadãos.", isCorrect: false, explanation: "Órgãos públicos podem tratar dados com base no cumprimento de obrigação legal e políticas públicas." },
          { id: "D", text: "Isenção perpétua de pagamento de impostos federais.", isCorrect: false, explanation: "A LGPD trata de proteção e privacidade de dados, não de direito tributário." }
        ]
      },
      {
        subjectArea: "Segurança da Informação & LGPD",
        statement: `Ao assinar tokens JWT (JSON Web Tokens) para autenticação entre microsserviços distribuídos, qual algoritmo e padrão de chave é recomendado para que os serviços consumidores validem o token sem conhecer o segredo de emissão?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-SEC-04",
        difficulty: "MÉDIO",
        pedagogicalTip: "Explique a diferença entre criptografia simétrica (HMAC SHA-256) e assimétrica (RSA/ECDSA com Chave Pública/Privada).",
        commonDistractorReasoning: "Distribuir a mesma chave privada simétrica para dezenas de microsserviços terceiros.",
        options: [
          { id: "A", text: "Criptografia Assimétrica (RS256 ou ES256), onde o Auth Server assina com a Chave Privada e os microsserviços validam com a Chave Pública (JWKS).", isCorrect: true, explanation: "Evita o compartilhamento do segredo mestre de geração de tokens." },
          { id: "B", text: "Algoritmo 'none' sem qualquer assinatura digital no header do JWT.", isCorrect: false, explanation: "Permite que qualquer atacante forje tokens arbitrários (Vulnerabilidade Crítica)." },
          { id: "C", text: "Chave estática simétrica '123456' compartilhada publicamente.", isCorrect: false, explanation: "Compromete completamente a segurança de todo o ecossistema." },
          { id: "D", text: "Gravação da senha pura do banco no payload sem assinatura.", isCorrect: false, explanation: "Expõe credenciais sensíveis em base64 público." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 6: DEVOPS, CI/CD & CONTÊINERES (26-30)
      // -------------------------------------------------------------
      {
        subjectArea: "DevOps, CI/CD & Contêineres",
        statement: `Ao construir imagens Docker para produção em ambientes corporativos de alta segurança, qual prática é recomendada para reduzir drasticamente a superfície de ataque e o tamanho da imagem final?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-OPS-01",
        difficulty: "MÉDIO",
        pedagogicalTip: "Compare um Dockerfile de estágio único com um Multi-Stage Build usando imagem distroless / alpine.",
        commonDistractorReasoning: "Incluir compiladores, compiladores C++, git e dependências de build na imagem final de runtime.",
        options: [
          { id: "A", text: "Utilização de Multi-Stage Builds copiando apenas os artefatos compilados finais para uma imagem base mínima (Distroless ou Alpine) executada por usuário não-root.", isCorrect: true, explanation: "Elimina ferramentas de build desnecessárias e reduz vulnerabilidades de pacotes." },
          { id: "B", text: "Instalar todos os utilitários de compilação e rodar o contêiner obrigatoriamente como usuário 'root'.", isCorrect: false, explanation: "Aumenta o risco de Container Escape e invasão do nó host." },
          { id: "C", text: "Desativar o isolamento de namespaces e compartilhar o PID 1 com o host.", isCorrect: false, explanation: "Quebra o isolamento básico do contêiner." },
          { id: "D", text: "Inserir senhas de produção fixadas no arquivo Dockerfile através da instrução ENV.", isCorrect: false, explanation: "Expõe credenciais nas camadas públicas da imagem Docker." }
        ]
      },
      {
        subjectArea: "DevOps, CI/CD & Contêineres",
        statement: `No Kubernetes, qual sonda (probe) deve ser configurada para que o cluster saiba quando um Pod terminou de aquecer e está pronto para receber tráfego do Service Load Balancer?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-OPS-02",
        difficulty: "MÉDIO",
        pedagogicalTip: "Diferencie Liveness Probe (reinicia contêiner travado) de Readiness Probe (habilita tráfego).",
        commonDistractorReasoning: "Confundir Liveness Probe com Readiness Probe.",
        options: [
          { id: "A", text: "Readiness Probe, que remove o Pod do balanceamento de carga caso o teste de prontidão falhe.", isCorrect: true, explanation: "Evita que requisições de usuários caiam em instâncias ainda em processo de inicialização." },
          { id: "B", text: "Liveness Probe exclusivamente para balancear tráfego HTTP.", isCorrect: false, explanation: "Liveness probe serve para reiniciar o contêiner quando ele entra em deadlock." },
          { id: "C", text: "CronJob de limpeza noturna do disco.", isCorrect: false, explanation: "CronJobs executam tarefas periódicas desacopladas do ciclo de vida dos Pods de serviço." },
          { id: "D", text: "DaemonSet de monitoramento de memória.", isCorrect: false, explanation: "DaemonSet garante 1 pod por nó físico, não é uma sonda de aplicação." }
        ]
      },
      {
        subjectArea: "DevOps, CI/CD & Contêineres",
        statement: `Em uma estratégia de deploy 'Canary Deployment', qual é o procedimento realizado para minimizar o impacto de possíveis bugs em produção?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-OPS-03",
        difficulty: "FÁCIL",
        pedagogicalTip: "Apresente como o roteamento gradual de tráfego (5% -> 25% -> 100%) monitora métricas de erro antes da virada total.",
        commonDistractorReasoning: "Confundir Canary Deployment com Blue-Green Deployment (chaveamento instantâneo 100%).",
        options: [
          { id: "A", text: "A nova versão é liberada inicialmente para uma pequena fração de usuários (ex: 5%), monitorando taxas de erro antes da promoção gradual para 100%.", isCorrect: true, explanation: "Permite detecção precoce de anomalias com impacto restrito a poucos usuários." },
          { id: "B", text: "O sistema inteiro é desligado durante o horário de pico para troca manual dos arquivos.", isCorrect: false, explanation: "Gera indisponibilidade inaceitável para sistemas modernos." },
          { id: "C", text: "A versão antiga é apagada imediatamente antes de iniciar a compilação da nova versão.", isCorrect: false, explanation: "Não oferece plano de contingência ou rollback em caso de falha de compilação." },
          { id: "D", text: "Todos os testes automatizados são ignorados para acelerar a entrega.", isCorrect: false, explanation: "Viola as boas práticas de qualidade contínua em CI/CD." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 7: REDES, APIS WEB & PROTOCOLOS (31-35)
      // -------------------------------------------------------------
      {
        subjectArea: "Redes & Protocolos Web",
        statement: `Qual das seguintes opções descreve uma evolução fundamental do protocolo HTTP/2 e HTTP/3 em comparação ao HTTP/1.1 tradicional?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-NET-01",
        difficulty: "MÉDIO",
        pedagogicalTip: "Explique o problema de Head-of-Line Blocking no HTTP/1.1 e como multiplexação em streams binários resolve.",
        commonDistractorReasoning: "Achar que HTTP/2 continua abrindo 6 conexões TCP paralelas para cada arquivo estático.",
        options: [
          { id: "A", text: "Multiplexação de múltiplas requisições/respostas concorrentes sobre uma única conexão TCP/QUIC em streams binários (eliminação do Head-of-Line Blocking).", isCorrect: true, explanation: "Permite tráfego simultâneo sem necessidade de múltiplas conexões TCP concorrentes custosas." },
          { id: "B", text: "Obrigação de transmissão em formato de texto puro sem compactação de cabeçalhos.", isCorrect: false, explanation: "HTTP/2 utiliza HPACK para compactação de headers e formato binário." },
          { id: "C", text: "Substituição completa do DNS por endereços IP gravados em arquivos locais.", isCorrect: false, explanation: "DNS continua sendo a infraestrutura fundamental de resolução de nomes na internet." },
          { id: "D", text: "Eliminação da criptografia TLS para aumentar a velocidade.", isCorrect: false, explanation: "Navegadores modernos exigem TLS para suporte a HTTP/2 e HTTP/3." }
        ]
      },
      {
        subjectArea: "Redes & Protocolos Web",
        statement: `Em uma API RESTful em conformidade com o RFC 7231, qual código de status HTTP deve ser retornado após a criação bem-sucedida de um novo recurso no servidor?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-NET-02",
        difficulty: "FÁCIL",
        pedagogicalTip: "Revise a semântica dos códigos 200 OK, 201 Created, 204 No Content e 409 Conflict.",
        commonDistractorReasoning: "Retornar 200 OK genérico para todas as operações ou 204 quando há recurso criado com URI de localização.",
        options: [
          { id: "A", text: "201 Created, idealmente acompanhado do cabeçalho 'Location' apontando para a URI do recurso gerado.", isCorrect: true, explanation: "Informa formalmente a criação do recurso e onde acessá-lo." },
          { id: "B", text: "404 Not Found.", isCorrect: false, explanation: "Indica que o recurso solicitado não foi encontrado." },
          { id: "C", text: "500 Internal Server Error.", isCorrect: false, explanation: "Indica erro inesperado no processamento do servidor." },
          { id: "D", text: "301 Moved Permanently.", isCorrect: false, explanation: "Código de redirecionamento de URL, não criação de recurso." }
        ]
      },

      // -------------------------------------------------------------
      // EIXO 8: INDÚSTRIA 4.0, IOT & SISTEMAS EMBARCADOS (36-40)
      // -------------------------------------------------------------
      {
        subjectArea: "Indústria 4.0 & IoT",
        statement: `No protocolo MQTT (Message Queuing Telemetry Transport) para telemetria de sensores industriais, qual nível de Qualidade de Serviço (QoS) garante que uma mensagem de alarme crítico será entregue exatamente uma única vez (Exactly Once)?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-IOT-01",
        difficulty: "MÉDIO",
        pedagogicalTip: "Explique o handshake de 4 vias do QoS 2 (PUBLISH -> PUBREC -> PUBREL -> PUBCOMP).",
        commonDistractorReasoning: "Confundir QoS 1 (At least once - com duplicatas possíveis) com QoS 2 (Exactly once).",
        options: [
          { id: "A", text: "QoS 2 (Exactly Once), que utiliza um handshake de quatro vias garantindo entrega única sem duplicações.", isCorrect: true, explanation: "Nível mais seguro de entrega para transações industriais críticas." },
          { id: "B", text: "QoS 0 (At most once), que dispara a mensagem sem confirmação (Fire and Forget).", isCorrect: false, explanation: "Pode haver perda de pacotes em redes ruidosas sem qualquer retransmissão." },
          { id: "C", text: "QoS 1 (At least once), que garante entrega mas pode gerar mensagens duplicadas.", isCorrect: false, explanation: "Garante recebimento mas não impede duplicidade." },
          { id: "D", text: "QoS 5 com suporte a inteligência artificial embarcada.", isCorrect: false, explanation: "Não existe nível QoS 5 na especificação do protocolo MQTT." }
        ]
      },
      {
        subjectArea: "Indústria 4.0 & IoT",
        statement: `Em controladores lógicos e microcontroladores industriais (CLPs/RTUs), qual mecanismo de hardware é mandatório para reiniciar automaticamente o sistema caso o firmware entre em loop infinito ou travamento de software?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-IOT-02",
        difficulty: "FÁCIL",
        pedagogicalTip: "Explique o conceito de 'alimentar o cão de guarda' (kick the watchdog) em loops de controle determinísticos.",
        commonDistractorReasoning: "Achar que sistemas embarcados dependem de intervenção manual presencial para cada travamento de software.",
        options: [
          { id: "A", text: "Watchdog Timer (Temporizador Cão de Guarda), que reinicia o microprocessador se o software não resetar o contador periodicamente.", isCorrect: true, explanation: "Garante recuperação autônoma de falhas temporárias em ambientes hostis e ininterruptos." },
          { id: "B", text: "Botão físico de ligar/desligar operado por operador de chão de fábrica.", isCorrect: false, explanation: "Inviável para estações remotas e automação autônoma contínua." },
          { id: "C", text: "Desligamento programado da rede elétrica a cada 5 minutos.", isCorrect: false, explanation: "Interrompe a operação fabril e causa perdas financeiras severas." },
          { id: "D", text: "Conversor Analógico-Digital (ADC) de 10 bits.", isCorrect: false, explanation: "ADC serve para converter sinais de tensão em valores numéricos digitais, não para recuperação de travamentos." }
        ]
      }
    ];

    // Se o professor pediu mais de 40 questões (ex: 50, 60, 80, 100), gerar variantes adicionais procedurais a partir do pool
    const generatedPool = [...masterPool];
    while (generatedPool.length < count) {
      const baseQ = masterPool[generatedPool.length % masterPool.length];
      const copyNum = Math.floor(generatedPool.length / masterPool.length) + 1;
      generatedPool.push({
        ...baseQ,
        statement: `[Contexto Avançado • Caso ${copyNum}] ${baseQ.statement}`,
        competencyCode: `${baseQ.competencyCode}-ADV${copyNum}`,
      });
    }

    return {
      title: `Simulado Integrado Multiassunto — ${topic}`,
      instructions: [
        "Leia atentamente cada enunciado antes de responder.",
        "Para cada questão de múltipla escolha, marque apenas uma opção no Cartão-Resposta.",
        "Preencha o cartão com caneta azul ou preta sem rasuras.",
        `Duração da prova: ${count >= 40 ? "180" : "90"} minutos.`
      ],
      questions: generatedPool.slice(0, count)
    };
  }

  // =========================================================================
  // 2. CORREÇÃO ÓPTICA EXPRESSA DE CARTÕES-RESPOSTA (OMR ENGINE)
  // =========================================================================
  static gradeStudentSubmission(
    submission: StudentOmrSubmission,
    suite: TeacherExamSuite
  ): StudentOmrGradingResult {
    const variant = suite.variants.find((v) => v.variantCode === submission.variantCode) || suite.variants[0];
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    const competencyMap: Record<string, { earned: number; total: number; percentage: number }> = {};
    const itemDetails: StudentOmrGradingResult["itemDetails"] = [];

    variant.questions.forEach((q) => {
      const qNum = q.variantIndex;
      const expectedAnswer = variant.answerKeyMap[qNum] || "A";
      const studentMarked = (submission.markedAnswers[qNum] || "").toUpperCase().trim();
      const pointsPossible = q.points || Number((100 / variant.questions.length).toFixed(2));
      maxScore += pointsPossible;

      // Encontrar metadados da questão mestre correspondente
      const masterQ = suite.masterQuestions.find((mq) => mq.id === q.originalQuestionId);
      const competency = masterQ?.competencyCode || "GERAL";
      const subjectArea = masterQ?.subjectArea || q.subjectArea || "Tecnologia";

      if (!competencyMap[competency]) {
        competencyMap[competency] = { earned: 0, total: 0, percentage: 0 };
      }
      competencyMap[competency].total += pointsPossible;

      if (!studentMarked) {
        blankCount++;
        itemDetails.push({
          questionIndex: qNum,
          marked: "(Em Branco)",
          expected: expectedAnswer,
          isCorrect: false,
          pointsEarned: 0,
          pointsPossible,
          competency,
          subjectArea,
        });
      } else if (studentMarked === expectedAnswer) {
        correctCount++;
        totalScore += pointsPossible;
        competencyMap[competency].earned += pointsPossible;
        itemDetails.push({
          questionIndex: qNum,
          marked: studentMarked,
          expected: expectedAnswer,
          isCorrect: true,
          pointsEarned: pointsPossible,
          pointsPossible,
          competency,
          subjectArea,
        });
      } else {
        wrongCount++;
        itemDetails.push({
          questionIndex: qNum,
          marked: studentMarked,
          expected: expectedAnswer,
          isCorrect: false,
          pointsEarned: 0,
          pointsPossible,
          competency,
          subjectArea,
        });
      }
    });

    // Calcular percentual de competências
    Object.keys(competencyMap).forEach((comp) => {
      const stat = competencyMap[comp];
      stat.percentage = stat.total > 0 ? Math.round((stat.earned / stat.total) * 100) : 0;
    });

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isApproved = scorePercentage >= 60; // Regra SENAI 60%

    let feedback = "";
    if (scorePercentage >= 90) {
      feedback = `Excelente desempenho multidisciplinar! Domínio avançado das competências (${scorePercentage}%). Destaque em resolução de problemas técnicos complexos.`;
    } else if (scorePercentage >= 75) {
      feedback = `Bom desempenho técnico (${scorePercentage}%). Recomendamos revisar detalhes finos das disciplinas com menor índice de acerto.`;
    } else if (scorePercentage >= 60) {
      feedback = `Atingiu o critério mínimo de aprovação do SENAI (${scorePercentage}%). Recomendamos plantão de dúvidas e exercícios de reforço nos eixos temáticos identificados.`;
    } else {
      feedback = `Abaixo do critério de proficiência mínima (< 60%). Necessário plano de recuperação paralela focado nos eixos de maior dificuldade.`;
    }

    return {
      studentId: submission.studentId,
      studentName: submission.studentName,
      variantCode: variant.variantCode,
      totalScore: Number(totalScore.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      scorePercentage,
      isApproved,
      correctCount,
      wrongCount,
      blankCount,
      itemDetails,
      competencyMastery: competencyMap,
      pedagogicalFeedback: feedback,
    };
  }

  /**
   * Processa lote completo de cartões-resposta de uma turma e gera relatório consolidado
   */
  static gradeBatchSubmissions(
    submissions: StudentOmrSubmission[],
    suite: TeacherExamSuite
  ): ClassOmrBatchReport {
    const studentResults = submissions.map((sub) => this.gradeStudentSubmission(sub, suite));

    const totalSubmissions = studentResults.length;
    if (totalSubmissions === 0) {
      return {
        examTitle: suite.title,
        totalSubmissions: 0,
        classAverage: 0,
        approvalRate: 0,
        highestScore: 0,
        lowestScore: 0,
        hardestQuestions: [],
        studentResults: [],
        recommendedInterventions: ["Nenhum cartão-resposta submetido até o momento."],
      };
    }

    const totalScoreSum = studentResults.reduce((acc, r) => acc + r.scorePercentage, 0);
    const classAverage = Math.round((totalScoreSum / totalSubmissions) * 10) / 10;
    const approvedCount = studentResults.filter((r) => r.isApproved).length;
    const approvalRate = Math.round((approvedCount / totalSubmissions) * 100);
    const highestScore = Math.max(...studentResults.map((r) => r.scorePercentage));
    const lowestScore = Math.min(...studentResults.map((r) => r.scorePercentage));

    // Mapear questões com maior índice de erro na turma
    const questionStats: Record<number, { errors: number; wrongAnswers: Record<string, number>; topic: string }> = {};

    studentResults.forEach((res) => {
      res.itemDetails.forEach((item) => {
        if (!questionStats[item.questionIndex]) {
          questionStats[item.questionIndex] = { errors: 0, wrongAnswers: {}, topic: `${item.subjectArea || "Tópico"} (${item.competency})` };
        }
        if (!item.isCorrect) {
          questionStats[item.questionIndex].errors++;
          const marked = item.marked;
          questionStats[item.questionIndex].wrongAnswers[marked] = (questionStats[item.questionIndex].wrongAnswers[marked] || 0) + 1;
        }
      });
    });

    const hardestQuestions = Object.entries(questionStats)
      .map(([qNum, stat]) => {
        const errRate = Math.round((stat.errors / totalSubmissions) * 100);
        let topWrong = "N/A";
        let maxCount = 0;
        Object.entries(stat.wrongAnswers).forEach(([ans, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topWrong = ans;
          }
        });
        return {
          questionIndex: Number(qNum),
          errorRatePercentage: errRate,
          mostCommonWrongAnswer: topWrong,
          topicDescription: stat.topic,
        };
      })
      .sort((a, b) => b.errorRatePercentage - a.errorRatePercentage)
      .slice(0, 5);

    // Intervenções pedagógicas sugeridas
    const interventions: string[] = [];
    if (approvalRate < 70) {
      interventions.push("A taxa de aprovação no simulado está abaixo de 70%. Realize uma aula expositiva-dialogada de revisão multidisciplinar.");
    }
    if (hardestQuestions.length > 0 && hardestQuestions[0].errorRatePercentage >= 40) {
      interventions.push(`A Questão #${hardestQuestions[0].questionIndex} [${hardestQuestions[0].topicDescription}] apresentou ${hardestQuestions[0].errorRatePercentage}% de erro. A alternativa '${hardestQuestions[0].mostCommonWrongAnswer}' foi o distrator predominante; revise esse conceito em aula.`);
    }
    interventions.push("Disponibilize o gabarito comentado no portal para autoavaliação guiada por competência.");

    return {
      examTitle: suite.title,
      totalSubmissions,
      classAverage,
      approvalRate,
      highestScore,
      lowestScore,
      hardestQuestions,
      studentResults,
      recommendedInterventions: interventions,
    };
  }

  // =========================================================================
  // 3. EXPORTADOR UNIFICADO DE CADERNO DE PROVAS, GABARITOS E CARTÕES OMR EM PDF
  //    SUPORTE ROBUSTO PARA PROVAS DE 40 A 100+ QUESTÕES MULTIPÁGINA & 2-COLUNAS
  // =========================================================================
  static async exportExamBundlePdf(
    suite: TeacherExamSuite,
    options: {
      includeVariants?: string[]; // Ex: ["A", "B"] ou todas
      includeTeacherMasterKey?: boolean;
      includeOmrBubbleSheets?: boolean;
      studentList?: { id: string; name: string; variantCode: string }[];
      saveFilename?: string;
    } = {}
  ): Promise<Buffer> {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const selectedVariants = suite.variants.filter(
      (v) => !options.includeVariants || options.includeVariants.includes(v.variantCode)
    );

    let isFirstPage = true;

    // -------------------------------------------------------------------------
    // SEÇÃO 1: CADERNOS DE QUESTÕES POR VARIANTE (A, B, C...)
    // -------------------------------------------------------------------------
    selectedVariants.forEach((variant) => {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Header Institucional SENAI
      doc.setFillColor(0, 51, 153); // Azul SENAI
      doc.rect(0, 0, 210, 32, "F");
      doc.setFillColor(255, 204, 0); // Amarelo SENAI
      doc.rect(0, 32, 210, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(suite.institutionHeader.institution, 14, 10);
      doc.setFontSize(11);
      doc.text(`${suite.title} — CADERNO OFICIAL`, 14, 18);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `CURSO: ${suite.courseName}  |  DISCIPLINAS: ${(suite.multiSubjects || [suite.subject]).slice(0, 3).join(", ")}  |  TOTAL: ${variant.questions.length} QUESTÕES`,
        14,
        25
      );

      // Badge de Versão no Canto Superior Direito
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(165, 6, 35, 20, 2, 2, "F");
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("VARIANTE OFICIAL", 182.5, 12, { align: "center" });
      doc.setFontSize(15);
      doc.text(`TIPO ${variant.variantCode}`, 182.5, 21, { align: "center" });

      // Cabeçalho de Identificação do Aluno
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 22, 2, 2, "F");
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 38, 182, 22, 2, 2, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ALUNO(A): ____________________________________________________", 18, 45);
      doc.text("MATRÍCULA / CPF: ____________________", 130, 45);
      doc.text("DATA: ____/____/2026   |   TURMA: ___________________", 18, 54);
      doc.text(`CÓDIGO ANTI-FRAUDE: ${variant.antiCheatSeed}`, 130, 54);

      // Instruções em destaque
      doc.setFillColor(254, 243, 199);
      doc.rect(14, 63, 182, 9, "F");
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(
        `ATENÇÃO: Prova contendo ${variant.questions.length} questões multiassunto. Confira se o seu Cartão-Resposta corresponde ao Caderno Tipo ${variant.variantCode}.`,
        18,
        69
      );

      // Renderizar Questões da Variante
      let currentY = 76;

      variant.questions.forEach((q) => {
        // Quebra de página automática se ultrapassar a margem inferior
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;

          // Header de continuação
          doc.setFillColor(241, 245, 249);
          doc.rect(14, 10, 182, 7, "F");
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text(`${suite.title} — Versão ${variant.variantCode} (Continuação)`, 18, 15);
          currentY = 23;
        }

        // Box de Enunciado
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, currentY, 182, 6.5, 1, 1, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const subjectTag = q.subjectArea ? ` • [${q.subjectArea}]` : "";
        doc.text(`QUESTÃO ${q.variantIndex}${subjectTag}  (${q.points} Pts)`, 18, currentY + 4.5);

        currentY += 8.5;

        // Texto do Enunciado
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        const statementLines = doc.splitTextToSize(q.statement, 180);
        doc.text(statementLines, 16, currentY);
        currentY += statementLines.length * 3.8 + 2;

        // Bloco de Código se houver
        if (q.codeSnippet) {
          doc.setFillColor(15, 23, 42);
          const codeLines = doc.splitTextToSize(q.codeSnippet, 172);
          const codeBoxHeight = Math.min(60, codeLines.length * 3.4 + 5);

          doc.roundedRect(16, currentY, 178, codeBoxHeight, 1.5, 1.5, "F");
          doc.setTextColor(248, 250, 252);
          doc.setFont("courier", "normal");
          doc.setFontSize(7);
          doc.text(codeLines.slice(0, 15), 20, currentY + 4.5);

          currentY += codeBoxHeight + 2.5;
          doc.setFont("helvetica", "normal");
        }

        // Alternativas
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt) => {
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }

            doc.setFillColor(241, 245, 249);
            doc.circle(19, currentY - 1, 2.8, "F");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text(opt.id, 18, currentY + 0.2);

            doc.setFont("helvetica", "normal");
            const optLines = doc.splitTextToSize(opt.text, 170);
            doc.text(optLines, 24, currentY);
            currentY += Math.max(5.5, optLines.length * 3.5 + 1.5);
          });
        }

        currentY += 3;
      });

      // Rodapé da Página
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text(
        `SENAI Avaliações • Simulado Multiassunto (${variant.questions.length}Q) • Caderno Versão ${variant.variantCode} • QR: ${variant.qrCodeSignature}`,
        14,
        290
      );
    });

    // -------------------------------------------------------------------------
    // SEÇÃO 2: FOLHAS DE RESPOSTA / CARTÃO OMR INTELIGENTE (MULTIASSUNTO 40+Q)
    // -------------------------------------------------------------------------
    if (options.includeOmrBubbleSheets !== false) {
      const studentTargets = options.studentList || selectedVariants.map((v) => ({
        id: "ALUNO-PADRAO",
        name: "NOME DO(A) ESTUDANTE",
        variantCode: v.variantCode,
      }));

      studentTargets.forEach((student) => {
        doc.addPage();

        // Moldura Institucional da Folha de Resposta
        doc.setDrawColor(0, 51, 153);
        doc.setLineWidth(0.8);
        doc.rect(10, 10, 190, 277, "S");

        // Topo Header
        doc.setFillColor(0, 51, 153);
        doc.rect(10, 10, 190, 22, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        doc.text("CARTÃO-RESPOSTA OFICIAL • LEITURA ÓPTICA (OMR)", 105, 18, { align: "center" });
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 105, 25, { align: "center" });

        // Identificação e QR Code Box
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 35, 140, 28, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(14, 35, 140, 28, "S");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`ALUNO(A): ${student.name.toUpperCase()}`, 18, 42);
        doc.text(`MATRÍCULA / ID: ${student.id}`, 18, 49);
        doc.text(`AVALIAÇÃO: ${suite.title.substring(0, 42)}`, 18, 56);

        // QR Code Box Visual
        doc.setFillColor(15, 23, 42);
        doc.rect(158, 35, 28, 28, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont("courier", "bold");
        doc.text("[QR-CODE]", 172, 45, { align: "center" });
        doc.text(`VER: ${student.variantCode}`, 172, 52, { align: "center" });
        doc.text(`OMR-${suite.id.substring(0, 5)}`, 172, 58, { align: "center" });

        // Badge de Versão em Destaque
        doc.setFillColor(255, 204, 0); // Amarelo
        doc.rect(14, 66, 182, 8, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          `GABARITO DE RESPOSTAS — CADERNO TIPO ${student.variantCode} (${suite.masterQuestions.length} QUESTÕES) — PREENCHA: ( ● )`,
          105,
          71.5,
          { align: "center" }
        );

        // Layout Óptico Dinâmico (1 Coluna se <= 20q, 2 Colunas se > 20q até 50q, ou multi-páginas)
        const totalQ = suite.masterQuestions.length;
        const isMultiColumn = totalQ > 20;
        const questionsPerCol = isMultiColumn ? Math.ceil(totalQ / 2) : totalQ;

        let gridYStart = 78;

        if (!isMultiColumn) {
          // Layout de 1 Coluna Central (para provas curtas de até 20 questões)
          doc.setFillColor(241, 245, 249);
          doc.rect(20, gridYStart, 170, 6.5, "F");
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text("ITEM", 30, gridYStart + 4.5);
          doc.text("A", 65, gridYStart + 4.5);
          doc.text("B", 90, gridYStart + 4.5);
          doc.text("C", 115, gridYStart + 4.5);
          doc.text("D", 140, gridYStart + 4.5);
          doc.text("NOTA", 168, gridYStart + 4.5);

          let currentGridY = gridYStart + 8;
          for (let i = 1; i <= totalQ; i++) {
            if (i % 2 === 0) {
              doc.setFillColor(248, 250, 252);
              doc.rect(20, currentGridY - 3.5, 170, 7.5, "F");
            }
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(`Questão ${i < 10 ? "0" + i : i}`, 25, currentGridY + 1.2);

            const cols = [66, 91, 116, 141];
            const letters = ["A", "B", "C", "D"];
            cols.forEach((colX, cIdx) => {
              doc.setDrawColor(71, 85, 105);
              doc.setLineWidth(0.3);
              doc.circle(colX, currentGridY, 2.8, "S");
              doc.setTextColor(100, 116, 139);
              doc.setFontSize(6);
              doc.text(letters[cIdx], colX - 1.1, currentGridY + 1);
            });
            currentGridY += 8;
          }
        } else {
          // Layout de 2 Colunas Otimizado para 40 a 50 questões em folha única A4
          const col1X = 14;
          const col2X = 106;
          const colWidth = 90;

          // Header Coluna 1
          doc.setFillColor(241, 245, 249);
          doc.rect(col1X, gridYStart, colWidth, 6, "F");
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text("ITEM", col1X + 4, gridYStart + 4.2);
          doc.text("A", col1X + 30, gridYStart + 4.2);
          doc.text("B", col1X + 45, gridYStart + 4.2);
          doc.text("C", col1X + 60, gridYStart + 4.2);
          doc.text("D", col1X + 75, gridYStart + 4.2);

          // Header Coluna 2
          doc.rect(col2X, gridYStart, colWidth, 6, "F");
          doc.text("ITEM", col2X + 4, gridYStart + 4.2);
          doc.text("A", col2X + 30, gridYStart + 4.2);
          doc.text("B", col2X + 45, gridYStart + 4.2);
          doc.text("C", col2X + 60, gridYStart + 4.2);
          doc.text("D", col2X + 75, gridYStart + 4.2);

          let currentGridY = gridYStart + 7.5;
          const rowHeight = 6.4;

          for (let r = 0; r < questionsPerCol; r++) {
            const qNum1 = r + 1;
            const qNum2 = r + 1 + questionsPerCol;

            // Zebra background
            if (r % 2 === 0) {
              doc.setFillColor(248, 250, 252);
              doc.rect(col1X, currentGridY - 3, colWidth, rowHeight, "F");
              if (qNum2 <= totalQ) {
                doc.rect(col2X, currentGridY - 3, colWidth, rowHeight, "F");
              }
            }

            // Coluna 1 Item
            if (qNum1 <= totalQ) {
              doc.setTextColor(15, 23, 42);
              doc.setFontSize(7.5);
              doc.setFont("helvetica", "bold");
              doc.text(`Q${qNum1 < 10 ? "0" + qNum1 : qNum1}`, col1X + 3, currentGridY + 1.2);

              const cols1 = [col1X + 31, col1X + 46, col1X + 61, col1X + 76];
              const letters = ["A", "B", "C", "D"];
              cols1.forEach((colX, cIdx) => {
                doc.setDrawColor(71, 85, 105);
                doc.setLineWidth(0.3);
                doc.circle(colX, currentGridY, 2.5, "S");
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(5.5);
                doc.setFont("helvetica", "normal");
                doc.text(letters[cIdx], colX - 0.9, currentGridY + 0.8);
              });
            }

            // Coluna 2 Item
            if (qNum2 <= totalQ) {
              doc.setTextColor(15, 23, 42);
              doc.setFontSize(7.5);
              doc.setFont("helvetica", "bold");
              doc.text(`Q${qNum2 < 10 ? "0" + qNum2 : qNum2}`, col2X + 3, currentGridY + 1.2);

              const cols2 = [col2X + 31, col2X + 46, col2X + 61, col2X + 76];
              const letters = ["A", "B", "C", "D"];
              cols2.forEach((colX, cIdx) => {
                doc.setDrawColor(71, 85, 105);
                doc.setLineWidth(0.3);
                doc.circle(colX, currentGridY, 2.5, "S");
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(5.5);
                doc.setFont("helvetica", "normal");
                doc.text(letters[cIdx], colX - 0.9, currentGridY + 0.8);
              });
            }

            currentGridY += rowHeight;
          }
        }

        // Área de Assinatura do Aluno e Pontuação
        doc.setDrawColor(148, 163, 184);
        doc.line(20, 260, 115, 260);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("Assinatura do(a) Estudante (Conforme Documento Oficial)", 20, 265);

        // Pontuação e Carimbo do Avaliador
        doc.rect(130, 246, 60, 22, "S");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("USO EXCLUSIVO DO PROFESSOR", 133, 251);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("Nota Final: ________ / 100", 133, 258);
        doc.text("Visto: __________________", 133, 264);
      });
    }

    // -------------------------------------------------------------------------
    // SEÇÃO 3: GABARITO OFICIAL DO PROFESSOR COM JUSTIFICATIVAS E DISTRATORES
    // -------------------------------------------------------------------------
    if (options.includeTeacherMasterKey !== false) {
      doc.addPage();

      // Header Gabarito do Docente
      doc.setFillColor(15, 23, 42); // Dark Navy
      doc.rect(0, 0, 210, 28, "F");
      doc.setFillColor(16, 185, 129); // Verde Esmeralda
      doc.rect(0, 28, 210, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("GABARITO DO PROFESSOR & MATRIZ DE CORREÇÃO CRUZADA", 14, 14);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`AVALIAÇÃO: ${suite.title}  |  TOTAL: 100 PONTOS  |  DISCIPLINAS: ${(suite.multiSubjects || [suite.subject]).join(", ")}`, 14, 22);

      // Tabela de Correlação de Gabaritos por Variante (paginada / 2-colunas se 40+Q)
      let tableY = 36;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, tableY, 182, 6.5, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM", 18, tableY + 4.5);
      doc.text("EIXO TEMÁTICO", 40, tableY + 4.5);

      selectedVariants.forEach((v, idx) => {
        doc.text(`VAR ${v.variantCode}`, 110 + idx * 18, tableY + 4.5);
      });

      tableY += 8;

      for (let i = 1; i <= suite.masterQuestions.length; i++) {
        if (tableY > 265) {
          doc.addPage();
          tableY = 20;
          doc.setFillColor(241, 245, 249);
          doc.rect(14, tableY, 182, 6.5, "F");
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text("ITEM", 18, tableY + 4.5);
          doc.text("EIXO TEMÁTICO", 40, tableY + 4.5);
          selectedVariants.forEach((v, idx) => {
            doc.text(`VAR ${v.variantCode}`, 110 + idx * 18, tableY + 4.5);
          });
          tableY += 8;
        }

        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, tableY - 3, 182, 6, "F");
        }
        const mq = suite.masterQuestions[i - 1];
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`Questão ${i < 10 ? "0" + i : i}`, 18, tableY + 1);

        doc.setFont("helvetica", "normal");
        doc.text((mq?.subjectArea || "Geral").substring(0, 32), 40, tableY + 1);

        selectedVariants.forEach((v, idx) => {
          const ans = v.answerKeyMap[i] || "-";
          doc.setTextColor(0, 51, 153);
          doc.setFont("helvetica", "bold");
          doc.text(`[ ${ans} ]`, 112 + idx * 18, tableY + 1);
        });

        tableY += 5.5;
      }

      tableY += 6;

      // Resoluções Detalhadas e Insights Pedagógicos
      if (tableY > 240) {
        doc.addPage();
        tableY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.rect(14, tableY, 182, 6, "F");
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("RESOLUÇÃO COMENTADA E ANÁLISE DE DISTRATORES (QUESTÕES MESTRE)", 18, tableY + 4.2);

      tableY += 9;

      suite.masterQuestions.forEach((mq) => {
        if (tableY > 250) {
          doc.addPage();
          tableY = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, tableY, 182, 5.5, 1, 1, "F");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Questão Mestre #${mq.index} [${mq.subjectArea || "Geral"} • ${mq.difficulty} • ${mq.competencyCode}] — Valor: ${mq.points} pts`,
          16,
          tableY + 3.8
        );

        tableY += 7;

        const correctOpt = mq.options?.find((o) => o.isCorrect);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`Gabarito: (${correctOpt?.id || "A"}) — ${correctOpt?.text || ""}`, 16, tableY, { maxWidth: 178 });

        tableY += 4.5;

        if (correctOpt?.explanation) {
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "normal");
          const expLines = doc.splitTextToSize(`Justificativa: ${correctOpt.explanation}`, 178);
          doc.text(expLines, 16, tableY);
          tableY += expLines.length * 3.5 + 1.5;
        }

        if (mq.commonDistractorReasoning) {
          doc.setTextColor(180, 83, 9);
          doc.setFont("helvetica", "italic");
          const distLines = doc.splitTextToSize(`Alerta de Distrator: ${mq.commonDistractorReasoning}`, 178);
          doc.text(distLines, 16, tableY);
          tableY += distLines.length * 3.5 + 1.5;
        }

        tableY += 3;
      });
    }

    return this.formatPdfOutput(doc, options.saveFilename || `Suíte_Avaliacoes_${suite.id}.pdf`);
  }

  /**
   * =========================================================================
   * DEFENSE-IN-DEPTH: EXAM SUITE ENCRYPTED EXPORT / IMPORT & QR VERIFICATION
   * =========================================================================
   */

  /**
   * Exporta a suíte completa de provas e gabaritos criptografada em AES-256-GCM
   * com assinatura HMAC para integridade estrita e não-repúdio.
   */
  public static exportEncryptedExamSuite(suite: TeacherExamSuite, ownerId?: string): EncryptedFilePackage {
    const rawJson = JSON.stringify(suite);
    return ConfidentialFileVault.encryptConfidentialFile({
      fileName: `exam-suite-${suite.id}.json`,
      category: "OFFICIAL_EXAMS",
      content: rawJson,
      ownerId: ownerId || suite.institutionHeader.teacherName,
      metadata: {
        examId: suite.id,
        title: suite.title,
        courseName: suite.courseName,
        totalPoints: suite.totalPoints,
        questionsCount: suite.masterQuestions.length,
        variantsCount: suite.variants.length
      }
    });
  }

  /**
   * Importa e decodifica uma suíte de provas criptografada, validando a integridade
   * criptográfica AES-GCM e a assinatura digital HMAC.
   */
  public static importEncryptedExamSuite(pkg: EncryptedFilePackage, actorId: string = "system"): TeacherExamSuite {
    const decrypted = ConfidentialFileVault.decryptConfidentialFile(pkg, actorId);
    return JSON.parse(decrypted.plainContent) as TeacherExamSuite;
  }

  /**
   * Valida a autenticidade digital de um QR Code lido pelo scanner OMR
   */
  public static verifyVariantQrSignature(qrBase64: string): {
    isValid: boolean;
    data?: { examId: string; variantCode: string; studentId: string; timestamp: number };
    errorReason?: string;
  } {
    return ConfidentialFileVault.verifyExamQrSignature(qrBase64);
  }
}
