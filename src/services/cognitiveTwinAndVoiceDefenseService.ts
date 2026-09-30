export interface StudentMicroCompetencyMastery {
  competencyId: string;
  name: string;
  category: "ALGORITMOS" | "BANCO_DE_DADOS" | "ARQUITETURA" | "SEGURANCA" | "ENGENHARIA_SOFTWARE";
  pKnown: number; // Probability of knowing concept (0.0 to 1.0)
  pTransit: number; // Learning rate
  pGuess: number; // Guess rate
  pSlip: number; // Slip rate
  lastPracticedAt: string;
  retentionPercent: number; // Ebbinghaus memory retention (0 - 100%)
  masteryLevel: "INICIANTE" | "EM_PROGRESSO" | "PROFICIENTE" | "MESTRE";
  recommendedAction: string;
}

export interface CognitiveTwinProfile {
  studentId: string;
  studentName: string;
  overallMasteryIndex: number; // 0 - 100
  cognitiveVelocity: number; // Speed of learning multiplier (e.g. 1.2x)
  retentionRiskCount: number;
  competencies: StudentMicroCompetencyMastery[];
  generatedAt: string;
}

export interface SelfHealingLessonStep {
  step: number;
  title: string;
  conceptSummary: string;
  mentalModelIntuition: string;
  interactiveMicroQuiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SelfHealingRemediationPath {
  id: string;
  studentId: string;
  targetCompetency: string;
  gapIdentified: string;
  steps: SelfHealingLessonStep[];
  estimatedDurationMinutes: number;
  expectedMasteryBoost: number;
}

export interface VoiceOralDefenseEvaluation {
  id: string;
  studentId: string;
  submissionId?: string;
  topicTitle: string;
  transcription: string;
  metrics: {
    technicalVocabularyScore: number; // 0 - 100
    conceptualDepthScore: number; // 0 - 100
    argumentationCoherenceScore: number; // 0 - 100
    authenticAuthorshipConfidence: number; // 0 - 100% (High = Genuine Student Authorship, Low = AI readout)
  };
  keyConceptsMentioned: string[];
  omissionsOrMisconceptions: string[];
  socraticFollowUpQuestion: string;
  overallVerdict: "APROVADO_COM_DISTINCAO" | "APROVADO" | "NECESSITA_APROFUNDAMENTO" | "INCONCLUSIVO_REFAZER";
  formalPedagogicalFeedback: string;
}

export class CognitiveTwinAndVoiceDefenseService {
  /**
   * Calculates Ebbinghaus retention percentage based on elapsed days
   */
  public static calculateEbbinghausRetention(lastPracticedIso: string, stabilityMultiplier = 1.0): number {
    const elapsedDays = Math.max(0, (Date.now() - new Date(lastPracticedIso).getTime()) / (1000 * 60 * 60 * 24));
    // R = e^(-t/S)
    const retention = Math.exp(-elapsedDays / (7 * stabilityMultiplier));
    return Math.round(Math.min(100, Math.max(10, retention * 100)));
  }

  /**
   * Updates Bayesian Knowledge Tracing (BKT) probability given student success/failure
   */
  public static updateBktKnowledge(
    currentPKnown: number,
    isCorrect: boolean,
    pTransit = 0.15,
    pGuess = 0.20,
    pSlip = 0.10
  ): number {
    // 1. Posterior probability of knowing given response
    let pKnownGivenObs: number;
    if (isCorrect) {
      pKnownGivenObs = (currentPKnown * (1 - pSlip)) / (currentPKnown * (1 - pSlip) + (1 - currentPKnown) * pGuess);
    } else {
      pKnownGivenObs = (currentPKnown * pSlip) / (currentPKnown * pSlip + (1 - currentPKnown) * (1 - pGuess));
    }

    // 2. Add transition probability to next state
    const nextPKnown = pKnownGivenObs + (1 - pKnownGivenObs) * pTransit;
    return Math.min(0.99, Math.max(0.05, Math.round(nextPKnown * 100) / 100));
  }

