/**
 * ============================================================================
 * BLIND / ANONYMOUS GRADING SERVICE (CORREÇÃO SEM IDENTIFICAÇÃO)
 * ============================================================================
 * Features:
 * 1. Anonymized grading studio hiding student name, photo, email, and ID.
 * 2. Deterministic pseudonyms (e.g. "Candidato #A-42", "Candidato #B-88").
 * 3. Controlled identity reveal with teacher authorization and audit trail.
 * 4. Transparent caveat warning regarding author names embedded inside code comments.
 * 5. Secure submission linkage preserving academic integrity without modifying code.
 * 6. Rubric scoring & integration with @tag feedback library.
 * ============================================================================
 */

export interface BlindSubmissionItem {
  submissionId: string;
  pseudonym: string; // e.g. "Candidato #A-42"
  activityId: string;
  activityTitle: string;
  className: string;
  language: string;
  submittedAtIso: string;
  codeContent: string;
  testsPassed: number;
  totalTests: number;
  rubricCriteria: {
    id: string;
    name: string;
    maxPoints: number;
    assignedPoints?: number;
    feedbackComment?: string;
  }[];
  finalScore?: number;
  gradingStatus: "PENDENTE" | "EM_AVALIACAO" | "CORRIGIDO";
  evaluatedAtIso?: string;
  // Real Identity (Hidden during blind review until reveal authorization)
  realIdentity: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    registrationNumber: string;
  };
  isIdentityRevealed: boolean;
  revealedAtIso?: string;
  revealedByTeacher?: string;
}

export class BlindGradingService {
  private static submissions: BlindSubmissionItem[] = [
    {
      submissionId: "sub-blind-101",
      pseudonym: "Candidato #A-42",
      activityId: "act-f12-01",
      activityTitle: "Lista 3: Somatórios e Filtros de Paridade",
      className: "DS - Turma A",
      language: "python",
      submittedAtIso: new Date(Date.now() - 3600000 * 8).toISOString(),
      codeContent: `def somar_pares_ate_limite(limite):\n    """Calcula a soma de todos os números pares entre 1 e limite (inclusivo)."""\n    if not isinstance(limite, int) or limite <= 0:\n        return 0\n    \n    soma = 0\n    # Itera de 1 ate limite (inclusivo)\n    for num in range(1, limite + 1):\n        if num % 2 == 0:\n            soma += num\n    return soma\n`,
      testsPassed: 4,
      totalTests: 4,
      rubricCriteria: [
        { id: "crit-1", name: "Corretude Algorítmica e Casos de Teste", maxPoints: 50, assignedPoints: 50, feedbackComment: "Todos os 4 casos de teste passaram com sucesso." },
        { id: "crit-2", name: "Tratamento de Entradas Inválidas e Limites", maxPoints: 30, assignedPoints: 30, feedbackComment: "Validação defensiva de inteiros negativos implementada corretamente." },
        { id: "crit-3", name: "Legibilidade e Boas Práticas (PEP 8)", maxPoints: 20, assignedPoints: 20, feedbackComment: "Docstrings claras e nomenclatura expressiva." }
      ],
      finalScore: 100,
      gradingStatus: "CORRIGIDO",
      evaluatedAtIso: new Date(Date.now() - 3600000 * 1).toISOString(),
      realIdentity: {
        studentId: "std-mariana-02",
        studentName: "Mariana Alencar",
        studentEmail: "mariana.alencar@estudante.edu.br",
        registrationNumber: "2024-DS-0142"
      },
      isIdentityRevealed: false
    },
    {
      submissionId: "sub-blind-102",
      pseudonym: "Candidato #A-43",
      activityId: "act-f12-01",
      activityTitle: "Lista 3: Somatórios e Filtros de Paridade",
      className: "DS - Turma A",
      language: "python",
      submittedAtIso: new Date(Date.now() - 3600000 * 6).toISOString(),
      codeContent: `def somar_pares_ate_limite(limite):\n    s = 0\n    for i in range(1, limite):\n        if i % 2 == 0:\n            s += i\n    return s\n`,
      testsPassed: 2,
      totalTests: 4,
      rubricCriteria: [
        { id: "crit-1", name: "Corretude Algorítmica e Casos de Teste", maxPoints: 50 },
        { id: "crit-2", name: "Tratamento de Entradas Inválidas e Limites", maxPoints: 30 },
        { id: "crit-3", name: "Legibilidade e Boas Práticas (PEP 8)", maxPoints: 20 }
      ],
      gradingStatus: "PENDENTE",
      realIdentity: {
        studentId: "std-lucas-03",
        studentName: "Lucas Ferreira",
        studentEmail: "lucas.ferreira@estudante.edu.br",
        registrationNumber: "2024-DS-0189"
      },
      isIdentityRevealed: false
    },
    {
      submissionId: "sub-blind-103",
      pseudonym: "Candidato #A-44",
      activityId: "act-f12-01",
      activityTitle: "Lista 3: Somatórios e Filtros de Paridade",
      className: "DS - Turma A",
      language: "python",
      submittedAtIso: new Date(Date.now() - 3600000 * 4).toISOString(),
      codeContent: `def somar_pares_ate_limite(limite):\n    if limite is None:\n        return 0\n    return sum(x for x in range(2, limite + 1, 2))\n`,
      testsPassed: 4,
      totalTests: 4,
      rubricCriteria: [
        { id: "crit-1", name: "Corretude Algorítmica e Casos de Teste", maxPoints: 50 },
        { id: "crit-2", name: "Tratamento de Entradas Inválidas e Limites", maxPoints: 30 },
        { id: "crit-3", name: "Legibilidade e Boas Práticas (PEP 8)", maxPoints: 20 }
      ],
      gradingStatus: "PENDENTE",
      realIdentity: {
        studentId: "std-vinicius-01",
        studentName: "Vinícius Souza",
        studentEmail: "vinicius.souza@estudante.edu.br",
        registrationNumber: "2024-DS-0012"
      },
      isIdentityRevealed: false
    }
  ];

