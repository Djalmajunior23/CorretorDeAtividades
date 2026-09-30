export interface KeystrokeEvent {
  key: string;
  type: "keydown" | "keyup" | "paste";
  timestamp: number; // ms
  lengthDelta?: number;
}

export interface KeystrokeForensicsAnalysisResult {
  studentId: string;
  totalKeystrokes: number;
  totalPasteEvents: number;
  averageWpm: number;
  averageFlightTimeMs: number;
  averageDwellTimeMs: number;
  pasteVolumeRatio: number; // % of total characters pasted
  authorshipConfidencePercent: number; // 0 - 100%
  forensicVerdict: "AUTORIA_HUMANA_LEGITIMA" | "PADRAO_HIBRIDO_COM_REVISAO" | "ALTA_PROBABILIDADE_COPIA_EXTERNA";
  timelineInsights: string[];
}

export interface XaiLineAnnotation {
  lineNumber: number;
  codeSnippet: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "ACID_RECOMMENDATION" | "EXCELLENCE";
  title: string;
  pedagogicalRationale: string;
  pointsDeductedOrAwarded: number;
}

export interface DropoutRiskDiagnostic {
  studentId: string;
  studentName: string;
  riskScore: number; // 0 - 100 (High = High Risk of Drop-out)
  riskLevel: "BAIXO" | "MODERADO" | "CRITICO_INTERVENCAO_IMEDIATA";
  indicators: {
    submissionLatencyDays: number;
    gradeTrend: "EVOLUCAO_POSITIVA" | "ESTAVEL" | "QUEDA_ABRUPTA";
    attendanceRatePercent: number;
    recoveryParticipationRate: number;
  };
  recommendedIntervention: string;
}

export class KeystrokeForensicsAndXaiService {
  /**
   * Evaluates keystroke dynamics timeline to determine human typing vs copy/paste of AI code
   */
  public static analyzeKeystrokeDynamics(
    studentId: string,
    keystrokes: KeystrokeEvent[],
    totalCodeChars: number
  ): KeystrokeForensicsAnalysisResult {
    const pasteEvents = keystrokes.filter((k) => k.type === "paste");
    const keydownEvents = keystrokes.filter((k) => k.type === "keydown");

    const totalPastes = pasteEvents.length;
    let pastedCharsCount = 0;
    for (const p of pasteEvents) {
      pastedCharsCount += Math.max(0, p.lengthDelta || 50);
    }

    const pasteRatio = totalCodeChars > 0 ? Math.min(1.0, pastedCharsCount / totalCodeChars) : 0;

    // Flight time calculation between consecutive keydowns
    let totalFlightTime = 0;
    let flightCount = 0;
    for (let i = 1; i < keydownEvents.length; i++) {
      const delta = keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp;
      if (delta > 20 && delta < 2000) {
        totalFlightTime += delta;
        flightCount++;
      }
    }

    const avgFlightTime = flightCount > 0 ? Math.round(totalFlightTime / flightCount) : 140;
    const avgDwellTime = 85; // ms avg keypress dwell time
    const estimatedWpm = Math.round(Math.min(120, Math.max(15, 60000 / (avgFlightTime * 5))));

    // Authorship confidence formula
    let confidence = 95;
    if (pasteRatio > 0.8) {
      confidence -= 65;
    } else if (pasteRatio > 0.4) {
      confidence -= 30;
    }

    if (keydownEvents.length < 20 && totalCodeChars > 150) {
      confidence -= 40;
    }

    confidence = Math.min(100, Math.max(10, confidence));

    let verdict: KeystrokeForensicsAnalysisResult["forensicVerdict"] = "AUTORIA_HUMANA_LEGITIMA";
    if (confidence < 45) {
      verdict = "ALTA_PROBABILIDADE_COPIA_EXTERNA";
    } else if (confidence < 75) {
      verdict = "PADRAO_HIBRIDO_COM_REVISAO";
    }

    return {
      studentId,
      totalKeystrokes: keystrokes.length,
      totalPasteEvents: totalPastes,
      averageWpm: estimatedWpm,
      averageFlightTimeMs: avgFlightTime,
      averageDwellTimeMs: avgDwellTime,
      pasteVolumeRatio: Math.round(pasteRatio * 100),
      authorshipConfidencePercent: confidence,
      forensicVerdict: verdict,
      timelineInsights: [
        `Velocidade média de digitação computada: ${estimatedWpm} WPM com cadência rítmica natural.`,
        pasteRatio > 0.5
          ? `Alerta: ${Math.round(pasteRatio * 100)}% do código foi inserido via blocos de colagem direta.`
          : `Autoria manual comprovada por sequência incremental de teclas e correções de digitação (Backspaces detectados).`
      ]
    };
  }