  /**
   * Generates a complete Cognitive Twin Profile for a student
   */
  public static getCognitiveTwinProfile(studentId: string, studentName = "Aluno SENAI"): CognitiveTwinProfile {
    const defaultCompetencies: StudentMicroCompetencyMastery[] = [
      {
        competencyId: "comp-1",
        name: "Modelagem Lógica & Normalização 3NF",
        category: "BANCO_DE_DADOS",
        pKnown: 0.85,
        pTransit: 0.12,
        pGuess: 0.15,
        pSlip: 0.08,
        lastPracticedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        retentionPercent: 78,
        masteryLevel: "PROFICIENTE",
        recommendedAction: "Praticar caso de borda com anomalia de atualização em tabelas transitivas."
      },
      {
        competencyId: "comp-2",
        name: "Estruturas de Dados & Complexidade Big-O",
        category: "ALGORITMOS",
        pKnown: 0.92,
        pTransit: 0.10,
        pGuess: 0.10,
        pSlip: 0.05,
        lastPracticedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        retentionPercent: 94,
        masteryLevel: "MESTRE",
        recommendedAction: "Apto a desafios de alta performance e duelos na Arena."
      },
      {
        competencyId: "comp-3",
        name: "Consultas Complexas (JOINs, Window Functions & CTE)",
        category: "BANCO_DE_DADOS",
        pKnown: 0.58,
        pTransit: 0.18,
        pGuess: 0.20,
        pSlip: 0.12,
        lastPracticedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        retentionPercent: 42,
        masteryLevel: "EM_PROGRESSO",
        recommendedAction: "Risco de esquecimento identificado! Ativar trilha de fixação de Window Functions."
      },
      {
        competencyId: "comp-4",
        name: "Segurança de Software & Prevenção OWASP",
        category: "SEGURANCA",
        pKnown: 0.74,
        pTransit: 0.15,
        pGuess: 0.15,
        pSlip: 0.10,
        lastPracticedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        retentionPercent: 68,
        masteryLevel: "PROFICIENTE",
        recommendedAction: "Reforçar validação de headers e parametrização SQL."
      }
    ];

    const overall = Math.round(
      defaultCompetencies.reduce((acc, c) => acc + c.pKnown * 100, 0) / defaultCompetencies.length
    );

    const retentionRisks = defaultCompetencies.filter((c) => c.retentionPercent < 60).length;

    return {
      studentId,
      studentName,
      overallMasteryIndex: overall,
      cognitiveVelocity: 1.15,
      retentionRiskCount: retentionRisks,
      competencies: defaultCompetencies,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generates a Self-Healing Remediation Path for a gap topic
   */
  public static generateSelfHealingPath(
    studentId: string,
    topic = "Normalização de Banco de Dados (3NF)"
  ): SelfHealingRemediationPath {
    return {
      id: `heal-${Date.now()}`,
      studentId,
      targetCompetency: topic,
      gapIdentified: "Dificuldade na identificação de dependências funcionais transitivas e separação de tabelas satélite.",
      estimatedDurationMinutes: 8,
      expectedMasteryBoost: 22,
      steps: [
        {
          step: 1,
          title: "Âncora Intuitiva: O que é Dependência Transitiva?",
          conceptSummary: "Se o atributo A determina B, e B determina C, C não deve ficar na mesma tabela de A.",
          mentalModelIntuition: "Pense no CEP e Cidade: O ID_Aluno determina o CEP, mas o CEP determina a Cidade. Deixar a Cidade na tabela Aluno gera redundância e anomalia se a cidade mudar de nome.",
          interactiveMicroQuiz: {
            question: "Na tabela Aluno (id, nome, cep, cidade, estado), por que 'cidade' viola a 3NF?",
            options: [
              "Porque 'cidade' depende de 'cep', que por sua vez depende de 'id'.",
              "Porque campos de texto não podem existir na 3NF.",
              "Porque não existe chave primária composta.",
              "Porque a tabela tem mais de 3 colunas."
            ],
            correctIndex: 0,
            explanation: "Exatamente! 'cidade' depende transitivamente da chave primária através do 'cep'."
          }
        },
        {
          step: 2,
          title: "Refatoração Cirúrgica: Decompondo sem Perda de Dados",
          conceptSummary: "Crie a tabela `Enderecos (cep PK, cidade, estado)` e mantenha apenas `cep FK` na tabela `Alunos`.",
          mentalModelIntuition: "Separar responsabilidades no banco é idêntico ao princípio de responsabilidade única (SRP) da programação orientada a objetos.",
          interactiveMicroQuiz: {
            question: "Após a decomposição para 3NF, qual a cardinalidade entre Alunos e Enderecos?",
            options: [
              "N:M com tabela associativa.",
              "N:1 (Muitos alunos podem morar no mesmo CEP).",
              "1:1 obrigatório.",
              "Não existe relacionamento entre as tabelas."
            ],
            correctIndex: 1,
            explanation: "Perfeito! Vários alunos podem compartilhar o mesmo CEP/bairro."
          }
        }
      ]
    };
  }

  /**
   * Evaluates an Oral Defense Speech transcription with Socratic verification
   */
  public static evaluateVoiceOralDefense(
    studentId: string,
    topicTitle: string,
    transcription: string
  ): VoiceOralDefenseEvaluation {
    const textLower = transcription.toLowerCase();

    // Key concepts dictionary for technical lexicon detection
    const technicalKeywords = [
      "complexidade", "algoritmo", "índice", "normalização", "chave primária",
      "chave estrangeira", "estrangeira", "primária", "recursão", "memória", "heap",
      "stack", "transação", "acid", "desempenho", "latência", "b-tree", "hash",
      "3nf", "3fn", "fk", "pk", "tabela", "integridade", "referencial", "redundância",
      "redundancias", "anomalia", "anomalias", "banco", "dados", "sql", "query",
      "join", "particionamento", "otimização", "latencia", "throughput", "função",
      "classe", "método", "estrutura", "fila", "pilha", "árvore", "grafo"
    ];

    const detectedKeywords = technicalKeywords.filter((kw) => textLower.includes(kw));
    const vocabularyScore = Math.min(100, Math.round((detectedKeywords.length / 3) * 100));

    // Assess conceptual depth and natural argumentation
    const wordsCount = transcription.trim().split(/\s+/).length;
    const depthScore = Math.min(100, Math.max(30, Math.round((wordsCount / 60) * 100)));

    // Authorship confidence: human speech typically has natural pauses and connectors
    const naturalConnectors = ["porque", "então", "decidi", "percebi", "optei", "ou seja", "por isso", "no caso"];
    const naturalMatches = naturalConnectors.filter((c) => textLower.includes(c)).length;
    const authorshipConfidence = Math.min(98, Math.max(65, 70 + naturalMatches * 5));

    const coherenceScore = Math.round((vocabularyScore * 0.4 + depthScore * 0.4 + authorshipConfidence * 0.2));

    let verdict: VoiceOralDefenseEvaluation["overallVerdict"] = "APROVADO";
    if (coherenceScore >= 88) {
      verdict = "APROVADO_COM_DISTINCAO";
    } else if (coherenceScore < 60) {
      verdict = "NECESSITA_APROFUNDAMENTO";
    }

    return {
      id: `oral-${Date.now()}`,
      studentId,
      topicTitle,
      transcription,
      metrics: {
        technicalVocabularyScore: vocabularyScore,
        conceptualDepthScore: depthScore,
        argumentationCoherenceScore: coherenceScore,
        authenticAuthorshipConfidence: authorshipConfidence
      },
      keyConceptsMentioned: detectedKeywords,
      omissionsOrMisconceptions: vocabularyScore < 60 ? ["Faltou explicitar os trade-offs de memória versus tempo de processamento."] : [],
      socraticFollowUpQuestion: `Excelente explicação. Se o volume de dados quintuplicasse para 10 milhões de linhas, qual índice ou estratégia de particionamento você aplicaria prioritariamente?`,
      overallVerdict: verdict,
      formalPedagogicalFeedback: `O estudante demonstrou ${coherenceScore >= 70 ? "sólida" : "satisfatória"} capacidade de verbalização técnica sobre '${topicTitle}', com vocabulário pertinente e articulação coerente das decisões de engenharia adotadas.`
    };
  }
}
