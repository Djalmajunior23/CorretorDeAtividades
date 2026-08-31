import React, { useState, useEffect } from "react";
import { BrainCircuit, RefreshCw, AlertTriangle, ShieldCheck, TrendingDown, Clock, Award, Users, Download, Sparkles } from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function AiPredictiveRetentionWidget() {
  const [loading, setLoading] = useState(true);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [modelName, setModelName] = useState("gemma3:4b");
  const [latency, setLatency] = useState(0);
  const [filterCategory, setFilterCategory] = useState("Todos");

  const fetchRetentionData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/analytics/predictive-retention-students"));
      const json = await safeJsonResponse(res);
      if (json && json.success) {
        setRetentionData(json.students || []);
        if (json.model) setModelName(json.model);
        if (json.latencyMs) setLatency(json.latencyMs);
      }
    } catch (e) {
      console.error("Error fetching AI Predictive Retention students", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetentionData();
  }, []);

  const filteredStudents = retentionData.filter(st => {
    if (filterCategory === "Todos") return true;
    return st.riskCategory === filterCategory;
  });

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text("CODECHECK AI - RELATÓRIO DE RETENÇÃO PREDITIVA", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Modelo IA Pedagógica: ${modelName} | Latência: ${latency}ms`, 14, 28);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

    const rows = retentionData.map(st => [
      st.studentName,
      st.className,
      `${st.averageScore} pts`,
      `${st.lateDeliveries} atrasos`,
      `${st.retentionRiskScore}% (${st.riskCategory})`,
      st.primaryFactor
    ]);

    (doc as any).autoTable({
      startY: 42,
      head: [["Estudante", "Turma", "Média", "Atrasos (SLA)", "Risco de Evasão", "Fator Principal"]],
      body: rows.length > 0 ? rows : [["-", "Nenhum estudante", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Relatorio_Retencao_Preditiva_${Date.now()}.pdf`);
  };

  const criticalCount = retentionData.filter(s => s.riskCategory === "Crítico").length;
  const mediumCount = retentionData.filter(s => s.riskCategory === "Médio").length;
  const lowCount = retentionData.filter(s => s.riskCategory === "Baixo").length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-500/20 flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3 text-indigo-400" /> AI_PEDAGOGICAL_MODEL • {modelName}
            </span>
            {latency > 0 && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Latência: {latency}ms
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-2 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            IA Predictive Retention • Score de Risco de Evasão por Estudante
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Análise preditiva avançada cruzando tempo de entrega (SLA), notas de laboratório e histórico de submissões para antecipar evasão escolar e recomendar intervenções pedagógicas direcionadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRetentionData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            Recalcular Scores
          </button>
          <button
            onClick={handleExportPdf}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 block font-bold">Risco Crítico (&gt;70%)</span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{criticalCount} <span className="text-xs text-rose-400 font-normal">estudantes</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block font-bold">Risco Moderado (40-69%)</span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{mediumCount} <span className="text-xs text-amber-400 font-normal">estudantes</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block font-bold">Risco Baixo (&lt;40%)</span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{lowCount} <span className="text-xs text-emerald-400 font-normal">estudantes</span></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {["Todos", "Crítico", "Médio", "Baixo"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === cat
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500"
                : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            {cat === "Todos" ? `Todos os Estudantes (${retentionData.length})` : `${cat} (${retentionData.filter(s => s.riskCategory === cat).length})`}
          </button>
        ))}
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Calculando scores preditivos de retenção com {modelName}...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-3.5 px-4 font-bold">Estudante / Turma</th>
                <th className="py-3.5 px-4 font-bold">Média</th>
                <th className="py-3.5 px-4 font-bold">Atividades</th>
                <th className="py-3.5 px-4 font-bold">Atrasos (SLA)</th>
                <th className="py-3.5 px-4 font-bold">Score de Evasão (IA)</th>
                <th className="py-3.5 px-4 font-bold">Fator Principal & Intervenção Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredStudents.map((st) => {
                const riskColor = st.riskCategory === "Crítico" 
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30" 
                  : st.riskCategory === "Médio" 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

                return (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-bold text-white block text-sm">{st.studentName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{st.className}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-slate-200">
                      {st.averageScore} pts
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {st.completedActivities} / {st.totalActivities}
                    </td>
                    <td className="py-4 px-4 font-mono text-amber-400">
                      {st.lateDeliveries} atrasos
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${riskColor}`}>
                          {st.retentionRiskScore}% • {st.riskCategory}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <span className="text-slate-300 block text-[11px] font-medium">{st.primaryFactor}</span>
                      <span className="text-[10px] text-indigo-400 font-mono block mt-1">💡 {st.recommendedIntervention}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-mono text-xs">
                    Nenhum estudante encontrado com o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AiPredictiveRetentionWidget;
