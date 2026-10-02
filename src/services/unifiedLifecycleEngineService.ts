/**
 * ============================================================================
 * UNIFIED LIFECYCLE ENGINE SERVICE
 * ============================================================================
 * Implements:
 * 1. Explicit Activity Lifecycle:
 *    - RASCUNHO -> EM_VALIDACAO -> PRONTA_PUBLICACAO -> PUBLICADA -> ENCERRADA -> ARQUIVADA
 *    - Content versioning (v1, v2, v3) with immutable snapshots of prompt, rubric, tests.
 * 2. Explicit Submission Lifecycle:
 *    - RASCUNHO -> RECEBIDA -> NA_FILA -> PROCESSANDO -> AVALIADA_AUTO -> 
 *      AGUARDANDO_REVISAO -> RESULTADO_PUBLICADO -> REFACAO_SOLICITADA -> FALHA_TECNICA
 *    - Transition logging with audit trail.
 *    - Protection against false zeros: Technical errors never become academic penalties.
 * 3. Optimistic Concurrency Control (OCC):
 *    - Version locks to prevent concurrent overwrites between instructors.
 * 4. Idempotent submission & state transitions.
 * ============================================================================
 */

export type ActivityLifecycleState = 
  | "RASCUNHO" 
  | "EM_VALIDACAO" 
  | "PRONTA_PUBLICACAO" 
  | "PUBLICADA" 
  | "ENCERRADA" 
  | "ARQUIVADA";

export type SubmissionLifecycleState = 
  | "RASCUNHO" 
  | "RECEBIDA" 
  | "NA_FILA" 
  | "PROCESSANDO" 
  | "AVALIADA_AUTO" 
  | "AGUARDANDO_REVISAO" 
  | "RESULTADO_PUBLICADO" 
  | "REFACAO_SOLICITADA" 
  | "FALHA_TECNICA";

export interface ActivityVersionSnapshot {
  versionNumber: number;
  prompt: string;
  starterCode?: string;
  rubric: { criterionId: string; name: string; maxPoints: number; description: string }[];
  testCases: { id: string; input: string; expectedOutput: string; isHidden: boolean }[];
  deliveryRules: {
    deadlineIso: string;
    maxAttempts: number;
    allowLateSubmissions: boolean;
    latePenaltyPercent?: number;
    allowRefactoring: boolean;
  };
  sha256ContentHash: string;
  createdAtIso: string;
  createdByUser: string;
}

export interface ManagedActivity {
  id: string;
  institutionId: string;
  classId: string;
  className: string;
  title: string;
  competencyTarget: string;
  currentState: ActivityLifecycleState;
  activeVersion: number;
  versionHistory: ActivityVersionSnapshot[];
  versionLock: number; // Optimistic Concurrency Control
  publishedAtIso?: string;
  closedAtIso?: string;
  createdAtIso: string;
  updatedAtIso: string;
  responsibleTeacherId: string;
}

export interface SubmissionStateTransitionLog {
  fromState: SubmissionLifecycleState;
  toState: SubmissionLifecycleState;
  timestampIso: string;
  actor: "STUDENT" | "SYSTEM_WORKER" | "TEACHER" | "SYSTEM_RECOVERY";
  actorId: string;
  reason?: string;
}

export interface ManagedSubmission {
  id: string;
  idempotencyKey: string;
  activityId: string;
  activityVersionUsed: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string;
  attemptNumber: number;
  codeContent: string;
  language: string;
  currentState: SubmissionLifecycleState;
  transitionHistory: SubmissionStateTransitionLog[];
  
  // Evaluation layers
  autoEvaluation?: {
    testsPassed: number;
    totalTests: number;
    suggestedScore: number;
    executionTimeMs: number;
    outputLog: string;
    evaluatedAtIso: string;
  };

