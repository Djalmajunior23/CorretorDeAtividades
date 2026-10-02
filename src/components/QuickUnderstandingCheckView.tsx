import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Code2,
  Bug,
  Plus,
  ArrowRight,
  ShieldAlert,
  Send,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import {
  QuickUnderstandingCheckService,
  QuickCheckSession,
  QuickCheckQuestion
} from "../services/quickUnderstandingCheckService";

interface QuickUnderstandingCheckViewProps {
  onNavigate?: (tab: string) => void;
}

export default function QuickUnderstandingCheckView({ onNavigate }: QuickUnderstandingCheckViewProps) {
  const [sessions, setSessions] = useState<QuickCheckSession[]>(() =>
    QuickUnderstandingCheckService.getSessions()
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || ""
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Quick simulation answer form state
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string>("");
  const [simulatedConfidence, setSimulatedConfidence] = useState<number>(4);
  const [simulatedName, setSimulatedName] = useState("Estudante Teste");

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  const stats = selectedSession ? QuickUnderstandingCheckService.getSessionStats(selectedSession.id) : null;

  const handleLinkReviewAction = () => {
    if (!selectedSession) return;
    const ok = QuickUnderstandingCheckService.linkReviewActionToNextClass(selectedSession.id);
    if (ok) {
      toast.success("Ação de revisão vinculada à próxima aula com sucesso!", {
        description: "Adicionada à sua Fila Inteligente de Trabalho para o planejamento do próximo encontro."
      });
      setSessions([...QuickUnderstandingCheckService.getSessions()]);
    }
  };

  const handleSimulateSubmit = () => {
    if (!selectedSession) return;
    const currentQ = selectedSession.questions[activeQuestionIndex];
    if (!currentQ) return;

    QuickUnderstandingCheckService.submitResponse(selectedSession.id, {
      studentPseudonymOrName: selectedSession.allowAnonymous ? "Estudante Anônimo" : simulatedName,
      isAnonymous: selectedSession.allowAnonymous,
      questionId: currentQ.id,
      selectedOptionId: selectedOpt || undefined,
      confidenceRating: currentQ.type === "AUTOAVALIACAO_CONFIANCA" ? simulatedConfidence : undefined
    });

    toast.success("Resposta registrada na verificação formativa!");
    setSessions([...QuickUnderstandingCheckService.getSessions()]);
    setSelectedOpt("");
    if (activeQuestionIndex < selectedSession.questions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Verificação Rápida do Entendimento (Exit Tickets)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Avaliação Formativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Micro-perguntas no início ou fim da aula para diagnosticar assimilação imediata sem penalização de notas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedSession && !selectedSession.linkedReviewActionCreated && (
            <button
              onClick={handleLinkReviewAction}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Vincular Ação à Próxima Aula</span>
            </button>
          )}
        </div>
      </div>

      {/* Formative Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Finalidade Estritamente Diagnóstica:</strong> Estas respostas têm caráter formativo e nunca são convertidas automaticamente em nota punitiva no boletim. O objetivo é calibrar o ritmo docente e direcionar reforços.
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sessions List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Sessões de Verificação ({sessions.length})</span>
          </h2>

          <div className="space-y-3">
            {sessions.map(s => {
              const isSelected = s.id === selectedSession?.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.className}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        s.moment === "FINAL_AULA_EXITTICKET"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {s.moment === "FINAL_AULA_EXITTICKET" ? "Exit Ticket" : "Warm-up"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {s.title}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {s.responses.length} respostas
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === "ATIVA" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Session Overview and Analytics */}
        {selectedSession && stats && (
          <div className="lg:col-span-2 space-y-6">
            {/* Session Stats Header Card */}
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                      {selectedSession.className}
                    </span>
                    {selectedSession.allowAnonymous && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Respostas Anônimas Permitidas
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white font-display mt-0.5">
                    {selectedSession.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedSession.linkedReviewActionCreated ? (
                    <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Ação Vinculada à Próxima Aula
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400">
                      Pendente de Vínculo Pedagógico
                    </span>
                  )}
                </div>
              </div>

              {/* High-level metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Participantes</span>
                  <span className="text-lg font-bold text-white font-mono">{stats.totalParticipants} / {stats.totalExpectedStudents}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Taxa de Adesão</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">{stats.participationRate.toFixed(0)}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Questões</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedSession.questions.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Total Respostas</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{selectedSession.responses.length}</span>
                </div>
              </div>
            </div>

            {/* Questions Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Resultados Detalhados por Questão</span>
              </h3>

              <div className="space-y-4">
                {stats.questionStats.map((qStat, idx) => {
                  const originalQ = selectedSession.questions.find(q => q.id === qStat.questionId);
                  return (
                    <div
                      key={qStat.questionId}
                      className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Questão #{idx + 1} ({qStat.type})
                        </span>
                        {qStat.type !== "AUTOAVALIACAO_CONFIANCA" ? (
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            qStat.accuracyRate >= 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          }`}>
                            Taxa de Acerto: {qStat.accuracyRate.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                            Média Confiança: {qStat.avgConfidence ? `${qStat.avgConfidence.toFixed(1)} / 5.0 ★` : "Sem dados"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-white">
                        {qStat.prompt}
                      </p>

                      {/* Code snippet if present */}
                      {originalQ?.codeSnippet && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                          <pre>{originalQ.codeSnippet}</pre>
                        </div>
                      )}

                      {/* Options breakdown */}
                      {originalQ?.options && (
                        <div className="space-y-1.5 text-xs">
                          {originalQ.options.map(opt => {
                            const answersForThisOpt = qStat.responses.filter(r => r.selectedOptionId === opt.id).length;
                            const ratio = qStat.totalAnswers > 0 ? (answersForThisOpt / qStat.totalAnswers) * 100 : 0;
                            return (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between ${
                                  opt.isCorrect
                                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                                    : "bg-slate-950/40 border-slate-800/80 text-slate-300"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {opt.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                                  <span>{opt.text}</span>
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-400">
                                  {answersForThisOpt} ({ratio.toFixed(0)}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {originalQ?.explanationNote && (
                        <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30 text-[11px] text-indigo-300 font-mono">
                          <strong>Gabarito Comentado:</strong> {originalQ.explanationNote}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
