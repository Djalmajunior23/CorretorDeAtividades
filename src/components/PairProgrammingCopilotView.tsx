import React, { useState } from "react";
import {
  Users,
  Bot,
  User,
  Send,
  Play,
  RotateCcw,
  FileDown,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Code2,
  Terminal,
  Zap,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  PairingSession,
  CopilotMode,
  PairProgrammingCopilotService
} from "../services/pairProgrammingCopilotService";

export const PairProgrammingCopilotView: React.FC = () => {
  const [studentName, setStudentName] = useState("Lucas Gabriel");
  const [problemTitle, setProblemTitle] = useState("Validação de Token JWT e Permissões RBAC");
  const [problemDescription, setProblemDescription] = useState("Implementar middleware com validação de expiração e escopos de usuário sem usar bibliotecas inseguras.");
  const [language, setLanguage] = useState("typescript");
  const [mode, setMode] = useState<CopilotMode>("SOCRATIC_NAVIGATOR");

  const [session, setSession] = useState<PairingSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentMessage, setStudentMessage] = useState("");
  const [studentCodeSnippet, setStudentCodeSnippet] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pairing/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          problemTitle,
          problemDescription,
          language,
          mode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          toast.success("Sessão de Programação em Par iniciada!");
          return;
        }
      }

      // Fallback
      const fallbackSession = await PairProgrammingCopilotService.startSession({
        studentName,
        problemTitle,
        problemDescription,
        language,
        mode
      });
      setSession(fallbackSession);
      toast.success("Sessão iniciada via serviço local.");
    } catch (err: any) {
      console.warn("Pairing API error, using fallback:", err);
      const fallbackSession = await PairProgrammingCopilotService.startSession({
        studentName,
        problemTitle,
        problemDescription,
        language,
        mode
      });
      setSession(fallbackSession);
      toast.success("Sessão iniciada com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTurn = async () => {
    if (!session || !studentMessage.trim()) return;

    const currentMsg = studentMessage;
    const currentCode = studentCodeSnippet;
    setStudentMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/pairing/interact-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          studentMessage: currentMsg,
          studentCodeSnippet: currentCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updatedSession) {
          setSession(data.updatedSession);
          return;
        }
      }

      // Fallback
      const { updatedSession } = await PairProgrammingCopilotService.interactSocraticTurn({
        session,
        studentMessage: currentMsg,
        studentCodeSnippet: currentCode
      });
      setSession(updatedSession);
    } catch (err: any) {
      console.warn("Turn error, fallback:", err);
      const { updatedSession } = await PairProgrammingCopilotService.interactSocraticTurn({
        session,
        studentMessage: currentMsg,
        studentCodeSnippet: currentCode
      });
      setSession(updatedSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceTdd = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/pairing/ping-pong-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          studentCode: studentCodeSnippet || "// Solução enviada pelo aluno"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updatedSession) {
          setSession(data.updatedSession);
          toast.success(data.nextInstruction || "Ciclo TDD avançado!");
          return;
        }
      }

      const { updatedSession, nextInstruction } = await PairProgrammingCopilotService.advancePingPongStep({
        session,
        studentCode: studentCodeSnippet
      });
      setSession(updatedSession);
      toast.success(nextInstruction);
    } catch (err: any) {
      const { updatedSession, nextInstruction } = await PairProgrammingCopilotService.advancePingPongStep({
        session,
        studentCode: studentCodeSnippet
      });
      setSession(updatedSession);
      toast.success(nextInstruction);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!session) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/pairing/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await PairProgrammingCopilotService.generatePairingSessionPdf(session);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mentoria_pair_${session.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dossiê de Mentoria Socrática baixado!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" /> Socratic AI Pair Copilot
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Ping-Pong TDD Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Real-Time Pair Programming Copilot
          </h1>
          <p className="text-slate-400 text-sm">
            Mentoria socrática sem respostas prontas mastigadas, ciclos guiados Red-Green-Refactor e rastreamento de autonomia cognitiva.
          </p>
        </div>

        {session && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Dossiê..." : "Exportar Mentoria (PDF)"}
          </button>
        )}
      </div>

      {!session ? (
        /* Setup Box */
        <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Configuração da Sessão de Par Pedagógico
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Estudante</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Linguagem</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Modo Pedagógico de Pareamento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("SOCRATIC_NAVIGATOR")}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === "SOCRATIC_NAVIGATOR"
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-purple-400" /> Navegador Socrático
                </div>
                <div className="text-[11px] text-slate-400">
                  Guia dialético com perguntas investigativas sem dar o código de bandeja.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("PING_PONG_TDD")}
                className={`p-3 rounded-xl border text-left transition ${
                  mode === "PING_PONG_TDD"
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" /> Ping-Pong TDD
                </div>
                <div className="text-[11px] text-slate-400">
                  Ciclo alternado: AI gera teste falhante (RED) e o aluno implementa a solução (GREEN).
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Título do Desafio / Tarefa</label>
            <input
              type="text"
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descrição / Requisitos</label>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none"
            />
          </div>

          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Iniciar Sessão de Pareamento AI
          </button>
        </div>
      ) : (
        /* Active Pairing Session Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dialogue & Chat */}
          <div className="lg:col-span-7 space-y-4">
            {/* Score Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Autonomia do Aluno</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${session.autonomyScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-300">{session.autonomyScore}%</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Nível Bloom</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 block">
                  {session.bloomsTaxonomyLevel}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-4 shadow-xl">
              {session.turns.map((turn) => {
                const isAi = turn.sender === "COPILOT_AI";
                return (
                  <div
                    key={turn.turnId}
                    className={`flex gap-3 ${isAi ? "items-start" : "items-start flex-row-reverse"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isAi
                          ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                          : "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                      }`}
                    >
                      {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 text-xs space-y-2 ${
                        isAi
                          ? "bg-slate-950 border border-slate-800 text-slate-200"
                          : "bg-blue-600/20 border border-blue-500/30 text-blue-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500">
                        <span className="font-semibold">{isAi ? "Copilot Socrático AI" : session.studentName}</span>
                        <span>{new Date(turn.timestamp).toLocaleTimeString("pt-BR")}</span>
                      </div>

                      <p className="leading-relaxed">{turn.message}</p>

                      {turn.codeSnippet && (
                        <pre className="bg-black/60 p-2.5 rounded-lg font-mono text-[11px] text-purple-300 overflow-x-auto whitespace-pre-wrap border border-purple-500/20">
                          {turn.codeSnippet}
                        </pre>
                      )}

                      {turn.socraticHintLevel && (
                        <div className="text-[10px] text-purple-400 font-medium flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" /> Nível de Dica Socrática: {turn.socraticHintLevel}/4
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendTurn()}
                  placeholder="Pergunte ao Copilot ou explique sua linha de raciocínio..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={handleSendTurn}
                  disabled={isLoading || !studentMessage.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & TDD Console */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" /> Seu Código de Trabalho ({session.language})
                </h3>
                {session.mode === "PING_PONG_TDD" && session.tddState && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    session.tddState.currentPhase === "RED_FAILING_TEST"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : session.tddState.currentPhase === "GREEN_PASSING_CODE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {session.tddState.currentPhase} (Ciclo {session.tddState.currentCycle})
                  </span>
                )}
              </div>

              <textarea
                value={studentCodeSnippet}
                onChange={(e) => setStudentCodeSnippet(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-purple-500/50 leading-relaxed"
                placeholder="// Escreva sua solução aqui para validar com o Copilot..."
              />

              {session.mode === "PING_PONG_TDD" ? (
                <button
                  onClick={handleAdvanceTdd}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Avançar Ciclo Ping-Pong TDD (Submeter Código)
                </button>
              ) : (
                <button
                  onClick={handleSendTurn}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" /> Solicitar Revisão Dialética do Código
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairProgrammingCopilotView;
