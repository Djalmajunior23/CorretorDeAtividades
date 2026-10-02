/**
 * ============================================================================
 * PEDAGOGICAL CONFIGURATION HIERARCHY SERVICE
 * ============================================================================
 * Features:
 * 1. 3-Tier Cascading Configuration Engine:
 *    - Level 1: INSTITUICAO (Enterprise Institutional baseline)
 *    - Level 2: TURMA / COHORT (Class-level adjustments)
 *    - Level 3: ATIVIDADE (Activity-specific overrides)
 * 2. Explicit Precedence: Atividade > Turma > Instituição.
 * 3. Individual student accommodations (e.g. time extensions for neurodiversity).
 * 4. Effective Rule Resolver: Computes the exact active rule with origin lineage.
 * ============================================================================
 */

export interface PedagogicalSettingsTier {
  timezone: string;
  maxAttempts: number;
  allowLateSubmission: boolean;
  latePenaltyPercentPerDay: number;
  allowRefactoring: boolean;
  maxRefactoringCycles: number;
  feedbackVisibilityMode: "IMEDIATO" | "APOS_PRAZO" | "LIBERACAO_DOCENTE_MANUAL";
  allowedAiAssistanceLevel: "BLOQUEADO" | "SOCRATICO_DICAS" | "COPILOT_COMPLETO";
  roundingRule: "PADRAO_MATEMATICO" | "SEMPRE_CIMA_MEIO_PONTO" | "TRUNCAMENTO";
  passingScoreThreshold: number;
}

export interface StudentAccommodationRule {
  studentId: string;
  studentName: string;
  extraTimeMultiplier: number; // e.g. 1.5x (50% extra time)
  allowExtraAttempt: boolean;
  specialNotes: string;
}

export interface EffectiveResolvedConfig {
  effectiveSettings: PedagogicalSettingsTier;
  originLineage: Record<keyof PedagogicalSettingsTier, "INSTITUICAO" | "TURMA" | "ATIVIDADE">;
  studentAccommodationsApplied?: StudentAccommodationRule;
  resolvedAtIso: string;
}

export class PedagogicalConfigHierarchyService {
  private static institutionalConfig: PedagogicalSettingsTier = {
    timezone: "America/Sao_Paulo",
    maxAttempts: 3,
    allowLateSubmission: true,
    latePenaltyPercentPerDay: 10,
    allowRefactoring: true,
    maxRefactoringCycles: 2,
    feedbackVisibilityMode: "LIBERACAO_DOCENTE_MANUAL",
    allowedAiAssistanceLevel: "SOCRATICO_DICAS",
    roundingRule: "PADRAO_MATEMATICO",
    passingScoreThreshold: 60
  };

  private static classConfigs: Record<string, Partial<PedagogicalSettingsTier>> = {
    "turma-ds-a": {
      maxAttempts: 5,
      allowedAiAssistanceLevel: "SOCRATICO_DICAS"
    }
  };

  private static activityConfigs: Record<string, Partial<PedagogicalSettingsTier>> = {
    "act-ds-001": {
      allowRefactoring: true,
      maxRefactoringCycles: 2
    }
  };

  private static studentAccommodations: StudentAccommodationRule[] = [
    {
      studentId: "std-carlos-05",
      studentName: "Carlos Eduardo Santos",
      extraTimeMultiplier: 1.5,
      allowExtraAttempt: true,
      specialNotes: "Tempo estendido homologado para acessibilidade e inclusão."
    }
  ];

  public static getInstitutionalConfig(): PedagogicalSettingsTier {
    return { ...this.institutionalConfig };
  }

  public static setInstitutionalConfig(_instId: string, cfg: Partial<PedagogicalSettingsTier> & { diasRefacao?: number; maxTentativasPadrao?: number; permiteUsoIA?: boolean; arredondamentoDecimais?: number }): void {
    if (cfg.diasRefacao !== undefined) this.institutionalConfig.maxRefactoringCycles = cfg.diasRefacao;
    if (cfg.maxTentativasPadrao !== undefined) this.institutionalConfig.maxAttempts = cfg.maxTentativasPadrao;
    if (cfg.permiteUsoIA !== undefined) this.institutionalConfig.allowedAiAssistanceLevel = cfg.permiteUsoIA ? "SOCRATICO_DICAS" : "BLOQUEADO";
    Object.assign(this.institutionalConfig, cfg);
  }

  public static setTurmaConfig(turmaId: string, _instId: string, cfg: Partial<PedagogicalSettingsTier> & { permiteUsoIA?: boolean }): void {
    if (!this.classConfigs[turmaId]) this.classConfigs[turmaId] = {};
    if (cfg.permiteUsoIA !== undefined) {
      cfg.allowedAiAssistanceLevel = cfg.permiteUsoIA ? "SOCRATICO_DICAS" : "BLOQUEADO";
    }
    Object.assign(this.classConfigs[turmaId], cfg);
  }

