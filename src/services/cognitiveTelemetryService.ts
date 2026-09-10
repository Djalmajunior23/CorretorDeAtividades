import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export type CognitiveState = "flow_state" | "mild_hesitation" | "cognitive_overload" | "disengaged";

export interface KeystrokeTelemetryEvent {
  studentId: string;
  studentName: string;
  classId?: string;
  activityId?: string;
  timestamp: number;
  charsAdded: number;
  charsDeleted: number; // backspaces / deletes
  pasteCount: number;
  executionErrorsCount: number;
  currentCodeLength: number;
  activeLanguage?: string;
  recentErrorCode?: string;
}

export interface StudentTelemetryMetrics {
  studentId: string;
  studentName: string;
  classId: string;
  activityId: string;
  cpm: number; // Characters per minute
  wpm: number; // Words per minute
  churnRate: number; // 0 - 1.0 (deletions / (additions + deletions))
  longPausesCount: number; // pauses > 8 seconds
  pasteBursts: number;
  consecutiveExecutionErrors: number;
  cognitiveLoadIndex: number; // 0 - 1.0 (0 = relaxed, 1.0 = heavy overload)
  state: CognitiveState;
  stateLabel: string;
  needsTeacherIntervention: boolean;
  recommendedAction: string;
  lastUpdated: string;
}

export interface MicroHintRequest {
  studentName: string;
  studentId: string;
  codeSnippet: string;
  language: string;
  errorLog?: string;
  activityContext?: string;
  hintLevel?: 1 | 2 | 3; // 1 = Socratic Nudge, 2 = Conceptual Anchor, 3 = Pseudocode Scaffold
  providerConfig?: CustomAIRequestOptions;
}

export interface MicroHintResponse {
  hintLevel: 1 | 2 | 3;
  levelTitle: string;
  socraticHint: string;
  pedagogicalTip: string;
  suggestedReflection: string;
  pseudocodeScaffold?: string;
  generatedAt: string;
}

// In-memory real-time telemetry store for active classroom monitoring
const telemetryMemoryStore: Map<string, StudentTelemetryMetrics> = new Map();

export class CognitiveTelemetryService {
  /**
   * Records live telemetry chunk from student editor and calculates real-time cognitive metrics.
   */
  static recordTelemetryEvent(event: KeystrokeTelemetryEvent): StudentTelemetryMetrics {
    const studentId = event.studentId || "anonymous_student";
    const studentName = event.studentName || "Estudante";
    const classId = event.classId || "TURMA-DEV-01";
    const activityId = event.activityId || "ACT-ALGO-01";

    const totalKeyActions = Math.max(1, event.charsAdded + event.charsDeleted);
    const churnRate = Math.min(1.0, event.charsDeleted / totalKeyActions);
    const cpm = Math.max(0, event.charsAdded * 6); // standard window extrapolation
    const wpm = Math.round(cpm / 5);

    // Calculate Cognitive Load Index (CLI: 0.0 to 1.0)
    // Churn rate weight 40%, consecutive errors weight 35%, paste bursts weight 15%, low/erratic cpm weight 10%
    const errorFactor = Math.min(1.0, (event.executionErrorsCount || 0) * 0.25);
    const pasteFactor = Math.min(1.0, (event.pasteCount || 0) * 0.2);
    const churnFactor = churnRate;
    const stagnationFactor = (cpm < 15 && totalKeyActions > 5) ? 0.3 : 0.0;

    const cognitiveLoadIndex = Math.min(
      1.0,
      Number((churnFactor * 0.40 + errorFactor * 0.35 + pasteFactor * 0.15 + stagnationFactor * 0.10).toFixed(2))
    );

    // State Classification
    let state: CognitiveState = "flow_state";
    let stateLabel = "Estado de Fluxo (Flow Criativo)";
    let needsTeacherIntervention = false;
    let recommendedAction = "Manter estudante em ritmo autônomo.";

    if (cognitiveLoadIndex >= 0.75 || event.executionErrorsCount >= 3) {
      state = "cognitive_overload";
      stateLabel = "Sobrecarga Cognitiva / Bloqueio";
      needsTeacherIntervention = true;
      recommendedAction = "Disparar Micro-Dica Socrática ou sugerir pausa diagnóstica.";
    } else if (cognitiveLoadIndex >= 0.45) {
      state = "mild_hesitation";
      stateLabel = "Hesitação / Ajuste de Raciocínio";
      needsTeacherIntervention = false;
      recommendedAction = "Monitorar próximo ciclo de compilação.";
    } else if (cpm === 0 && totalKeyActions <= 2) {
      state = "disengaged";
      stateLabel = "Inativo / Pausa Prolongada";
      needsTeacherIntervention = false;
      recommendedAction = "Verificar se estudante necessita de incentivo inicial.";
    }

    const metrics: StudentTelemetryMetrics = {
      studentId,
      studentName,
      classId,
      activityId,
      cpm,
      wpm,
      churnRate: Number(churnRate.toFixed(2)),
      longPausesCount: cpm < 10 ? 1 : 0,
      pasteBursts: event.pasteCount || 0,
      consecutiveExecutionErrors: event.executionErrorsCount || 0,
      cognitiveLoadIndex,
      state,
      stateLabel,
      needsTeacherIntervention,
      recommendedAction,
      lastUpdated: new Date().toISOString()
    };

    telemetryMemoryStore.set(studentId, metrics);
    return metrics;
  }

