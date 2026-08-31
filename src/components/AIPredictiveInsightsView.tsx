import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Download, FileText, CheckCircle2, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function AIPredictiveInsightsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [modelName, setModelName] = useState("gemma3:4b");

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/analytics/ai-predictive-insights"));
      const json = await safeJsonResponse(res);
      if (json && json.success) {
        setData(json);
        if (json.model) setModelName(json.model);
      }
    } catch (e) {
      console.error("Error fetching AI predictive insights", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK AI - ANÁLISE PREDITIVA DE EVASÃO (15 DIAS)", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Modelo Utilizado: ${modelName}`, 14, 28);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

    const rows = (data?.predictions || []).map((p: any) => [
      p.className,
      `${p.riskProbability}%`,
      p.riskLevel,
      p.primaryFactor,
      p.recommendedAction
    ]);

    (doc as any).autoTable({
      startY: 42,
      head: [["Turma", "Prob. Risco (15d)", "Nível", "Fator Principal", "Ação Recomendada"]],
      body: rows.length > 0 ? rows : [["Nenhum dado", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Analise_Preditiva_Evasao_${Date.now()}.pdf`);
  };

  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6366f1"];

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
              Motor Preditivo IA • {modelName}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-1">
            Análise Preditiva de Evasão & Risco Pedagógico
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Previsão automática de risco de evasão e cadência de submissão para os próximos 15 dias com base em histórico neural.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Atualizar Predição
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório PDF
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-[#0f172a] rounded-2xl border border-slate-800">
          <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Processando tendências históricas com {modelName}...</p>
        </div>
      ) : (
        <>
          {/* Charts & Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Probability Bar Chart */}
            <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Probabilidade de Evasão por Turma (Próximos 15 Dias)</h3>
                  <p className="text-xs text-slate-400">Percentual estimado de risco baseado em estouro de SLA e queda de submissão.</p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.predictions || []} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="className" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#030712", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: any) => [`${val}%`, "Probabilidade de Risco"]}
                    />
                    <Bar dataKey="riskProbability" radius={[6, 6, 0, 0]}>
                      {(data?.predictions || []).map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.riskProbability > 50 ? "#ef4444" : entry.riskProbability > 30 ? "#f59e0b" : "#10b981"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution Summary */}
            <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4 justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-display">Resumo de Níveis de Alerta</h3>
                <p className="text-xs text-slate-400">Distribuição institucional de turmas monitoradas.</p>
              </div>

              <div className="space-y-4 my-auto">
                {(data?.predictions || []).map((p: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.riskProbability > 50 ? "bg-rose-500 animate-pulse" : p.riskProbability > 30 ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{p.className}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{p.primaryFactor}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={`text-sm font-bold ${p.riskProbability > 50 ? "text-rose-400" : p.riskProbability > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                        {p.riskProbability}%
                      </div>
                      <div className="text-[9px] uppercase text-slate-500 font-semibold">{p.riskLevel} RISCO</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Análise gerada em tempo real com pesos neurais ajustados para o trimestre letivo vigente.</span>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations per Class */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <h3 className="text-base font-bold text-white font-display">Plano de Intervenção Preventiva Sugerido pela IA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.predictions || []).map((p: any, idx: number) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3 justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Turma Monitorada</span>
                      <h4 className="text-sm font-bold text-white">{p.className}</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${p.riskLevel === 'ALTO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : p.riskLevel === 'MÉDIO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                      {p.riskProbability}% RISCO
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold mb-1">Ação Preventiva Recomendada:</span>
                    {p.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default AIPredictiveInsightsView;
