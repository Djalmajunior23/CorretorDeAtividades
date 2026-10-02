/**
 * ============================================================================
 * GRADE RULE SIMULATOR SERVICE (SIMULADOR DE REGRAS DE NOTAS)
 * ============================================================================
 * Features:
 * 1. Multi-variable What-If simulation without modifying active student records:
 *    - Evaluation Weights (e.g. Listas, Projetos, Provas)
 *    - Recovery Rules (Substitutiva, Média Aritmética, Maior Nota, Teto 60%)
 *    - Grade Composition (Descarte da menor lista)
 *    - Rounding Algorithms (Padrão, Meio-Ponto Acima, Truncamento)
 *    - Unsubmitted Activities Treatment (Nota Zero, Desconsiderar)
 *    - Approval Thresholds (Nota Mínima, Frequência Mínima)
 * 2. Side-by-side comparative dashboard with affected student delta indicators.
 * 3. Authorized Application Workflow: Requires teacher reason, signs audit log,
 *    and supports instant Rollback.
 * ============================================================================
 */

export interface GradeRuleConfig {
  weightHomework: number; // 0 to 100
  weightProject: number; // 0 to 100
  weightExam: number; // 0 to 100
  recoveryPolicy: "SUBSTITUTIVA_TOTAL" | "MEDIA_ARITMETICA" | "MAIOR_NOTA" | "TETO_MAXIMO_60";
  compositionRule: "TODAS_NOTAS" | "DESCARTAR_MENOR_LISTA";
  roundingRule: "PADRAO_MATEMATICO" | "SEMPRE_CIMA_MEIO_PONTO" | "TRUNCAMENTO";
  unsubmittedHandling: "NOTA_ZERO" | "DESCONSIDERAR";
  passingScoreMin: number; // e.g. 60
  recoveryScoreMin: number; // e.g. 40
  minAttendancePercent: number; // e.g. 75
}

export interface StudentRawGradeRecord {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  attendancePercent: number;
  homeworkScores: (number | null)[]; // null if not submitted
  projectScore: number | null;
  examScore: number | null;
  recoveryScore: number | null;
}

export interface StudentSimulatedResult {
  studentId: string;
  studentName: string;
  attendancePercent: number;
  currentFinalScore: number;
  currentStatus: "APROVADO" | "RECUPERACAO" | "REPROVADO";
  simulatedFinalScore: number;
  simulatedStatus: "APROVADO" | "RECUPERACAO" | "REPROVADO";
  scoreDelta: number;
  statusChanged: boolean;
  explanation: string;
}

export interface SimulationSummary {
  ruleConfig: GradeRuleConfig;
  totalStudents: number;
  currentClassAverage: number;
  simulatedClassAverage: number;
  currentApprovedCount: number;
  simulatedApprovedCount: number;
  currentRecoveryCount: number;
  simulatedRecoveryCount: number;
  currentFailedCount: number;
  simulatedFailedCount: number;
  affectedStudentsCount: number;
  studentResults: StudentSimulatedResult[];
  simulatedAtIso: string;
}

export interface GradePolicyAuditSnapshot {
  id: string;
  classId: string;
  appliedByTeacher: string;
  appliedAtIso: string;
  previousConfig: GradeRuleConfig;
  newConfig: GradeRuleConfig;
  justificationReason: string;
  studentsAffected: number;
  isRolledBack: boolean;
  rolledBackAtIso?: string;
}

export class GradeRuleSimulatorService {
  private static activeConfig: GradeRuleConfig = {
    weightHomework: 30,
    weightProject: 40,
    weightExam: 30,
    recoveryPolicy: "MAIOR_NOTA",
    compositionRule: "TODAS_NOTAS",
    roundingRule: "PADRAO_MATEMATICO",
    unsubmittedHandling: "NOTA_ZERO",
    passingScoreMin: 60,
    recoveryScoreMin: 40,
    minAttendancePercent: 75
  };

  private static auditSnapshots: GradePolicyAuditSnapshot[] = [];

