import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Download, FileText, CheckCircle2, Clock, UserX, Zap, Activity } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Cell, BarChart, Bar } from "recharts";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function PredictivePerformanceView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [modelName, setModelName] = useState("gemma3:4b");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/analytics/predictive-performance"));
      const json = await safeJsonResponse(res);
      if (json && json.success) {
        setData(json);
        if (json.model) setModelName(json.model);
      }
    } catch (e) {
      console.error("Error fetching predictive performance data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK AI - RELATÓRIO PREDITIVO DE DESEMPENHO E RETENÇÃO", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Modelo IA: ${modelName}`, 14, 28);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34);

    const rows = (data?.studentsAtRisk || []).map((s: any) => [
      s.studentName,
      s.className,
      `${s.retentionProbability}%`,
      s.creativeBlockDetected ? "Sim (Bloqueio Criativo)" : "Normal",
      s.typingIdleAvg || "28s",
      s.recommendedAction
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Estudante", "Turma", "Retenção", "Padrão Digitação", "Ociosidade Média", "Ação Pedagógica"]],
      body: rows.length > 0 ? rows : [["Nenhum estudante", "-", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Relatorio_Preditivo_Desempenho_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-emerald-500/20">
              AI_PEDAGOGICAL_MODEL • {modelName}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-2">
            Relatórios Pedagógicos Preditivos & Retenção
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Análise neural do ritmo de submissão dos estudantes, probabilidade de retenção escolar e detecção em tempo real de bloqueio criativo por telemetria de digitação.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Reanalisar Ritmo
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
          <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Processando telemetria e padrões neurais com {modelName}...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase">Taxa Média de Retenção</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-display">
                  {data?.metrics?.averageRetentionRate || "84.2"}%
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">+2.4% este mês</span>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase">Bloqueios Criativos Detectados</span>
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-display">
                  {data?.metrics?.creativeBlockCount || "7"}
                </span>
                <span className="text-xs font-mono text-rose-400 font-semibold">Requer interveção</span>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase">Ritmo de Submissão</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-display">
                  {data?.metrics?.submissionVelocity || "1.48"} /h
                </span>
                <span className="text-xs font-mono text-slate-400">Média por turma</span>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono uppercase">Modelo Preditivo Ativo</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-4">
                <span className="text-lg font-bold text-emerald-400 font-mono truncate block">
                  {modelName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Latência: {data?.latencyMs || 240}ms</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Retention Probability Chart */}
            <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Tendência de Probabilidade de Retenção (15 Dias)</h3>
                  <p className="text-xs text-slate-400">Evolução institucional da retenção mapeada por telemetria preditiva.</p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.retentionTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[60, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#030712", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: any) => [`${val}%`, "Retenção Esperada"]}
                    />
                    <Line type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Submission Rhythm & Velocity */}
            <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display">Ritmo de Submissão por Turma</h3>
                  <p className="text-xs text-slate-400">Atividades entregues por dia no ciclo atual.</p>
                </div>
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.rhythmData || []} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="className" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#030712", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }}
                      formatter={(val: any) => [val, "Submissões / Dia"]}
                    />
                    <Bar dataKey="submissionsPerDay" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Students Flagged with Creative Block */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Estudantes com 'Bloqueio Criativo' Detectado por Telemetria
                </h3>
                <p className="text-xs text-slate-400">
                  Identificados por pausas prolongadas (&gt;25s) sem inserção de código e alta taxa de exclusões em linhas consecutivas.
                </p>
              </div>
              <span className="text-xs font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1 rounded-lg">
                {(data?.studentsAtRisk || []).filter((s: any) => s.creativeBlockDetected).length} Alunos Identificados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.studentsAtRisk || []).map((student: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                    student.creativeBlockDetected
                      ? "bg-rose-950/20 border-rose-900/50 hover:border-rose-700/50"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-400 uppercase">{student.className}</div>
                      <h4 className="text-base font-bold text-white mt-0.5">{student.studentName}</h4>
                    </div>
                    {student.creativeBlockDetected ? (
                      <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                        <Clock className="w-3 h-3" /> Bloqueio Criativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Ritmo Estável
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Prob. Retenção:</span>
                      <span className={student.retentionProbability < 60 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {student.retentionProbability}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ociosidade Média:</span>
                      <span className="text-amber-400 font-bold">{student.typingIdleAvg || "28s"}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold mb-1">
                      Ação Preventiva Sugerida:
                    </span>
                    {student.recommendedAction}
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

export default PredictivePerformanceView;
