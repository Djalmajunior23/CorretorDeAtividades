import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Edit3,
  Save,
  Plus,
  Trash2,
  FileText,
  Download,
  Info,
  ShieldCheck,
  Calendar,
  Award
} from "lucide-react";
import { toast } from "sonner";
import {
  SmartLessonPlannerService,
  LessonPlanProposal,
  LessonBlock
} from "../services/smartLessonPlannerService";

interface SmartLessonPlannerViewProps {
  onNavigate?: (tab: string) => void;
}

export default function SmartLessonPlannerView({ onNavigate }: SmartLessonPlannerViewProps) {
  const [proposals, setProposals] = useState<LessonPlanProposal[]>(() =>
    SmartLessonPlannerService.getProposals()
  );
  const [selectedProposalId, setSelectedProposalId] = useState<string>(
    proposals[0]?.id || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  // New Custom Proposal form state
  const [customTopic, setCustomTopic] = useState("");
  const [customCompetency, setCustomCompetency] = useState("");
  const [customDuration, setCustomDuration] = useState(100);
  const [customClass, setCustomClass] = useState("Desenvolvimento de Sistemas - Turma A");
  const [customEvidenceSummary, setCustomEvidenceSummary] = useState("");

  const selectedProposal = proposals.find(p => p.id === selectedProposalId) || proposals[0];

  const handleApprove = () => {
    if (!selectedProposal) return;
    const ok = SmartLessonPlannerService.approveProposal(selectedProposal.id, teacherNotes);
    if (ok) {
      toast.success("Roteiro de aula homologado oficialmente!", {
        description: "O plano agora está ativo no seu Diário de Classe sem alterações automáticas externas."
      });
      setProposals([...SmartLessonPlannerService.getProposals()]);
    }
  };

  const handleBlockDurationChange = (blockId: string, delta: number) => {
    if (!selectedProposal) return;
    const updatedBlocks = selectedProposal.blocks.map(b => {
      if (b.id === blockId) {
        const newDur = Math.max(5, b.durationMinutes + delta);
        return { ...b, durationMinutes: newDur };
      }
      return b;
    });

    const newTotal = updatedBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
    const updatedProp: LessonPlanProposal = {
      ...selectedProposal,
      blocks: updatedBlocks,
      totalDurationMinutes: newTotal
    };

    SmartLessonPlannerService.updateProposal(updatedProp);
    setProposals([...SmartLessonPlannerService.getProposals()]);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic || !customCompetency) {
      toast.error("Preencha o tópico e a competência pedagógica.");
      return;
    }

    const created = SmartLessonPlannerService.generateCustomProposal({
      classId: "turma-custom",
      className: customClass,
      topic: customTopic,
      competencyTarget: customCompetency,
      totalDurationMinutes: customDuration,
      previouslyTaughtContent: ["Conteúdo prévio da disciplina"],
      evidenceSummary: customEvidenceSummary || undefined
    });

    toast.success("Novo roteiro gerado com sucesso!");
    setProposals([...SmartLessonPlannerService.getProposals()]);
    setSelectedProposalId(created.id);
    setShowCustomModal(false);
    setCustomTopic("");
    setCustomCompetency("");
  };

  const getBlockTypeColor = (type: LessonBlock["type"]) => {
    switch (type) {
      case "ABERTURA":
        return "border-amber-500/40 bg-amber-500/10 text-amber-400";
      case "EXPLICACAO":
        return "border-cyan-500/40 bg-cyan-500/10 text-cyan-400";
      case "PRATICA":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
      case "VERIFICACAO":
        return "border-indigo-500/40 bg-indigo-500/10 text-indigo-400";
      case "ENCERRAMENTO":
        return "border-purple-500/40 bg-purple-500/10 text-purple-400";
      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Preparação Assistida da Próxima Aula
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                5 Blocos Pedagógicos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Roteiros estruturados a partir das evidências das atividades recentes e objetivos docentes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Roteiro Sob Medida</span>
          </button>
        </div>
      </div>

      {/* Zero Auto-Publish Policy Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Garantia de Autonomia Docente:</strong> As sugestões servem como base editável. O CodeCheck nunca publica tarefas, altera o planejamento institucional ou envia materiais aos estudantes de forma autônoma sem sua expressa homologação.
        </div>
      </div>

      {/* Main Grid: Proposal Selector and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Proposals List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Roteiros Sugeridos ({proposals.length})</span>
          </h2>

          <div className="space-y-3">
            {proposals.map(p => {
              const isSelected = p.id === selectedProposal?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProposalId(p.id);
                    setIsEditing(false);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.className}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        p.status === "APROVADO_OFICIAL"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : p.status === "REVISADO_DOCENTE"
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {p.status === "APROVADO_OFICIAL"
                        ? "Homologado"
                        : p.status === "REVISADO_DOCENTE"
                        ? "Revisado"
                        : "Sugestão IA"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {p.topic}
                  </h3>

                  <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {p.totalDurationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      {p.blocks.length} blocos
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Proposal Interactive Canvas */}
        {selectedProposal && (
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Header Card */}
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {selectedProposal.className}
                  </span>
                  <h2 className="text-lg font-bold text-white font-display mt-0.5">
                    {selectedProposal.topic}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {selectedProposal.status !== "APROVADO_OFICIAL" ? (
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Homologar Roteiro</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Plano Homologado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Competency & Evidence Grounding */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-1">
                    Competência-Alvo
                  </span>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedProposal.competencyTarget}
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  selectedProposal.evidenceFound.hasSufficientData
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-amber-950/20 border-amber-500/30"
                }`}>
                  <span className={`text-[10px] font-mono uppercase font-bold block mb-1 ${
                    selectedProposal.evidenceFound.hasSufficientData ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    Evidência Base ({selectedProposal.evidenceFound.source})
                  </span>
                  <p className="text-xs text-slate-300">
                    {selectedProposal.evidenceFound.summary}
                  </p>
                  {selectedProposal.evidenceFound.dataLimitationWarning && (
                    <div className="mt-2 text-[11px] text-amber-300/90 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{selectedProposal.evidenceFound.dataLimitationWarning}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5 Pedagogical Blocks Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Estrutura dos 5 Blocos ({selectedProposal.totalDurationMinutes} min no total)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Ajuste durações com os controles (+ / -)
                </span>
              </div>

              <div className="space-y-3">
                {selectedProposal.blocks.map((block, idx) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${getBlockTypeColor(block.type)}`}>
                          {block.name}
                        </span>
                      </div>

                      {/* Duration adjust buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBlockDurationChange(block.id, -5)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                          title="Diminuir 5 min"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-white px-2">
                          {block.durationMinutes} min
                        </span>
                        <button
                          onClick={() => handleBlockDurationChange(block.id, 5)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
                          title="Aumentar 5 min"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {block.description}
                    </p>

                    {/* Suggested activities and materials tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                      {block.suggestedActivities.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                            Atividades Sugeridas:
                          </span>
                          <ul className="space-y-1 text-slate-300">
                            {block.suggestedActivities.map((act, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-cyan-400 font-bold">•</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {block.recommendedMaterials.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block mb-1">
                            Materiais Recomendados:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {block.recommendedMaterials.map((mat, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5"
                              >
                                <BookOpen className="w-3 h-3 text-cyan-400" />
                                <span>{mat.title}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {block.groundedEvidenceNote && (
                      <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{block.groundedEvidenceNote}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Teacher Notes & Custom Remarks */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <label className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Observações & Ajustes do Docente</span>
              </label>
              <textarea
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="Insira anotações específicas para a condução desta aula..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Custom Lesson Proposal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl bg-[#090e21] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Novo Roteiro de Aula Assistido</span>
                </h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustom} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-300 mb-1">Turma Destino:</label>
                  <input
                    type="text"
                    value={customClass}
                    onChange={(e) => setCustomClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Tópico / Conteúdo da Aula:</label>
                  <input
                    type="text"
                    placeholder="ex: Estruturas Condicionais e Tratamento de Exceções"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Competência Pedagógica Alvo:</label>
                  <input
                    type="text"
                    placeholder="ex: Implementar rotinas defensivas com try/except"
                    value={customCompetency}
                    onChange={(e) => setCustomCompetency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Duração Total (minutos):</label>
                  <input
                    type="number"
                    min={30}
                    max={240}
                    step={10}
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Evidências / Notas Recentes (Opcional):</label>
                  <textarea
                    placeholder="ex: 30% dos alunos tiveram dificuldade no último exercício de parsing..."
                    value={customEvidenceSummary}
                    onChange={(e) => setCustomEvidenceSummary(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
                  >
                    Gerar Roteiro
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
