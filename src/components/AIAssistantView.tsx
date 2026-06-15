import React, { useState, useEffect } from "react";
import {
  Sparkles,
  FileText,
  BrainCircuit,
  Users,
  Target,
  CheckCircle2,
  Send,
  Loader2,
  Save,
  History,
  Trash2,
  HelpCircle,
  CornerDownLeft,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AIStatusDashboard } from "./AIStatusDashboard";
import { exportGenericResultToPDF } from "../utils/pdfExport";
import { exportToExcel, exportToCSV } from "../utils/dataExport";

interface HistoryItem {
  id: string;
  type: string;
  prompt: string;
  timestamp: string;
  response: any;
}

export default function AIAssistantView({ featureFlags }: any) {
  const [activeTool, setActiveTool] = useState<string>("chat");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("codecheck_ai_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleExportPDF = () => {
    if (!result || result.error) return;
    const toolTitle =
      tools.find((t) => t.id === activeTool)?.title || "Resultado AI";
    exportGenericResultToPDF(toolTitle, result);
  };

  const tools = [
    { id: "chat", title: "Assistente Chat", icon: BrainCircuit, flags: [] },
    {
      id: "lesson_plan",
      title: "Plano de Aula",
      icon: FileText,
      flags: ["ENABLE_AI_LESSON_PLANNER"],
    },
    {
      id: "activity",
      title: "Gerar Atividade",
      icon: CodeIcon,
      flags: ["ENABLE_AI_ACTIVITY_BUILDER"],
    },
    {
      id: "rubric",
      title: "Gerar Rubrica",
      icon: CheckCircle2,
      flags: ["ENABLE_AI_RUBRIC_BUILDER"],
    },
    {
      id: "simulated_exam",
      title: "Simulado de Prova",
      icon: Target,
      flags: ["ENABLE_AI_SIMULATED_EXAMS"],
    },
    {
      id: "recovery_plan",
      title: "Recuperação Paralela",
      icon: Users,
      flags: ["ENABLE_AI_RECOVERY_PLAN"],
    },
  ];

  const quickActions = [
    {
      text: "Explique complexidade assintótica O(log N) de forma simples.",
      tool: "chat",
    },
    {
      text: "Crie um plano de 2 horas sobre algoritmos de Ordenação Rápida.",
      tool: "lesson_plan",
    },
    {
      text: "Escreva uma lista com 2 exercícios práticos sobre matrizes bidimensionais.",
      tool: "activity",
    },
    {
      text: "Sugerir critérios de avaliação para código limpo em Python.",
      tool: "rubric",
    },
  ];

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("codecheck_ai_history", JSON.stringify(history));
  }, [history]);

  const handleGenerate = async (type: string, promptText?: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse.trim()) return;

    setLoading(true);
    setResult(null);
    setPrompt("");

    try {
      let endpoint =
        type === "chat"
          ? "/api/codecheck/module06/student-recommendation"
          : `/api/codecheck/module06/${type.replace("_", "-") === "activity" ? "activity-builder" : type.replace("_", "-")}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToUse }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);

        // Add item to history
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          type,
          prompt: textToUse,
          timestamp: new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          response: data,
        };
        setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      } else {
        setResult({ error: "Erro na comunicação com a API." });
      }
    } catch (e) {
      setResult({ error: "Erro ao gerar solicitação." });
    }
    setLoading(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setActiveTool(item.type);
    setResult(item.response);
  };

  return (
    <div className="flex flex-col gap-6">
      <AIStatusDashboard />

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
        {/* Sidebar Tool Selector & Quick actions */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Banner Docente */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-slate-950 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <h2 className="font-bold text-white tracking-widest text-xs uppercase font-mono">
                Copiloto Docente IA
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Sua central de geração pedagógica rápida e chat consultivo.
            </p>
          </div>

          {/* List of actions/models */}
          <div className="flex flex-col gap-1.5 bg-[#050819] p-2.5 rounded-2xl border border-slate-800">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2 block">
              Modelos Disponíveis
            </span>
            {tools.map((tool) => {
              const isAvailable = tool.flags.every(
                (f) => (featureFlags as any)[f] !== false,
              );
              if (!isAvailable) return null;
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setResult(null);
                    setPrompt("");
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    activeTool === tool.id
                      ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-bold"
                      : "bg-slate-900/40 border-transparent text-slate-400 hover:bg-[#070b1e] hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{tool.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-col gap-2 bg-[#050819] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 pl-0.5 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block font-sans">
                Sugestões Docente
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-sans">
              {quickActions
                .filter(
                  (act) => act.tool === activeTool || activeTool === "chat",
                )
                .map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenerate(act.tool, act.text)}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/50 hover:bg-slate-900 text-[11px] text-slate-300 hover:text-white transition-all text-left leading-relaxed"
                  >
                    {act.text}
                  </button>
                ))}
            </div>
          </div>

          {/* Persistent History Panel */}
          <div className="flex flex-col gap-2 bg-[#050819] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-900 mb-1">
              <div className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Histórico
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[9px] font-mono text-rose-450 hover:text-rose-400 uppercase font-bold"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto scrollbar-thin">
              {history.length === 0 ? (
                <span className="text-[10px] text-slate-600 font-mono italic text-center py-2 font-sans">
                  Sem histórico recente
                </span>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleLoadFromHistory(item)}
                    className="p-2 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-indigo-500/20 hover:bg-slate-900/50 text-[10px] text-slate-400 hover:text-slate-200 transition-all text-left flex justify-between items-center font-sans"
                  >
                    <span className="truncate w-10/12">{item.prompt}</span>
                    <span className="text-[8px] text-slate-600 font-mono">
                      {item.timestamp}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Workspace: Chat Speech bubbles style */}
        <div className="flex-1 bg-[#050819] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Workspace title metadata */}
          <div className="p-5 border-b border-slate-800/80 bg-[#030614]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                Fase 06 Ativa: {tools.find((t) => t.id === activeTool)?.title}
              </h3>
            </div>
            {result && !result.error && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 text-xs font-mono font-bold rounded-lg border border-indigo-500/20 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => {
                    const toolTitle =
                      tools.find((t) => t.id === activeTool)?.title ||
                      "Resultado AI";
                    exportToExcel([result], toolTitle);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-mono font-bold rounded-lg border border-emerald-500/20 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => {
                    const toolTitle =
                      tools.find((t) => t.id === activeTool)?.title ||
                      "Resultado AI";
                    exportToCSV([result], toolTitle);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-700 transition-all"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleCopy(JSON.stringify(result, null, 2))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-800 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-mono font-bold rounded-lg border border-emerald-500/20 transition-all">
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Rascunho</span>
                </button>
              </div>
            )}
          </div>

          {/* Workspace Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col gap-6 justify-between">
            <div className="flex-1 flex flex-col gap-6">
              {/* If no result & no loading, show welcoming empty state */}
              {!loading && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto py-12 gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      Como posso ajudar hoje?
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                      Digite sua solicitação ou clique em uma das sugestões
                      rápidas ao lado para iniciar um plano analítico.
                    </p>
                  </div>
                </div>
              )}

              {/* Conversation Flow Area */}
              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="font-mono text-xs tracking-wider uppercase">
                    Computando Diretrizes Pedagógicas...
                  </span>
                </div>
              )}

              {/* Show results bubbles */}
              {!loading && result && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  {result.error ? (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-mono">
                      {result.error}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Speeches - AI Response wrapper */}
                      <div className="flex flex-col gap-1 pr-8">
                        <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest pl-1">
                          Resposta do Copiloto IA
                        </span>
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                          {/* Dynamic keys map layout */}
                          <div className="flex flex-col gap-5">
                            {Object.entries(result).map(([key, value], i) => (
                              <div
                                key={i}
                                className="flex flex-col gap-2 border-b border-slate-900 pb-4 last:border-0 last:pb-0 font-sans"
                              >
                                <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">
                                  {key.replace(/_/g, " ")}
                                </span>

                                {Array.isArray(value) ? (
                                  <ul className="space-y-1.5 ml-1">
                                    {value.map((item: any, idx: number) => (
                                      <li
                                        key={idx}
                                        className="text-xs text-slate-300 leading-relaxed flex items-start gap-1.5"
                                      >
                                        <span className="text-emerald-500 font-bold mt-0.5">
                                          •
                                        </span>
                                        <span>
                                          {typeof item === "object"
                                            ? JSON.stringify(item)
                                            : item}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {value as string}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User speech area (Prompt entry) */}
            <div className="mt-auto border-t border-slate-900 pt-5">
              <div className="flex flex-col gap-2 pl-1">
                <label className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Sua instrução ou prompt
                </label>
                <div className="relative flex items-center">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate(activeTool);
                      }
                    }}
                    placeholder="Ex: Desenvolva testes de verificação para controle de fluxo condicional..."
                    className="w-full bg-[#020512] border border-slate-800 rounded-xl p-4 pr-16 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all min-h-[75px] resize-none"
                  />
                  <button
                    onClick={() => handleGenerate(activeTool)}
                    disabled={loading || !prompt.trim()}
                    className="absolute right-4 p-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-30 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center"
                    title="Enviar comando"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <CornerDownLeft className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-slate-600 font-mono text-right pr-1">
                  Pressione Enter para enviar, Shift+Enter para quebra de linha.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round font-sans"
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );
}
