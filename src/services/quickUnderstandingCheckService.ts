/**
 * ============================================================================
 * QUICK UNDERSTANDING CHECK SERVICE (VERIFICAÇÃO RÁPIDA DO ENTENDIMENTO)
 * ============================================================================
 * Features:
 * 1. Fast exit tickets & warm-up checkpoints for technology and programming classes.
 * 2. 5 Question Formats:
 *    - MULTIPLA_ESCOLHA: Concept checks
 *    - RESPOSTA_CURTA: Keywords and syntax terms
 *    - PREVISAO_SAIDA: Predicting exact output from code snippets
 *    - IDENTIFICACAO_ERRO: Spotting bugs, off-by-one or type errors in snippets
 *    - AUTOAVALIACAO_CONFIANCA: Student self-efficacy rating (1 to 5 stars)
 * 3. Real-time participation aggregation, breakdown of common misconceptions.
 * 4. Distinct Anonymous vs Identified response handling.
 * 5. Strict Formative Policy: never converted into punitive grades automatically.
 * 6. 1-click binding of reinforcement actions for the next class.
 * ============================================================================
 */

export type QuickCheckQuestionType = 
  | "MULTIPLA_ESCOLHA" 
  | "RESPOSTA_CURTA" 
  | "PREVISAO_SAIDA" 
  | "IDENTIFICACAO_ERRO" 
  | "AUTOAVALIACAO_CONFIANCA";

export interface QuickCheckQuestion {
  id: string;
  prompt: string;
  type: QuickCheckQuestionType;
  codeSnippet?: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  expectedShortAnswer?: string;
  bugLineNumber?: number;
  explanationNote: string;
}

export interface StudentQuickResponse {
  id: string;
  studentId?: string; // empty if anonymous
  studentPseudonymOrName: string;
  isAnonymous: boolean;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  confidenceRating?: number; // 1 to 5
  isCorrect?: boolean;
  submittedAtIso: string;
}

export interface QuickCheckSession {
  id: string;
  classId: string;
  className: string;
  title: string;
  moment: "INICIO_AULA_WARMUP" | "FINAL_AULA_EXITTICKET";
  allowAnonymous: boolean;
  status: "ATIVA" | "ENCERRADA";
  questions: QuickCheckQuestion[];
  responses: StudentQuickResponse[];
  totalExpectedStudents: number;
  linkedReviewActionCreated: boolean;
  createdAtIso: string;
}

