import { jsPDF } from "jspdf";
import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

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
  // =========================================================================
  static async generateExamSuite(params: {
    subject: string;
    topic: string;
    courseName?: string;
    targetAudience?: string;
    educationLevel?: "SENAI_TECNICO" | "SUPERIOR" | "ENSINO_MEDIO" | "CONCURSO_ENADE";
    questionCount?: number;
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
    const courseName = params.courseName || "Técnico em Desenvolvimento de Sistemas";
    const targetAudience = params.targetAudience || "SENAI - Formação Profissional Técnica";
    const questionCount = Math.max(3, Math.min(20, params.questionCount || 5));
    const variantCount = Math.max(1, Math.min(6, params.variantCount || 4));
    const teacherName = params.teacherName || "Prof. Especialista";
    const academicPeriod = params.academicPeriod || "2026/1";

    const prompt = `Você é um Especialista em Avaliação Educacional Técnica e Metodologia SENAI / BNCC.
Crie um conjunto mestre de ${questionCount} questões avaliativas profissionais, contextualizadas no cenário real da indústria e tecnologia.

INFORMAÇÕES DA AVALIAÇÃO:
- Disciplina: "${subject}"
- Tópico Principal: "${topic}"
- Curso: "${courseName}"
- Público-Alvo: "${targetAudience}"
- Nível: "${params.educationLevel || "SENAI_TECNICO"}"
- Tipos de Questão Permitidos: ${(params.questionTypes || ["MULTIPLE_CHOICE", "CODE_ANALYSIS"]).join(", ")}
${params.customInstructions ? `- Instruções Adicionais: "${params.customInstructions}"` : ""}

DIRETRIZES DE ELABORAÇÃO:
1. Questões devem conter enunciados contextualizados com situações-problema reais da indústria/mercado de trabalho brasileiro.
2. Cada questão de múltipla escolha DEVE ter 4 opções (A, B, C, D) com alternativas plausíveis (distratores inteligentes baseados em concepções alternativas comuns).
3. Cada questão deve ter competência associada (ex: SENAI-DS-01, BNCC-EM13MAT), nível de taxonomia de Bloom, e pontos calculados (totalizando 100 pontos no conjunto).
4. Explicação detalhada do gabarito e justificativa pedagógica para cada distrator.

RETORNE ESTRITAMENTE UM JSON VÁLIDO no seguinte formato:
{
  "title": "Avaliação Oficial de ${topic}",
  "instructions": [
    "Leia atentamente cada enunciado antes de responder.",
    "Para questões de múltipla escolha, apenas uma alternativa é correta.",
    "Preencha o cartão-resposta com caneta azul ou preta sem rasuras.",
    "Duração máxima de 90 minutos."
  ],
  "questions": [
    {
      "index": 1,
      "type": "MULTIPLE_CHOICE",
      "statement": "Texto claro e contextualizado do problema...",
      "codeSnippet": "// Código opcional caso seja questão de análise de software",
      "bloomTaxonomyLevel": "Aplicar",
      "competencyCode": "SENAI-TEC-01",
      "difficulty": "MÉDIO",
      "points": 20,
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
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 7000 });

      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      // Fallback algorítmico determinístico robusto caso a IA esteja offline
      parsedResult = this.generateDeterministicMasterQuestions(subject, topic, questionCount);
    }

    if (!parsedResult || !Array.isArray(parsedResult.questions) || parsedResult.questions.length === 0) {
      parsedResult = this.generateDeterministicMasterQuestions(subject, topic, questionCount);
    }

    // Normalizar questões mestre
    const rawQuestions: any[] = parsedResult.questions;
    const pointsPerQuestion = Math.round(100 / rawQuestions.length);

    const masterQuestions: ExamQuestionMaster[] = rawQuestions.map((q, idx) => {
      const options: ExamQuestionOption[] = (q.options || [
        { id: "A", text: "Opção correta principal", isCorrect: true, explanation: "Atende perfeitamente ao requisito técnico." },
        { id: "B", text: "Opção com inconsistência lógica", isCorrect: false, explanation: "Falha na validação de limites." },
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
        statement: q.statement || `Questão avaliativa sobre ${topic} (${idx + 1})`,
        codeSnippet: q.codeSnippet || undefined,
        options,
        correctAnswerText: q.correctAnswerText || undefined,
        bloomTaxonomyLevel: q.bloomTaxonomyLevel || (idx % 2 === 0 ? "Aplicar" : "Analisar"),
        competencyCode: q.competencyCode || `SENAI-CP-${100 + idx}`,
        difficulty: q.difficulty || (idx === 0 ? "FÁCIL" : idx === rawQuestions.length - 1 ? "DIFÍCIL" : "MÉDIO"),
        points: q.points || pointsPerQuestion,
        pedagogicalTip: q.pedagogicalTip || `Reforce o conceito de ${topic} em aula prática com exemplos incrementais.`,
        commonDistractorReasoning: q.commonDistractorReasoning || "Atenção a armadilhas comuns de sintaxe e semântica.",
      };
    });

    // Ajustar soma dos pontos para exatamente 100
    const currentSum = masterQuestions.reduce((acc, q) => acc + q.points, 0);
    if (currentSum !== 100 && masterQuestions.length > 0) {
      masterQuestions[masterQuestions.length - 1].points += 100 - currentSum;
    }

    // Gerar as variantes (A, B, C, D...) com permutação determinística e preservação do gabarito
    const variants: ExamVariant[] = this.generatePermutatedVariants(masterQuestions, variantCount);

    const examSuiteId = `EXAM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      id: examSuiteId,
      title: parsedResult.title || `Avaliação Oficial de ${topic}`,
      subject,
      courseName,
      targetAudience,
      totalPoints: 100,
      durationMinutes: 90,
      instructions: parsedResult.instructions || [
        "Leia atentamente cada enunciado antes de assinalar a resposta.",
        "Apenas uma alternativa é correta para cada questão de múltipla escolha.",
        "Preencha o Cartão-Resposta oficial no verso sem dobras ou rasuras.",
        "O uso de calculadoras ou celulares é estritamente proibido durante a prova.",
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
            statement: origQ.statement,
            codeSnippet: origQ.codeSnippet,
            type: origQ.type,
            points: origQ.points,
          });

          answerKeyMap[questionNum] = "DISCURSIVA";
        }
      });

      variants.push({
        variantCode: code,
        variantTitle: `Caderno de Prova — Versão ${code}`,
        antiCheatSeed: `VAR-${code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        qrCodeSignature: `CC-EXAM-V${code}-${Date.now().toString(36)}`,
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
   * Fallback offline com questões industriais sólidas
   */
  private static generateDeterministicMasterQuestions(
    subject: string,
    topic: string,
    count: number
  ): any {
    const defaultPool = [
      {
        statement: `Em um sistema de manufatura integrada da Indústria 4.0, uma esteira automatizada envia eventos de telemetria para processamento concorrente. Ao implementar uma fila de prioridade para alarmes críticos em ${subject} (${topic}), qual estrutura de dados e estratégia garante menor latência de inserção e remoção no pior caso?`,
        bloomTaxonomyLevel: "Analisar",
        competencyCode: "SENAI-IND-01",
        difficulty: "MÉDIO",
        points: 20,
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
        statement: `Considere o seguinte trecho de código para validação de integridade de dados em uma API RESTful de monitoramento de sensores:\n\nfunction validarLeitura(payload) {\n  if (!payload || typeof payload.temperatura !== 'number') return false;\n  if (payload.temperatura < -50 || payload.temperatura > 150) return false;\n  return true;\n}\n\nQual princípio de Clean Code e Defesa em Profundidade está sendo aplicado corretamente neste padrão?`,
        bloomTaxonomyLevel: "Aplicar",
        competencyCode: "SENAI-DS-02",
        difficulty: "FÁCIL",
        points: 20,
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
        statement: `Durante a homologação de um banco de dados relacional para um sistema de rastreabilidade de peças, constatou-se que consultas que filtram pelo código de barras e data de fabricação apresentavam gargalos de I/O em tabelas com 5 milhões de registros. Qual índice é a solução mais performática recomendada?`,
        bloomTaxonomyLevel: "Avaliar",
        competencyCode: "SENAI-BD-03",
        difficulty: "DIFÍCIL",
        points: 20,
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
        statement: `No contexto de segurança e LGPD, ao armazenar senhas de operadores de chão de fábrica e supervisores, qual é o procedimento criptográfico mandatório de acordo com as normas técnicas vigentes?`,
        bloomTaxonomyLevel: "Entender",
        competencyCode: "SENAI-SEC-04",
        difficulty: "FÁCIL",
        points: 20,
        pedagogicalTip: "Apresente o conceito de Rainbow Tables e como o Salt individual impede ataques de dicionário pré-computados.",
        commonDistractorReasoning: "Acreditar que algoritmos obsoletos como MD5 ou SHA-1 ainda oferecem proteção suficiente.",
        options: [
          { id: "A", text: "Aplicação de função de derivação de chave com Salt único e fator de trabalho adaptável (Argon2id ou BCrypt).", isCorrect: true, explanation: "Protege contra ataques de força bruta, tabelas arco-íris e aceleração por GPU." },
          { id: "B", text: "Criptografia reversível com chave estática gravada diretamente no código-fonte.", isCorrect: false, explanation: "Violação grave de segurança (Hardcoded Secret)." },
          { id: "C", text: "Hash MD5 simples sem qualquer adição de salt.", isCorrect: false, explanation: "Vulnerável a colisões e tabelas pré-computadas instantâneas." },
          { id: "D", text: "Codificação em Base64 para ocultação visual da senha no banco de dados.", isCorrect: false, explanation: "Base64 é apenas um formato de codificação facilmente reversível, não uma cifra ou hash." }
        ]
      },
      {
        statement: `Em uma arquitetura de microsserviços para logística de entregas, um serviço consumidor fica inoperante devido à indisponibilidade temporária de um serviço de frete externo. Qual padrão de resiliência deve ser implementado para evitar falhas em cascata e degradação de todo o ecossistema?`,
        bloomTaxonomyLevel: "Criar",
        competencyCode: "SENAI-ARC-05",
        difficulty: "MÉDIO",
        points: 20,
        pedagogicalTip: "Configure um dashboard de métricas com estados Closed, Open e Half-Open no simulador.",
        commonDistractorReasoning: "Confundir Circuit Breaker com balanceamento de carga de rede (Load Balancer).",
        options: [
          { id: "A", text: "Circuit Breaker (Disjuntor de Circuito) com Fallback gracioso e política de Retry exponencial com Jitter.", isCorrect: true, explanation: "Interrompe requisições a serviços instáveis, permitindo sua recuperação e mantendo a operação local estável." },
          { id: "B", text: "Laço infinito de requisições síncronas bloqueantes até que o serviço responda.", isCorrect: false, explanation: "Esgota as threads do servidor e derruba a aplicação consumidora por completo." },
          { id: "C", text: "Eliminação total de logs e métricas para economizar conexões de rede.", isCorrect: false, explanation: "Torna o sistema uma caixa-preta sem diagnóstico de incidentes." },
          { id: "D", text: "Transferência de todo o processamento de regras de negócio para a camada visual do front-end.", isCorrect: false, explanation: "Gera vulnerabilidades de segurança e inconsistência de dados." }
        ]
      }
    ];

    return {
      title: `Avaliação Oficial de ${topic}`,
      instructions: [
        "Leia atentamente cada enunciado antes de responder.",
        "Para cada questão de múltipla escolha, marque apenas uma opção no Cartão-Resposta.",
        "Preencha o cartão com caneta azul ou preta sem rasuras.",
        "Duração da prova: 90 minutos."
      ],
      questions: defaultPool.slice(0, count)
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
      const pointsPossible = q.points || 10;
      maxScore += pointsPossible;

      // Encontrar metadados da questão mestre correspondente
      const masterQ = suite.masterQuestions.find((mq) => mq.id === q.originalQuestionId);
      const competency = masterQ?.competencyCode || "GERAL";

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
      feedback = `Excelente desempenho! Domínio avançado das competências (${scorePercentage}%). Destaque em resolução de problemas técnicos.`;
    } else if (scorePercentage >= 75) {
      feedback = `Bom desempenho técnico (${scorePercentage}%). Recomendamos revisar detalhes finos das questões assinaladas incorretamente.`;
    } else if (scorePercentage >= 60) {
      feedback = `Atingiu o critério mínimo de aprovação do SENAI (${scorePercentage}%). Recomendamos plantão de dúvidas e exercícios de reforço nas competências com menor pontuação.`;
    } else {
      feedback = `Abaixo do critério de proficiência mínima (< 60%). Necessário plano de recuperação paralela imediata focado nos pontos críticos identificados.`;
    }

    return {
      studentId: submission.studentId,
      studentName: submission.studentName,
      variantCode: variant.variantCode,
      totalScore,
      maxScore,
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
          questionStats[item.questionIndex] = { errors: 0, wrongAnswers: {}, topic: item.competency };
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
      interventions.push("A taxa de aprovação está abaixo de 70%. Realize uma aula expositiva-dialogada de revisão com resolução coletiva no quadro.");
    }
    if (hardestQuestions.length > 0 && hardestQuestions[0].errorRatePercentage >= 50) {
      interventions.push(`A Questão #${hardestQuestions[0].questionIndex} apresentou ${hardestQuestions[0].errorRatePercentage}% de erro. A alternativa '${hardestQuestions[0].mostCommonWrongAnswer}' foi o distrator predominante; desmistifique esse equívoco conceitual.`);
    }
    interventions.push("Disponibilize a matriz de gabarito comentado no Portal do Aluno para autoavaliação guiada.");

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
      doc.setFontSize(12);
      doc.text(`${suite.title} — CADERNO DE QUESTÕES`, 14, 18);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `CURSO: ${suite.courseName}  |  DISCIPLINA: ${suite.subject}  |  PROFESSOR(A): ${suite.institutionHeader.teacherName}`,
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
      doc.setFontSize(16);
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
      doc.rect(14, 63, 182, 10, "F");
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(
        "ATENÇÃO: Confira se o seu Cartão-Resposta corresponde à mesma Versão deste Caderno. Preencha sem rasuras.",
        18,
        69.5
      );

      // Renderizar Questões da Variante
      let currentY = 78;

      variant.questions.forEach((q) => {
        // Quebra de página automática se ultrapassar a margem inferior
        if (currentY > 255) {
          doc.addPage();
          currentY = 20;

          // Header de continuação
          doc.setFillColor(241, 245, 249);
          doc.rect(14, 10, 182, 7, "F");
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "bold");
          doc.text(`${suite.title} — Versão ${variant.variantCode} (Continuação)`, 18, 15);
          currentY = 24;
        }

        // Box de Enunciado
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, currentY, 182, 7, 1, 1, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text(`QUESTÃO ${q.variantIndex}  (${q.points} PONTOS)`, 18, currentY + 5);

        currentY += 10;

        // Texto do Enunciado
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const statementLines = doc.splitTextToSize(q.statement, 180);
        doc.text(statementLines, 16, currentY);
        currentY += statementLines.length * 4.2 + 2;

        // Bloco de Código se houver
        if (q.codeSnippet) {
          doc.setFillColor(15, 23, 42);
          const codeLines = doc.splitTextToSize(q.codeSnippet, 172);
          const codeBoxHeight = codeLines.length * 3.8 + 6;

          doc.roundedRect(16, currentY, 178, codeBoxHeight, 1.5, 1.5, "F");
          doc.setTextColor(248, 250, 252);
          doc.setFont("courier", "normal");
          doc.setFontSize(7.5);
          doc.text(codeLines, 20, currentY + 5);

          currentY += codeBoxHeight + 3;
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
            doc.circle(20, currentY - 1, 3.2, "F");
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.text(opt.id, 18.8, currentY + 0.3);

            doc.setFont("helvetica", "normal");
            const optLines = doc.splitTextToSize(opt.text, 168);
            doc.text(optLines, 26, currentY);
            currentY += Math.max(7, optLines.length * 3.8 + 2);
          });
        } else {
          // Espaço para resposta discursiva
          doc.setDrawColor(203, 213, 225);
          doc.setLineDashPattern([1, 1], 0);
          for (let l = 0; l < 4; l++) {
            doc.line(16, currentY + l * 6, 194, currentY + l * 6);
          }
          doc.setLineDashPattern([], 0);
          currentY += 28;
        }

        currentY += 4;
      });

      // Rodapé da Página
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.text(
        `SENAI Avaliações • Sistema CodeCheck AI • Caderno Versão ${variant.variantCode} • QR: ${variant.qrCodeSignature}`,
        14,
        290
      );
    });

    // -------------------------------------------------------------------------
    // SEÇÃO 2: FOLHAS DE RESPOSTA / CARTÃO OMR INTELIGENTE (1 POR PÁGINA)
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
        doc.rect(10, 10, 190, 24, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("CARTÃO-RESPOSTA OFICIAL • LEITURA ÓPTICA (OMR)", 105, 19, { align: "center" });
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI", 105, 27, { align: "center" });

        // Identificação e QR Code Box
        doc.setFillColor(248, 250, 252);
        doc.rect(14, 38, 140, 32, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(14, 38, 140, 32, "S");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text(`ALUNO(A): ${student.name.toUpperCase()}`, 18, 46);
        doc.text(`MATRÍCULA / ID: ${student.id}`, 18, 54);
        doc.text(`AVALIAÇÃO: ${suite.title.substring(0, 45)}`, 18, 62);

        // QR Code Box Visual
        doc.setFillColor(15, 23, 42);
        doc.rect(158, 38, 32, 32, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("courier", "bold");
        doc.text("[QR-CODE]", 174, 49, { align: "center" });
        doc.text(`VER: ${student.variantCode}`, 174, 57, { align: "center" });
        doc.text(`OMR-${suite.id.substring(0, 6)}`, 174, 64, { align: "center" });

        // Badge de Versão em Destaque
        doc.setFillColor(255, 204, 0); // Amarelo
        doc.rect(14, 74, 182, 10, "F");
        doc.setTextColor(0, 51, 153);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(
          `GABARITO DE RESPOSTAS — CADERNO TIPO ${student.variantCode} — INSTRUÇÃO: PREENCHA TOTALMENTE O CÍRCULO ( ● )`,
          105,
          80.5,
          { align: "center" }
        );

        // Grid Óptico de Respostas
        let gridY = 92;
        const totalQ = suite.masterQuestions.length;

        // Cabeçalho da Tabela OMR
        doc.setFillColor(241, 245, 249);
        doc.rect(20, gridY, 170, 7, "F");
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("ITEM", 30, gridY + 5);
        doc.text("A", 65, gridY + 5);
        doc.text("B", 90, gridY + 5);
        doc.text("C", 115, gridY + 5);
        doc.text("D", 140, gridY + 5);
        doc.text("RESULTADO DO LEITOR", 165, gridY + 5);

        gridY += 9;

        for (let i = 1; i <= totalQ; i++) {
          // Linha zebra
          if (i % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, gridY - 4, 170, 8, "F");
          }

          doc.setTextColor(15, 23, 42);
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.text(`Questão ${i < 10 ? "0" + i : i}`, 25, gridY + 1.5);

          // Círculos A, B, C, D
          const cols = [66, 91, 116, 141];
          const letters = ["A", "B", "C", "D"];

          cols.forEach((colX, cIdx) => {
            doc.setDrawColor(71, 85, 105);
            doc.setLineWidth(0.4);
            doc.circle(colX, gridY, 3.2, "S");
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "normal");
            doc.text(letters[cIdx], colX - 1.2, gridY + 1.2);
          });

          // Campo para anotação / score do professor
          doc.setDrawColor(226, 232, 240);
          doc.rect(160, gridY - 3, 25, 6, "S");

          gridY += 9;
        }

        // Área de Assinatura do Aluno
        doc.setDrawColor(148, 163, 184);
        doc.line(30, 260, 120, 260);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.text("Assinatura do(a) Estudante (Conforme Documento Oficial)", 30, 265);

        // Pontuação e Carimbo do Avaliador
        doc.rect(135, 245, 55, 24, "S");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("USO EXCLUSIVO DO PROFESSOR", 138, 250);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Nota Final: ________ / 100", 138, 258);
        doc.text("Visto: __________________", 138, 265);
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
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("GABARITO DO PROFESSOR & MATRIZ DE CORREÇÃO CRUZADA", 14, 14);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`AVALIAÇÃO: ${suite.title}  |  TOTAL: 100 PONTOS  |  DISCIPLINA: ${suite.subject}`, 14, 22);

      // Tabela de Correlação de Gabaritos por Variante
      let tableY = 38;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, tableY, 182, 7, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM", 18, tableY + 5);

      selectedVariants.forEach((v, idx) => {
        doc.text(`VAR ${v.variantCode}`, 45 + idx * 28, tableY + 5);
      });

      tableY += 9;

      for (let i = 1; i <= suite.masterQuestions.length; i++) {
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, tableY - 4, 182, 7, "F");
        }
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`Questão ${i}`, 18, tableY + 1);

        selectedVariants.forEach((v, idx) => {
          const ans = v.answerKeyMap[i] || "-";
          doc.setTextColor(0, 51, 153);
          doc.setFont("helvetica", "bold");
          doc.text(`[ ${ans} ]`, 47 + idx * 28, tableY + 1);
        });

        tableY += 7.5;
      }

      tableY += 6;

      // Resoluções Detalhadas e Insights Pedagógicos
      doc.setFillColor(241, 245, 249);
      doc.rect(14, tableY, 182, 6.5, "F");
      doc.setTextColor(0, 51, 153);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("RESOLUÇÃO COMENTADA E ANÁLISE DE DISTRATORES (QUESTÕES MESTRE)", 18, tableY + 4.5);

      tableY += 10;

      suite.masterQuestions.forEach((mq) => {
        if (tableY > 255) {
          doc.addPage();
          tableY = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, tableY, 182, 6, 1, 1, "F");
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Questão Mestre #${mq.index} [${mq.difficulty} • ${mq.bloomTaxonomyLevel} • ${mq.competencyCode}] — Valor: ${mq.points} pts`,
          16,
          tableY + 4.2
        );

        tableY += 8;

        const correctOpt = mq.options?.find((o) => o.isCorrect);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(`Gabarito Mestre: Alternativa (${correctOpt?.id || "A"}) — ${correctOpt?.text || ""}`, 16, tableY);

        tableY += 5;

        if (correctOpt?.explanation) {
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "normal");
          const expLines = doc.splitTextToSize(`Justificativa: ${correctOpt.explanation}`, 178);
          doc.text(expLines, 16, tableY);
          tableY += expLines.length * 3.8 + 2;
        }

        if (mq.commonDistractorReasoning) {
          doc.setTextColor(180, 83, 9);
          doc.setFont("helvetica", "italic");
          const distLines = doc.splitTextToSize(`Alerta de Distrator: ${mq.commonDistractorReasoning}`, 178);
          doc.text(distLines, 16, tableY);
          tableY += distLines.length * 3.8 + 2;
        }

        tableY += 4;
      });
    }

    return this.formatPdfOutput(doc, options.saveFilename || `Suíte_Avaliacoes_${suite.id}.pdf`);
  }
}