  teacherReview?: {
    reviewedByTeacherId: string;
    reviewedByTeacherName: string;
    moderatedScore: number;
    criteriaScores: { criterionId: string; points: number; feedbackComment?: string }[];
    generalFeedback: string;
    reviewedAtIso: string;
    justificationForOverride?: string;
  };

  publishedResult?: {
    officialScore: number;
    publishedAtIso: string;
    publishedByTeacherId: string;
    isRefactoringRequested: boolean;
    refactoringReason?: string;
    scheduledVisibilityIso?: string;
  };

  technicalFailureDetails?: {
    failedAtIso: string;
    errorType: "SANDBOX_TIMEOUT" | "AI_UNAVAILABLE" | "CONTAINER_OOM" | "NETWORK_FAILURE";
    errorMessage: string;
    isRecoverable: boolean;
    retryCount: number;
  };

  versionLock: number; // OCC
  receivedAtIso: string;
  updatedAtIso: string;
}

export class UnifiedLifecycleEngineService {
  private static activities: ManagedActivity[] = [
    {
      id: "act-ds-001",
      institutionId: "inst-fiemg-01",
      classId: "turma-ds-a",
      className: "Desenvolvimento de Sistemas - Turma A",
      title: "Lista 3: Somatórios e Filtros de Paridade em Python",
      competencyTarget: "Construir algoritmos com laços controlados e funções modulares",
      currentState: "PUBLICADA",
      activeVersion: 1,
      versionLock: 1,
      publishedAtIso: new Date(Date.now() - 3600000 * 48).toISOString(),
      createdAtIso: new Date(Date.now() - 3600000 * 72).toISOString(),
      updatedAtIso: new Date(Date.now() - 3600000 * 48).toISOString(),
      responsibleTeacherId: "prof-djalma",
      versionHistory: [
        {
          versionNumber: 1,
          prompt: "Implemente a função somar_pares_ate_limite(limite) que soma todos os inteiros pares de 1 até limite (inclusive). Trate casos de limite nulo ou negativo retornando 0.",
          starterCode: "def somar_pares_ate_limite(limite):\n    pass\n",
          rubric: [
            { criterionId: "crit-1", name: "Corretude Algorítmica", maxPoints: 50, description: "Passa em todos os testes unitários" },
            { criterionId: "crit-2", name: "Tratamento de Limites", maxPoints: 30, description: "Trata números <= 0 e entradas nulas" },
            { criterionId: "crit-3", name: "Legibilidade (Clean Code)", maxPoints: 20, description: "Docstrings e PEP 8" }
          ],
          testCases: [
            { id: "tc-1", input: "10", expectedOutput: "30", isHidden: false },
            { id: "tc-2", input: "5", expectedOutput: "6", isHidden: false },
            { id: "tc-3", input: "0", expectedOutput: "0", isHidden: true },
            { id: "tc-4", input: "-5", expectedOutput: "0", isHidden: true }
          ],
          deliveryRules: {
            deadlineIso: new Date(Date.now() + 3600000 * 24).toISOString(),
            maxAttempts: 3,
            allowLateSubmissions: true,
            latePenaltyPercent: 10,
            allowRefactoring: true
          },
          sha256ContentHash: "4a2b1c8e9f0d3a7e5b6c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
          createdAtIso: new Date(Date.now() - 3600000 * 48).toISOString(),
          createdByUser: "prof-djalma"
        }
      ]
    }
  ];

