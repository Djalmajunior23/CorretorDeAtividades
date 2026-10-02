import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sliders,
  Building2,
  Users,
  Target,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Award,
  ChevronRight,
  Lightbulb,
  Save
} from "lucide-react";
import { toast } from "sonner";
import {
  PedagogicalConfigHierarchyService,
  EffectiveResolvedConfig,
  PedagogicalSettingsTier
} from "../services/pedagogicalConfigHierarchyService";

interface PedagogicalConfigHierarchyViewProps {
  onNavigate?: (tab: string) => void;
}

export default function PedagogicalConfigHierarchyView({ onNavigate }: PedagogicalConfigHierarchyViewProps) {
  const [selectedTierTab, setSelectedTierTab] = useState<"INSTITUICAO" | "TURMA" | "ATIVIDADE">("ATIVIDADE");
  const [resolvedConfig, setResolvedConfig] = useState<EffectiveResolvedConfig>(() =>
    PedagogicalConfigHierarchyService.resolveEffectiveConfig({
      activityId: "act-ds-001",
      classId: "turma-ds-a"
    })
  );

  const getOriginBadge = (origin: "INSTITUICAO" | "TURMA" | "ATIVIDADE") => {
    switch (origin) {
      case "ATIVIDADE":
        return <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">Herança: Atividade (Override)</span>;
      case "TURMA":
        return <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold">Herança: Turma</span>;
      case "INSTITUICAO":
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">Herança: Institucional</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/30 border border-indigo-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Sliders className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Configurações Pedagógicas em Cascata (3 Níveis)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Precedência Explícita
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hierarquia de regras: Instituição ➔ Turma ➔ Atividade, com resolução em tempo real e acomodações individuais.
            </p>
          </div>
        </div>
      </div>

      {/* Precedence Hierarchy Diagram Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#090e21] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs font-mono">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Nível 1: Instituição (Base)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Parâmetros globais institucionais (Fuso horário, política base de tentativas e teto de aprovação).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e21] border border-indigo-800/50 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs font-mono">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Nível 2: Turma / Coorte</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ajustes específicos do curso/semestre (ex: mais tentativas para turmas introdutórias).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e21] border border-cyan-800/50 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Nível 3: Atividade (Maior Precedência)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Regras específicas do exercício (ex: bloqueio de IA em desafios avaliativos).
          </p>
        </div>
      </div>

      {/* Effective Rules Inspector Canvas */}
      <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Regras Efetivas Aplicadas (Lista 3 - Turma DS A)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Resolução em cascata calculada pelo motor de políticas pedagógicas.
            </p>
          </div>

          <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Regra Efetiva Ativa</span>
          </span>
        </div>

        {/* Resolved Rule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Max attempts */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Máximo de Tentativas Permitidas</span>
              <span className="text-xs text-slate-400">{resolvedConfig.effectiveSettings.maxAttempts} envios autorizados</span>
            </div>
            {getOriginBadge(resolvedConfig.originLineage.maxAttempts)}
          </div>

          {/* AI Level */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Nível de Apoio por IA</span>
              <span className="text-xs text-indigo-300 font-mono">{resolvedConfig.effectiveSettings.allowedAiAssistanceLevel}</span>
            </div>
            {getOriginBadge(resolvedConfig.originLineage.allowedAiAssistanceLevel)}
          </div>

          {/* Refactoring */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Ciclo de Refação Orientada</span>
              <span className="text-xs text-emerald-400 font-mono">
                {resolvedConfig.effectiveSettings.allowRefactoring ? `Permitida (Até ${resolvedConfig.effectiveSettings.maxRefactoringCycles} ciclos)` : "Desabilitada"}
              </span>
            </div>
            {getOriginBadge(resolvedConfig.originLineage.allowRefactoring)}
          </div>

          {/* Feedback visibility */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Visibilidade do Feedback</span>
              <span className="text-xs text-slate-300 font-mono">{resolvedConfig.effectiveSettings.feedbackVisibilityMode}</span>
            </div>
            {getOriginBadge(resolvedConfig.originLineage.feedbackVisibilityMode)}
          </div>
        </div>

        {/* Individual Student Accommodations */}
        {resolvedConfig.studentAccommodationsApplied && (
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-2">
            <span className="text-xs font-mono uppercase text-indigo-300 font-bold block flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Acomodação Individual Homologada: {resolvedConfig.studentAccommodationsApplied.studentName}</span>
            </span>
            <p className="text-xs text-slate-300">
              Multiplicador de tempo: <strong>{resolvedConfig.studentAccommodationsApplied.extraTimeMultiplier}x</strong> | Tentativa extra: <strong>{resolvedConfig.studentAccommodationsApplied.allowExtraAttempt ? "Sim" : "Não"}</strong>.
            </p>
            <p className="text-[11px] text-slate-400 italic">
              "{resolvedConfig.studentAccommodationsApplied.specialNotes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
