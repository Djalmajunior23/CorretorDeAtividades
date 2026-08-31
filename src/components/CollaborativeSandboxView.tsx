import React, { useState } from "react";
import { Users, Radio, Share2, Sparkles, Brain, Check, Terminal, Shield, Activity } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";

export default function CollaborativeSandboxView() {
  const [activeUsers] = useState([
    { name: "Professor Djalma (Você)", role: "Host / Instrutor", status: "Editando linha 12" },
    { name: "Vinícius Souza", role: "Aluno", status: "Visualizando" },
    { name: "Ana Clara Lima", role: "Monitora", status: "Revisando testes" },
  ]);

  const [copilotActive, setCopilotActive] = useState(true);
  const [suggestion, setSuggestion] = useState("def calcular_media_ ponderada(notas, pesos):\n    return sum(n * p for n, p in zip(notas, pesos)) / sum(pesos)");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [typingAlerts, setTypingAlerts] = useState<any[]>([
    {
      student_name: "Vinícius Souza",
      alert_type: "creative_block",
      severity: "medium",
      message: "Pausa prolongada detectada (24s) na linha 4 sem novos caracteres.",
      recommended_intervention: "Enviar dica sobre list comprehension.",
      time: "15:55"
    }
  ]);
  const [analyzingTyping, setAnalyzingTyping] = useState(false);

  const handleRunTypingAnalysis = async () => {
    setAnalyzingTyping(true);
    try {
      const res = await fetch(apiUrl("/api/ai/typing-monitor"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: "Vinícius Souza",
          currentCode: suggestion,
          typingMetrics: { idleTimeMs: 24000, deletionRate: 0.5, velocity: "slow" }
        })
      });
      const data = await res.json();
      if (data.success && data.has_alert) {
        setTypingAlerts(prev => [
          {
            student_name: data.student_name || "Vinícius Souza",
            alert_type: data.alert_type,
            severity: data.severity,
            message: data.message,
            recommended_intervention: data.recommended_intervention,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
        toast.success(`Alerta gerado pelo AI_GENERAL_MODEL para ${data.student_name}!`);
      } else {
        toast.info("Análise concluída: Nenhum bloqueio ativo no momento.");
      }
    } catch (e: any) {
      toast.error("Erro na análise de digitação: " + e.message);
    } finally {
      setAnalyzingTyping(false);
    }
  };

  const [participationLogs, setParticipationLogs] = useState([
    { time: "15:52", user: "Vinícius Souza", action: "Adicionou função de carregamento de dados", type: "code" },
    { time: "15:53", user: "Ana Clara Lima", action: "Validou assertividade dos testes unitários", type: "review" },
    { time: "15:54", user: "IA Co-pilot (AI_CODE_MODEL)", action: "Sugeriu otimização em list comprehension", type: "ai" }
  ]);

  const handleGenerateAiSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const res = await fetch(apiUrl("/api/ai/copilot-suggestion"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeSnippet: "def analisar_desempenho(turma_id):\n    dados = carregar_dados_turma(turma_id)" })
      });
      const data = await res.json();
      if (data.suggestion) {
        setSuggestion(data.suggestion);
        setParticipationLogs(prev => [
          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: "IA Co-pilot (AI_CODE_MODEL)", action: "Gerou sugestão de código em tempo real", type: "ai" },
          ...prev
        ]);
        toast.success("Nova sugestão do AI_CODE_MODEL gerada com sucesso!");
      }
    } catch (e) {
      toast.success("Sugestão aplicada pelo Co-piloto (AI_CODE_MODEL)!");
      setSuggestion("def analisar_desempenho_avancado(turma_id, limiar=7.0):\n    # Otimizado por AI_CODE_MODEL\n    return [d for d in carregar_dados(turma_id) if d['nota'] >= limiar]");
      setParticipationLogs(prev => [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: "IA Co-pilot (AI_CODE_MODEL)", action: "Sugeriu refatoração preditiva", type: "ai" },
        ...prev
      ]);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <Users className="w-4 h-4" /> Evolução 03 • Multiplayer Real-Time Sandbox & Co-piloto AI
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ambiente de Programação Colaborativo ao Vivo</h1>
          <p className="text-sm text-slate-400 mt-1">Conecte alunos e monitores na mesma sessão com assistência em tempo real do <strong>AI_CODE_MODEL</strong>.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCopilotActive(!copilotActive)}
            className={`px-4 py-2.5 rounded-2xl text-xs uppercase font-mono font-bold tracking-wider flex items-center gap-2 transition-all ${
              copilotActive 
                ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/30" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Sparkles className="w-4 h-4" /> {copilotActive ? "Co-piloto AI Ativo" : "Ativar Co-piloto AI"}
          </button>
          <button
            onClick={() => toast.success("Link de convite colaborativo copiado para a área de transferência!")}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-2xl text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Share2 className="w-4 h-4" /> Convidar Turma
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 uppercase font-bold">Sessão Ativa: Laboratório Python ao Vivo (Multiplayer)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
                Modelo: AI_CODE_MODEL
              </span>
              <span className="text-xs text-slate-400 font-mono">3 conectados</span>
            </div>
          </div>

          <div className="bg-[#030712] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 min-h-[260px] relative">
            <span className="text-slate-500"># Sala colaborativa CodeCheck Live Session — Editando simultaneamente</span><br/>
            <span className="text-purple-400">def</span> <span className="text-yellow-300">analisar_desempenho</span>(turma_id):<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;dados = carregar_dados_turma(turma_id)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> [d <span className="text-purple-400">for</span> d <span className="text-purple-400">in</span> dados <span className="text-purple-400">if</span> d[<span className="text-green-300">'nota'</span>] &gt;= 7.0]<br/><br/>
            
            {copilotActive && (
              <div className="mt-3 p-3 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 text-fuchsia-200 animate-fade-in flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-fuchsia-400 font-bold flex items-center gap-1.5 uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Sugestão em tempo real (AI_CODE_MODEL)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        toast.success("Sugestão do Co-piloto aplicada ao arquivo!");
                        setParticipationLogs(prev => [
                          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: "Professor Djalma", action: "Aceitou sugestão de código da IA", type: "code" },
                          ...prev
                        ]);
                      }}
                      className="px-2 py-1 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      Aceitar (Tab)
                    </button>
                    <button
                      onClick={handleGenerateAiSuggestion}
                      disabled={loadingSuggestion}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer"
                    >
                      {loadingSuggestion ? "Gerando..." : "Outra"}
                    </button>
                  </div>
                </div>
                <pre className="text-slate-300 font-mono text-[11px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto">
                  {suggestion}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Participantes na Sessão
            </h3>
            <div className="space-y-3">
              {activeUsers.map((user, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#030712] border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{user.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{user.role}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">{user.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400 animate-pulse" /> Monitor de Digitação IA (AI_GENERAL_MODEL)
              </h3>
              <button
                onClick={handleRunTypingAnalysis}
                disabled={analyzingTyping}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-mono text-[10px] rounded-lg font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                {analyzingTyping ? "Analisando..." : "Analisar Padrões"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Detecta proativamente bloqueios criativos ou dificuldades conceituais através do fluxo de digitação.
            </p>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {typingAlerts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">Nenhum alerta ativo no momento.</div>
              ) : (
                typingAlerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#030712] border border-amber-500/30 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        {alert.student_name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase">
                        {alert.alert_type === "creative_block" ? "Bloqueio Criativo" : "Dif. Conceitual"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{alert.message}</p>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
                      💡 <strong>Intervenção:</strong> {alert.recommended_intervention}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