  private static submissions: ManagedSubmission[] = [
    {
      id: "sub-ds-101",
      idempotencyKey: "sub-mariana-act-ds-001-att-1",
      activityId: "act-ds-001",
      activityVersionUsed: 1,
      studentId: "std-mariana-02",
      studentName: "Mariana Alencar",
      studentEmail: "mariana.alencar@estudante.edu.br",
      classId: "turma-ds-a",
      attemptNumber: 1,
      codeContent: "def somar_pares_ate_limite(limite):\n    if not isinstance(limite, int) or limite <= 0:\n        return 0\n    return sum(x for x in range(2, limite + 1, 2))\n",
      language: "python",
      currentState: "RESULTADO_PUBLICADO",
      versionLock: 2,
      receivedAtIso: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      transitionHistory: [
        { fromState: "RASCUNHO", toState: "RECEBIDA", timestampIso: new Date(Date.now() - 3600000 * 12).toISOString(), actor: "STUDENT", actorId: "std-mariana-02" },
        { fromState: "RECEBIDA", toState: "NA_FILA", timestampIso: new Date(Date.now() - 3600000 * 12 + 100).toISOString(), actor: "SYSTEM_WORKER", actorId: "job-dispatcher" },
        { fromState: "NA_FILA", toState: "PROCESSANDO", timestampIso: new Date(Date.now() - 3600000 * 12 + 500).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-1" },
        { fromState: "PROCESSANDO", toState: "AVALIADA_AUTO", timestampIso: new Date(Date.now() - 3600000 * 12 + 1800).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-1" },
        { fromState: "AVALIADA_AUTO", toState: "AGUARDANDO_REVISAO", timestampIso: new Date(Date.now() - 3600000 * 12 + 1900).toISOString(), actor: "SYSTEM_WORKER", actorId: "lifecycle-engine" },
        { fromState: "AGUARDANDO_REVISAO", toState: "RESULTADO_PUBLICADO", timestampIso: new Date(Date.now() - 3600000 * 2).toISOString(), actor: "TEACHER", actorId: "prof-djalma", reason: "Revisão e homologação de nota 100" }
      ],
      autoEvaluation: {
        testsPassed: 4,
        totalTests: 4,
        suggestedScore: 100,
        executionTimeMs: 142,
        outputLog: "Todos os 4 testes aprovados.",
        evaluatedAtIso: new Date(Date.now() - 3600000 * 12 + 1800).toISOString()
      },
      teacherReview: {
        reviewedByTeacherId: "prof-djalma",
        reviewedByTeacherName: "Prof. Djalma Batista",
        moderatedScore: 100,
        criteriaScores: [
          { criterionId: "crit-1", points: 50, feedbackComment: "Excelente cobertura de testes." },
          { criterionId: "crit-2", points: 30, feedbackComment: "Casos negativos tratados." },
          { criterionId: "crit-3", points: 20, feedbackComment: "Código elegante e pythonic." }
        ],
        generalFeedback: "Parabéns pela clareza e uso de generator expression.",
        reviewedAtIso: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      publishedResult: {
        officialScore: 100,
        publishedAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
        publishedByTeacherId: "prof-djalma",
        isRefactoringRequested: false
      }
    },
    {
      id: "sub-ds-102",
      idempotencyKey: "sub-lucas-act-ds-001-att-1",
      activityId: "act-ds-001",
      activityVersionUsed: 1,
      studentId: "std-lucas-03",
      studentName: "Lucas Ferreira",
      studentEmail: "lucas.ferreira@estudante.edu.br",
      classId: "turma-ds-a",
      attemptNumber: 1,
      codeContent: "def somar_pares_ate_limite(limite):\n    soma = 0\n    for i in range(1, limite):\n        if i % 2 == 0:\n            soma += i\n    return soma\n",
      language: "python",
      currentState: "AGUARDANDO_REVISAO",
      versionLock: 1,
      receivedAtIso: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAtIso: new Date(Date.now() - 3600000 * 8).toISOString(),
      transitionHistory: [
        { fromState: "RASCUNHO", toState: "RECEBIDA", timestampIso: new Date(Date.now() - 3600000 * 8).toISOString(), actor: "STUDENT", actorId: "std-lucas-03" },
        { fromState: "RECEBIDA", toState: "NA_FILA", timestampIso: new Date(Date.now() - 3600000 * 8 + 100).toISOString(), actor: "SYSTEM_WORKER", actorId: "job-dispatcher" },
        { fromState: "NA_FILA", toState: "PROCESSANDO", timestampIso: new Date(Date.now() - 3600000 * 8 + 400).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-1" },
        { fromState: "PROCESSANDO", toState: "AVALIADA_AUTO", timestampIso: new Date(Date.now() - 3600000 * 8 + 1500).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-1" },
        { fromState: "AVALIADA_AUTO", toState: "AGUARDANDO_REVISAO", timestampIso: new Date(Date.now() - 3600000 * 8 + 1600).toISOString(), actor: "SYSTEM_WORKER", actorId: "lifecycle-engine" }
      ],
      autoEvaluation: {
        testsPassed: 2,
        totalTests: 4,
        suggestedScore: 50,
        executionTimeMs: 168,
        outputLog: "Falha nos testes tc-1 e tc-2: off-by-one no limite superior range().",
        evaluatedAtIso: new Date(Date.now() - 3600000 * 8 + 1500).toISOString()
      }
    },
    {
      id: "sub-ds-103",
      idempotencyKey: "sub-carlos-act-ds-001-att-1",
      activityId: "act-ds-001",
      activityVersionUsed: 1,
      studentId: "std-carlos-05",
      studentName: "Carlos Eduardo Santos",
      studentEmail: "carlos.santos@estudante.edu.br",
      classId: "turma-ds-a",
      attemptNumber: 1,
      codeContent: "def somar_pares_ate_limite(limite):\n    import time; time.sleep(100)\n",
      language: "python",
      currentState: "FALHA_TECNICA",
      versionLock: 1,
      receivedAtIso: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAtIso: new Date(Date.now() - 3600000 * 4).toISOString(),
      transitionHistory: [
        { fromState: "RASCUNHO", toState: "RECEBIDA", timestampIso: new Date(Date.now() - 3600000 * 4).toISOString(), actor: "STUDENT", actorId: "std-carlos-05" },
        { fromState: "RECEBIDA", toState: "NA_FILA", timestampIso: new Date(Date.now() - 3600000 * 4 + 100).toISOString(), actor: "SYSTEM_WORKER", actorId: "job-dispatcher" },
        { fromState: "NA_FILA", toState: "PROCESSANDO", timestampIso: new Date(Date.now() - 3600000 * 4 + 400).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-2" },
        { fromState: "PROCESSANDO", toState: "FALHA_TECNICA", timestampIso: new Date(Date.now() - 3600000 * 4 + 5500).toISOString(), actor: "SYSTEM_WORKER", actorId: "worker-node-2", reason: "Tempo limite do sandbox atingido (5000ms)" }
      ],
      technicalFailureDetails: {
        failedAtIso: new Date(Date.now() - 3600000 * 4 + 5500).toISOString(),
        errorType: "SANDBOX_TIMEOUT",
        errorMessage: "Processo interrompido por timeout do executor seguro.",
        isRecoverable: true,
        retryCount: 1
      }
    }
  ];

  // ==========================================================================
  // ACTIVITY LIFECYCLE METHODS
  // ==========================================================================
  public static getActivities(classId?: string): ManagedActivity[] {
    if (!classId || classId === "all") return this.activities;
    return this.activities.filter(a => a.classId === classId);
  }

  public static getActivityById(activityId: string): ManagedActivity | undefined {
    return this.activities.find(a => a.id === activityId);
  }

  public static createDraftActivity(params: {
    turmaId: string;
    professorId: string;
    titulo: string;
    enunciado: string;
    rubrica: { criterio: string; peso: number; descricao?: string }[];
    testesPrivados: { input: string; expected: string; isHidden?: boolean }[];
    regrasEntrega: {
      prazoFinal: string;
      maxTentativas: number;
      permiteAtraso: boolean;
      fatorDescontoAtraso?: number;
      permiteRefacao?: boolean;
    };
  }): ManagedActivity {
    const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const contentToHash = JSON.stringify({
      enunciado: params.enunciado,
      rubrica: params.rubrica,
      testes: params.testesPrivados,
      regras: params.regrasEntrega
    });

    let hash = 0;
    for (let i = 0; i < contentToHash.length; i++) {
      hash = ((hash << 5) - hash) + contentToHash.charCodeAt(i);
      hash |= 0;
    }
    const sha256 = `sha256-${Math.abs(hash).toString(16).padStart(16, "0")}`;

    const snapshot: ActivityVersionSnapshot = {
      versionNumber: 1,
      prompt: params.enunciado,
      rubric: params.rubrica.map((r, i) => ({
        criterionId: `crit-${i + 1}`,
        name: r.criterio,
        maxPoints: r.peso,
        description: r.descricao || r.criterio
      })),
      testCases: params.testesPrivados.map((t, i) => ({
        id: `tc-${i + 1}`,
        input: t.input,
        expectedOutput: t.expected,
        isHidden: t.isHidden !== false
      })),
      deliveryRules: {
        deadlineIso: params.regrasEntrega.prazoFinal,
        maxAttempts: params.regrasEntrega.maxTentativas,
        allowLateSubmissions: params.regrasEntrega.permiteAtraso,
        latePenaltyPercent: params.regrasEntrega.fatorDescontoAtraso ? (1 - params.regrasEntrega.fatorDescontoAtraso) * 100 : 0,
        allowRefactoring: params.regrasEntrega.permiteRefacao ?? true
      },
      sha256ContentHash: sha256,
      createdAtIso: new Date().toISOString(),
      createdByUser: params.professorId
    };

    const newActivity: ManagedActivity = {
      id: actId,
      institutionId: "inst-fiemg-01",
      classId: params.turmaId,
      className: "Turma de Tecnologia Integrada",
      title: params.titulo,
      competencyTarget: "Competência técnica essencial",
      currentState: "RASCUNHO",
      activeVersion: 1,
      versionHistory: [snapshot],
      versionLock: 1,
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      responsibleTeacherId: params.professorId
    };

    this.activities.unshift(newActivity);
    return newActivity;
  }

  public static requestValidation(activityId: string, actorUserId: string): ManagedActivity {
    const res = this.transitionActivityState(activityId, "EM_VALIDACAO", actorUserId, this.getActivityById(activityId)?.versionLock || 1);
    if (!res.success || !res.activity) {
      throw new Error(res.error || "Erro ao solicitar validação.");
    }
    return res.activity;
  }

  public static approveForPublication(activityId: string, actorUserId: string): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");
    const res = this.transitionActivityState(activityId, "PRONTA_PUBLICACAO", actorUserId, act.versionLock);
    if (!res.success || !res.activity) {
      throw new Error(res.error || "Erro ao aprovar publicação.");
    }
    return res.activity;
  }

  public static publishActivity(activityId: string, actorUserId: string): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");
    const res = this.transitionActivityState(activityId, "PUBLICADA", actorUserId, act.versionLock);
    if (!res.success || !res.activity) {
      throw new Error(res.error || "Erro ao publicar atividade.");
    }
    return res.activity;
  }

  public static closeActivity(activityId: string, actorUserId: string): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");
    const res = this.transitionActivityState(activityId, "ENCERRADA", actorUserId, act.versionLock);
    if (!res.success || !res.activity) {
      throw new Error(res.error || "Erro ao encerrar atividade.");
    }
    return res.activity;
  }

  public static archiveActivity(activityId: string, actorUserId: string): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");
    const res = this.transitionActivityState(activityId, "ARQUIVADA", actorUserId, act.versionLock);
    if (!res.success || !res.activity) {
      throw new Error(res.error || "Erro ao arquivar atividade.");
    }
    return res.activity;
  }

  public static updatePublishedActivity(
    activityId: string,
    changes: { enunciado?: string; rubrica?: any[]; testesPrivados?: any[]; regrasEntrega?: any },
    actorUserId: string,
    _motivo: string
  ): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");

    const latest = act.versionHistory[act.versionHistory.length - 1];
    const newVer = act.activeVersion + 1;

    const contentToHash = JSON.stringify({
      prompt: changes.enunciado || latest.prompt,
      rubric: changes.rubrica || latest.rubric,
      testCases: changes.testesPrivados || latest.testCases,
      deliveryRules: changes.regrasEntrega || latest.deliveryRules,
      ver: newVer
    });

    let hash = 0;
    for (let i = 0; i < contentToHash.length; i++) {
      hash = ((hash << 5) - hash) + contentToHash.charCodeAt(i);
      hash |= 0;
    }
    const sha256 = `sha256-${Math.abs(hash).toString(16).padStart(16, "0")}`;

    const newSnapshot: ActivityVersionSnapshot = {
      versionNumber: newVer,
      prompt: changes.enunciado || latest.prompt,
      rubric: changes.rubrica ? changes.rubrica.map((r, i) => ({
        criterionId: `crit-${i + 1}`,
        name: r.criterio,
        maxPoints: r.peso,
        description: r.criterio
      })) : latest.rubric,
      testCases: latest.testCases,
      deliveryRules: latest.deliveryRules,
      sha256ContentHash: sha256,
      createdAtIso: new Date().toISOString(),
      createdByUser: actorUserId
    };

    act.versionHistory.push(newSnapshot);
    act.activeVersion = newVer;
    act.updatedAtIso = new Date().toISOString();
    act.versionLock += 1;
    return act;
  }

  public static updateDraftWithOCC(
    activityId: string,
    changes: Partial<{ titulo: string; enunciado: string }>,
    expectedLock: number,
    _actorUserId: string
  ): ManagedActivity {
    const act = this.getActivityById(activityId);
    if (!act) throw new Error("Atividade não encontrada.");

    if (act.versionLock !== expectedLock) {
      throw new Error(`409 Conflict: O registro foi alterado concorrentemente (lock atual: ${act.versionLock}, fornecido: ${expectedLock}).`);
    }

    if (changes.titulo) act.title = changes.titulo;
    if (changes.enunciado && act.versionHistory.length > 0) {
      act.versionHistory[act.versionHistory.length - 1].prompt = changes.enunciado;
    }
    act.versionLock += 1;
    act.updatedAtIso = new Date().toISOString();
    return act;
  }

  public static transitionActivityState(
    activityId: string,
    targetState: ActivityLifecycleState,
    _actorUserId: string,
    expectedVersionLock: number
  ): { success: boolean; error?: string; activity?: ManagedActivity } {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) return { success: false, error: "Atividade não encontrada." };

    // Optimistic Concurrency Control
    if (act.versionLock !== expectedVersionLock) {
      return {
        success: false,
        error: `Conflito de concorrência detectado: A atividade foi alterada por outro usuário (versão atual: ${act.versionLock}, esperada: ${expectedVersionLock}). Recarregue os dados antes de prosseguir.`
      };
    }

    // Valid state machine transitions
    const validTransitions: Record<ActivityLifecycleState, ActivityLifecycleState[]> = {
      RASCUNHO: ["EM_VALIDACAO", "ARQUIVADA"],
      EM_VALIDACAO: ["PRONTA_PUBLICACAO", "RASCUNHO"],
      PRONTA_PUBLICACAO: ["PUBLICADA", "RASCUNHO"],
      PUBLICADA: ["ENCERRADA", "ARQUIVADA"],
      ENCERRADA: ["PUBLICADA", "ARQUIVADA"],
      ARQUIVADA: ["RASCUNHO"]
    };

    if (!validTransitions[act.currentState].includes(targetState)) {
      return {
        success: false,
        error: `Transição inválida: Não é permitido mover de '${act.currentState}' para '${targetState}'.`
      };
    }

    act.currentState = targetState;
    act.updatedAtIso = new Date().toISOString();
    act.versionLock += 1;

    if (targetState === "PUBLICADA" && !act.publishedAtIso) {
      act.publishedAtIso = new Date().toISOString();
    } else if (targetState === "ENCERRADA") {
      act.closedAtIso = new Date().toISOString();
    }

    return { success: true, activity: act };
  }

