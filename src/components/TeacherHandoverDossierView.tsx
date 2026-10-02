import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  FileCheck,
  Hash,
  Download,
  UserCheck,
  Sparkles,
  Award
} from "lucide-react";
import { toast } from "sonner";
import {
  TeacherHandoverService,
  HandoverDossier
} from "../services/teacherHandoverService";

interface TeacherHandoverDossierViewProps {
  onNavigate?: (tab: string) => void;
}

export default function TeacherHandoverDossierView({ onNavigate }: TeacherHandoverDossierViewProps) {
  const [dossiers, setDossiers] = useState<HandoverDossier[]>(() =>
    TeacherHandoverService.getDossiers()
  );
  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    dossiers[0]?.id || ""
  );
  const [newClarificationMsg, setNewClarificationMsg] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const selectedDossier = dossiers.find(d => d.id === selectedDossierId) || dossiers[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !newClarificationMsg.trim()) return;

    TeacherHandoverService.addClarificationMessage(selectedDossier.id, {
      authorName: "Prof. Djalma Batista",
      authorRole: "ORIGEM",
      message: newClarificationMsg
    });

    toast.success("Mensagem de esclarecimento enviada!");
    setDossiers([...TeacherHandoverService.getDossiers()]);
    setNewClarificationMsg("");
  };

  const handleConfirmReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    const ok = TeacherHandoverService.acknowledgeReceipt(
      selectedDossier.id,
      receiptNotes || "Dossiê recebido, conferido e homologado pelo professor sucessor."
    );

    if (ok) {
      toast.success("Protocolo de recebimento homologado com sucesso!", {
        description: "A transição de titularidade pedagógica foi concluída com selo SHA-256."
      });
      setDossiers([...TeacherHandoverService.getDossiers()]);
      setShowReceiptModal(false);
      setReceiptNotes("");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20 ring-1 ring-white/20">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Passagem de Turma entre Professores (Dossiê de Continuidade)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Transição Segura
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Resumo estruturado de continuidade pedagógica, matérias ministradas, pendências de notas e intervenções.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedDossier && selectedDossier.status !== "RECEBIDO_HOMOLOGADO" && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Registrar Protocolo de Recebimento</span>
            </button>
          )}
        </div>
      </div>

      {/* Security and Integrity Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Privacidade & Integridade dos Dados:</strong> Este dossiê contém apenas fatos pedagógicos essenciais e planos de aula. Dados pessoais sensíveis são resguardados e o pacote é protegido com hash de autenticidade SHA-256.
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Dossiers List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <span>Dossiês de Transição ({dossiers.length})</span>
          </h2>

          <div className="space-y-3">
            {dossiers.map(d => {
              const isSelected = d.id === selectedDossier?.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDossierId(d.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-rose-500/60 shadow-lg shadow-rose-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {d.className}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        d.status === "RECEBIDO_HOMOLOGADO"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {d.status === "RECEBIDO_HOMOLOGADO" ? "Homologado" : "Transmitido"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug">
                    {d.disciplineName}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
                    <span>{d.originTeacherName} ➔ {d.targetTeacherName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Dossier Document View */}
        {selectedDossier && (
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-6">
              {/* Dossier Header & SHA-256 Seal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {selectedDossier.className}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Dossiê #{selectedDossier.id}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white font-display mt-0.5">
                    {selectedDossier.disciplineName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    De: <strong className="text-slate-200">{selectedDossier.originTeacherName}</strong> ➔ Para: <strong className="text-slate-200">{selectedDossier.targetTeacherName}</strong> ({selectedDossier.targetTeacherEmail})
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                    <Hash className="w-3.5 h-3.5 text-rose-400" />
                    <span>Integridade: {selectedDossier.integrityHashSha256.substring(0, 16)}...</span>
                  </div>
                  {selectedDossier.status === "RECEBIDO_HOMOLOGADO" && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Recebimento Homologado ({selectedDossier.successorAcknowledgement?.formalReceiptCode})
                    </span>
                  )}
                </div>
              </div>

              {/* 1. Taught Topics Confirmed */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-emerald-400 font-bold block">
                  1. Conteúdos Efetivamente Ministrados ({selectedDossier.taughtTopics.reduce((s, t) => s + t.hoursExecuted, 0)}h)
                </span>
                <div className="space-y-2">
                  {selectedDossier.taughtTopics.map((top, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex justify-between font-bold text-white mb-0.5">
                        <span>{top.topic}</span>
                        <span className="font-mono text-emerald-400">{top.hoursExecuted}h (em {top.completionDateIso})</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Competência: {top.competencyAchieved}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Remaining Syllabus */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold block">
                  2. Ementa Restante & Cronograma Estimado ({selectedDossier.remainingSyllabus.reduce((s, t) => s + t.estimatedHours, 0)}h)
                </span>
                <div className="space-y-2">
                  {selectedDossier.remainingSyllabus.map((rem, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex justify-between font-bold text-white mb-0.5">
                        <span>{rem.topic}</span>
                        <span className="font-mono text-amber-400">{rem.estimatedHours}h previstas</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">Estratégia Recomendada: {rem.recommendedStrategies}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Backlog & Pedagogical Interventions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                    Pendências de Avaliação
                  </span>
                  <p className="text-slate-300">
                    <strong>{selectedDossier.evaluationBacklog.pendingReviewsCount}</strong> correções pendentes • <strong>{selectedDossier.evaluationBacklog.openStudentAppealsCount}</strong> recurso em aberto.
                  </p>
                  <p className="text-slate-400 italic text-[11px]">
                    "{selectedDossier.evaluationBacklog.criticalNotes}"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">
                    Intervenções Pedagógicas Registradas
                  </span>
                  {selectedDossier.pedagogicalInterventions.map((intv, idx) => (
                    <div key={idx} className="text-[11px]">
                      <strong className="text-white">{intv.clusterName} ({intv.affectedStudentsCount} alunos)</strong>
                      <p className="text-slate-400 mt-0.5">{intv.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clarification Q&A Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold block flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <span>Canal de Esclarecimentos entre Docentes ({selectedDossier.clarificationThread.length})</span>
                </span>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedDossier.clarificationThread.map(msg => (
                    <div
                      key={msg.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1"
                    >
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <strong className="text-rose-300">{msg.authorName} ({msg.authorRole})</strong>
                        <span>{msg.timestampIso.split("T")[0]}</span>
                      </div>
                      <p className="text-slate-200">{msg.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar esclarecimento ou dúvida sobre a transição..."
                    value={newClarificationMsg}
                    onChange={(e) => setNewClarificationMsg(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Confirm Receipt Protocol */}
      <AnimatePresence>
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#090e21] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-rose-400" />
                  <span>Registrar Protocolo de Recebimento da Turma</span>
                </h3>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmReceipt} className="space-y-4 text-xs font-mono">
                <p className="text-slate-300">
                  Ao confirmar, você declara ter recebido e conferido os conteúdos ministrados, materiais e pendências de avaliação da disciplina.
                </p>

                <div>
                  <label className="block text-slate-300 mb-1">
                    Parecer do Professor Sucessor (Opcional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ex: Conteúdos conferidos. Assumindo a turma a partir do Módulo 4 de Dicionários..."
                    value={receiptNotes}
                    onChange={(e) => setReceiptNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    Homologar Recebimento
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
