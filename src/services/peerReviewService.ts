/**
 * ============================================================================
 * PEER REVIEW (AVALIAÇÃO POR PARES) & FORMATIVE COLLABORATION SERVICE
 * ============================================================================
 * Implements:
 * 1. Double-blind pseudonimization (protects student identities).
 * 2. Rubric-based peer evaluation criteria.
 * 3. Teacher moderation queue (prevents offensive/inappropriate comments).
 * 4. Separation of peer review scores from official grades until teacher approval.
 * ============================================================================
 */

export interface PeerReviewAssignment {
  assignmentId: string;
  activityId: string;
  activityTitle: string;
  authorPseudonym: string; // e.g. "Autor Código #A-42" (Student identity hidden)
  reviewerPseudonym: string; // e.g. "Avaliador Par #P-17"
  reviewerRealId: string;
  codeSnippet: string;
  deadlineIso: string;
  status: "PENDENTE" | "AVALIADO" | "MODERADO_PELO_PROFESSOR" | "REJEITADO";
  
  // Peer Feedback
  rubricScores?: {
    criterionName: string;
    scoreGiven: number; // 0 to 10
    comment: string;
  }[];
  overallPeerScore?: number;
  qualitativeFeedback?: string;
  evaluatedAt?: string;

  // Teacher Moderation
  isModerated: boolean;
  teacherApproved: boolean;
  moderatedAt?: string;
  moderatorNotes?: string;
}

export class PeerReviewService {
  private static assignments: PeerReviewAssignment[] = [
    {
      assignmentId: "pr-001",
      activityId: "act-f12-01",
      activityTitle: "Estruturas de Repetição & Filtro Par",
      authorPseudonym: "Colega Desenvolvedor #Alpha",
      reviewerPseudonym: "Avaliador Par #Sigma",
      reviewerRealId: "std-vinicius",
      codeSnippet: "def somar_pares(n):\n    # Solução limpa com list comprehension\n    return sum(i for i in range(2, n + 1, 2))",
      deadlineIso: new Date(Date.now() + 3600000 * 48).toISOString(),
      status: "AVALIADO",
      rubricScores: [
        { criterionName: "Legibilidade e Organização", scoreGiven: 10, comment: "Código muito conciso e fácil de entender." },
        { criterionName: "Eficiência do Algoritmo", scoreGiven: 9, comment: "Uso do passo 2 no range evitou verificações desnecessárias com % 2." },
        { criterionName: "Tratamento de Casos Limite", scoreGiven: 8, comment: "Funciona para n=0 e números grandes." }
      ],
      overallPeerScore: 90,
      qualitativeFeedback: "Excelente trabalho! Achei muito criativo usar o range(2, n+1, 2) para percorrer apenas os números pares.",
      evaluatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      isModerated: true,
      teacherApproved: true,
      moderatedAt: new Date(Date.now() - 3600000).toISOString(),
      moderatorNotes: "Feedback construtivo e respeitoso aprovado pelo professor."
    },
    {
      assignmentId: "pr-002",
      activityId: "act-f12-01",
      activityTitle: "Estruturas de Repetição & Filtro Par",
      authorPseudonym: "Colega Desenvolvedor #Beta",
      reviewerPseudonym: "Avaliador Par #Gamma",
      reviewerRealId: "std-mariana",
      codeSnippet: "def somar_pares(n):\n    s = 0\n    for i in range(1, n+1):\n        if i % 2 == 0: s += i\n    return s",
      deadlineIso: new Date(Date.now() + 3600000 * 48).toISOString(),
      status: "PENDENTE",
      isModerated: false,
      teacherApproved: false
    }
  ];

  /**
   * Returns all peer review assignments for a student
   */
  public static getAssignmentsForReviewer(reviewerId: string): PeerReviewAssignment[] {
    return this.assignments.filter(a => a.reviewerRealId === reviewerId || a.reviewerRealId === "std-vinicius");
  }

  /**
   * Returns all peer reviews awaiting teacher moderation
   */
  public static getModerationQueue(): PeerReviewAssignment[] {
    return this.assignments.filter(a => a.status === "AVALIADO" && !a.teacherApproved);
  }

  /**
   * Submits a peer evaluation
   */
  public static submitEvaluation(params: {
    assignmentId: string;
    rubricScores: { criterionName: string; scoreGiven: number; comment: string }[];
    overallPeerScore: number;
    qualitativeFeedback: string;
  }): PeerReviewAssignment | null {
    const assignment = this.assignments.find(a => a.assignmentId === params.assignmentId);
    if (!assignment) return null;

    assignment.rubricScores = params.rubricScores;
    assignment.overallPeerScore = params.overallPeerScore;
    assignment.qualitativeFeedback = params.qualitativeFeedback;
    assignment.status = "AVALIADO";
    assignment.evaluatedAt = new Date().toISOString();
    assignment.isModerated = false;
    assignment.teacherApproved = false;

    return assignment;
  }

  /**
   * Moderates a peer review (Teacher approval/rejection)
   */
  public static moderateReview(assignmentId: string, approved: boolean, notes: string): PeerReviewAssignment | null {
    const assignment = this.assignments.find(a => a.assignmentId === assignmentId);
    if (!assignment) return null;

    assignment.isModerated = true;
    assignment.teacherApproved = approved;
    assignment.moderatedAt = new Date().toISOString();
    assignment.moderatorNotes = notes;
    assignment.status = approved ? "MODERADO_PELO_PROFESSOR" : "REJEITADO";

    return assignment;
  }
}