  public static getSubmissions(activityId?: string): BlindSubmissionItem[] {
    if (!activityId || activityId === "all") return this.submissions;
    return this.submissions.filter(s => s.activityId === activityId);
  }

  public static getSubmissionById(submissionId: string): BlindSubmissionItem | undefined {
    return this.submissions.find(s => s.submissionId === submissionId);
  }

  public static gradeSubmission(
    submissionId: string,
    criteriaScores: { criterionId: string; points: number; feedbackComment?: string }[]
  ): boolean {
    const sub = this.submissions.find(s => s.submissionId === submissionId);
    if (!sub) return false;

    let totalScore = 0;
    sub.rubricCriteria.forEach(crit => {
      const match = criteriaScores.find(c => c.criterionId === crit.id);
      if (match) {
        crit.assignedPoints = Math.min(crit.maxPoints, Math.max(0, match.points));
        if (match.feedbackComment) crit.feedbackComment = match.feedbackComment;
        totalScore += crit.assignedPoints;
      }
    });

    sub.finalScore = totalScore;
    sub.gradingStatus = "CORRIGIDO";
    sub.evaluatedAtIso = new Date().toISOString();
    return true;
  }

  public static revealIdentity(submissionId: string, teacherName: string): boolean {
    const sub = this.submissions.find(s => s.submissionId === submissionId);
    if (!sub) return false;
    sub.isIdentityRevealed = true;
    sub.revealedAtIso = new Date().toISOString();
    sub.revealedByTeacher = teacherName;
    return true;
  }

  public static revealAllForActivity(activityId: string, teacherName: string): number {
    let count = 0;
    this.submissions.forEach(sub => {
      if (sub.activityId === activityId || activityId === "all") {
        sub.isIdentityRevealed = true;
        sub.revealedAtIso = new Date().toISOString();
        sub.revealedByTeacher = teacherName;
        count++;
      }
    });
    return count;
  }
}
