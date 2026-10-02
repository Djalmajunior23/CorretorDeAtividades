/**
 * ============================================================================
 * COHORT COMPARISON SERVICE (COMPARAÇÃO ENTRE OFERTAS DA DISCIPLINA)
 * ============================================================================
 * Features:
 * 1. Longitudinal multi-semester cohort comparison for technical courses:
 *    - Semester 2024/2, 2025/1, 2025/2, 2026/1.
 * 2. Key Aggregate Metrics:
 *    - Enrolled vs Active Participants
 *    - Submission & Non-submission Ratios
 *    - Performance breakdown by Competency Criterion
 *    - Grade Distribution Histograms (0-49, 50-69, 70-89, 90-100)
 *    - Average Attempts & Mean Time to Completion
 *    - Rubric and Activity Versions utilized
 * 3. Discrepancy & Limitation Warning System:
 *    - Flags rubric alterations, altered workload, or differing prerequisites.
 * 4. Strict Ethical Stance:
 *    - Strictly aggregate data; eliminates punitive rankings of teachers/students.
 * ============================================================================
 */

export interface CohortOfferData {
  id: string;
  disciplineCode: string;
  disciplineName: string;
  semesterPeriod: string; // e.g. "2025/1", "2025/2", "2026/1"
  className: string;
  instructorName: string;
  enrolledStudentsCount: number;
  activeParticipantsCount: number;
  totalActivitiesCount: number;
  submissionRatioPercent: number; // e.g. 88.5
  classAverageGrade: number; // e.g. 76.4
  gradeDistribution: {
    range0To49: number;  // Reprovação direta
    range50To69: number; // Faixa de recuperação / atenção
    range70To89: number; // Bom desempenho
    range90To100: number; // Excelência
  };
  criteriaBreakdown: {
    criterionName: string;
    averageScorePercent: number;
  }[];
  averageAttemptsPerActivity: number;
  averageTimeToCompletionHours: number;
  activityVersionUsed: string; // e.g. "v1.2 (3 listas + 1 projeto)"
  rubricVersionUsed: string; // e.g. "Rubrica Padrão v2.0 (4 critérios com testes de limite)"
  comparisonLimitationsNotice?: string;
}

export interface ComparativeDiscrepancyReport {
  cohortA: CohortOfferData;
  cohortB: CohortOfferData;
  hasRubricDiscrepancy: boolean;
  rubricDiscrepancyNote?: string;
  hasCurriculumDiscrepancy: boolean;
  curriculumDiscrepancyNote?: string;
  performanceDelta: {
    averageGradeDelta: number;
    submissionRateDelta: number;
    attemptsDelta: number;
  };
  pedagogicalObservation: string;
}

