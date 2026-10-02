import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Users,
  FileText,
  RefreshCw,
  Send,
  Eye,
  ShieldAlert,
  Database,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import {
  ClassOperationsCentralService,
  ClassOperationsSummary
} from "../services/classOperationsCentralService";
import { ControlledPublicationService } from "../services/controlledPublicationService";
import { ReliableAsyncJobQueueService } from "../services/reliableAsyncJobQueueService";
import { UnifiedLifecycleEngineService } from "../services/unifiedLifecycleEngineService";

interface ClassOperationsCentralViewProps {
  onNavigate?: (tab: string) => void;
}

export default function ClassOperationsCentralView({ onNavigate }: ClassOperationsCentralViewProps) {
  const [summary, setSummary] = useState<ClassOperationsSummary>(() =>
    ClassOperationsCentralService.getOperationsSummary()
  );
  const [activeFilterTab, setActiveFilterTab] = useState<
    "ALL" | "RECEIVED" | "AWAITING_REVIEW" | "FAILURES" | "REFACTORING" | "PUBLISHED"
  >("AWAITING_REVIEW");

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchReason, setBatchReason] = useState("Homologação consolidada das correções e feedbacks da Lista 3.");

  const refreshData = () => {
    setSummary(ClassOperationsCentralService.getOperationsSummary());
    toast.success("Dados operacionais atualizados com o banco de dados.");
  };

  const handleRetryTechnicalFailure = (subId: string) => {
    const sub = UnifiedLifecycleEngineService.getSubmissionById(subId);
    if (!sub) return;

    ReliableAsyncJobQueueService.enqueueJob({
      idempotencyKey: `retry-${sub.id}-${Date.now()}`,
      type: "CORRECAO_SUBMISSAO",
      payload: { submissionId: sub.id, codeContent: sub.codeContent, language: sub.language }
    });

    UnifiedLifecycleEngineService.transitionSubmissionState(
      sub.id,
      "NA_FILA",
      "SYSTEM_RECOVERY",
      "teacher-operations-cockpit",
      "Retentativa manual de processamento solicitada pelo docente"
    );

    toast.info("Submissão reenviada para a Fila de Processamento Seguro.");
    setSummary(ClassOperationsCentralService.getOperationsSummary());
  };

  const handleBatchPublish = (e: React.FormEvent) => {
    e.preventDefault();
    const result = ControlledPublicationService.publishBatchResults({
      activityId: "act-ds-001",
      teacherId: "prof-djalma",
      teacherName: "Prof. Djalma Batista",
      justificationReason: batchReason
    });

    toast.success(`Resultados publicados para ${result.publishedCount} estudantes!`, {
      description: "Notificações individuais disparadas e boletim atualizado."
    });

    setShowBatchModal(false);
    setSummary(ClassOperationsCentralService.getOperationsSummary());
  };

  const allSubmissions = [
    ...summary.submissionsByState.awaitingReview,
    ...summary.submissionsByState.received,
    ...summary.submissionsByState.technicalFailures,
    ...summary.submissionsByState.refactorings,
    ...summary.submissionsByState.published
  ];

  const filteredSubmissions = allSubmissions.filter(s => {
    if (activeFilterTab === "RECEIVED") return s.currentState === "RECEBIDA" || s.currentState === "NA_FILA";
    if (activeFilterTab === "AWAITING_REVIEW") return s.currentState === "AGUARDANDO_REVISAO" || s.currentState === "AVALIADA_AUTO";
    if (activeFilterTab === "FAILURES") return s.currentState === "FALHA_TECNICA";
    if (activeFilterTab === "REFACTORING") return s.currentState === "REFACAO_SOLICITADA";
    if (activeFilterTab === "PUBLISHED") return s.currentState === "RESULTADO_PUBLICADO";
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Central de Operações da Turma
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {summary.className}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                {summary.dataSource}
              </span>
              <span>•</span>
              <span>Consulta: {new Date(summary.queryTimestampIso).toLocaleTimeString("pt-BR")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Publicar Lote Controlado</span>
          </button>
        </div>
      </div>

      {/* 8 Operational Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilterTab("ALL")}
          className="p-4 rounded-2xl bg-[#090e21] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Atividades Ativas</span>
          <span className="text-2xl font-bold text-white font-mono">{summary.metrics.ongoingActivitiesCount}</span>
          <span className="text-[10px] text-cyan-400 font-mono block">Em andamento</span>
        </div>

        <div
          onClick={() => setActiveFilterTab("RECEIVED")}
          className="p-4 rounded-2xl bg-[#090e21] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1"
        >
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Entregas Recebidas</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{summary.metrics.receivedSubmissionsCount}</span>
          <span className="text-[10px] text-slate-400 font-mono block">{summary.metrics.unsubmittedStudentsCount} não entregaram</span>
        </div>

        <div
          onClick={() => setActiveFilterTab("AWAITING_REVIEW")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
            activeFilterTab === "AWAITING_REVIEW"
              ? "bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "bg-[#090e21] border-slate-800 hover:border-slate-700"
          }`}
        >
          <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">Aguardando Revisão</span>
          <span className="text-2xl font-bold text-amber-300 font-mono">{summary.metrics.awaitingTeacherReviewCount}</span>
          <span className="text-[10px] text-amber-400/80 font-mono block">Feedback não publicado</span>
        </div>

        <div
          onClick={() => setActiveFilterTab("FAILURES")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1 ${
            summary.metrics.technicalFailuresCount > 0
              ? "bg-rose-950/20 border-rose-500/40"
              : "bg-[#090e21] border-slate-800"
          }`}
        >
          <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">Falhas Técnicas</span>
          <span className="text-2xl font-bold text-rose-300 font-mono">{summary.metrics.technicalFailuresCount}</span>
          <span className="text-[10px] text-rose-400/80 font-mono block">Zero erros acadêmicos</span>
        </div>
      </div>

      {/* Submissions Table with Filter Tabs */}
      <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilterTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFilterTab === "ALL"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todas ({allSubmissions.length})
            </button>
            <button
              onClick={() => setActiveFilterTab("AWAITING_REVIEW")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFilterTab === "AWAITING_REVIEW"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Aguardando Revisão ({summary.metrics.awaitingTeacherReviewCount})
            </button>
            <button
              onClick={() => setActiveFilterTab("FAILURES")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFilterTab === "FAILURES"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Falhas Técnicas ({summary.metrics.technicalFailuresCount})
            </button>
            <button
              onClick={() => setActiveFilterTab("PUBLISHED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeFilterTab === "PUBLISHED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Publicadas ({summary.submissionsByState.published.length})
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Exibindo <strong>{filteredSubmissions.length}</strong> registros
          </span>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Estudante</th>
                <th className="p-3">Tentativa</th>
                <th className="p-3">Situação</th>
                <th className="p-3">Nota Sugerida</th>
                <th className="p-3">Nota Oficial</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredSubmissions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-white">{sub.studentName}</div>
                    <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                  </td>
                  <td className="p-3 text-slate-300">#{sub.attemptNumber}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.currentState === "RESULTADO_PUBLICADO" ? "bg-emerald-500/20 text-emerald-400" :
                      sub.currentState === "AGUARDANDO_REVISAO" ? "bg-amber-500/20 text-amber-400" :
                      sub.currentState === "FALHA_TECNICA" ? "bg-rose-500/20 text-rose-400" :
                      "bg-blue-500/20 text-blue-400"
                    }`}>
                      {sub.currentState}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {sub.autoEvaluation ? `${sub.autoEvaluation.suggestedScore} pts` : "—"}
                  </td>
                  <td className="p-3 font-bold text-white">
                    {sub.publishedResult ? `${sub.publishedResult.officialScore} pts` : (
                      sub.teacherReview ? `${sub.teacherReview.moderatedScore} pts (revisado)` : "Pendente"
                    )}
                  </td>
                  <td className="p-3">
                    {sub.currentState === "FALHA_TECNICA" ? (
                      <button
                        onClick={() => handleRetryTechnicalFailure(sub.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/40 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reavaliar Sandbox</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate && onNavigate("teacher_review_queue")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Revisar</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Controlled Batch Publication */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#090e21] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Publicação Controlada em Lote</span>
                </h3>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBatchPublish} className="space-y-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                  <span>Você está prestes a publicar notas e pareceres oficiais para <strong>{summary.metrics.awaitingTeacherReviewCount}</strong> submissões revisadas.</span>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">
                    Justificativa Institucional da Publicação:
                  </label>
                  <textarea
                    rows={3}
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBatchModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    Confirmar e Publicar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
