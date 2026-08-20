import React from "react";
import { TrendingUp, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function PredictiveAnalyticsView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold">
            <TrendingUp className="w-4 h-4" /> Evolução 02 • Analytics Preditivo
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Machine Learning Atuarial & Previsão de Evasão</h1>
          <p className="text-sm text-slate-400 mt-1">Identifique alunos em risco de retenção antes mesmo das provas finais.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Risco Crítico</span>
          <div className="text-3xl font-black text-rose-400 font-mono mt-1">3 Alunos</div>
          <span className="text-[10px] text-slate-500 font-mono">Probabilidade de reprovação &gt; 70%</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Atenção Necessária</span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">7 Alunos</div>
          <span className="text-[10px] text-slate-500 font-mono">Queda de rendimento recente</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Desempenho Estável</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">35 Alunos</div>
          <span className="text-[10px] text-slate-500 font-mono">Dentro da média esperada</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-mono text-slate-400 uppercase">Acurácia do Modelo</span>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">94.8%</div>
          <span className="text-[10px] text-slate-500 font-mono">Treinado com dados históricos</span>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" /> Alunos com Alerta Preditivo Ativo
        </h3>
        <div className="space-y-3">
          {[
            { name: "Carlos Eduardo da Silva", turma: "Turma A (Engenharia)", risk: "Crítico (82%)", reason: "Falta de submissões nas últimas 3 semanas e nota média 4.2" },
            { name: "Mariana Alencar", turma: "Turma B (Sistemas)", risk: "Moderado (58%)", reason: "Dificuldade recorrente em estruturas de repetição" },
            { name: "Lucas Ferreira", turma: "Turma A (Engenharia)", risk: "Moderado (51%)", reason: "Tempo de conclusão de atividades 3x superior à média" },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#030712] border border-slate-800">
              <div>
                <span className="text-sm font-bold text-white block">{item.name}</span>
                <span className="text-xs text-slate-400 font-mono">{item.turma} • Motivo: {item.reason}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold">
                  {item.risk}
                </span>
                <button 
                  onClick={() => toast.success(`Plano de intervenção gerado para ${item.name}!`)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl transition-all"
                >
                  Gerar Intervenção
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