export class QuickUnderstandingCheckService {
  private static sessions: QuickCheckSession[] = [
    {
      id: "qck-01",
      classId: "turma-ds-a",
      className: "DS - Turma A",
      title: "Exit Ticket #04: Laços for e Fatiamento de Listas",
      moment: "FINAL_AULA_EXITTICKET",
      allowAnonymous: false,
      status: "ENCERRADA",
      totalExpectedStudents: 28,
      linkedReviewActionCreated: true,
      createdAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      questions: [
        {
          id: "q1",
          prompt: "Qual será o valor exato impresso pela execução do trecho abaixo?",
          type: "PREVISAO_SAIDA",
          codeSnippet: "nums = [10, 20, 30, 40, 50]\nprint(sum(nums[1:4]))",
          options: [
            { id: "opt-1", text: "90", isCorrect: true },
            { id: "opt-2", text: "100", isCorrect: false },
            { id: "opt-3", text: "60", isCorrect: false },
            { id: "opt-4", text: "150", isCorrect: false }
          ],
          explanationNote: "O slice nums[1:4] extrai os índices 1, 2 e 3 ([20, 30, 40]), cuja soma é 90. O índice 4 (50) é excluído."
        },
        {
          id: "q2",
          prompt: "Em qual linha está o erro que causa IndexError quando a lista está vazia?",
          type: "IDENTIFICACAO_ERRO",
          codeSnippet: "def obter_primeiro_par(lista):\n    # Linha 2\n    val = lista[0]\n    if val % 2 == 0:\n        return val\n    return None",
          bugLineNumber: 3,
          options: [
            { id: "l1", text: "Linha 1: def obter_primeiro_par(lista)", isCorrect: false },
            { id: "l3", text: "Linha 3: val = lista[0] (falta verificação if not lista)", isCorrect: true },
            { id: "l4", text: "Linha 4: if val % 2 == 0", isCorrect: false }
          ],
          explanationNote: "A linha 3 tenta acessar o índice 0 sem antes verificar se a lista possui elementos."
        },
        {
          id: "q3",
          prompt: "Como você avalia sua confiança na manipulação de listas e loops em Python?",
          type: "AUTOAVALIACAO_CONFIANCA",
          explanationNote: "Métrica formativa de percepção de autoeficácia docente/discente."
        }
      ],
      responses: [
        { id: "r1", studentId: "std-01", studentPseudonymOrName: "Vinícius Souza", isAnonymous: false, questionId: "q1", selectedOptionId: "opt-1", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r2", studentId: "std-01", studentPseudonymOrName: "Vinícius Souza", isAnonymous: false, questionId: "q2", selectedOptionId: "l3", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r3", studentId: "std-01", studentPseudonymOrName: "Vinícius Souza", isAnonymous: false, questionId: "q3", confidenceRating: 4, submittedAtIso: new Date().toISOString() },
        { id: "r4", studentId: "std-02", studentPseudonymOrName: "Mariana Alencar", isAnonymous: false, questionId: "q1", selectedOptionId: "opt-1", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r5", studentId: "std-02", studentPseudonymOrName: "Mariana Alencar", isAnonymous: false, questionId: "q2", selectedOptionId: "l3", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r6", studentId: "std-02", studentPseudonymOrName: "Mariana Alencar", isAnonymous: false, questionId: "q3", confidenceRating: 5, submittedAtIso: new Date().toISOString() },
        { id: "r7", studentId: "std-03", studentPseudonymOrName: "Lucas Ferreira", isAnonymous: false, questionId: "q1", selectedOptionId: "opt-2", isCorrect: false, submittedAtIso: new Date().toISOString() },
        { id: "r8", studentId: "std-03", studentPseudonymOrName: "Lucas Ferreira", isAnonymous: false, questionId: "q2", selectedOptionId: "l3", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r9", studentId: "std-03", studentPseudonymOrName: "Lucas Ferreira", isAnonymous: false, questionId: "q3", confidenceRating: 3, submittedAtIso: new Date().toISOString() }
      ]
    },
    {
      id: "qck-02",
      classId: "turma-eng-b",
      className: "Eng Soft - Turma B",
      title: "Warm-up #05: Consultas Relacionais com JOIN",
      moment: "INICIO_AULA_WARMUP",
      allowAnonymous: true,
      status: "ATIVA",
      totalExpectedStudents: 30,
      linkedReviewActionCreated: false,
      createdAtIso: new Date().toISOString(),
      questions: [
        {
          id: "q-sql-1",
          prompt: "Qual comando SQL preserva registros da tabela da esquerda mesmo sem correspondência na tabela estrangeira?",
          type: "MULTIPLA_ESCOLHA",
          options: [
            { id: "sql-1", text: "INNER JOIN", isCorrect: false },
            { id: "sql-2", text: "LEFT JOIN", isCorrect: true },
            { id: "sql-3", text: "CROSS JOIN", isCorrect: false },
            { id: "sql-4", text: "NATURAL JOIN", isCorrect: false }
          ],
          explanationNote: "LEFT JOIN garante a preservação de todas as tuplas da relação esquerda, preenchendo com NULL onde não houver match."
        },
        {
          id: "q-sql-2",
          prompt: "Autoavaliação de prontidão para o laboratório de banco de dados hoje:",
          type: "AUTOAVALIACAO_CONFIANCA",
          explanationNote: "Termômetro de prontidão antes do início das atividades de bancada."
        }
      ],
      responses: [
        { id: "r-sql-1", studentPseudonymOrName: "Estudante Anônimo #1", isAnonymous: true, questionId: "q-sql-1", selectedOptionId: "sql-2", isCorrect: true, submittedAtIso: new Date().toISOString() },
        { id: "r-sql-2", studentPseudonymOrName: "Estudante Anônimo #1", isAnonymous: true, questionId: "q-sql-2", confidenceRating: 4, submittedAtIso: new Date().toISOString() },
        { id: "r-sql-3", studentPseudonymOrName: "Estudante Anônimo #2", isAnonymous: true, questionId: "q-sql-1", selectedOptionId: "sql-1", isCorrect: false, submittedAtIso: new Date().toISOString() },
        { id: "r-sql-4", studentPseudonymOrName: "Estudante Anônimo #2", isAnonymous: true, questionId: "q-sql-2", confidenceRating: 2, submittedAtIso: new Date().toISOString() }
      ]
    }
  ];

  public static getSessions(classId?: string): QuickCheckSession[] {
    if (!classId || classId === "all") return this.sessions;
    return this.sessions.filter(s => s.classId === classId);
  }

  public static getSessionById(id: string): QuickCheckSession | undefined {
    return this.sessions.find(s => s.id === id);
  }

  public static createSession(session: Omit<QuickCheckSession, "id" | "responses" | "linkedReviewActionCreated" | "createdAtIso">): QuickCheckSession {
    const newSession: QuickCheckSession = {
      ...session,
      id: `qck-${Date.now()}`,
      responses: [],
      linkedReviewActionCreated: false,
      createdAtIso: new Date().toISOString()
    };
    this.sessions.unshift(newSession);
    return newSession;
  }

  public static submitResponse(sessionId: string, response: Omit<StudentQuickResponse, "id" | "submittedAtIso">): boolean {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;

    // Check correctness if multiple choice or output prediction
    const q = session.questions.find(item => item.id === response.questionId);
    let isCorrect = response.isCorrect;
    if (q && q.options && response.selectedOptionId) {
      const opt = q.options.find(o => o.id === response.selectedOptionId);
      isCorrect = opt?.isCorrect || false;
    }

    session.responses.push({
      ...response,
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isCorrect,
      submittedAtIso: new Date().toISOString()
    });
    return true;
  }

  public static getSessionStats(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return null;

    const totalSubmissions = new Set(session.responses.map(r => r.studentId || r.studentPseudonymOrName)).size;
    const participationRate = session.totalExpectedStudents > 0 ? (totalSubmissions / session.totalExpectedStudents) * 100 : 0;

    const questionStats = session.questions.map(q => {
      const qResponses = session.responses.filter(r => r.questionId === q.id);
      const totalAnswers = qResponses.length;
      const correctAnswers = qResponses.filter(r => r.isCorrect).length;
      const accuracyRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      const confidenceValues = qResponses.map(r => r.confidenceRating).filter((v): v is number => typeof v === "number");
      const avgConfidence = confidenceValues.length > 0 
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length 
        : null;

      return {
        questionId: q.id,
        prompt: q.prompt,
        type: q.type,
        totalAnswers,
        accuracyRate,
        avgConfidence,
        responses: qResponses
      };
    });

    return {
      sessionId: session.id,
      title: session.title,
      totalExpectedStudents: session.totalExpectedStudents,
      totalParticipants: totalSubmissions,
      participationRate,
      questionStats
    };
  }

  public static linkReviewActionToNextClass(sessionId: string): boolean {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return false;
    session.linkedReviewActionCreated = true;
    return true;
  }
}