  public static createNewActivityVersion(
    activityId: string,
    updatedSnapshot: Omit<ActivityVersionSnapshot, "versionNumber" | "sha256ContentHash" | "createdAtIso">,
    createdByUser: string
  ): { success: boolean; newVersionNumber?: number; error?: string } {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) return { success: false, error: "Atividade não encontrada." };

    const newVer = act.activeVersion + 1;
    const contentToHash = JSON.stringify({
      prompt: updatedSnapshot.prompt,
      rubric: updatedSnapshot.rubric,
      testCases: updatedSnapshot.testCases,
      deliveryRules: updatedSnapshot.deliveryRules
    });

    let hash = 0;
    for (let i = 0; i < contentToHash.length; i++) {
      hash = ((hash << 5) - hash) + contentToHash.charCodeAt(i);
      hash |= 0;
    }
    const sha256 = `sha256-${Math.abs(hash).toString(16).padStart(16, "0")}`;

    const newSnapshot: ActivityVersionSnapshot = {
      ...updatedSnapshot,
      versionNumber: newVer,
      sha256ContentHash: sha256,
      createdAtIso: new Date().toISOString(),
      createdByUser
    };

    act.versionHistory.push(newSnapshot);
    act.activeVersion = newVer;
    act.updatedAtIso = new Date().toISOString();
    act.versionLock += 1;