  private static rawStudents: StudentRawGradeRecord[] = [
    {
      studentId: "std-01",
      studentName: "Vinícius Souza",
      registrationNumber: "2024-DS-0012",
      attendancePercent: 92,
      homeworkScores: [90, 85, 100],
      projectScore: 95,
      examScore: 88,
      recoveryScore: null
    },
    {
      studentId: "std-02",
      studentName: "Mariana Alencar",
      registrationNumber: "2024-DS-0142",
      attendancePercent: 88,
      homeworkScores: [100, 95, 90],
      projectScore: 92,
      examScore: 90,
      recoveryScore: null
    },
    {
      studentId: "std-03",
      studentName: "Lucas Ferreira",
      registrationNumber: "2024-DS-0189",
      attendancePercent: 78,
      homeworkScores: [50, 40, 60],
      projectScore: 55,
      examScore: 45,
      recoveryScore: 70
    },
    {
      studentId: "std-04",
      studentName: "Ana Clara Lima",
      registrationNumber: "2024-DS-0205",
      attendancePercent: 85,
      homeworkScores: [75, 80, null],
      projectScore: 70,
      examScore: 65,
      recoveryScore: null
    },
    {
      studentId: "std-05",
      studentName: "Carlos Eduardo Santos",
      registrationNumber: "2024-DS-0231",
      attendancePercent: 68, // Risco Frequência
      homeworkScores: [80, 85, 90],
      projectScore: 85,
      examScore: 80,
      recoveryScore: null
    },
    {
      studentId: "std-06",
      studentName: "Beatriz Nogueira",
      registrationNumber: "2024-DS-0301",
      attendancePercent: 82,
      homeworkScores: [30, 45, 50],
      projectScore: 40,
      examScore: 35,
      recoveryScore: 55
    }
  ];

  public static getActiveConfig(): GradeRuleConfig {
    return { ...this.activeConfig };
  }

  public static getAuditSnapshots(): GradePolicyAuditSnapshot[] {
    return this.auditSnapshots;
  }

  private static computeStudentScore(
    student: StudentRawGradeRecord,
    config: GradeRuleConfig
  ): { finalScore: number; status: "APROVADO" | "RECUPERACAO" | "REPROVADO"; explanation: string } {
    // 1. Homework score
    let cleanHwList: number[] = [];
    if (config.unsubmittedHandling === "NOTA_ZERO") {
      cleanHwList = student.homeworkScores.map(s => (s === null ? 0 : s));
    } else {
      cleanHwList = student.homeworkScores.filter((s): s is number => s !== null);
    }

    if (cleanHwList.length === 0) cleanHwList = [0];

    if (config.compositionRule === "DESCARTAR_MENOR_LISTA" && cleanHwList.length > 1) {
      const minVal = Math.min(...cleanHwList);
      const minIndex = cleanHwList.indexOf(minVal);
      cleanHwList.splice(minIndex, 1);
    }

    const hwAvg = cleanHwList.reduce((a, b) => a + b, 0) / cleanHwList.length;

    // 2. Project and Exam
    const proj = student.projectScore !== null ? student.projectScore : (config.unsubmittedHandling === "NOTA_ZERO" ? 0 : hwAvg);
    let exam = student.examScore !== null ? student.examScore : (config.unsubmittedHandling === "NOTA_ZERO" ? 0 : hwAvg);

    // 3. Recovery policy
    if (student.recoveryScore !== null) {
      if (config.recoveryPolicy === "SUBSTITUTIVA_TOTAL") {
        exam = student.recoveryScore;
      } else if (config.recoveryPolicy === "MAIOR_NOTA") {
        exam = Math.max(exam, student.recoveryScore);
      } else if (config.recoveryPolicy === "MEDIA_ARITMETICA") {
        exam = (exam + student.recoveryScore) / 2;
      } else if (config.recoveryPolicy === "TETO_MAXIMO_60") {
        const candidate = Math.max(exam, student.recoveryScore);
        exam = Math.min(60, candidate);
      }
    }

    // 4. Weighted composition
    const totalWeights = config.weightHomework + config.weightProject + config.weightExam;
    let weightedRaw = ((hwAvg * config.weightHomework) + (proj * config.weightProject) + (exam * config.weightExam)) / (totalWeights || 100);

    // 5. Rounding rule
    let finalScore = weightedRaw;
    if (config.roundingRule === "PADRAO_MATEMATICO") {
      finalScore = Math.round(weightedRaw);
    } else if (config.roundingRule === "SEMPRE_CIMA_MEIO_PONTO") {
      const decimal = weightedRaw - Math.floor(weightedRaw);
      finalScore = decimal >= 0.5 ? Math.ceil(weightedRaw) : Math.floor(weightedRaw);
    } else if (config.roundingRule === "TRUNCAMENTO") {
      finalScore = Math.floor(weightedRaw);
    }

    // 6. Approval status check
    let status: "APROVADO" | "RECUPERACAO" | "REPROVADO" = "REPROVADO";
    if (student.attendancePercent < config.minAttendancePercent) {
      status = "REPROVADO";
    } else if (finalScore >= config.passingScoreMin) {
      status = "APROVADO";
    } else if (finalScore >= config.recoveryScoreMin) {
      status = "RECUPERACAO";
    } else {
      status = "REPROVADO";
    }

    const explanation = `Listas: ${hwAvg.toFixed(1)} | Projeto: ${proj} | Prova: ${exam.toFixed(1)} ➔ Nota Final: ${finalScore} (${status})`;

    return { finalScore, status, explanation };
  }