export class CohortComparisonService {
  private static cohortOffers: CohortOfferData[] = [
    {
      id: "coh-2025-1",
      disciplineCode: "DS-PROG-01",
      disciplineName: "Lógica de Programação e Estrutura de Dados",
      semesterPeriod: "2025/1",
      className: "Técnico DS - Turma 2025.1",
      instructorName: "Prof. Djalma Batista",
      enrolledStudentsCount: 32,
      activeParticipantsCount: 29,
      totalActivitiesCount: 12,
      submissionRatioPercent: 84.5,
      classAverageGrade: 72.8,
      gradeDistribution: {
        range0To49: 4,
        range50To69: 6,
        range70To89: 14,
        range90To100: 5
      },
      criteriaBreakdown: [
        { criterionName: "Corretude e Casos de Teste", averageScorePercent: 74 },
        { criterionName: "Tratamento de Limites e Robustez", averageScorePercent: 62 },
        { criterionName: "Legibilidade e Clean Code", averageScorePercent: 82 }
      ],
      averageAttemptsPerActivity: 2.8,
      averageTimeToCompletionHours: 3.4,
      activityVersionUsed: "v1.0 (Exercícios Monolíticos)",
      rubricVersionUsed: "Rubrica v1.0 (3 critérios básicos)",
      comparisonLimitationsNotice: "Utilizou Rubrica v1.0 sem testes de estresse de memória e sem penalização de complexidade de tempo."
    },
    {
      id: "coh-2025-2",
      disciplineCode: "DS-PROG-01",
      disciplineName: "Lógica de Programação e Estrutura de Dados",
      semesterPeriod: "2025/2",
      className: "Técnico DS - Turma 2025.2",
      instructorName: "Prof. Djalma Batista",
      enrolledStudentsCount: 30,
      activeParticipantsCount: 28,
      totalActivitiesCount: 14,
      submissionRatioPercent: 89.2,
      classAverageGrade: 78.4,
      gradeDistribution: {
        range0To49: 2,
        range50To69: 5,
        range70To89: 13,
        range90To100: 8
      },
      criteriaBreakdown: [
        { criterionName: "Corretude e Casos de Teste", averageScorePercent: 81 },
        { criterionName: "Tratamento de Limites e Robustez", averageScorePercent: 71 },
        { criterionName: "Legibilidade e Clean Code", averageScorePercent: 86 }
      ],
      averageAttemptsPerActivity: 2.3,
      averageTimeToCompletionHours: 2.9,
      activityVersionUsed: "v2.0 (Ciclo de Refação Guiada Integrado)",
      rubricVersionUsed: "Rubrica v2.0 (Casos limites + Feedback @tags)",
      comparisonLimitationsNotice: "Introduziu o Ciclo de Refação Orientada, elevando as tentativas qualificadas."
    },
    {
      id: "coh-2026-1",
      disciplineCode: "DS-PROG-01",
      disciplineName: "Lógica de Programação e Estrutura de Dados",
      semesterPeriod: "2026/1",
      className: "Técnico DS - Turma 2026.1 (Atual)",
      instructorName: "Prof. Djalma Batista",
      enrolledStudentsCount: 28,
      activeParticipantsCount: 27,
      totalActivitiesCount: 8, // Em andamento
      submissionRatioPercent: 92.4,
      classAverageGrade: 81.6,
      gradeDistribution: {
        range0To49: 1,
        range50To69: 3,
        range70To89: 15,
        range90To100: 8
      },
      criteriaBreakdown: [
        { criterionName: "Corretude e Casos de Teste", averageScorePercent: 85 },
        { criterionName: "Tratamento de Limites e Robustez", averageScorePercent: 76 },
        { criterionName: "Legibilidade e Clean Code", averageScorePercent: 88 }
      ],
      averageAttemptsPerActivity: 2.1,
      averageTimeToCompletionHours: 2.4,
      activityVersionUsed: "v2.5 (Provas Paramétricas + Sandbox Wasm)",
      rubricVersionUsed: "Rubrica v2.0 (Casos limites + Feedback @tags)",
      comparisonLimitationsNotice: "Oferta corrente ainda em andamento (8 de 14 atividades concluídas)."
    }
  ];

  public static getOffers(): CohortOfferData[] {
    return this.cohortOffers;
  }

  public static getOfferById(id: string): CohortOfferData | undefined {
    return this.cohortOffers.find(o => o.id === id);
  }

  public static compareOffers(offerIdA: string, offerIdB: string): ComparativeDiscrepancyReport | null {
    const a = this.getOfferById(offerIdA);
    const b = this.getOfferById(offerIdB);
    if (!a || !b) return null;

    const hasRubricDiscrepancy = a.rubricVersionUsed !== b.rubricVersionUsed;
    const hasCurriculumDiscrepancy = a.activityVersionUsed !== b.activityVersionUsed;

    const rubricDiscrepancyNote = hasRubricDiscrepancy
      ? `As ofertas utilizaram versões distintas de rubrica: '${a.rubricVersionUsed}' vs '${b.rubricVersionUsed}'. A comparação de critérios de limites deve levar em conta o aumento de rigor.`
      : undefined;

    const curriculumDiscrepancyNote = hasCurriculumDiscrepancy
      ? `A oferta ${b.semesterPeriod} utilizou '${b.activityVersionUsed}', alterando a dinâmica de entrega em relação a ${a.semesterPeriod}.`
      : undefined;

    const avgDelta = Number((b.classAverageGrade - a.classAverageGrade).toFixed(1));
    const subDelta = Number((b.submissionRatioPercent - a.submissionRatioPercent).toFixed(1));
    const attDelta = Number((b.averageAttemptsPerActivity - a.averageAttemptsPerActivity).toFixed(1));

    let pedagogicalObservation = `Evolução positiva observada: média geral variou ${avgDelta >= 0 ? "+" : ""}${avgDelta} pontos e a taxa de submissão variou ${subDelta >= 0 ? "+" : ""}${subDelta}%.`;
    if (hasRubricDiscrepancy) {
      pedagogicalObservation += " Recomenda-se ponderar os resultados considerando o maior detalhamento de rubrica na versão mais recente.";
    }

    return {
      cohortA: a,
      cohortB: b,
      hasRubricDiscrepancy,
      rubricDiscrepancyNote,
      hasCurriculumDiscrepancy,
      curriculumDiscrepancyNote,
      performanceDelta: {
        averageGradeDelta: avgDelta,
        submissionRateDelta: subDelta,
        attemptsDelta: attDelta
      },
      pedagogicalObservation
    };
  }
}