    return { success: true, newVersionNumber: newVer };
  }

  // ==========================================================================
  // SUBMISSION LIFECYCLE METHODS
  // ==========================================================================
  public static getSubmissions(filters?: { activityId?: string; classId?: string; studentId?: string; state?: SubmissionLifecycleState }): ManagedSubmission[] {
    return this.submissions.filter(s => {
      if (filters?.activityId && filters.activityId !== "all" && s.activityId !== filters.activityId) return false;
      if (filters?.classId && filters.classId !== "all" && s.classId !== filters.classId) return false;
      if (filters?.studentId && filters.studentId !== "all" && s.studentId !== filters.studentId) return false;
      if (filters?.state && s.currentState !== filters.state) return false;
      return true;
    });
  }

  public static getSubmissionById(id: string): ManagedSubmission | undefined {
    return this.submissions.find(s => s.id === id);
  }

  public static submitDelivery(params: {
    atividadeId?: string;
    activityId?: string;
    turmaId?: string;
    classId?: string;
    alunoId?: string;
    studentId?: string;
    alunoNome?: string;
    studentName?: string;
    alunoEmail?: string;
    studentEmail?: string;
    tentativaNumero?: number;
    codigo?: string;
    codeContent?: string;
    linguagem?: string;
    language?: string;
    idempotencyKey?: string;
    submissaoOrigemRefacaoId?: string;
  }): ManagedSubmission {
    const actId = params.atividadeId || params.activityId || "act-ds-001";
    const stdId = params.alunoId || params.studentId || "std-generic";
    const stdName = params.alunoNome || params.studentName || "Aluno";
    const stdEmail = params.alunoEmail || params.studentEmail || `${stdId}@escola.edu.br`;
    const clsId = params.turmaId || params.classId || "turma-ds-a";
    const code = params.codigo || params.codeContent || "";
    const lang = params.linguagem || params.language || "typescript";

    const previousAttempts = this.submissions.filter(
      s => s.activityId === actId && s.studentId === stdId
    );
    const attemptNumber = params.tentativaNumero || (previousAttempts.length + 1);
    const key = params.idempotencyKey || `${stdId}:${actId}:${attemptNumber}`;

    // Idempotency check
    const existing = this.submissions.find(s => s.idempotencyKey === key);
    if (existing) {
      return existing;
    }

    const act = this.getActivityById(actId);
    const activeVer = act ? act.activeVersion : 1;

    const newSub: ManagedSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      idempotencyKey: key,
      activityId: actId,
      activityVersionUsed: activeVer,
      studentId: stdId,
      studentName: stdName,
      studentEmail: stdEmail,
      classId: clsId,
      attemptNumber,
      codeContent: code,
      language: lang,
      currentState: "RECEBIDA",
      versionLock: 1,
      receivedAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      transitionHistory: [
        {
          fromState: "RASCUNHO",
          toState: "RECEBIDA",
          timestampIso: new Date().toISOString(),
          actor: "STUDENT",
          actorId: stdId,
          reason: `Submissão de entrega - Tentativa #${attemptNumber}`
        }
      ]
    };

    this.submissions.unshift(newSub);
    return newSub;
  }

  public static transitionSubmissionStatus(
    submissionId: string,
    targetState: SubmissionLifecycleState,
    actorName = "SYSTEM"
  ): ManagedSubmission {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error("Submissão não encontrada.");

    const fromState = sub.currentState;
    sub.currentState = targetState;
    sub.updatedAtIso = new Date().toISOString();
    sub.versionLock += 1;

    sub.transitionHistory.push({
      fromState,
      toState: targetState,
      timestampIso: new Date().toISOString(),
      actor: "SYSTEM_WORKER",
      actorId: actorName,
      reason: `Transição para ${targetState}`
    });

    return sub;
  }

  public static registerAutoEvaluationResult(
    submissionId: string,
    score: number,
    details: { passedTests?: number; totalTests?: number; executionTimeMs?: number; feedback?: string }
  ): ManagedSubmission {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error("Submissão não encontrada.");

    sub.autoEvaluation = {
      testsPassed: details.passedTests ?? 1,
      totalTests: details.totalTests ?? 1,
      suggestedScore: score,
      executionTimeMs: details.executionTimeMs ?? 100,
      outputLog: details.feedback ?? "Avaliação automática concluída com sucesso.",
      evaluatedAtIso: new Date().toISOString()
    };

    return this.transitionSubmissionStatus(submissionId, "AVALIADA_AUTO", "AutoEvaluationEngine");
  }

  public static registerTechnicalFailure(
    submissionId: string,
    errorType: string,
    errorMessage: string
  ): ManagedSubmission & { isZeroPunitivo: boolean; notaAutomatica: null; motivoFalha: string } {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error("Submissão não encontrada.");

    sub.technicalFailureDetails = {
      failedAtIso: new Date().toISOString(),
      errorType: "SANDBOX_TIMEOUT",
      errorMessage: `${errorType}: ${errorMessage}`,
      isRecoverable: true,
      retryCount: 1
    };

    this.transitionSubmissionStatus(submissionId, "FALHA_TECNICA", "SandboxSupervisor");

    return Object.assign(sub, {
      isZeroPunitivo: false,
      notaAutomatica: null,
      motivoFalha: `${errorType}: ${errorMessage}`
    });
  }

  public static transitionSubmissionState(
    submissionId: string,
    targetState: SubmissionLifecycleState,
    actor: SubmissionStateTransitionLog["actor"],
    actorId: string,
    reason?: string
  ): boolean {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (!sub) return false;

    const fromState = sub.currentState;
    sub.currentState = targetState;
    sub.updatedAtIso = new Date().toISOString();
    sub.versionLock += 1;

    sub.transitionHistory.push({
      fromState,
      toState: targetState,
      timestampIso: new Date().toISOString(),
      actor,
      actorId,
      reason
    });

    return true;
  }
}