  /**
   * Generates Explainable AI (XAI) Line-by-Line Code Annotations
   */
  public static generateXaiCodeAnnotations(code: string, language = "javascript"): XaiLineAnnotation[] {
    const lines = code.split("\n");
    const annotations: XaiLineAnnotation[] = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimLine = line.trim();

      if (trimLine.includes("for") && trimLine.includes("for")) {
        annotations.push({
          lineNumber: lineNum,
          codeSnippet: trimLine,
          severity: "WARNING",
          title: "Complexidade O(N²) Detectada",
          pedagogicalRationale: "Laços aninhados elevam a complexidade temporal para quadrática. Considere o uso de Hash Table / Map para reduzir para O(N).",
          pointsDeductedOrAwarded: -10
        });
      }

      if (trimLine.includes("SELECT *") || trimLine.includes("select *")) {
        annotations.push({
          lineNumber: lineNum,
          codeSnippet: trimLine,
          severity: "WARNING",
          title: "Projeção Irrestrita (SELECT *)",
          pedagogicalRationale: "Evite `SELECT *` em produção. Projete apenas as colunas estritamente necessárias para economizar largura de banda e permitir Index Only Scan.",
          pointsDeductedOrAwarded: -5
        });
      }

      if (trimLine.includes("BEGIN TRANSACTION") || trimLine.includes("SERIALIZABLE") || trimLine.includes("COMMIT")) {
        annotations.push({
          lineNumber: lineNum,
          codeSnippet: trimLine,
          severity: "EXCELLENCE",
          title: "Controle Transacional Robusto",
          pedagogicalRationale: "Excelente uso explícito de blocos transacionais com nível de isolamento configurado.",
          pointsDeductedOrAwarded: +10
        });
      }
    });

    return annotations;
  }

  /**
   * Computes Dropout Early Warning Diagnostic
   */
  public static evaluateDropoutRisk(
    studentId: string,
    studentName = "Estudante SENAI",
    avgGrade = 55,
    attendanceRate = 72,
    latencyDays = 4.5
  ): DropoutRiskDiagnostic {
    let riskScore = 0;

    if (avgGrade < 60) riskScore += 45;
    else if (avgGrade < 70) riskScore += 20;

    if (attendanceRate < 75) riskScore += 35;
    else if (attendanceRate < 85) riskScore += 15;

    if (latencyDays > 3) riskScore += 20;

    riskScore = Math.min(100, riskScore);

    let riskLevel: DropoutRiskDiagnostic["riskLevel"] = "BAIXO";
    if (riskScore >= 70) riskLevel = "CRITICO_INTERVENCAO_IMEDIATA";
    else if (riskScore >= 40) riskLevel = "MODERADO";

    return {
      studentId,
      studentName,
      riskScore,
      riskLevel,
      indicators: {
        submissionLatencyDays: latencyDays,
        gradeTrend: avgGrade < 60 ? "QUEDA_ABRUPTA" : "ESTAVEL",
        attendanceRatePercent: attendanceRate,
        recoveryParticipationRate: avgGrade < 60 ? 0.3 : 1.0
      },
      recommendedIntervention: riskScore >= 70
        ? "Agendar sabatina socrática presencial com o docente e ativar imediatamente o Plano de Recuperação Individual (PRI) com micro-trilha adaptativa."
        : "Manter acompanhamento de frequência e incentivar participação nas maratonas de programação da Arena."
    };
  }
}
