import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Send,
  X,
  RefreshCw,
  Code2,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  SmartCodeRefactorService,
  SmartCodeRefactorAnalysis
} from "../services/smartCodeRefactorService";

interface SmartCodeRefactorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  initialLanguage?: string;
  studentName?: string;
}

export default function SmartCodeRefactorStudioModal({
  isOpen,
  onClose,
  initialCode = "def calcular_media_pedidos(pedidos):\n    total = 0\n    for i in range(len(pedidos)):\n        for j in range(len(pedidos)):\n            if i == j:\n                total = total + pedidos[i]['valor']\n    return eval(str(total / len(pedidos)))",
  initialLanguage = "python",
  studentName = "Estudante SENAI"
}: SmartCodeRefactorStudioModalProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [topic, setTopic] = useState("Algoritmos e Estruturas de Dados");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SmartCodeRefactorAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"side_by_side" | "findings" | "summary">("side_by_side");

  if (!isOpen) return null;

  const handleRunRefactor = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/code/smart-refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          contextTopic: topic
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Refatoração inteligente e análise estática concluídas!");
      } else {
        throw new Error(data.error || "Erro na análise");
      }
    } catch {
      // Local fallback
      const fallback = SmartCodeRefactorService.generateDeterministicOfflineRefactor(code, language);
      setAnalysis(fallback);
      toast.info("Análise concluída via motor estático local.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyRefactored = () => {
    if (!analysis?.refactoredCode) return;
    navigator.clipboard.writeText(analysis.refactoredCode);
    toast.success("Código refatorado copiado para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Estúdio de Refatoração & Remediação de Vulnerabilidades
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Clean Code & AppSec
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Análise de complexidade ciclomática, Big-O, remediação de falhas e guia pedagógico para {studentName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Linguagem:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="python">Python</option>
                <option value="typescript">TypeScript / JavaScript</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="sql">SQL / DDL</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Tópico:</span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-violet-500 w-52"
                placeholder="Ex: Algoritmos e Complexidade"
              />
            </div>
          </div>

          <button
            onClick={handleRunRefactor}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 font-bold text-xs shadow-lg shadow-violet-950/50 transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin text-amber-300" : ""}`} />
            {isAnalyzing ? "Analisando Código..." : "Executar Refatoração IA"}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Complexidade Ciclomática</span>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xl font-bold text-rose-400">
                    {analysis.metrics.cyclomaticComplexityBefore}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-xl font-bold text-emerald-400">
                    {analysis.metrics.cyclomaticComplexityAfter}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Índice de Manutenibilidade</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xl font-bold text-amber-400">
                    {analysis.metrics.maintainabilityIndexBefore}/100
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-xl font-bold text-emerald-400">
                    {analysis.metrics.maintainabilityIndexAfter}/100
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Complexidade Big-O</span>
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-300 font-mono">
                    {analysis.metrics.estimatedBigOBefore}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-lg font-bold text-emerald-300 font-mono">
                    {analysis.metrics.estimatedBigOAfter}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Falhas Sanitizadas</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="mt-1">
                  <span className="text-xl font-bold text-emerald-400">
                    {analysis.findings.length} itens tratados
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          {analysis && (
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("side_by_side")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "side_by_side"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Comparação Código Original x Refatorado
              </button>
              <button
                onClick={() => setActiveTab("findings")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "findings"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Diagnóstico de Segurança & Smells ({analysis.findings.length})
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "summary"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Guia Pedagógico & Feedback
              </button>
            </div>
          )}

          {/* Tab 1: Code Side by Side */}
          {(!analysis || activeTab === "side_by_side") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Código Original do Aluno</span>
                  <span className="text-[10px] text-rose-400 font-mono">Entrada Bruta</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={14}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none focus:border-violet-500 resize-none custom-scrollbar"
                  placeholder="Cole o código do estudante aqui..."
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Código Refatorado (Clean Code & Blindado)</span>
                  {analysis && (
                    <button
                      onClick={handleCopyRefactored}
                      className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </button>
                  )}
                </div>
                <textarea
                  value={analysis?.refactoredCode || "// Clique em 'Executar Refatoração IA' para gerar o código limpo..."}
                  readOnly
                  rows={14}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-emerald-900/40 font-mono text-xs text-emerald-300 focus:outline-none resize-none custom-scrollbar"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Findings List */}
          {analysis && activeTab === "findings" && (
            <div className="space-y-3">
              {analysis.findings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma vulnerabilidade crítica ou má prática encontrada no código analisado!
                </div>
              ) : (
                analysis.findings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                          {item.category.replace("_", " ")}
                        </span>
                        <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400">
                        Severidade: {item.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{item.description}</p>

                    <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300">
                      <span className="font-semibold text-indigo-200">💡 Orientação Docente: </span>
                      {item.pedagogicalRationale}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Summary */}
          {analysis && activeTab === "summary" && (
            <div className="p-5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                Parecer Pedagógico de Refatoração
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {analysis.pedagogicalSummary}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Padrão de Engenharia de Software SENAI & OWASP Top 10
          </span>

          <div className="flex items-center gap-2">
            {analysis && (
              <button
                onClick={() => toast.success(`Guia de Refatoração despachado para o editor de ${studentName}!`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Despachar para o Aluno
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
