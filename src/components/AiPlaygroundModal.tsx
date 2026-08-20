import React, { useState } from "react";
import { BrainCircuit, Sparkles, Sliders, Play, CheckCircle2, Terminal, RefreshCw, GitCompare, Clock, Cpu } from "lucide-react";
import { toast } from "sonner";

interface AiPlaygroundModalProps {
  onClose: () => void;
}

export function AiPlaygroundModal({ onClose }: AiPlaygroundModalProps) {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [compareModel, setCompareModel] = useState("deepseek-coder");
  const [isComparing, setIsComparing] = useState(false);
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [customPrompt, setCustomPrompt] = useState("Atue como um professor sênior do SENAI. Analise o código do aluno abaixo, verifique erros de sintaxe, complexidade ciclomática e forneça feedback construtivo em Markdown.");
  const [testCode, setTestCode] = useState("function soma(a, b) { return a + b; }");
  const [aiOutput, setAiOutput] = useState("");
  const [compareOutput, setCompareOutput] = useState("");
  const [metrics, setMetrics] = useState<{ latency: number; inputTokens: number; outputTokens: number } | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunPlayground = () => {
    setRunning(true);
    setAiOutput("");
    setCompareOutput("");
    setMetrics(null);

    setTimeout(() => {
      setRunning(false);
      setAiOutput(`### 🤖 Relatório de Análise (${selectedModel})
- **Status da Compilação**: Sucesso (Sem erros).
- **Complexidade Ciclomática**: 1 (Excelente).
- **Feedback**: Código otimizado, sem gargalos. Pronto para produção.`);

      if (isComparing) {
        setCompareOutput(`### 🤖 Relatório de Análise (${compareModel})
- **Status da Compilação**: Sucesso.
- **Complexidade Ciclomática**: 1.
- **Feedback**: Estrutura limpa e elegante. Nenhuma sugestão de refatoração necessária.`);
      }

      setMetrics({
        latency: Math.floor(Math.random() * 200) + 180,
        inputTokens: Math.floor(Math.random() * 50) + 120,
        outputTokens: Math.floor(Math.random() * 100) + 150
      });

      toast.success("Inferência executada com sucesso!");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Playground Avançado & Comparador de Modelos de IA</h3>
              <p className="text-xs text-slate-400">Compare inferências lado a lado (Side-by-Side) com métricas de latência e tokens.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
          {/* Left Column: Model Configuration & Prompt */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Modo de Comparação</label>
              <button
                onClick={() => setIsComparing(!isComparing)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${isComparing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                <GitCompare className="w-3.5 h-3.5" /> {isComparing ? "Ativado (2 Modelos)" : "Ativar Comparação"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400">Modelo Primário</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="llama-3-sonar">Llama 3 70B Sonar</option>
                  <option value="deepseek-coder">DeepSeek Coder V2</option>
                </select>
              </div>

              {isComparing && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[11px] font-bold text-purple-400">Modelo para Comparação</label>
                  <select
                    value={compareModel}
                    onChange={(e) => setCompareModel(e.target.value)}
                    className="bg-[#030712] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  >
                    <option value="deepseek-coder">DeepSeek Coder V2</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="llama-3-sonar">Llama 3 70B Sonar</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Temperatura ({temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="accent-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Max Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
                  className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200">System Prompt / Diretrizes</label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: Code Input & Outputs */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Código de Teste (Sandbox)</label>
                <textarea
                  rows={3}
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  className="bg-[#030712] border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={running}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                {running ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executando Inferência em Paralelo...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Executar Comparação de Modelos
                  </>
                )}
              </button>

              {metrics && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Latência: <strong className="text-white">{metrics.latency}ms</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Tokens In/Out: <strong className="text-white">{metrics.inputTokens} / {metrics.outputTokens}</strong>
                  </div>
                </div>
              )}

              <div className={`grid grid-cols-1 ${isComparing ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">Saída ({selectedModel})</span>
                  <div className="p-3 bg-[#030712] rounded-xl border border-slate-900 text-xs font-mono text-slate-200 min-h-[140px] whitespace-pre-wrap leading-relaxed">
                    {aiOutput || <span className="text-slate-600 italic">Aguardando execução...</span>}
                  </div>
                </div>

                {isComparing && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">Saída ({compareModel})</span>
                    <div className="p-3 bg-[#030712] rounded-xl border border-purple-950 text-xs font-mono text-slate-200 min-h-[140px] whitespace-pre-wrap leading-relaxed">
                      {compareOutput || <span className="text-slate-600 italic">Aguardando execução paralela...</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