  /**
   * Returns the aggregated classroom radar metrics for real-time projection.
   */
  static getClassroomRadar(classId?: string): {
    totalActiveStudents: number;
    flowCount: number;
    hesitationCount: number;
    overloadCount: number;
    disengagedCount: number;
    averageCognitiveLoad: number;
    urgentInterventions: StudentTelemetryMetrics[];
    students: StudentTelemetryMetrics[];
  } {
    // If empty, generate rich initial simulated classroom cohort
    if (telemetryMemoryStore.size === 0) {
      this.populateInitialCohort(classId || "TURMA-SENAI-DEV-A");
    }

    const students = Array.from(telemetryMemoryStore.values()).filter(
      (s) => !classId || s.classId === classId || classId === "all"
    );

    const flowCount = students.filter((s) => s.state === "flow_state").length;
    const hesitationCount = students.filter((s) => s.state === "mild_hesitation").length;
    const overloadCount = students.filter((s) => s.state === "cognitive_overload").length;
    const disengagedCount = students.filter((s) => s.state === "disengaged").length;

    const avgCli =
      students.length > 0
        ? Number((students.reduce((acc, s) => acc + s.cognitiveLoadIndex, 0) / students.length).toFixed(2))
        : 0.25;

    const urgentInterventions = students.filter((s) => s.needsTeacherIntervention);

    return {
      totalActiveStudents: students.length,
      flowCount,
      hesitationCount,
      overloadCount,
      disengagedCount,
      averageCognitiveLoad: avgCli,
      urgentInterventions,
      students
    };
  }

