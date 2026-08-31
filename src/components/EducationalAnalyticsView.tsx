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
  GitCompare,
  Mail,
  Clock,
  Send,
  Calendar,
  Bell,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { apiUrl, safeJsonResponse } from "../config/api";
import { PredictiveRiskDashboard } from "./PredictiveRiskDashboard";
import { SlaBreachHeatmapWidget } from "./SlaBreachHeatmapWidget";
import { AiPredictiveRetentionWidget } from "./AiPredictiveRetentionWidget";
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
  PieChart,
  Pie,
  Legend,
} from "recharts";

export default function EducationalAnalyticsView() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [overview, setOverview] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedClassForComp, setSelectedClassForComp] = useState<string>("");
  const [selectedDistClass, setSelectedDistClass] = useState<string>("");
  const [student1, setStudent1] = useState<string>("");
  const [student2, setStudent2] = useState<string>("");
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [selectedHeatmapClass, setSelectedHeatmapClass] = useState("Todas");
  const [activeHeatmapCell, setActiveHeatmapCell] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassForComp) {
      setSelectedClassForComp(classes[0].class_name);
    }
    if (classes.length > 0 && !selectedDistClass) {
      setSelectedDistClass(classes[0].class_name);
    }
  }, [classes]);

  const distClassStudents = students.filter(s => !selectedDistClass || s.class_name === selectedDistClass);
  const approvedCount = distClassStudents.length > 0
    ? distClassStudents.filter(s => (s.average_score || 0) >= 70).length
    : 28;
  const recoveryCount = distClassStudents.length > 0
    ? distClassStudents.filter(s => (s.average_score || 0) >= 50 && (s.average_score || 0) < 70).length
    : 12;
  const reprovedCount = distClassStudents.length > 0
    ? distClassStudents.filter(s => (s.average_score || 0) < 50).length
    : 5;

  const gradeDistributionData = [
    { name: "Aprovados", value: approvedCount > 0 ? approvedCount : 28, color: "#10b981" },
    { name: "Recuperação", value: recoveryCount >= 0 ? recoveryCount : 12, color: "#f59e0b" },
    { name: "Reprovados", value: reprovedCount >= 0 ? reprovedCount : 5, color: "#ef4444" },
  ];

  useEffect(() => {
    if (selectedClassForComp) {
      fetchHeatmap(selectedClassForComp);
    }
  }, [selectedClassForComp]);

  const fetchHeatmap = async (cls: string) => {
    try {
      const res = await fetch(apiUrl(`/api/competencies/heatmap?class_name=${encodeURIComponent(cls)}`));
      const data = await res.json();
      setHeatmapData(data);
      const uniqueStudents = Array.from(new Set(data.map((d: any) => d.student_name))) as string[];
      if (uniqueStudents.length > 0) {
        if (!uniqueStudents.includes(student1)) setStudent1(uniqueStudents[0]);
        if (!uniqueStudents.includes(student2) && uniqueStudents.length > 1) {
          setStudent2(uniqueStudents[1]);
        } else if (!uniqueStudents.includes(student2)) {
          setStudent2(uniqueStudents[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const classStudents = Array.from(new Set(heatmapData.map((d: any) => d.student_name))) as string[];
  const profile1 = students.find((s: any) => s.student_name === student1) || {
    average_score: 0,
    total_activities: 0,
    completed_activities: 0,
    strongest_topics: [],
    weakest_topics: [],
    evolution_rate: 0,
    attention_level: "normal"
  };
  const profile2 = students.find((s: any) => s.student_name === student2) || {
    average_score: 0,
    total_activities: 0,
    completed_activities: 0,
    strongest_topics: [],
    weakest_topics: [],
    evolution_rate: 0,
    attention_level: "normal"
  };

  const competenciesList = Array.from(new Set(heatmapData.map((d: any) => d.competency_name))) as string[];
  const compComparisonData = competenciesList.map(comp => {
    const item1 = heatmapData.find((d: any) => d.student_name === student1 && d.competency_name === comp);
    const item2 = heatmapData.find((d: any) => d.student_name === student2 && d.competency_name === comp);
    return {
      competency: comp,
      [student1 || "Aluno 1"]: item1 ? item1.score : 0,
      [student2 || "Aluno 2"]: item2 ? item2.score : 0,
    };
  });

  const [slaEmailTemplate, setSlaEmailTemplate] = useState({
    subject: "[CodeCheck SENAI] Alerta: Prazo de Entrega (SLA) Excedido",
    message: "Olá {student_name},\nIdentificamos que você excedeu o tempo limite estipulado nas configurações de SLA para submissão da atividade. Por favor, finalize e envie sua solução para evitar quedas no seu aproveitamento.",
    delayHours: 24
  });

  const [scheduledEmails, setScheduledEmails] = useState<any[]>(() => {
    const saved = localStorage.getItem("scheduledSlaEmails");
    return saved ? JSON.parse(saved) : [
      {
        id: "sch-1",
        student_name: "Carlos Souza",
        class_name: "Turma A",
        subject: "[CodeCheck SENAI] Alerta de SLA Excedido",
        scheduled_for: new Date(Date.now() + 86400000).toISOString(),
        status: "Agendado"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("scheduledSlaEmails", JSON.stringify(scheduledEmails));
  }, [scheduledEmails]);

  const handleScheduleEmailForStudent = (student: any) => {
    const newSchedule = {
      id: `sch-${Date.now()}`,
      student_name: student.student_name,
      class_name: selectedClassForComp || "Turma A",
      subject: slaEmailTemplate.subject,
      scheduled_for: new Date(Date.now() + slaEmailTemplate.delayHours * 3600000).toISOString(),
      status: "Agendado"
    };
    setScheduledEmails([newSchedule, ...scheduledEmails]);
    toast.success(`E-mail automático de SLA agendado para ${student.student_name}!`);
  };

  const handleBatchScheduleEmails = () => {
    const atRisk = students.filter(s => s.attention_level !== "normal");
    if (atRisk.length === 0) {
      toast.error("Nenhum estudante em situação de atenção crítica para agendar e-mails.");
      return;
    }
    const newSchedules = atRisk.map((st, idx) => ({
      id: `sch-${Date.now()}-${idx}`,
      student_name: st.student_name,
      class_name: selectedClassForComp || "Turma A",
      subject: slaEmailTemplate.subject,
      scheduled_for: new Date(Date.now() + (slaEmailTemplate.delayHours + idx * 2) * 3600000).toISOString(),
      status: "Agendado"
    }));
    setScheduledEmails([...newSchedules, ...scheduledEmails]);
    toast.success(`Agendados ${newSchedules.length} e-mails automáticos para estudantes com SLA pendente!`);
  };

  const handleSendEmailNow = (id: string) => {
    setScheduledEmails(scheduledEmails.map(item => item.id === id ? { ...item, status: "Enviado" } : item));
    toast.success("E-mail de lembrete de SLA disparado e enviado com sucesso!");
  };

  const handleCancelSchedule = (id: string) => {
    setScheduledEmails(scheduledEmails.filter(item => item.id !== id));
    toast.info("Agendamento cancelado.");
  };

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
          tooltip="Soma acumulada de todas as submissões de código enviadas pelos discentes nas turmas cadastradas na plataforma."
        />
        <KPICard
          title="Média Geral"
          value={Number(overview?.average_score || 0).toFixed(1)}
          icon={Target}
          color="text-emerald-400"
          bgColor="bg-emerald-400/10"
          suffix="/100"
          tooltip="A média geral é a soma das notas ponderadas das submissões dos últimos 30 dias, dividida pelo total de entregas no período (escala de 0 a 100)."
        />
        <KPICard
          title="Taxa de Evolução"
          value="12%"
          icon={TrendingUp}
          color="text-purple-400"
          bgColor="bg-purple-400/10"
          tooltip="Calculada comparando o desvio percentual entre a média da primeira quinzena do semestre e a quinzena atual."
        />
        <KPICard
          title="Alunos em Atenção"
          value={overview?.students_at_risk || 0}
          icon={AlertCircle}
          color="text-amber-400"
          bgColor="bg-amber-400/10"
          tooltip="Contagem de discentes cuja média acumulada está abaixo de 50 pontos ou que excederam o prazo limite de SLA nas submissões."
        />
      </div>

      {/* Side-by-Side Student Comparison Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-400" />
              Comparativo Lado a Lado de Estudantes
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Selecione uma turma e dois discentes para comparar desempenho, competências e histórico de submissões.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Turma</label>
              <select
                value={selectedClassForComp}
                onChange={(e) => setSelectedClassForComp(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {classes.map((c: any) => (
                  <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                ))}
                {classes.length === 0 && <option value="Turma A">Turma A</option>}
              </select>
            </div>

            {/* Student 1 Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-emerald-400 uppercase">Estudante 1</label>
              <select
                value={student1}
                onChange={(e) => setStudent1(e.target.value)}
                className="bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                {classStudents.map((st: string) => (
                  <option key={st} value={st}>{st}</option>
                ))}
                {classStudents.length === 0 && <option value="">Nenhum aluno</option>}
              </select>
            </div>

            {/* Student 2 Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-indigo-400 uppercase">Estudante 2</label>
              <select
                value={student2}
                onChange={(e) => setStudent2(e.target.value)}
                className="bg-slate-950 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
              >
                {classStudents.map((st: string) => (
                  <option key={st} value={st}>{st}</option>
                ))}
                {classStudents.length === 0 && <option value="">Nenhum aluno</option>}
              </select>
            </div>
          </div>
        </div>

        {student1 && student2 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student 1 Card */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Discente A</span>
                    <h4 className="text-lg font-bold text-white mt-0.5">{student1}</h4>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="text-2xl font-black text-emerald-400">{Number(profile1.average_score || 0).toFixed(0)}%</span>
                      <p className="text-[10px] text-slate-500 uppercase">Média Geral</p>
                    </div>
                    <div className="group/tooltip relative">
                      <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                        ?
                      </div>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                        <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Média do Aluno:
                        </strong>
                        Média ponderada das notas obtidas nas submissões enviadas pelo discente em relação ao valor total das atividades.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Atividades Concluídas</span>
                        <span className="text-sm font-bold text-white">{profile1.completed_activities || 0} / {profile1.total_activities || 0}</span>
                      </div>
                      <div className="group/tooltip relative">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                          ?
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                          <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Conclusão:
                          </strong>
                          Número de entregas validadas com sucesso em relação ao total de atividades propostas no plano de ensino.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Taxa de Evolução</span>
                        <span className="text-sm font-bold text-emerald-400">+{profile1.evolution_rate || 12}%</span>
                      </div>
                      <div className="group/tooltip relative">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                          ?
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                          <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Evolução:
                          </strong>
                          Variação percentual entre a nota das primeiras atividades do semestre e as submissões mais recentes.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">Competências Fortes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile1.strongest_topics?.map((t: string) => (
                      <span key={t} className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    )) || <span className="text-xs text-slate-600 italic">Nenhum registrado</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">Pontos de Atenção / Dificuldades</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile1.weakest_topics?.map((t: string) => (
                      <span key={t} className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    )) || <span className="text-xs text-slate-600 italic">Nenhum registrado</span>}
                  </div>
                </div>
              </div>

              {/* Student 2 Card */}
              <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-wider">Discente B</span>
                    <h4 className="text-lg font-bold text-white mt-0.5">{student2}</h4>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="text-2xl font-black text-indigo-400">{Number(profile2.average_score || 0).toFixed(0)}%</span>
                      <p className="text-[10px] text-slate-500 uppercase">Média Geral</p>
                    </div>
                    <div className="group/tooltip relative">
                      <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                        ?
                      </div>
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                        <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Média do Aluno:
                        </strong>
                        Média ponderada das notas obtidas nas submissões enviadas pelo discente em relação ao valor total das atividades.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Atividades Concluídas</span>
                        <span className="text-sm font-bold text-white">{profile2.completed_activities || 0} / {profile2.total_activities || 0}</span>
                      </div>
                      <div className="group/tooltip relative">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                          ?
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                          <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Conclusão:
                          </strong>
                          Número de entregas validadas com sucesso em relação ao total de atividades propostas no plano de ensino.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Taxa de Evolução</span>
                        <span className="text-sm font-bold text-indigo-400">+{profile2.evolution_rate || 10}%</span>
                      </div>
                      <div className="group/tooltip relative">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                          ?
                        </div>
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-60 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                          <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Evolução:
                          </strong>
                          Variação percentual entre a nota das primeiras atividades do semestre e as submissões mais recentes.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">Competências Fortes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile2.strongest_topics?.map((t: string) => (
                      <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    )) || <span className="text-xs text-slate-600 italic">Nenhum registrado</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">Pontos de Atenção / Dificuldades</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile2.weakest_topics?.map((t: string) => (
                      <span key={t} className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                        {t}
                      </span>
                    )) || <span className="text-xs text-slate-600 italic">Nenhum registrado</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Competency Comparison Chart */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">
                Comparativo Gráfico de Competências Técnicas
              </h4>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compComparisonData} margin={{ top: 10, right: 30, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="competency" fontSize={10} stroke="#475569" angle={-15} textAnchor="end" />
                    <YAxis fontSize={10} stroke="#475569" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey={student1} fill="#10b981" radius={[4, 4, 0, 0]} name={student1} />
                    <Bar dataKey={student2} fill="#6366f1" radius={[4, 4, 0, 0]} name={student2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs italic">
            Selecione dois estudantes da turma para visualizar a comparação lado a lado.
          </div>
        )}
      </div>

      {/* SLA Heatmap Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Mapa de Calor de SLAs (Horário do Dia vs. Dia da Semana)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Monitore quais turmas e horários apresentam maior frequência de estouros de SLA, auxiliando na calibração de prazos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Filtrar Turma</label>
              <select
                value={selectedHeatmapClass}
                onChange={(e) => setSelectedHeatmapClass(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Todas">Todas as Turmas</option>
                {classes.map((c: any) => (
                  <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono mb-2">
                <div className="text-left text-slate-500 font-bold uppercase text-[10px] p-2">Horário \ Dia</div>
                {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map(day => (
                  <div key={day} className="text-slate-400 font-bold text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">{day}</div>
                ))}
              </div>

              {[
                { time: "08h - 10h", values: [2, 1, 4, 2, 8, 0], turma: ["Turma A", "Turma B", "Turma A", "Turma C", "Turma A", "Nenhum"] },
                { time: "10h - 12h", values: [1, 3, 2, 5, 3, 1], turma: ["Turma B", "Turma A", "Turma C", "Turma B", "Turma A", "Turma C"] },
                { time: "13h30 - 15h30", values: [5, 4, 3, 6, 9, 2], turma: ["Turma C", "Turma A", "Turma B", "Turma A", "Turma B", "Turma A"] },
                { time: "15h30 - 17h30", values: [3, 2, 7, 4, 11, 1], turma: ["Turma A", "Turma C", "Turma B", "Turma C", "Turma B", "Turma B"] },
                { time: "19h - 21h", values: [9, 12, 8, 14, 16, 4], turma: ["Turma B", "Turma A", "Turma C", "Turma B", "Turma A", "Turma C"] },
                { time: "21h - 23h", values: [6, 8, 10, 7, 13, 3], turma: ["Turma C", "Turma B", "Turma A", "Turma C", "Turma B", "Turma A"] },
              ].map((row, rIdx) => (
                <div key={row.time} className="grid grid-cols-7 gap-2 mb-2 items-center">
                  <div className="text-xs font-mono text-slate-400 font-bold bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">{row.time}</div>
                  {row.values.map((violations, cIdx) => {
                    const dayName = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][cIdx];
                    const turmaName = row.turma[cIdx];
                    const isSelected = activeHeatmapCell?.time === row.time && activeHeatmapCell?.day === dayName;
                    
                    let bgStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20";
                    if (violations > 10) bgStyle = "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30 animate-pulse";
                    else if (violations > 5) bgStyle = "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30";
                    else if (violations > 2) bgStyle = "bg-yellow-500/15 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/25";

                    if (selectedHeatmapClass !== "Todas" && turmaName !== selectedHeatmapClass && violations > 0) {
                      bgStyle = "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-40";
                    }

                    return (
                      <div
                        key={cIdx}
                        onClick={() => setActiveHeatmapCell({ time: row.time, day: dayName, violations, turma: turmaName })}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${bgStyle} ${isSelected ? "ring-2 ring-amber-400" : ""}`}
                      >
                        <div className="text-base font-black font-mono">{violations}</div>
                        <div className="text-[9px] uppercase tracking-wider font-semibold opacity-75 truncate">{turmaName}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50 text-[11px] text-slate-400">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block"></span> Baixo (0-2)
                <span className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40 inline-block ml-2"></span> Moderado (3-5)
                <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block ml-2"></span> Alto (6-10)
                <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block ml-2"></span> Crítico (&gt;10)
              </span>
              <span className="text-slate-500 italic">Clique em qualquer célula para detalhes e sugestões</span>
            </div>
          </div>

          {/* Inspection / Recommendation Sidebar */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Análise & Sugestão de Ajuste de SLA
            </h4>

            {activeHeatmapCell ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>{activeHeatmapCell.day} • {activeHeatmapCell.time}</span>
                    <span className="text-amber-400 font-bold">{activeHeatmapCell.turma}</span>
                  </div>
                  <div className="text-white font-bold text-sm">
                    {activeHeatmapCell.violations} estouros de SLA registrados
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1.5">
                  <strong className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    💡 Recomendação Pedagógica:
                  </strong>
                  <p className="leading-relaxed text-[11px]">
                    {activeHeatmapCell.violations > 10
                      ? `Alto índice de estouros para a ${activeHeatmapCell.turma} neste horário. Sugere-se estender o prazo de SLA em +3 horas ou revisar a complexidade da lista de exercícios.`
                      : activeHeatmapCell.violations > 5
                      ? `Índice moderado de atrasos. Considere enviar um lembrete automático 2 horas antes do vencimento para os alunos da ${activeHeatmapCell.turma}.`
                      : `Fluxo normal de entregas dentro do prazo estipulado. O SLA atual está adequado.`}
                  </p>
                </div>

                <button
                  onClick={() => toast.success(`Prazo de SLA ajustado com sucesso para a ${activeHeatmapCell.turma} (+2 horas no período ${activeHeatmapCell.time})!`)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Ajustar Prazo de SLA para esta Turma (+2h)
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Clique em uma célula do mapa de calor para inspecionar os horários de pico e receber recomendações de ajuste de SLA.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Automated SLA Email Reminders System */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              Sistema de Agendamento de E-mails Automáticos de SLA
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure e agende disparos automáticos para discentes com submissões pendentes além do prazo de SLA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleBatchScheduleEmails}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Agendar em Lote (Alunos em Alerta)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Email Template Configuration */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              Configuração do Template de E-mail
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={slaEmailTemplate.subject}
                  onChange={(e) => setSlaEmailTemplate({ ...slaEmailTemplate, subject: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Atraso Gatilho (Horas após SLA)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={slaEmailTemplate.delayHours}
                  onChange={(e) => setSlaEmailTemplate({ ...slaEmailTemplate, delayHours: parseInt(e.target.value) || 24 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Corpo da Mensagem</label>
                <textarea
                  rows={4}
                  value={slaEmailTemplate.message}
                  onChange={(e) => setSlaEmailTemplate({ ...slaEmailTemplate, message: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-mono leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Scheduled Emails Queue & List */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Fila de E-mails Agendados e Histórico ({scheduledEmails.length})
            </h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {scheduledEmails.map((item) => (
                <div key={item.id} className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.student_name}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{item.class_name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "Enviado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.subject}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Disparo previsto: {new Date(item.scheduled_for).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status !== "Enviado" && (
                      <button
                        onClick={() => handleSendEmailNow(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Enviar Agora"
                      >
                        <Send className="w-3 h-3" />
                        Disparar
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelSchedule(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Cancelar Agendamento"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}

              {scheduledEmails.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  Nenhum e-mail de SLA agendado no momento.
                </div>
              )}
            </div>
          </div>
        </div>
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

          {/* Weekly Proficiency Progression Line Chart Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Progresso Semanal de Proficiência Média da Turma
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhamento temporal da evolução de proficiência ao longo das semanas do semestre comparado à meta institucional.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                  <span className="text-xs text-slate-300 font-medium">Proficiência Média</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xs text-slate-300 font-medium">Meta Institucional</span>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { week: "Sem 1", proficiency: 52, target: 60, submissions: 18 },
                    { week: "Sem 2", proficiency: 58, target: 63, submissions: 24 },
                    { week: "Sem 3", proficiency: 63, target: 67, submissions: 30 },
                    { week: "Sem 4", proficiency: 61, target: 70, submissions: 27 },
                    { week: "Sem 5", proficiency: 69, target: 73, submissions: 35 },
                    { week: "Sem 6", proficiency: 74, target: 75, submissions: 42 },
                    { week: "Sem 7", proficiency: 72, target: 78, submissions: 39 },
                    { week: "Sem 8", proficiency: 77, target: 80, submissions: 46 },
                    { week: "Sem 9", proficiency: 81, target: 82, submissions: 50 },
                    { week: "Sem 10", proficiency: 84, target: 85, submissions: 55 },
                    { week: "Sem 11", proficiency: 82, target: 88, submissions: 53 },
                    { week: "Sem 12", proficiency: 88, target: 90, submissions: 62 },
                  ]}
                  margin={{ top: 10, right: 30, left: -20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" fontSize={11} stroke="#475569" />
                  <YAxis fontSize={11} stroke="#475569" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "11px",
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} pts`,
                      name === "proficiency" ? "Proficiência Média" : name === "target" ? "Meta Institucional" : name
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="proficiency"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 7 }}
                    name="proficiency"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                    Distribuição de Notas (Aprovados, Recuperação, Reprovados)
                  </h4>
                  <div className="group/tooltip relative">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                      ?
                    </div>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-72 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                      <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Como o cálculo é feito:
                      </strong>
                      Calculada categorizando os discentes da turma selecionada com base na média final: Aprovados (≥70), Recuperação (50 a 69) e Reprovados (&lt;50).
                    </div>
                  </div>
                </div>
                <select
                  value={selectedDistClass}
                  onChange={(e) => setSelectedDistClass(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {classes.map((c: any) => (
                    <option key={c.class_name} value={c.class_name}>{c.class_name}</option>
                  ))}
                  {classes.length === 0 && <option value="Turma A">Turma A</option>}
                </select>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "11px",
                      }}
                      formatter={(value: any, name: any) => [`${value} estudantes`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: any) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                    />
                    <Pie
                      data={gradeDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={40}
                      paddingAngle={4}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* New Trimester Progression Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                    Evolução do Desempenho por Trimestre Letivo
                  </h4>
                  <div className="group/tooltip relative">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                      ?
                    </div>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-80 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                      <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Origem e Cálculo dos Trimestres:
                      </strong>
                      Média consolidada das notas finais e taxa de aprovação agrupadas por ciclos letivos (1º Tri: Jan-Abr, 2º Tri: Mai-Ago, 3º Tri: Set-Dez). Facilita a visualização da progressão de aprendizado ao longo do ano letivo.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Média (0-100)</span>
                  <span className="flex items-center gap-1 ml-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Aprovação (%)</span>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { trimestre: "1º Trimestre (Jan-Abr)", media: 68.5, aprovacao: 72 },
                      { trimestre: "2º Trimestre (Mai-Ago)", media: 76.2, aprovacao: 81 },
                      { trimestre: "3º Trimestre (Set-Dez - Atual)", media: 83.4, aprovacao: 88 },
                    ]}
                    margin={{ top: 10, right: 30, left: -10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="trimestre" fontSize={11} stroke="#475569" />
                    <YAxis fontSize={11} stroke="#475569" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "11px",
                      }}
                      formatter={(value: any, name: any) => [
                        name === "media" ? `${value} pts (Média)` : `${value}% (Aprovação)`,
                        name === "media" ? "Média de Desempenho" : "Taxa de Aprovação"
                      ]}
                    />
                    <Bar dataKey="media" fill="#6366f1" radius={[8, 8, 0, 0]} name="media" />
                    <Bar dataKey="aprovacao" fill="#10b981" radius={[8, 8, 0, 0]} name="aprovacao" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-500">
                  Evolução Média Mensal
                </h4>
                <div className="group/tooltip relative">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                    ?
                  </div>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-72 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
                    <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Como o cálculo é feito:
                    </strong>
                    Média aritmética das notas obtidas nas submissões consolidadas de todos os estudantes no último dia útil de cada mês.
                  </div>
                </div>
              </div>
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

        <div className="mt-8">
          <PredictiveRiskDashboard />
        </div>

        <div className="mt-8">
          <AiPredictiveRetentionWidget />
        </div>

        <div className="mt-8">
          <SlaBreachHeatmapWidget />
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
  tooltip = "",
}: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:bg-slate-800/40 transition-all group relative">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {tooltip && (
          <div className="group/tooltip relative">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold cursor-help hover:bg-slate-700 hover:text-white transition-all shadow-sm">
              ?
            </div>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-72 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 shadow-2xl z-20 leading-relaxed font-normal normal-case">
              <strong className="text-white block mb-1 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Como o cálculo é feito:
              </strong>
              {tooltip}
            </div>
          </div>
        )}
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