  public static simulate(proposedConfig: GradeRuleConfig): SimulationSummary {
    const studentResults: StudentSimulatedResult[] = this.rawStudents.map(student => {
      const current = this.computeStudentScore(student, this.activeConfig);
      const simulated = this.computeStudentScore(student, proposedConfig);
      const scoreDelta = simulated.finalScore - current.finalScore;
      const statusChanged = current.status !== simulated.status;

      return {
        studentId: student.studentId,
        studentName: student.studentName,
        attendancePercent: student.attendancePercent,
        currentFinalScore: current.finalScore,
        currentStatus: current.status,
        simulatedFinalScore: simulated.finalScore,
        simulatedStatus: simulated.status,
        scoreDelta,
        statusChanged,
        explanation: simulated.explanation
      };
    });

    const currentAvg = studentResults.reduce((sum, s) => sum + s.currentFinalScore, 0) / studentResults.length;
    const simulatedAvg = studentResults.reduce((sum, s) => sum + s.simulatedFinalScore, 0) / studentResults.length;

    return {
      ruleConfig: proposedConfig,
      totalStudents: studentResults.length,
      currentClassAverage: Number(currentAvg.toFixed(1)),
      simulatedClassAverage: Number(simulatedAvg.toFixed(1)),
      currentApprovedCount: studentResults.filter(s => s.currentStatus === "APROVADO").length,
      simulatedApprovedCount: studentResults.filter(s => s.simulatedStatus === "APROVADO").length,
      currentRecoveryCount: studentResults.filter(s => s.currentStatus === "RECUPERACAO").length,
      simulatedRecoveryCount: studentResults.filter(s => s.simulatedStatus === "RECUPERACAO").length,
      currentFailedCount: studentResults.filter(s => s.currentStatus === "REPROVADO").length,
      simulatedFailedCount: studentResults.filter(s => s.simulatedStatus === "REPROVADO").length,
      affectedStudentsCount: studentResults.filter(s => s.statusChanged || s.scoreDelta !== 0).length,
      studentResults,
      simulatedAtIso: new Date().toISOString()
    };
  }

  public static applyConfigOfficially(params: {
    classId: string;
    newConfig: GradeRuleConfig;
    teacherName: string;
    justificationReason: string;
  }): GradePolicyAuditSnapshot {
    const previousConfig = { ...this.activeConfig };
    this.activeConfig = { ...params.newConfig };

    const sim = this.simulate(params.newConfig);

    const snapshot: GradePolicyAuditSnapshot = {
      id: `snap-${Date.now()}`,
      classId: params.classId,
      appliedByTeacher: params.teacherName,
      appliedAtIso: new Date().toISOString(),
      previousConfig,
      newConfig: { ...params.newConfig },
      justificationReason: params.justificationReason,
      studentsAffected: sim.affectedStudentsCount,
      isRolledBack: false
    };

    this.auditSnapshots.unshift(snapshot);
    return snapshot;
  }

  public static rollbackSnapshot(snapshotId: string): boolean {
    const snap = this.auditSnapshots.find(s => s.id === snapshotId);
    if (!snap || snap.isRolledBack) return false;

    this.activeConfig = { ...snap.previousConfig };
    snap.isRolledBack = true;
    snap.rolledBackAtIso = new Date().toISOString();
    return true;
  }
}