  public static setActivityConfig(actId: string, _turmaId: string, cfg: Partial<PedagogicalSettingsTier> & { maxTentativas?: number }): void {
    if (!this.activityConfigs[actId]) this.activityConfigs[actId] = {};
    if (cfg.maxTentativas !== undefined) cfg.maxAttempts = cfg.maxTentativas;
    Object.assign(this.activityConfigs[actId], cfg);
  }

  public static setStudentAccommodation(studentId: string, _turmaId: string, acc: { multiplicadorTempo?: number; extraTimeMultiplier?: number; tentativasExtras?: number; allowExtraAttempt?: boolean; motivoLaudo?: string }): void {
    const existingIdx = this.studentAccommodations.findIndex(a => a.studentId === studentId);
    const rule: StudentAccommodationRule = {
      studentId,
      studentName: "Estudante Acomodado",
      extraTimeMultiplier: acc.multiplicadorTempo ?? acc.extraTimeMultiplier ?? 1.0,
      allowExtraAttempt: (acc.tentativasExtras && acc.tentativasExtras > 0) || !!acc.allowExtraAttempt,
      specialNotes: acc.motivoLaudo || "Acomodação pedagógica"
    };
    if (existingIdx >= 0) {
      this.studentAccommodations[existingIdx] = rule;
    } else {
      this.studentAccommodations.push(rule);
    }
  }

  public static getClassConfig(classId: string): Partial<PedagogicalSettingsTier> {
    return this.classConfigs[classId] || {};
  }

  public static getActivityConfig(activityId: string): Partial<PedagogicalSettingsTier> {
    return this.activityConfigs[activityId] || {};
  }

  public static getStudentAccommodations(): StudentAccommodationRule[] {
    return this.studentAccommodations;
  }

  public static getEffectiveConfig(params: {
    instituicaoId?: string;
    turmaId?: string;
    atividadeId?: string;
  }): {
    permiteUsoIA: boolean;
    maxTentativas: number;
    diasRefacao: number;
    arredondamentoDecimais: number;
    effectiveSettings: PedagogicalSettingsTier;
  } {
    const res = this.resolveEffectiveConfig({
      classId: params.turmaId,
      activityId: params.atividadeId
    });
    return {
      permiteUsoIA: res.effectiveSettings.allowedAiAssistanceLevel !== "BLOQUEADO",
      maxTentativas: res.effectiveSettings.maxAttempts,
      diasRefacao: res.effectiveSettings.maxRefactoringCycles || 7,
      arredondamentoDecimais: 1,
      effectiveSettings: res.effectiveSettings
    };
  }

  public static getEffectiveConfigForStudent(params: {
    instituicaoId?: string;
    turmaId?: string;
    atividadeId?: string;
    alunoId?: string;
  }): {
    multiplicadorTempo: number;
    maxTentativas: number;
  } {
    const base = this.getEffectiveConfig(params);
    const acc = this.studentAccommodations.find(a => a.studentId === params.alunoId);
    const mult = acc?.extraTimeMultiplier ?? 1.0;
    const extra = acc?.allowExtraAttempt ? 2 : 0;
    return {
      multiplicadorTempo: mult,
      maxTentativas: base.maxTentativas + extra
    };
  }

  /**
   * Resolves effective configuration applying precedence: ATIVIDADE > TURMA > INSTITUICAO
   */
  public static resolveEffectiveConfig(params: {
    activityId?: string;
    classId?: string;
    studentId?: string;
  }): EffectiveResolvedConfig {
    const inst = this.institutionalConfig;
    const cls = params.classId ? this.classConfigs[params.classId] || {} : {};
    const act = params.activityId ? this.activityConfigs[params.activityId] || {} : {};

    const effective: PedagogicalSettingsTier = { ...inst };
    const lineage: Record<keyof PedagogicalSettingsTier, "INSTITUICAO" | "TURMA" | "ATIVIDADE"> = {
      timezone: "INSTITUICAO",
      maxAttempts: "INSTITUICAO",
      allowLateSubmission: "INSTITUICAO",
      latePenaltyPercentPerDay: "INSTITUICAO",
      allowRefactoring: "INSTITUICAO",
      maxRefactoringCycles: "INSTITUICAO",
      feedbackVisibilityMode: "INSTITUICAO",
      allowedAiAssistanceLevel: "INSTITUICAO",
      roundingRule: "INSTITUICAO",
      passingScoreThreshold: "INSTITUICAO"
    };

    // Apply class tier overrides
    (Object.keys(cls) as (keyof PedagogicalSettingsTier)[]).forEach(key => {
      if (cls[key] !== undefined) {
        (effective as any)[key] = cls[key];
        lineage[key] = "TURMA";
      }
    });

    // Apply activity tier overrides
    (Object.keys(act) as (keyof PedagogicalSettingsTier)[]).forEach(key => {
      if (act[key] !== undefined) {
        (effective as any)[key] = act[key];
        lineage[key] = "ATIVIDADE";
      }
    });

    // Check accommodations
    const acc = params.studentId 
      ? this.studentAccommodations.find(a => a.studentId === params.studentId)
      : undefined;

    return {
      effectiveSettings: effective,
      originLineage: lineage,
      studentAccommodationsApplied: acc,
      resolvedAtIso: new Date().toISOString()
    };
  }
}
