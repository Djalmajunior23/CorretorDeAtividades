import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCompare,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Layers,
  Calendar,
  Clock,
  Award,
  Users,
  ShieldCheck,
  Info,
  ArrowRight
} from "lucide-react";
import {
  CohortComparisonService,
  CohortOfferData,
  ComparativeDiscrepancyReport
} from "../services/cohortComparisonService";

interface CohortComparisonStudioViewProps {
  onNavigate?: (tab: string) => void;
}

export default function CohortComparisonStudioView({ onNavigate }: CohortComparisonStudioViewProps) {
  const [offers] = useState<CohortOfferData[]>(() =>
    CohortComparisonService.getOffers()
  );
  const [selectedOfferA, setSelectedOfferA] = useState<string>(offers[0]?.id || "");
  const [selectedOfferB, setSelectedOfferB] = useState<string>(offers[1]?.id || offers[0]?.id || "");

  const comparisonReport: ComparativeDiscrepancyReport | null =
    selectedOfferA && selectedOfferB
      ? CohortComparisonService.compareOffers(selectedOfferA, selectedOfferB)
      : null;

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-cyan-950/30 border border-teal-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-1 ring-white/20">
            <GitCompare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Comparação Longitudinal de Ofertas da Disciplina
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                Análise de Coortes
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Compare a evolução das turmas ao longo dos semestres com sinalização de discrepâncias de rubricas.
            </p>
          </div>
        </div>
      </div>

      {/* Ethical Analytics Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Ética e Respeito Docente:</strong> Os dados são estritamente agregados para análise de currículo e calibração pedagógica. O sistema não gera rankings competitivos ou punitivos entre turmas ou professores.
        </div>
      </div>

      {/* Cohort Selectors Bar */}
      <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-mono uppercase text-teal-400 font-bold mb-2">
            Oferta de Referência (Coorte A):
          </label>
          <select
            value={selectedOfferA}
            onChange={(e) => setSelectedOfferA(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
          >
            {offers.map(o => (
              <option key={o.id} value={o.id}>
                {o.semesterPeriod} — {o.className} ({o.instructorName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-cyan-400 font-bold mb-2">
            Oferta Comparada (Coorte B):
          </label>
          <select
            value={selectedOfferB}
            onChange={(e) => setSelectedOfferB(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {offers.map(o => (
              <option key={o.id} value={o.id}>
                {o.semesterPeriod} — {o.className} ({o.instructorName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discrepancy Warnings if present */}
      {comparisonReport && (comparisonReport.hasRubricDiscrepancy || comparisonReport.hasCurriculumDiscrepancy) && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Fatores que Limitam a Comparação Direta:</span>
          </div>
          {comparisonReport.rubricDiscrepancyNote && (
            <p className="pl-6">• {comparisonReport.rubricDiscrepancyNote}</p>
          )}
          {comparisonReport.curriculumDiscrepancyNote && (
            <p className="pl-6">• {comparisonReport.curriculumDiscrepancyNote}</p>
          )}
        </div>
      )}

      {/* Comparative Data Grid */}
      {comparisonReport && (
        <div className="space-y-6">
          {/* Delta Highlights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-[#090e21] border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Variação na Média Geral
              </span>
              <span className={`text-2xl font-bold font-mono ${
                comparisonReport.performanceDelta.averageGradeDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {comparisonReport.performanceDelta.averageGradeDelta >= 0 ? "+" : ""}
                {comparisonReport.performanceDelta.averageGradeDelta} pts
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {comparisonReport.cohortA.classAverageGrade} ➔ {comparisonReport.cohortB.classAverageGrade}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090e21] border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Variação na Taxa de Entregas
              </span>
              <span className={`text-2xl font-bold font-mono ${
                comparisonReport.performanceDelta.submissionRateDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {comparisonReport.performanceDelta.submissionRateDelta >= 0 ? "+" : ""}
                {comparisonReport.performanceDelta.submissionRateDelta}%
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {comparisonReport.cohortA.submissionRatioPercent}% ➔ {comparisonReport.cohortB.submissionRatioPercent}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090e21] border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                Tentativas Médias p/ Conclusão
              </span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {comparisonReport.cohortB.averageAttemptsPerActivity} tentativas
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                (vs {comparisonReport.cohortA.averageAttemptsPerActivity} em {comparisonReport.cohortA.semesterPeriod})
              </div>
            </div>
          </div>

          {/* Side by Side Detailed Comparison Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cohort A Column */}
            <div className="p-6 rounded-2xl bg-[#090e21] border border-teal-800/40 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-teal-400 uppercase">
                  {comparisonReport.cohortA.semesterPeriod}
                </span>
                <h3 className="text-base font-bold text-white font-display mt-0.5">
                  {comparisonReport.cohortA.className}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {comparisonReport.cohortA.enrolledStudentsCount} matriculados • {comparisonReport.cohortA.activeParticipantsCount} ativos
                </span>
              </div>

              {/* Grade Distribution */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Distribuição de Notas por Faixa
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 block">0 - 49</span>
                    <strong className="text-white">{comparisonReport.cohortA.gradeDistribution.range0To49}</strong>
                  </div>
                  <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block">50 - 69</span>
                    <strong className="text-white">{comparisonReport.cohortA.gradeDistribution.range50To69}</strong>
                  </div>
                  <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-400 block">70 - 89</span>
                    <strong className="text-white">{comparisonReport.cohortA.gradeDistribution.range70To89}</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block">90 - 100</span>
                    <strong className="text-white">{comparisonReport.cohortA.gradeDistribution.range90To100}</strong>
                  </div>
                </div>
              </div>

              {/* Rubric and Activity Versions */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
                <div><span className="text-slate-400">Versão da Atividade:</span> <strong className="text-slate-200">{comparisonReport.cohortA.activityVersionUsed}</strong></div>
                <div><span className="text-slate-400">Versão da Rubrica:</span> <strong className="text-slate-200">{comparisonReport.cohortA.rubricVersionUsed}</strong></div>
              </div>
            </div>

            {/* Cohort B Column */}
            <div className="p-6 rounded-2xl bg-[#090e21] border border-cyan-800/40 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {comparisonReport.cohortB.semesterPeriod}
                </span>
                <h3 className="text-base font-bold text-white font-display mt-0.5">
                  {comparisonReport.cohortB.className}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {comparisonReport.cohortB.enrolledStudentsCount} matriculados • {comparisonReport.cohortB.activeParticipantsCount} ativos
                </span>
              </div>

              {/* Grade Distribution */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Distribuição de Notas por Faixa
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 block">0 - 49</span>
                    <strong className="text-white">{comparisonReport.cohortB.gradeDistribution.range0To49}</strong>
                  </div>
                  <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20">
                    <span className="text-[10px] text-amber-400 block">50 - 69</span>
                    <strong className="text-white">{comparisonReport.cohortB.gradeDistribution.range50To69}</strong>
                  </div>
                  <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-400 block">70 - 89</span>
                    <strong className="text-white">{comparisonReport.cohortB.gradeDistribution.range70To89}</strong>
                  </div>
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-400 block">90 - 100</span>
                    <strong className="text-white">{comparisonReport.cohortB.gradeDistribution.range90To100}</strong>
                  </div>
                </div>
              </div>

              {/* Rubric and Activity Versions */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
                <div><span className="text-slate-400">Versão da Atividade:</span> <strong className="text-slate-200">{comparisonReport.cohortB.activityVersionUsed}</strong></div>
                <div><span className="text-slate-400">Versão da Rubrica:</span> <strong className="text-slate-200">{comparisonReport.cohortB.rubricVersionUsed}</strong></div>
              </div>
            </div>
          </div>

          {/* Qualitative Synthesis Card */}
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 space-y-2">
            <span className="text-xs font-mono uppercase text-teal-400 font-bold flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Síntese Pedagógica da Comparação</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {comparisonReport.pedagogicalObservation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
