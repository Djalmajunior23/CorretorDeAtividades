import React, { useState, useEffect } from "react";
import { BellRing, Mail, Target, ShieldAlert, Sparkles, Send, RefreshCw, Layers, AlertTriangle, Cpu } from "lucide-react";

export default function AutomationActionCenterView({ featureFlags }: any) {
  const [activeTab, setActiveTab] = useState("alerts");

  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sandboxMetrics, setSandboxMetrics] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState("all");
  const [timeoutThreshold, setTimeoutThreshold] = useState(3.0);
  const [tuningApplied, setTuningApplied] = useState(false);

  useEffect(() => {
    if (activeTab === "alerts" || activeTab === "resource_metrics") {
      fetch("/api/codecheck/module07/alerts")
        .then(res => res.json())
        .then(data => {
          if (!data.error) setAlerts(data);
        })
        .catch(console.error);

      fetch(`/api/codecheck/module07/sandbox-metrics?activityId=${selectedActivity}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setSandboxMetrics(data);
        })
        .catch(console.error);
    } else if (activeTab === "communication") {
      fetch("/api/codecheck/module07/notifications")
        .then(res => res.json())
        .then(data => {
          if (!data.error) setNotifications(data);
        })
        .catch(console.error);
    }
  }, [activeTab, selectedActivity]);

  return (
    <div className="flex gap-6 animate-fade-in h-[calc(100vh-80px)]">
      <div className="w-64 shrink-0 flex flex-col gap-2">
         <div className="p-4 bg-[#0f172a] border border-emerald-500/30 rounded-xl mb-2">
            <h2 className="font-bold font-mono text-white tracking-widest text-sm flex items-center gap-2 uppercase">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Automação
            </h2>
            <p className="text-xs text-slate-400 mt-1">Central de Ações (Fase 07)</p>
         </div>

         {[
            {id: "alerts", label: "Alertas Pedagógicos", icon: ShieldAlert},
            {id: "resource_metrics", label: "Monitor de Gargalos", icon: Cpu},
            {id: "recovery", label: "Recuperação Autom.", icon: Target},
            {id: "communication", label: "Notificações", icon: Mail},
            {id: "settings", label: "Configurações", icon: Layers}
         ].map(tab => (
           <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all ${
                activeTab === tab.id 
                 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                 : 'bg-[#0f172a]/50 border-transparent text-slate-400 hover:bg-[#0f172a] hover:text-slate-200'
              }`}
           >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-bold font-mono">{tab.label}</span>
           </button>
         ))}
      </div>

      <div className="flex-1 bg-[#0f172a] border border-[#1e295b]/30 rounded-xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-[#1e295b]/50 bg-[#030712]/50 flex items-center justify-between">
           <h3 className="font-bold text-white text-lg font-display">
              {activeTab === "alerts" && "Alertas Pedagógicos"}
              {activeTab === "resource_metrics" && "Monitor de Gargalos de Recursos"}
              {activeTab === "recovery" && "Recuperação Automática"}
              {activeTab === "communication" && "Comunicação e Notificações"}
              {activeTab === "settings" && "Regras de Automação"}
           </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin flex flex-col gap-6">
           {activeTab === "alerts" && (
             <div className="flex flex-col gap-6">
               
               {/* Sandbox Metrics Visualization */}
               {sandboxMetrics && (
                 <div className="bg-[#030712]/50 border border-slate-700/50 p-5 rounded-xl flex flex-col gap-4">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/50 pb-3">
                     <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold font-mono text-slate-200">{sandboxMetrics.activity_name || "Diagnóstico de Submissões e Sandbox"}</h4>
                     </div>

                     {/* Controls Area */}
                     <div className="flex flex-wrap items-center gap-3">
                       <div className="flex flex-col">
                         <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Filtrar por Atividade</label>
                         <select 
                           value={selectedActivity}
                           onChange={(e) => setSelectedActivity(e.target.value)}
                           className="bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-200 p-1 px-2 focus:outline-none focus:border-indigo-500"
                         >
                           <option value="all">Todas as Atividades (Geral)</option>
                           <option value="condicionais">Atividade 1 (Simples)</option>
                           <option value="lacos">Atividade 2 (Média)</option>
                           <option value="recursao">Atividade 3 (Complexa)</option>
                           <option value="grafos">Atividade 4 (Muito Complexa)</option>
                         </select>
                       </div>

                       <div className="flex flex-col">
                         <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">Limite de Alerta de Timeout ({timeoutThreshold}%)</label>
                         <div className="flex items-center gap-2">
                           <input 
                             type="range" 
                             min="0.5" 
                             max="15" 
                             step="0.5"
                             value={timeoutThreshold} 
                             onChange={(e) => setTimeoutThreshold(parseFloat(e.target.value))}
                             className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                           />
                           <span className="text-xs font-mono text-indigo-400 font-bold min-w-[28px]">{timeoutThreshold}%</span>
                         </div>
                       </div>
                     </div>
                   </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="flex flex-col bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Execuções Globais</span>
                       <span className="text-xl font-bold text-slate-200">{sandboxMetrics.total_executions}</span>
                     </div>
                     <div className="flex flex-col bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
                       <span className="text-[10px] text-rose-400 uppercase tracking-wider font-mono">Erros Internos</span>
                       <span className="text-xl font-bold text-rose-300">{sandboxMetrics.internal_errors}</span>
                     </div>
                     <div className="flex flex-col bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
                       <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">Timeouts Sandbox</span>
                       <span className="text-xl font-bold text-amber-300">{sandboxMetrics.sandbox_timeouts}</span>
                     </div>
                     <div className="flex flex-col bg-sky-500/5 p-3 rounded-lg border border-sky-500/20">
                       <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono">Erros de Código</span>
                       <span className="text-xl font-bold text-sky-300">{sandboxMetrics.code_specific_issues}</span>
                     </div>
                  </div>

                  {((sandboxMetrics.sandbox_timeouts / sandboxMetrics.total_executions) * 100) > timeoutThreshold && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3 mt-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-amber-400">Taxa de Timeouts de Sandbox Elevada ({timeoutThreshold}% Excedido) ({((sandboxMetrics.sandbox_timeouts / sandboxMetrics.total_executions) * 100).toFixed(1)}%)</span>
                        <span className="text-xs text-amber-400/80 mt-1">
                          Esta atividade ultrapassou a taxa limite de tolerância. Sugerimos ajustar ou aumentar os limites de tempo e RAM na configuração do Sandbox para acomodar a complexidade do código submetido para diminuir falsos positivos causados por Timeouts.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col mt-2">
                     <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400 mb-1">
                       <span>Análise de Causa (Infra vs Código)</span>
                       <span>
                         {Math.round(((sandboxMetrics.sandbox_timeouts + sandboxMetrics.resource_limit_hits) / 
                           (sandboxMetrics.sandbox_timeouts + sandboxMetrics.resource_limit_hits + sandboxMetrics.code_specific_issues)
                         ) * 100)}% GAFE INFRA/RECURSOS
                       </span>
                     </div>
                     <div className="w-full h-2.5 bg-[#0f172a] rounded-full overflow-hidden flex border border-slate-700/50">
                       <div 
                         style={{ width: `${(sandboxMetrics.internal_errors / sandboxMetrics.total_executions) * 100}%` }} 
                         className="h-full bg-rose-500" 
                         title={`Erros Internos (${sandboxMetrics.internal_errors})`}
                       />
                       <div 
                         style={{ width: `${(sandboxMetrics.sandbox_timeouts / sandboxMetrics.total_executions) * 100}%` }} 
                         className="h-full bg-amber-500"
                         title={`Timeouts (${sandboxMetrics.sandbox_timeouts})`}
                       />
                       <div 
                         style={{ width: `${(sandboxMetrics.code_specific_issues / sandboxMetrics.total_executions) * 100}%` }} 
                         className="h-full bg-sky-500"
                         title={`Problemas de Código (${sandboxMetrics.code_specific_issues})`}
                       />
                       <div 
                         style={{ width: `${((sandboxMetrics.total_executions - sandboxMetrics.internal_errors - sandboxMetrics.sandbox_timeouts - sandboxMetrics.code_specific_issues) / sandboxMetrics.total_executions) * 100}%` }} 
                         className="h-full bg-emerald-500/30"
                         title="Execuções com Sucesso"
                       />
                     </div>
                     <p className="text-[10px] text-slate-500 mt-2 text-right">
                       Isso ajuda a identificar se as falhas na submissão ocorrem devido a restrições de sandbox, como Timeouts e Limite de RAM, em vez de erros lógicos dos aprendizes.
                     </p>
                  </div>
                </div>
               )}

               <div className="flex flex-col gap-4">
                 {alerts.map(a => (
                   <div key={a.id} className={`p-4 rounded-xl border flex items-start gap-4 ${
                     a.type === 'danger' ? 'bg-rose-500/5 border-rose-500/20' : 
                     a.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-sky-500/5 border-sky-500/20'
                   }`}>
                     <div className="flex-1">
                       <span className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">{a.title}</span>
                       <p className="text-sm text-slate-300">{a.message}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {activeTab === "resource_metrics" && (
             <div className="flex flex-col gap-6 animate-fade-in text-slate-200 animate-duration-300">
               {/* Intro Card */}
               <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                   <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                     <Cpu className="w-4 h-4 text-emerald-400" />
                     Diagnóstico de Gargalos & Limites do Sandbox
                   </h4>
                   <p className="text-xs text-slate-400 mt-1">
                     Visualização agregada de falhas de ambiente (<strong className="text-rose-400 font-mono">Internal Error</strong>) e processos que excederam o tempo limite (<strong className="text-amber-400 font-mono">Sandbox Timeout</strong>) para identificar gargalos críticos de recursos computacionais.
                   </p>
                 </div>
                 {/* Selector inside the header block */}
                 <div className="flex flex-col gap-1 shrink-0">
                   <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Filtrar Atividade</span>
                   <select
                     value={selectedActivity}
                     onChange={(e) => {
                       setSelectedActivity(e.target.value);
                       setTuningApplied(false);
                     }}
                     className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56 cursor-pointer"
                   >
                     <option value="all">Todas as Atividades (Métrica Global)</option>
                     <option value="condicionais">Atividade 1 (Simples)</option>
                     <option value="lacos">Atividade 2 (Média)</option>
                     <option value="recursao">Atividade 3 (Complexa)</option>
                     <option value="grafos">Atividade 4 (Muito Complexa)</option>
                   </select>
                 </div>
               </div>

               {/* Main Metric Spotlight */}
               {sandboxMetrics && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Aggregated Total Widget */}
                   <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-700/40 flex flex-col justify-between min-h-[180px]">
                     <div>
                       <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Falha de Recursos Agregados</span>
                       <div className="flex items-baseline gap-2 mt-2">
                         <h3 className="text-4xl font-bold font-mono text-white">
                           {sandboxMetrics.internal_errors + sandboxMetrics.sandbox_timeouts}
                         </h3>
                         <span className="text-xs font-mono text-rose-400 font-semibold">
                           (Erros + Timeouts)
                         </span>
                       </div>
                       <p className="text-xs text-slate-300 mt-3 font-medium">
                         Representa <strong className="font-mono text-emerald-400">{(((sandboxMetrics.internal_errors + sandboxMetrics.sandbox_timeouts) / sandboxMetrics.total_executions) * 100).toFixed(1)}%</strong> de todas as {sandboxMetrics.total_executions} execuções.
                       </p>
                     </div>

                     {/* Threshold alert display */}
                     <div className="mt-4 pt-3 border-t border-slate-850 flex items-center">
                       {((sandboxMetrics.internal_errors + sandboxMetrics.sandbox_timeouts) / sandboxMetrics.total_executions) * 100 > 5 ? (
                         <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Gargalo Crítico de Recursos
                         </span>
                       ) : ((sandboxMetrics.internal_errors + sandboxMetrics.sandbox_timeouts) / sandboxMetrics.total_executions) * 100 > 1.5 ? (
                         <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Atenção Recomendada
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Performance Saudável
                         </span>
                       )}
                     </div>
                   </div>

                   {/* Breakdown of Internal Error */}
                   <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-700/40 flex flex-col justify-between min-h-[180px]">
                     <div>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-mono font-bold text-rose-400 block uppercase tracking-wider">Internal Error</span>
                         <span className="text-xs font-mono bg-rose-950/40 text-rose-300 border border-rose-900/30 px-2 py-0.5 rounded font-bold">
                           {((sandboxMetrics.internal_errors / sandboxMetrics.total_executions) * 100).toFixed(1)}%
                         </span>
                       </div>
                       <h3 className="text-4xl font-bold font-mono text-slate-200 mt-2">
                         {sandboxMetrics.internal_errors}
                       </h3>
                       <p className="text-xs text-slate-400 mt-3 font-normal">
                         Falhas severas de orquestração do sandbox ao iniciar sub-processores ou pods Docker. Significa erro interno ao provisionar ou isolar o ambiente.
                       </p>
                     </div>
                     <div className="text-[10px] text-zinc-500 font-mono mt-4 pt-3 border-t border-slate-850">
                       Causa raiz frequente: Esgotamento de memória RAM.
                     </div>
                   </div>

                   {/* Breakdown of Sandbox Timeout */}
                   <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-705 flex flex-col justify-between min-h-[180px]">
                     <div>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-mono font-bold text-amber-400 block uppercase tracking-wider">Sandbox Timeout</span>
                         <span className="text-xs font-mono bg-amber-950/40 text-amber-300 border border-amber-900/30 px-2 py-0.5 rounded font-bold">
                           {((sandboxMetrics.sandbox_timeouts / sandboxMetrics.total_executions) * 100).toFixed(1)}%
                         </span>
                       </div>
                       <h3 className="text-4xl font-bold font-mono text-slate-200 mt-2">
                         {sandboxMetrics.sandbox_timeouts}
                       </h3>
                       <p className="text-xs text-slate-400 mt-3 font-normal">
                         Sinaliza que o script do teste consumiu mais tempo que a janela máxima estrita (3.5s). Geralmente induzido por laços de repetição infinitos.
                       </p>
                     </div>
                     <div className="text-[10px] text-zinc-500 font-mono mt-4 pt-3 border-t border-slate-850">
                       Causa raiz frequente: Estouro de tempo limite de CPU.
                     </div>
                   </div>
                 </div>
               )}

               {/* Bottom section: Comparison Analysis and Optimization Advice */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-normal">
                 {/* Visual Bottleneck Comparison of Activities */}
                 <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-700/40 flex flex-col gap-4">
                   <div>
                     <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Comparativo de Gargalos por Atividade</h4>
                     <p className="text-xs text-slate-400 mt-1">Análise comparativa das falhas de recursos acumuladas (Internal Errors + Sandbox Timeouts).</p>
                   </div>

                   <div className="flex flex-col gap-3 mt-2">
                     {[
                       { id: "all", label: "Todas as Atividades (Métrica Global)", internal: 12, timeout: 45, total: 1200 },
                       { id: "condicionais", label: "Atividade 1: Est. Condicionais (Simples)", internal: 1, timeout: 2, total: 400 },
                       { id: "lacos", label: "Atividade 2: Laços de Repetição (Média)", internal: 2, timeout: 5, total: 350 },
                       { id: "recursao", label: "Atividade 3: Funções Recursivas (Complexa)", internal: 4, timeout: 15, total: 250 },
                       { id: "grafos", label: "Atividade 4: Algoritmos de Grafos (Muito Complexa)", internal: 5, timeout: 23, total: 200 }
                     ].map(act => {
                       const aggregate = act.internal + act.timeout;
                       const rate = (aggregate / act.total) * 100;
                       const isSelected = selectedActivity === act.id;

                       return (
                         <div 
                           key={act.id} 
                           onClick={() => {
                             setSelectedActivity(act.id);
                             setTuningApplied(false);
                           }}
                           className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                             isSelected 
                               ? "bg-indigo-950/20 border-indigo-500/50" 
                               : "bg-slate-950/30 border-slate-800/80 hover:bg-slate-900/30 hover:border-slate-700"
                           }`}
                         >
                           <div className="flex items-center justify-between text-xs">
                             <span className={`font-mono text-xs ${isSelected ? "text-indigo-300 font-bold" : "text-slate-300"}`}>{act.label}</span>
                             <span className="font-mono text-[11px] text-slate-400">
                               {aggregate} falhas (<strong className={rate > 5 ? "text-rose-400 font-bold" : rate > 1.5 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>{rate.toFixed(1)}%</strong>)
                             </span>
                           </div>
                           
                           {/* Custom styled progress bars */}
                           <div className="w-full bg-[#0f172a] border border-slate-800/80 rounded-full h-2.5 overflow-hidden flex">
                             <div 
                               style={{ width: `${(act.internal / act.total) * 100}%` }}
                               className="h-full bg-rose-500 transition-all duration-300"
                               title={`Internal Error (${act.internal})`}
                             />
                             <div 
                               style={{ width: `${(act.timeout / act.total) * 100}%` }}
                               className="h-full bg-amber-500 transition-all duration-300"
                               title={`Sandbox Timeout (${act.timeout})`}
                             />
                             <div 
                               style={{ width: `${100 - rate}%` }}
                               className="h-full bg-emerald-500/10"
                               title="Execuções corretas"
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {/* Resource Tuning Sandbox Recommendation */}
                 <div className="bg-[#030712]/50 p-6 rounded-2xl border border-slate-700/40 flex flex-col gap-4 justify-between">
                   <div className="flex flex-col gap-3">
                     <div>
                       <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Ações de Otimização Recomendadas</h4>
                       <p className="text-xs text-slate-400 mt-1">
                         Reações preventivas automatizadas para contornar lentidões do servidor ou códigos ineficientes dos estudantes.
                       </p>
                     </div>

                     <div className="flex flex-col gap-2 mt-1">
                       <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                         <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block tracking-wider mb-1">Ação 1: Ajuste de Janela Limite</span>
                         <p className="text-xs text-slate-300">
                           Atividades como recursão ou grafos possuem complexidade computacional elevada. Recomenda-se elevar o tempo limite sandbox padrão para <span className="text-indigo-400 font-semibold font-mono">5.0s</span>.
                         </p>
                       </div>

                       <div className="bg-slate-950/40 border border-[#1e295b]/30 p-3 rounded-xl">
                         <span className="text-[10px] font-mono text-rose-400 font-bold uppercase block tracking-wider mb-1">Ação 2: Auditoria de Recursão & Loops Infinitos</span>
                         <p className="text-xs text-slate-300 font-normal">
                           Disparar alerta pedagógico instruindo os alunos que estão gerando timeouts recorrentes a revisitarem as condições de escape de seus algoritmos recursivos.
                         </p>
                       </div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     {tuningApplied && (
                       <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center text-xs font-mono font-medium animate-fade-in">
                         ✓ Parâmetros do Sandbox sintonizados para 256MB e 5s!
                       </div>
                     )}
                     
                     <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-2 font-normal">
                         <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                         <span className="text-xs font-mono text-slate-300">Aumentar RAM do Sandbox (256MB)</span>
                       </div>
                       <button 
                         onClick={() => setTuningApplied(true)}
                         className="bg-indigo-600 hover:bg-indigo-500 text-[10px] font-mono py-1.5 px-3 rounded-lg text-white font-semibold transition-colors cursor-pointer"
                       >
                         Aplicar Otimização
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeTab === "communication" && (
             <div className="flex flex-col gap-4">
               {notifications.map(n => (
                 <div key={n.id} className="p-4 rounded-xl border bg-[#030712]/50 border-slate-700/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-slate-200">Destinatário: {n.target}</span>
                       <span className="text-xs bg-indigo-505/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">{n.status}</span>
                    </div>
                    <p className="text-sm text-slate-400">Tipo: {n.type}</p>
                    <span className="text-xs text-slate-500 font-mono">Enviado em: {n.sentAt}</span>
                 </div>
               ))}
             </div>
           )}

           {activeTab === "settings" && (
              <div className="text-slate-300 text-sm">Configuração de regras (em desenvolvimento)</div>
           )}
        </div>
      </div>
    </div>
  )
}
