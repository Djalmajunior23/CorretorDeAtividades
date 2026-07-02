import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  ChevronRight,
  Download,
  RefreshCw,
  BookOpen,
  Target,
  BrainCircuit,
  LayoutGrid,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { apiUrl, safeJsonResponse } from "../config/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export default function EducationalAnalyticsView() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [overview, setOverview] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overRes, classRes, studRes] = await Promise.all([
        fetch(apiUrl("/api/analytics/overview")),
        fetch(apiUrl("/api/analytics/classes")),
        fetch(apiUrl("/api/analytics/students")),
      ]);
      setOverview(await overRes.json());
      setClasses(await classRes.json());
      setStudents(await studRes.json());
    } catch (e) {
      toast.error("Erro ao carregar dados analíticos.");
    } finally {
      setLoading(false);
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(apiUrl("/api/analytics/recalculate"), { method: "POST" });
      if (res.ok) {
        toast.success("Analytics recalculado com sucesso!");
        fetchData();
      }
    } catch (e) {
      toast.error("Erro ao recalcular.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    const toastId = toast.loading("Gerando PDF formatado...");

    try {
      // Temporarily add some padding and fix width for better capture if needed
      // But for now let's try direct capture
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#020617",
        logging: false,
        onclone: (clonedDoc) => {
          // You can modify the cloned document before capture here if needed
          const el = clonedDoc.getElementById("report-content");
          if (el) el.style.padding = "40px";
          
          // Hide elements that shouldn't be in the PDF
          const noPrintElements = clonedDoc.querySelectorAll(".no-print");
          noPrintElements.forEach(el => {
            (el as HTMLElement).style.display = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Analytics_${new Date().toISOString().split("T")[0]}.pdf`);

      toast.success("Relatório exportado com sucesso!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar PDF.", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs animate-pulse">
        Carregando IA Engine...
      </div>
    );
  }

  return (
    <div
      ref={reportRef}
      id="report-content"
      className="flex flex-col gap-8 animate-in fade-in duration-700 p-1"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-display">
            Analytics Educacional
          </h2>
          <p className="text-slate-400 mt-1">
            Transformando correções em indicadores estratégicos de aprendizagem.
          </p>
        </div>
        <div className="flex gap-3 no-print">
          <button
            onClick={recalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`}
            />
            {recalculating ? "Processando..." : "Atualizar Analytics"}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Download
              className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`}
            />
            {exporting ? "Exportando..." : "Exportar Relatório"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total de Entregas"
          value={overview?.total_submissions || 0}
          icon={BookOpen}
          color="text-blue-400"
          bgColor="bg-blue-400/10"
        />
        <KPICard
          title="Média Geral"
          value={Number(overview?.average_score || 0).toFixed(1)}
          icon={Target}
          color="text-emerald-400"
          bgColor="bg-emerald-400/10"
          suffix="/100"
        />
        <KPICard
          title="Taxa de Evolução"
          value="12%"
          icon={TrendingUp}
          color="text-purple-400"
          bgColor="bg-purple-400/10"
        />
        <KPICard
          title="Alunos em Atenção"
          value={overview?.students_at_risk || 0}
          icon={AlertCircle}
          color="text-amber-400"
          bgColor="bg-amber-400/10"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Heatmap Section */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-emerald-400" />
                  Matriz de Conhecimento por Turma
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Domínio de conteúdos fundamentais de programação.
                </p>
              </div>
              <button className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="w-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                      Turma
                    </th>
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold text-center">
                      Variáveis
                    </th>
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold text-center">
                      Lógica
                    </th>
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold text-center">
                      Vetores
                    </th>
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold text-center">
                      Funções
                    </th>
                    <th className="pb-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold text-center">
                      Média
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {classes.map((c) => (
                    <tr
                      key={c.class_name}
                      className="group hover:bg-slate-800/20 transition-all cursor-pointer"
                    >
                      <td className="py-4 font-bold text-white text-sm">
                        {c.class_name}
                      </td>
                      {["92%", "81%", "45%", "35%"].map((val, idx) => (
                        <td key={idx} className="py-4 text-center">
                          <div
                            className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ring-1 ring-white/10 ${
                              parseInt(val) >= 80
                                ? "bg-emerald-500 text-white"
                                : parseInt(val) >= 60
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : parseInt(val) >= 40
                                    ? "bg-amber-500/20 text-amber-500"
                                    : "bg-rose-500/20 text-rose-500"
                            }`}
                          >
                            {val}
                          </div>
                        </td>
                      ))}
                      <td className="py-4 text-center font-black text-white text-sm">
                        {Number(c.average_score || 0).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                  {classes.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-500 italic text-sm"
                      >
                        Nenhum dado de turma disponível. Adicione correções para
                        gerar o analytics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider text-slate-500">
                Distribuição de Notas
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "0-30", val: 5 },
                      { name: "31-50", val: 12 },
                      { name: "51-70", val: 35 },
                      { name: "71-90", val: 28 },
                      { name: "91-100", val: 15 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" fontSize={10} stroke="#475569" />
                    <YAxis fontSize={10} stroke="#475569" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#10b981" }}
                    />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {[5, 12, 35, 28, 15].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index > 2 ? "#10b981" : "#f59e0b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider text-slate-500">
                Evolução Média Mensal
              </h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { name: "Jan", val: 45 },
                      { name: "Fev", val: 52 },
                      { name: "Mar", val: 48 },
                      { name: "Abr", val: 63 },
                      { name: "Mai", val: 74 },
                      { name: "Jun", val: 78 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" fontSize={10} stroke="#475569" />
                    <YAxis fontSize={10} stroke="#475569" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "10px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="val"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#8b5cf6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recommendations & Attention List */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Recomendações IA</h3>
            </div>

            <div className="space-y-4">
              <RecommendationItem
                text="Realizar atividade prática guiada sobre Vetores."
                icon={Target}
              />
              <RecommendationItem
                text="Aplicar exercício de decomposição com Funções."
                icon={BarChart3}
              />
              <RecommendationItem
                text="Revisar entrada e saída com Portugol/C."
                icon={AlertCircle}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-indigo-500/10">
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold mb-3">
                Resumo Pedagógico
              </p>
              <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-indigo-500 pl-4">
                "A turma apresenta desenvolvimento parcial em lógica de
                programação, com maior dificuldade em abstração de funções e
                indexação de vetores."
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Acompanhamento Crítico
            </h3>
            <div className="space-y-4">
              {students
                .filter((s) => s.attention_level !== "normal")
                .map((s) => (
                  <div
                    key={s.student_name}
                    className="flex flex-col p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {s.student_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          s.attention_level === "critical_support"
                            ? "bg-rose-500/10 text-rose-400"
                            : s.attention_level === "reinforcement_needed"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {s.attention_level === "critical_support"
                          ? "Suporte Crítico"
                          : s.attention_level === "reinforcement_needed"
                            ? "Reforço"
                            : "Atenção"}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Média
                        </span>
                        <span className="text-lg font-black text-slate-200">
                          {Number(s.average_score || 0).toFixed(0)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                        {s.weakest_topics?.slice(0, 2).map((t: string) => (
                          <span
                            key={t}
                            className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 truncate"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              {students.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-600 italic">
                  Nenhum perfil de aluno gerado.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  suffix = "",
}: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:bg-slate-800/40 transition-all group">
      <div
        className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
        {title}
      </p>
      <div className="flex items-baseline gap-1 mt-1">
        <h4 className="text-3xl font-black text-white">{value}</h4>
        <span className="text-xs font-bold text-slate-600">{suffix}</span>
      </div>
    </div>
  );
}

function RecommendationItem({ text, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-800/40 rounded-2xl hover:bg-slate-950 transition-all">
      <div className="p-1.5 bg-indigo-500/10 rounded-lg shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-indigo-400" />
      </div>
      <p className="text-xs text-slate-300 leading-tight">{text}</p>
    </div>
  );
}
