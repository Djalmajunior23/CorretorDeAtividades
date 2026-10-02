/**
 * ============================================================================
 * GUIDED REFACTORING & ITERATIVE LEARNING COMPANION SERVICE
 * ============================================================================
 * Implements:
 * 1. Student version history tracking with diff insights.
 * 2. 3-tier progressive hints (scaffolding: Concept -> Edge Case -> Pseudocode).
 * 3. Student change justification ("O que você alterou e por quê?").
 * 4. Grade calculation policies (highest score, weighted average, latest).
 * 5. Student review appeal / contestation mechanism.
 * ============================================================================
 */

export interface StudentCodeVersion {
  versionIndex: number;
  timestamp: string;
  code: string;
  scoreObtained: number;
  changeRationale?: string;
  feedbackHighlights: string[];
  testsPassed: number;
  totalTests: number;
}

export interface ProgressiveHint {
  level: 1 | 2 | 3;
  title: string;
  category: "CONCEITUAL" | "CASO_LIMITE" | "PSEUDOCODIGO";
  content: string;
  penaltyPercentage: number; // e.g. 0% for level 1, 5% for level 2, 10% for level 3
  isUnlocked: boolean;
}

export interface RefactoringSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  maxAttemptsAllowed: number;
  attemptsCount: number;
  deadlineIso: string;
  gradingPolicy: "HIGHEST_ATTEMPT" | "WEIGHTED_AVERAGE" | "LATEST_ATTEMPT";
  versions: StudentCodeVersion[];
  hints: ProgressiveHint[];
  currentDraft: string;
  canRefactor: boolean;
}

export class RefactoringCycleService {
  private static sessions: Record<string, RefactoringSession> = {};

  /**
   * Retrieves or initializes a student's refactoring session
   */
  public static getSession(studentId: string, activityId: string): RefactoringSession {
    const key = `${studentId}:${activityId}`;
    if (this.sessions[key]) {
      return this.sessions[key];
    }

    const newSession: RefactoringSession = {
      sessionId: `refact-${Date.now()}-${studentId}`,
      studentId,
      studentName: studentId === "std-vinicius" ? "Vinícius Souza" : "Estudante",
      activityId,
      activityTitle: "Estruturas de Repetição & Filtro Par",
      maxAttemptsAllowed: 3,
      attemptsCount: 1,
      deadlineIso: new Date(Date.now() + 3600000 * 72).toISOString(),
      gradingPolicy: "HIGHEST_ATTEMPT",
      versions: [
        {
          versionIndex: 1,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          code: `def somar_pares(n):\n    # Versão 1 com bug em n=0 e limite superior\n    soma = 0\n    for i in range(n):\n        if i % 2 == 0:\n            soma += i\n    return soma`,
          scoreObtained: 65,
          changeRationale: "Primeira tentativa com loop for simples",
          feedbackHighlights: [
            "Sintaxe correta e boa indentação.",
            "Atenção ao limite superior: range(n) para antes de N.",
            "Caso limite n=0 deve retornar 0 sem erro."
          ],
          testsPassed: 2,
          totalTests: 4
        }
      ],
      hints: [
        {
          level: 1,
          title: "Dica 1: Revisão do Intervalo da Função range()",
          category: "CONCEITUAL",
          content: "Em Python, o comando range(start, stop) é exclusivo no limite superior. Para incluir o próprio número N no loop, o limite superior deve ser 'n + 1'.",
          penaltyPercentage: 0,
          isUnlocked: true
        },
        {
          level: 2,
          title: "Dica 2: Casos Limite com Números Negativos e Zero",
          category: "CASO_LIMITE",
          content: "Se a entrada for n <= 0, o loop não deve somar valores indevidos. Verifique se uma condição inicial if n < 2 pode simplificar o fluxo.",
          penaltyPercentage: 5,
          isUnlocked: false
        },
        {
          level: 3,
          title: "Dica 3: Pseudo-código de Solução O(1) ou Loop Fechado",
          category: "PSEUDOCODIGO",
          content: "Estrutura sugerida:\n1. Se n <= 0, retorne 0\n2. Inicialize soma = 0\n3. Para cada i de 2 até n com passo 2:\n     soma += i\n4. Retorne soma",
          penaltyPercentage: 10,
          isUnlocked: false
        }
      ],
      currentDraft: `def somar_pares(n):\n    # Escreva sua versão melhorada aqui\n    soma = 0\n    for i in range(1, n + 1):\n        if i % 2 == 0:\n            soma += i\n    return soma`,
      canRefactor: true
    };

    this.sessions[key] = newSession;
    return newSession;
  }

  /**
   * Unlocks a progressive hint
   */
  public static unlockHint(studentId: string, activityId: string, level: 1 | 2 | 3): ProgressiveHint | null {
    const session = this.getSession(studentId, activityId);
    const hint = session.hints.find(h => h.level === level);
    if (!hint) return null;
    hint.isUnlocked = true;
    return hint;
  }

  /**
   * Submits a refactored version with student's change rationale
   */
  public static submitRefactoring(params: {
    studentId: string;
    activityId: string;
    newCode: string;
    changeRationale: string;
    scoreObtained: number;
    feedbackHighlights: string[];
    testsPassed: number;
    totalTests: number;
  }): RefactoringSession {
    const session = this.getSession(params.studentId, params.activityId);

    const newVersionIndex = session.versions.length + 1;
    session.versions.push({
      versionIndex: newVersionIndex,
      timestamp: new Date().toISOString(),
      code: params.newCode,
      scoreObtained: params.scoreObtained,
      changeRationale: params.changeRationale,
      feedbackHighlights: params.feedbackHighlights,
      testsPassed: params.testsPassed,
      totalTests: params.totalTests
    });

    session.attemptsCount = session.versions.length;
    session.canRefactor = session.attemptsCount < session.maxAttemptsAllowed;
    session.currentDraft = params.newCode;

    return session;
  }

  /**
   * Calculates final grade according to activity policy
   */
  public static calculateFinalScore(session: RefactoringSession): number {
    if (session.versions.length === 0) return 0;

    const scores = session.versions.map(v => v.scoreObtained);

    switch (session.gradingPolicy) {
      case "HIGHEST_ATTEMPT":
        return Math.max(...scores);
      case "LATEST_ATTEMPT":
        return scores[scores.length - 1];
      case "WEIGHTED_AVERAGE":
        // E.g. later attempts have higher weight
        const totalWeights = session.versions.reduce((acc, _, idx) => acc + (idx + 1), 0);
        const weightedSum = session.versions.reduce((acc, v, idx) => acc + v.scoreObtained * (idx + 1), 0);
        return Math.round(weightedSum / totalWeights);
      default:
        return Math.max(...scores);
    }
  }
}