  /**
   * Generates a Just-In-Time Socratic Micro-Hint to unblock the student without giving away the final solution.
   */
  static async generateMicroHint(input: MicroHintRequest): Promise<MicroHintResponse> {
    const hintLevel = input.hintLevel || 1;
    const levelTitles = {
      1: "Nível 1: Pergunta Socrática Desbloqueadora (Nudge)",
      2: "Nível 2: Âncora Conceitual & Regra de Negócio",
      3: "Nível 3: Scaffold Estrutural & Pseudocódigo Guiado"
    };

    const prompt = `Você é um Tutor Pedagógico Socrático do SENAI.
O aluno(a) ${input.studentName} está trabalhando em um código em ${input.language} e apresenta sinais de sobrecarga cognitiva ou erro repetido.

CONTEXTO DA ATIVIDADE: ${input.activityContext || "Algoritmo de Processamento de Dados"}
CÓDIGO ATUAL DO ALUNO:
\`\`\`${input.language}
${input.codeSnippet || "// Nenhum código informado ainda"}
\`\`\`

ÚLTIMO ERRO / LOG DO SANDBOX:
${input.errorLog || "Sem erros explícitos de compilação, mas travado na lógica."}

NÍVEL DE DICA SOLICITADO: Nível ${hintLevel} (${levelTitles[hintLevel]}).
DIRETRIZES PEDAGÓGICAS SENAI:
- NÃO dê a resposta pronta nem o código pronto final.
- Se nível 1: Faça uma pergunta reflexiva socrática apontando para a variável ou condição suspeita.
- Se nível 2: Explique o conceito matemático ou computacional subjacente de forma concisa.
- Se nível 3: Mostre um modelo mental ou pseudocódigo estruturado em 3 passos.

FORMATO OBRIGATÓRIO (Apenas JSON puro):
{
  "socraticHint": "...",
  "pedagogicalTip": "...",
  "suggestedReflection": "...",
  "pseudocodeScaffold": "..."
}`;

    const provider = ProviderFactory.createCustomProvider(input.providerConfig);

    try {
      const raw = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 2000 });
      const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);

      return {
        hintLevel,
        levelTitle: levelTitles[hintLevel],
        socraticHint: parsed.socraticHint || "Observe com atenção as condições de parada do seu laço de repetição.",
        pedagogicalTip: parsed.pedagogicalTip || "Lembre-se de testar manualmente os valores iniciais (i = 0).",
        suggestedReflection: parsed.suggestedReflection || "Qual valor a variável assume logo na primeira iteração?",
        pseudocodeScaffold: parsed.pseudocodeScaffold || undefined,
        generatedAt: new Date().toISOString()
      };
    } catch (err: any) {
      console.warn(`[CognitiveTelemetryService] Fallback hint generated: ${err.message}`);
      return this.generateFallbackHint(input, hintLevel, levelTitles[hintLevel]);
    }
  }

  private static generateFallbackHint(input: MicroHintRequest, level: 1 | 2 | 3, levelTitle: string): MicroHintResponse {
    if (level === 1) {
      return {
        hintLevel: 1,
        levelTitle,
        socraticHint: `Observe como você está atualizando sua variável de controle antes da verificação condicional em ${input.language}.`,
        pedagogicalTip: "Pense no ciclo de vida de cada variável durante a iteração.",
        suggestedReflection: "Se a lista estiver vazia ou tiver apenas 1 elemento, o que acontece?",
        generatedAt: new Date().toISOString()
      };
    } else if (level === 2) {
      return {
        hintLevel: 2,
        levelTitle,
        socraticHint: `Para resolver essa etapa, você precisa garantir que a coleção mantenha a ordem ou que a chave exista antes da consulta.`,
        pedagogicalTip: "O erro comum aqui é tentar acessar um índice além do tamanho da lista (IndexOutOfBounds).",
        suggestedReflection: "Qual é a diferença entre len(lista) e o índice do último elemento?",
        generatedAt: new Date().toISOString()
      };
    } else {
      return {
        hintLevel: 3,
        levelTitle,
        socraticHint: "Aqui está a estrutura de pensamento em 3 etapas para organizar seu raciocínio:",
        pedagogicalTip: "Construa primeiro o caso base, depois a iteração geral e por fim o retorno formatado.",
        suggestedReflection: "Implemente uma etapa por vez e execute o teste para validar os passos parciais.",
        pseudocodeScaffold: `// 1. Inicializar acumulador ou estrutura vazia\n// 2. Iterar sobre os elementos com filtro seletivo\n// 3. Retornar ou imprimir o resultado processado`,
        generatedAt: new Date().toISOString()
      };
    }
  }

  private static populateInitialCohort(classId: string) {
    const studentsSeed = [
      { id: "stu_101", name: "Lucas Silveira", errors: 0, cpm: 120, churn: 0.12, state: "flow_state" as const },
      { id: "stu_102", name: "Ana Beatriz Rocha", errors: 0, cpm: 95, churn: 0.18, state: "flow_state" as const },
      { id: "stu_103", name: "Gabriel Martins", errors: 1, cpm: 55, churn: 0.48, state: "mild_hesitation" as const },
      { id: "stu_104", name: "Mariana Costa", errors: 4, cpm: 25, churn: 0.78, state: "cognitive_overload" as const },
      { id: "stu_105", name: "Rodrigo Almeida", errors: 3, cpm: 18, churn: 0.82, state: "cognitive_overload" as const },
      { id: "stu_106", name: "Carolina Mendes", errors: 0, cpm: 0, churn: 0.0, state: "disengaged" as const },
      { id: "stu_107", name: "Felipe Nogueira", errors: 0, cpm: 140, churn: 0.08, state: "flow_state" as const }
    ];

    studentsSeed.forEach((s) => {
      const cli = s.state === "cognitive_overload" ? 0.85 : s.state === "mild_hesitation" ? 0.52 : s.state === "disengaged" ? 0.1 : 0.2;
      telemetryMemoryStore.set(s.id, {
        studentId: s.id,
        studentName: s.name,
        classId,
        activityId: "ACT-DEV-PBL-01",
        cpm: s.cpm,
        wpm: Math.round(s.cpm / 5),
        churnRate: s.churn,
        longPausesCount: s.cpm < 20 ? 3 : 0,
        pasteBursts: s.churn > 0.5 ? 2 : 0,
        consecutiveExecutionErrors: s.errors,
        cognitiveLoadIndex: cli,
        state: s.state,
        stateLabel: s.state === "cognitive_overload" ? "Sobrecarga Cognitiva / Bloqueio" : s.state === "mild_hesitation" ? "Hesitação / Ajuste de Raciocínio" : s.state === "disengaged" ? "Inativo / Pausa Prolongada" : "Estado de Fluxo (Flow Criativo)",
        needsTeacherIntervention: s.state === "cognitive_overload",
        recommendedAction: s.state === "cognitive_overload" ? "Disparar Micro-Dica Socrática Nível 2." : "Manter autonomia.",
        lastUpdated: new Date().toISOString()
      });
    });
  }
}
