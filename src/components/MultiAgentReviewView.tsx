import React, { useState } from "react";
import { Sparkles, Bot, CheckCircle, Code, Shield, Cpu, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function MultiAgentReviewView() {
  const [selectedAgent, setSelectedAgent] = useState<string>("algorithm");
  const [sampleCode, setSampleCode] = useState("def calcular_media(notas):\n    return sum(notas) / len(notas)");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const agents = [
    { id: "algorithm", name: "Agente Lógica & Algoritmos", icon: Code, desc: "Especialista em complexidade ciclomática, otimização e eficiência de código.", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" },
    { id: "security", name: "Agente Segurança & Boas Práticas", icon: Shield, desc: "Especialista em detecção de vulnerabilidades, tratamento de exceções e PEP8.", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    { id: "pedagogy", name: "Agente Tutoria Pedagógica", icon: Bot, desc: "Gera explicações empáticas estilo professor para nivelamento e feedback formativo.", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  ];

  const handleRunMultiAgent = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({
        agent: agents.find(a => a.id === selectedAgent)?.name,
        score: 95,
        feedback: "Código limpo, eficiente e de complexidade O(n). Excelente uso de funções embutidas do Python.",
        suggestions: ["Adicionar type hinting (ex: notas: list[float]) para maior robustez.", "Tratar caso de lista vazia para evitar ZeroDivisionError."]
      });
      toast.success("Análise multi-agente concluída com sucesso!");
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <Sparkles className="w-4 h-4" /> Evolução 01 • Multi-Agent RAG
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Agentes de IA Especializados para Correção</h1>
          <p className="text-sm text-slate-400 mt-1">Delegue a correção de código para comitês de agentes especialistas autônomos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agents.map(agent => {
          const Icon = agent.icon;
          const isSelected = selectedAgent === agent.id;
          return (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                isSelected 
                  ? "bg-slate-800/90 border-emerald-500/60 shadow-xl shadow-emerald-500/5 ring-2 ring-emerald-500/20" 
                  : "bg-slate-900/40 border-slate-800 hover:bg-slate-900/80"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${agent.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <span>{isSelected ? "● Ativo para Análise" : "Selecionar agente"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
        <h3 className="text-lg font-bold text-white">Simulador de Análise Multi-Agente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Código do Aluno para Avaliação</label>
            <textarea 
              rows={8}
              value={sampleCode}
              onChange={(e) => setSampleCode(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleRunMultiAgent}
              disabled={analyzing}
              className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {analyzing ? <Cpu className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{analyzing ? "Agentes Analisando Código..." : "Executar Comitê de Agentes"}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Relatório Sintetizado do Agente</label>
            <div className="bg-[#030712] border border-slate-800 rounded-2xl p-5 min-h-[240px] flex flex-col justify-between">
              {analysisResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono text-emerald-400 font-bold">{analysisResult.agent}</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">Nota: {analysisResult.score}/100</span>
                  </div>
                  <p className="text-xs text-slate-300">{analysisResult.feedback}</p>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Recomendações do Agente:</span>
                    <ul className="space-y-1">
                      {analysisResult.suggestions.map((s: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500 font-mono text-xs">
                  <Bot className="w-8 h-8 mb-2 opacity-40" />
                  <span>Execute o comitê para ver o parecer pedagógico do agente selecionado.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
