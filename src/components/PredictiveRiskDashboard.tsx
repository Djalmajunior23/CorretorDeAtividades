import React, { useState } from "react";
import { TrendingUp, AlertTriangle, Users, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export function PredictiveRiskDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const [riskData, setRiskData] = useState([
    { name: "Vinícius Souza", turma: "Turma A", riskLevel: "Baixo", score: 88, overdueCount: 0, trend: "+5%" },
    { name: "Ana Clara Lima", turma: "Turma B", riskLevel: "Médio", score: 62, overdueCount: 2, trend: "-12%" },
    { name: "Carlos Eduardo", turma: "Turma A", riskLevel: "Alto", score: 41, overdueCount: 5, trend: "-25%" },
    { name: "Mariana Santos", turma: "Turma C", riskLevel: "Baixo", score: 94, overdueCount: 0, trend: "+8%" },
    { name: "Lucas Gabriel", turma: "Turma B", riskLevel: "Alto", score: 38, overdueCount: 6, trend: "-30%" },
  ]);

  const handleRefreshAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="rounded-2xl border border-[#1e295b]/30 bg-[#0f172a] p-6 flex flex-col gap-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e295b]/20 pb-4">
        <div>
          <h2 className="text-base font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Análise Preditiva de Desempenho & Risco de Evasão
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Machine Learning preventivo baseado em submissões, estouros de SLA e frequência nos laboratórios.
          </p>
        </div>
        <button
          onClick={handleRefreshAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Processando Modelo..." : "Atualizar Predição"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#030712]/60 border border-slate-800 flex flex-col gap-1 relative group/tooltip">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Alunos em Baixo Risco</span>
            <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help">?</div>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 shadow-xl z-20 font-normal normal-case">
              <strong className="text-white block mb-1 font-bold">Cálculo:</strong> Percentual de discentes com score preditivo superior a 75 e histórico sem estouros de SLA.
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-400 font-mono">78%</span>
          <span className="text-[10px] text-slate-500">Engajamento estável acima da média</span>
        </div>
        <div className="p-4 rounded-xl bg-[#030712]/60 border border-slate-800 flex flex-col gap-1 relative group/tooltip">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Alunos em Risco Moderado</span>
            <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help">?</div>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 shadow-xl z-20 font-normal normal-case">
              <strong className="text-white block mb-1 font-bold">Cálculo:</strong> Percentual de discentes com score preditivo entre 50 e 74 ou entre 1 e 3 estouros de SLA.
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-400 font-mono">14%</span>
          <span className="text-[10px] text-slate-500">Atrasos pontuais em listas recentes</span>
        </div>
        <div className="p-4 rounded-xl bg-[#030712]/60 border border-slate-800 flex flex-col gap-1 relative group/tooltip">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Alunos em Alto Risco (Evasão)</span>
            <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help">?</div>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 shadow-xl z-20 font-normal normal-case">
              <strong className="text-white block mb-1 font-bold">Cálculo:</strong> Percentual de discentes com score preditivo inferior a 50 ou mais de 3 SLAs estourados.
            </div>
          </div>
          <span className="text-2xl font-bold text-rose-400 font-mono">8%</span>
          <span className="text-[10px] text-slate-500">Necessitam de intervenção pedagógica urgente</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#161f36] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1e295b]/30">
            <tr>
              <th className="px-4 py-3">Discente</th>
              <th className="px-4 py-3">Turma</th>
              <th className="px-4 py-3">Nível de Risco</th>
              <th className="px-4 py-3">Score Preditivo</th>
              <th className="px-4 py-3">SLAs Estourados</th>
              <th className="px-4 py-3">Tendência (7d)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e295b]/20">
            {riskData.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#161f36]/40 transition-colors">
                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                    {item.name.charAt(0)}
                  </div>
                  {item.name}
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">{item.turma}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                    item.riskLevel === 'Baixo' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    item.riskLevel === 'Médio' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {item.riskLevel === 'Alto' && <ShieldAlert className="w-3 h-3" />}
                    {item.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-white">{item.score}/100</td>
                <td className="px-4 py-3 font-mono text-slate-300">{item.overdueCount}</td>
                <td className={`px-4 py-3 font-mono font-bold ${item.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.trend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
