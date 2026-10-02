import React, { useState } from "react";
import { 
  Users, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  MessageSquare, 
  Code2, 
  Send, 
  RefreshCw, 
  Filter,
  Eye,
  Check,
  X
} from "lucide-react";
import { PeerReviewService, PeerReviewAssignment } from "../services/peerReviewService";

export default function PeerReviewStudioView() {
  const [activeTab, setActiveTab] = useState<"STUDENT_REVIEW" | "TEACHER_MODERATION">("STUDENT_REVIEW");
  const [assignments, setAssignments] = useState<PeerReviewAssignment[]>(() => {
    return PeerReviewService.getAssignmentsForReviewer("std-vinicius");
  });
  const [selectedAssignment, setSelectedAssignment] = useState<PeerReviewAssignment | null>(assignments[0] || null);

  // Review Form
  const [score1, setScore1] = useState(9);
  const [comment1, setComment1] = useState("Código muito bem estruturado e com comentários claros.");
  const [score2, setScore2] = useState(8);
  const [comment2, setComment2] = useState("Lógica eficiente com range(2, n+1, 2).");
  const [qualitativeFeedback, setQualitativeFeedback] = useState("Gostei bastante da solução! Uma dica seria tratar n <= 0 logo no início.");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Moderation state
  const [moderationQueue, setModerationQueue] = useState<PeerReviewAssignment[]>(() => {
    return PeerReviewService.getModerationQueue();
  });

  const handleSubmitPeerReview = () => {
    if (!selectedAssignment) return;

    const overallScore = Math.round(((score1 + score2) / 20) * 100);
    const updated = PeerReviewService.submitEvaluation({
      assignmentId: selectedAssignment.assignmentId,
      rubricScores: [
        { criterionName: "Legibilidade e Organização", scoreGiven: score1, comment: comment1 },
        { criterionName: "Eficiência do Algoritmo", scoreGiven: score2, comment: comment2 }
      ],
      overallPeerScore: overallScore,
      qualitativeFeedback
    });

    if (updated) {
      setAssignments([...PeerReviewService.getAssignmentsForReviewer("std-vinicius")]);
      setSelectedAssignment({ ...updated });
      setToastMessage("Sua avaliação por pares foi enviada com sucesso e encaminhada para moderação docente!");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleModerate = (assignmentId: string, approved: boolean) => {
    PeerReviewService.moderateReview(assignmentId, approved, approved ? "Feedback construtivo aprovado pelo professor." : "Feedback reprovado por falta de detalhamento.");
    setModerationQueue([...PeerReviewService.getModerationQueue()]);
    setToastMessage(`Avaliação ${approved ? "Aprovada e Liberada ao Autor" : "Rejeitada para Ajustes"}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1829] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              AVALIAÇÃO FORMATIVA & COLABORAÇÃO
            </span>
            <span className="text-xs text-slate-400 font-mono">• Distribuição Duplo-Cega Pseudonimizada</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Estúdio de Revisão por Pares (Peer Review)
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Avalie o código de colegas de forma anônima e construtiva com base em rubricas guiadas. Todas as avaliações passam por moderação docente antes da liberação.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("STUDENT_REVIEW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "STUDENT_REVIEW"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Visão do Aluno Avaliador
          </button>
          <button
            onClick={() => setActiveTab("TEACHER_MODERATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "TEACHER_MODERATION"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Moderação Docente ({moderationQueue.length})
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STUDENT PEER REVIEW VIEW */}
      {activeTab === "STUDENT_REVIEW" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Assigned Peer Code List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono px-2">
              Códigos Atribuídos para Você Avaliar ({assignments.length})
            </span>

            <div className="flex flex-col gap-3">
              {assignments.map((item) => {
                const isSelected = selectedAssignment?.assignmentId === item.assignmentId;
                return (
                  <div
                    key={item.assignmentId}
                    onClick={() => setSelectedAssignment(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{item.authorPseudonym}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        item.status === "AVALIADO" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">{item.activityTitle}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Prazo: {new Date(item.deadlineIso).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Code Review & Rubric Scoring Form */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {selectedAssignment ? (
              <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      Avaliando: {selectedAssignment.authorPseudonym}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Atividade: {selectedAssignment.activityTitle} • Identidade do autor preservada por segurança.
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                    Seu pseudônimo: {selectedAssignment.reviewerPseudonym}
                  </span>
                </div>

                {/* Code Viewer */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    Código Submetido pelo Colega:
                  </span>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                    {selectedAssignment.codeSnippet}
                  </pre>
                </div>

                {/* Rubric Criteria Evaluation Inputs */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Critérios de Avaliação Orientada por Rubrica
                  </span>

                  {/* Criterion 1 */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">1. Legibilidade e Organização do Código</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{score1} / 10 pts</span>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={score1}
                          onChange={(e) => setScore1(Number(e.target.value))}
                          className="w-24 accent-cyan-500"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={comment1}
                      onChange={(e) => setComment1(e.target.value)}
                      placeholder="Deixe um comentário sobre a clareza e estrutura do código..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Criterion 2 */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">2. Eficiência e Lógica do Algoritmo</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{score2} / 10 pts</span>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={score2}
                          onChange={(e) => setScore2(Number(e.target.value))}
                          className="w-24 accent-cyan-500"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={comment2}
                      onChange={(e) => setComment2(e.target.value)}
                      placeholder="Deixe um comentário sobre a performance e tratamento de casos limite..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Qualitative Constructive Feedback */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300">
                      Parecer Formativo Construtivo (Dicas e Elogios):
                    </label>
                    <textarea
                      rows={3}
                      value={qualitativeFeedback}
                      onChange={(e) => setQualitativeFeedback(e.target.value)}
                      placeholder="Escreva elogios e sugestões de melhoria com respeito e foco pedagógico..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSubmitPeerReview}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar Avaliação para Moderação
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
                <Users className="w-10 h-10 text-slate-600" />
                <span className="text-xs font-bold text-slate-400">Selecione um código atribuído</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHER MODERATION QUEUE VIEW */}
      {activeTab === "TEACHER_MODERATION" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Fila de Moderação Docente ({moderationQueue.length} avaliações pendentes)
            </span>
          </div>

          {moderationQueue.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400/60" />
              <span className="text-xs font-bold text-slate-300">Nenhum feedback pendente de moderação</span>
              <p className="text-[11px] text-slate-500">Todas as avaliações dos pares foram revisadas e liberadas aos autores.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moderationQueue.map((item) => (
                <div key={item.assignmentId} className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">De: {item.reviewerPseudonym} ➔ Para: {item.authorPseudonym}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.activityTitle}</span>
                    </div>
                    <span className="text-sm font-bold font-mono text-cyan-400">{item.overallPeerScore} / 100</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Parecer Redigido:</span>
                    "{item.qualitativeFeedback}"
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleModerate(item.assignmentId, false)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Rejeitar Feedback
                    </button>
                    <button
                      onClick={() => handleModerate(item.assignmentId, true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aprovar & Liberar ao Autor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
