import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  EyeOff,
  Eye,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  Save,
  MessageSquare,
  Lock,
  Unlock,
  ChevronRight,
  Terminal,
  Award,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import {
  BlindGradingService,
  BlindSubmissionItem
} from "../services/blindGradingService";
import { ReusableFeedbackBankService } from "../services/reusableFeedbackBankService";

interface BlindGradingStudioViewProps {
  onNavigate?: (tab: string) => void;
}

export default function BlindGradingStudioView({ onNavigate }: BlindGradingStudioViewProps) {
  const [submissions, setSubmissions] = useState<BlindSubmissionItem[]>(() =>
    BlindGradingService.getSubmissions()
  );
  const [selectedSubId, setSelectedSubId] = useState<string>(
    submissions[0]?.submissionId || ""
  );
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({});
  const [criteriaComments, setCriteriaComments] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");

  const selectedSub = submissions.find(s => s.submissionId === selectedSubId) || submissions[0];

  const handleSelectSubmission = (sub: BlindSubmissionItem) => {
    setSelectedSubId(sub.submissionId);
    const scores: Record<string, number> = {};
    const comments: Record<string, string> = {};
    sub.rubricCriteria.forEach(c => {
      scores[c.id] = c.assignedPoints !== undefined ? c.assignedPoints : c.maxPoints;
      comments[c.id] = c.feedbackComment || "";
    });
    setCriteriaScores(scores);
    setCriteriaComments(comments);
  };

  const handleScoreChange = (critId: string, value: number) => {
    setCriteriaScores(prev => ({ ...prev, [critId]: value }));
  };

  const handleCommentChange = (critId: string, comment: string) => {
    setCriteriaComments(prev => ({ ...prev, [critId]: comment }));
  };

  const handleInsertSnippetTag = (critId: string, tag: string) => {
    const snip = ReusableFeedbackBankService.getByShortcut(tag);
    if (snip) {
      const formatted = `[Obs]: ${snip.observationTemplate} | [Ação]: ${snip.guidanceNextAction}`;
      setCriteriaComments(prev => ({
        ...prev,
        [critId]: prev[critId] ? `${prev[critId]}\n${formatted}` : formatted
      }));
      toast.success(`Snippet '${tag}' inserido!`);
    } else {
      toast.error(`Snippet '${tag}' não encontrado no banco.`);
    }
  };

  const handleSaveGrade = () => {
    if (!selectedSub) return;
    const scoresList = selectedSub.rubricCriteria.map(c => ({
      criterionId: c.id,
      points: criteriaScores[c.id] !== undefined ? criteriaScores[c.id] : c.maxPoints,
      feedbackComment: criteriaComments[c.id]
    }));

    const ok = BlindGradingService.gradeSubmission(selectedSub.submissionId, scoresList);
    if (ok) {
      toast.success(`Avaliação cega concluída para ${selectedSub.pseudonym}!`, {
        description: "A nota foi calculada e a associação com o estudante segue preservada com segurança."
      });
      setSubmissions([...BlindGradingService.getSubmissions()]);
    }
  };

  const handleRevealIdentity = () => {
    if (!selectedSub) return;
    const ok = BlindGradingService.revealIdentity(selectedSub.submissionId, "Prof. Djalma Batista");
    if (ok) {
      toast.info(`Identidade revelada para auditoria: ${selectedSub.realIdentity.studentName}`, {
        description: "Ação registrada no log de integridade avaliativa."
      });
      setSubmissions([...BlindGradingService.getSubmissions()]);
    }
  };

  const handleRevealAll = () => {
    const count = BlindGradingService.revealAllForActivity("all", "Prof. Djalma Batista");
    toast.info(`Identidades reveladas para ${count} submissões.`);
    setSubmissions([...BlindGradingService.getSubmissions()]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-800/40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-slate-800 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <EyeOff className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Estúdio de Correção sem Identificação (Duplo-Cega)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Anti-Viés Avaliativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Avalie o código e os critérios por pseudônimos. A identidade é ocultada para garantir imparcialidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRevealAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono transition-all border border-slate-700 cursor-pointer"
          >
            <Unlock className="w-4 h-4 text-indigo-400" />
            <span>Revelar Todas as Identidades</span>
          </button>
        </div>
      </div>

      {/* Critical Limitation & Security Warning */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Aviso Pedagógico de Anonimato:</strong> O sistema oculta nomes, fotos e matrículas dos metadados oficiais. No entanto, códigos-fonte e comentários enviados pelos estudantes podem conter nomes ou apelidos inseridos no texto. O anonimato é garantido no fluxo da interface.
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Pseudonym Submissions List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Fila Pseudonimizada ({submissions.length})</span>
          </h2>

          <div className="space-y-3">
            {submissions.map(sub => {
              const isSelected = sub.submissionId === selectedSub?.submissionId;
              return (
                <div
                  key={sub.submissionId}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                      <EyeOff className="w-3 h-3" />
                      {sub.pseudonym}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        sub.gradingStatus === "CORRIGIDO"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {sub.gradingStatus === "CORRIGIDO" ? `Nota: ${sub.finalScore}` : "Pendente"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white leading-snug">
                    {sub.activityTitle}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">
                      {sub.testsPassed} / {sub.totalTests} testes ok
                    </span>
                    {sub.isIdentityRevealed ? (
                      <span className="text-indigo-300 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {sub.realIdentity.studentName}
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Identidade Oculta
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Anonymous Code Review & Rubric Grading */}
        {selectedSub && (
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Header Card */}
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4" />
                      {selectedSub.pseudonym}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedSub.className}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white font-display mt-0.5">
                    {selectedSub.activityTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedSub.isIdentityRevealed ? (
                    <button
                      onClick={handleRevealIdentity}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer"
                      title="Revelar identidade real deste estudante"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Revelar Identidade</span>
                    </button>
                  ) : (
                    <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs font-mono text-indigo-300">
                      <strong>Estudante:</strong> {selectedSub.realIdentity.studentName} ({selectedSub.realIdentity.registrationNumber})
                    </div>
                  )}

                  <button
                    onClick={handleSaveGrade}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Avaliação</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer Panel */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Code2 className="w-4 h-4" />
                    Código Submetido ({selectedSub.language})
                  </span>
                  <span>{selectedSub.testsPassed}/{selectedSub.totalTests} Testes Automatizados Aprovados</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre className="leading-relaxed">{selectedSub.codeContent}</pre>
                </div>
              </div>

              {/* Rubric Evaluation Panel */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Critérios da Rubrica Avaliativa</span>
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                    <span>Atalhos rápidos:</span>
                    <button
                      onClick={() => handleInsertSnippetTag(selectedSub.rubricCriteria[0]?.id || "", "@offbyone")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px]"
                    >
                      @offbyone
                    </button>
                    <button
                      onClick={() => handleInsertSnippetTag(selectedSub.rubricCriteria[0]?.id || "", "@nullcheck")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px]"
                    >
                      @nullcheck
                    </button>
                    <button
                      onClick={() => handleInsertSnippetTag(selectedSub.rubricCriteria[0]?.id || "", "@cleancode")}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px]"
                    >
                      @cleancode
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedSub.rubricCriteria.map(crit => (
                    <div
                      key={crit.id}
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {crit.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={crit.maxPoints}
                            value={criteriaScores[crit.id] !== undefined ? criteriaScores[crit.id] : crit.maxPoints}
                            onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1 text-center text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-xs font-mono text-slate-400">/ {crit.maxPoints} pts</span>
                        </div>
                      </div>

                      <textarea
                        value={criteriaComments[crit.id] || ""}
                        onChange={(e) => handleCommentChange(crit.id, e.target.value)}
                        placeholder="Parecer formativo sobre este critério (digite @tag para sugestões)..."
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
