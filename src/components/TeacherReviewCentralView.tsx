import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles, 
  Edit3, 
  RefreshCw, 
  ShieldCheck, 
  Filter, 
  User, 
  Code2, 
  ChevronRight,
  MessageSquare,
  Award,
  AlertTriangle,
  History,
  Check,
  X
} from "lucide-react";
import { TraceableGradingService, TraceableGradingAttempt } from "../services/traceableGradingService";

export default function TeacherReviewCentralView() {
  const [queue, setQueue] = useState<TraceableGradingAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<TraceableGradingAttempt | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  
  // Review form state
  const [adjustedScore, setAdjustedScore] = useState<number>(0);
  const [justification, setJustification] = useState<string>("");
  const [actionType, setActionType] = useState<"APPROVED" | "ADJUSTED_SCORE" | "REQUESTED_REFACTORING">("APPROVED");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadQueue = () => {
    const items = TraceableGradingService.getReviewQueue({
      classId: classFilter,
      reason: reasonFilter
    });
    setQueue(items);
    if (items.length > 0 && (!selectedAttempt || !items.find(i => i.attemptId === selectedAttempt.attemptId))) {
      setSelectedAttempt(items[0]);
      setAdjustedScore(items[0].suggestedScore);
      setJustification(items[0].studentAppeal?.studentRationale ? "Recurso acatado parcialmente após revisão." : "Nota homologada conforme critérios da rubrica.");
    }
  };

  useEffect(() => {
    loadQueue();
  }, [classFilter, reasonFilter]);

  useEffect(() => {
    if (selectedAttempt) {
      setAdjustedScore(selectedAttempt.suggestedScore);
      setJustification(selectedAttempt.studentAppeal ? "Recurso do aluno analisado: ajustes aplicados aos casos limite." : "Nota validada pelo docente.");
    }
  }, [selectedAttempt]);

  const handlePublishReview = () => {
    if (!selectedAttempt) return;

    TraceableGradingService.publishTeacherReview({
      attemptId: selectedAttempt.attemptId,
      reviewerId: "prof-djalma",
      reviewerName: "Professor Djalma Batista",
      finalPublishedScore: actionType === "REQUESTED_REFACTORING" ? 0 : adjustedScore,
      writtenJustification: justification,
      actionTaken: actionType,
      appealStatusUpdate: selectedAttempt.studentAppeal ? (actionType === "ADJUSTED_SCORE" ? "ACCEPTED" : "REJECTED") : undefined
    });

    setToastMessage(`Decisão registrada com sucesso: ${actionType === 'APPROVED' ? 'Nota Homologada' : actionType === 'ADJUSTED_SCORE' ? 'Nota Ajustada' : 'Refação Solicitada'}`);
    setTimeout(() => setToastMessage(null), 3500);
    loadQueue();
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0b1329] to-[#040817] border border-cyan-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              AUDITORIA & DECISÃO DOCENTE
            </span>
            <span className="text-xs text-slate-400 font-mono">• {queue.length} itens aguardando ação</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            Central de Revisão Docente
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Triagem e homologação de notas com separação estrita entre sugestões automáticas e notas oficiais publicadas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-mono"
            >
              <option value="all">Todos os Motivos</option>
              <option value="appeal">Recursos / Pedidos de Alunos</option>
              <option value="failure">Falhas Técnicas de Execução</option>
              <option value="timeout">Timeouts de Aluno</option>
            </select>
          </div>

          <button
            onClick={loadQueue}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all"
            title="Atualizar Fila"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Grid: Queue List (Left) & Side-by-Side Reviewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Queue */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Fila de Pendências</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {queue.length} aguardando
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/60" />
              <span className="text-xs font-bold text-slate-300">Fila Limpa!</span>
              <p className="text-[11px] text-slate-500">Todas as submissões e recursos já foram revisados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[750px] overflow-y-auto pr-1">
              {queue.map((item) => {
                const isSelected = selectedAttempt?.attemptId === item.attemptId;
                const isAppeal = item.studentAppeal?.status === "PENDING";
                const isTimeout = item.errorType === "STUDENT_TIMEOUT";

                return (
                  <div
                    key={item.attemptId}
                    onClick={() => setSelectedAttempt(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/5"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.studentName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                        Tentativa #{item.attemptNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{item.activityId} ({item.activityVersion})</span>
                      <span className="text-amber-400 font-bold">Nota Sugerida: {item.suggestedScore} pts</span>
                    </div>

                    {/* Tag Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {isAppeal && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5" />
                          Recurso do Aluno
                        </span>
                      )}
                      {isTimeout && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Time Limit Exceeded
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                        {item.testsPassed}/{item.totalTests} testes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Side-by-Side Review Workplace */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {selectedAttempt ? (
            <div className="p-6 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-6 shadow-2xl">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedAttempt.studentName}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                      {selectedAttempt.codeLanguage.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Atividade: {selectedAttempt.activityId} • Versão {selectedAttempt.activityVersion} • Checksum SHA-256: {selectedAttempt.codeSha256.slice(0, 12)}...
                  </span>
                </div>

                {/* Score summary comparison */}
                <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Sugerido (IA/Testes)</span>
                    <span className="text-lg font-bold text-amber-400 font-mono">{selectedAttempt.suggestedScore} / 100</span>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-800" />
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">Publicado (Docente)</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {selectedAttempt.isPublished && selectedAttempt.publishedScore !== null ? `${selectedAttempt.publishedScore} / 100` : "Em Revisão"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Appeal Notification Callout (if present) */}
              {selectedAttempt.studentAppeal && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      Justificativa do Recurso Submetido pelo Aluno:
                    </span>
                    <span className="text-[10px] text-amber-400/80">{new Date(selectedAttempt.studentAppeal.appealedAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-amber-500/20 italic">
                    "{selectedAttempt.studentAppeal.studentRationale}"
                  </p>
                </div>
              )}

              {/* Code Snippet Viewer */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Código Submetido pelo Aluno (Tentativa #{selectedAttempt.attemptNumber})
                </span>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                  {selectedAttempt.codeSnippet}
                </pre>
              </div>

              {/* Rubric Criteria Evaluation */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Critérios da Rubrica Pedagógica
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedAttempt.rubricCriteria.map((crit) => (
                    <div key={crit.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{crit.name}</span>
                          <span className="text-xs font-mono font-bold text-cyan-400">{crit.scoreObtained}/{crit.weight} pts</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{crit.description}</p>
                      </div>
                      <p className="text-[10px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 italic">
                        {crit.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Cases Breakdown (Showing Public and Private) */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Casos de Teste Executados no Sandbox
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedAttempt.testCases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className={`p-3 rounded-xl border text-xs font-mono flex flex-col gap-1.5 ${
                        tc.passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">
                          Teste #{idx + 1} {tc.isPrivate && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded ml-1">Privado</span>}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tc.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                          {tc.passed ? "APROVADO" : "FALHOU"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Entrada: <code className="text-white font-bold">{tc.input}</code> | Esperado: <code className="text-white">{tc.expectedOutput}</code>
                      </div>
                      {!tc.passed && tc.actualOutput && (
                        <div className="text-[11px] text-rose-300">
                          Obtido: <code className="text-rose-200 font-bold">{tc.actualOutput}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Decision & Publishing Panel */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/30 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    Decisão e Homologação da Nota Oficial
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Ação Auditada • Registro Imutável</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActionType("APPROVED")}
                    className={`p-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                      actionType === "APPROVED"
                        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Homologar Nota Sugerida
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("ADJUSTED_SCORE")}
                    className={`p-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                      actionType === "ADJUSTED_SCORE"
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Ajustar Nota com Justificativa
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("REQUESTED_REFACTORING")}
                    className={`p-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 ${
                      actionType === "REQUESTED_REFACTORING"
                        ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300 shadow-md shadow-indigo-500/10"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Solicitar Refação Orientada
                  </button>
                </div>

                {actionType === "ADJUSTED_SCORE" && (
                  <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <label className="text-xs font-mono font-bold text-slate-300">Nova Nota Final:</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={adjustedScore}
                      onChange={(e) => setAdjustedScore(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-sm font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-xs text-slate-500 font-mono">/ 100 pontos</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300">Justificativa e Parecer Docente (Visível ao Estudante):</label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Descreva a razão pedagógica da aprovação, ajuste de nota ou orientações para a refação..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handlePublishReview}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Publicar Decisão e Notificar Aluno
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-950/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-3">
              <FileText className="w-12 h-12 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-400 font-mono">Nenhuma submissão selecionada</h3>
              <p className="text-xs text-slate-500">Selecione uma pendência na fila à esquerda para auditar e homologar a nota.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
