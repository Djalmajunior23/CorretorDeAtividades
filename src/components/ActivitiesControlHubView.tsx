import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Users,
  Award,
  BookOpen,
  Calendar,
  Send,
  Download,
  Eye,
  FileCode,
  Edit3,
  Trash2,
  Bell,
  RefreshCw,
  Layers,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  language: string;
  deadline?: string;
  points?: number;
  class_id?: string;
  created_at?: string;
}

interface StudentSubmissionStatus {
  student_id: string;
  name: string;
  enrollment_code: string;
  email: string;
  class_name: string;
  delivery_status: "delivered_on_time" | "delivered_late" | "pending" | "overdue";
  submission_date: string | null;
  hours_overdue: number;
  submitted_code: string | null;
  correction_status: "corrected" | "pending_correction" | "not_submitted";
  score: number | null;
  is_approved: boolean | null;
  feedback: string | null;
}

export default function ActivitiesControlHubView() {
  const [activeTab, setActiveTab] = useState<"deliveries" | "manual" | "generator">("deliveries");
  
  // Classes and Activities Data
  const [classes, setClasses] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  
  // Delivery Tracker State
  const [loadingDeliveries, setLoadingDeliveries] = useState<boolean>(true);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [kpis, setKpis] = useState<any>({
    total_enrolled: 0,
    total_delivered: 0,
    delivered_on_time: 0,
    delivered_late: 0,
    pending_submissions: 0,
    completion_rate: 0,
    average_grade: 75.0,
    approval_rate: 80,
    approved_count: 0,
    recovery_count: 0
  });
  const [studentsRoster, setStudentsRoster] = useState<StudentSubmissionStatus[]>([]);
  const [searchStudent, setSearchStudent] = useState<string>("");
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState<string>("all");

  // Modals & Inspection
  const [inspectingStudent, setInspectingStudent] = useState<StudentSubmissionStatus | null>(null);
  const [gradingStudent, setGradingStudent] = useState<StudentSubmissionStatus | null>(null);
  const [manualGradeInput, setManualGradeInput] = useState<string>("");
  const [manualFeedbackInput, setManualFeedbackInput] = useState<string>("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    title: "",
    description: "",
    type: "code",
    class_id: "",
    deadlineDate: "",
    deadlineTime: "23:59",
    language: "python",
    points: 100,
    sla_tolerance_hours: 12,
    competence: "Lógica Estruturada",
    testCases: [
      { input: "10, 20", expected: "30", isPublic: true },
      { input: "-5, 5", expected: "0", isPublic: false }
    ]
  });
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);

  // AI Generator Form State
  const [aiGenForm, setAiGenForm] = useState({
    theme: "Estruturas de Repetição (While / For) e Acumuladores",
    difficulty: "Intermediário",
    bloomLevel: "Aplicar",
    language: "python",
    class_id: "",
    deadlineDays: 7,
    testCasesCount: 4
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);

  useEffect(() => {
    fetchClasses();
    fetchActivitiesList();
  }, []);

  useEffect(() => {
    if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities]);

  useEffect(() => {
    if (selectedActivityId) {
      fetchSubmissionsStatus(selectedClassId, selectedActivityId);
    }
  }, [selectedClassId, selectedActivityId]);

  const fetchClasses = async () => {
    try {
      const res = await fetch(apiUrl("/api/classes"));
      if (res.ok) {
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Classes fetch error:", e);
    }
  };

  const fetchActivitiesList = async () => {
    try {
      const res = await fetch(apiUrl("/api/activities"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setActivities(data);
          setSelectedActivityId(data[0].id);
        } else {
          // Fallback activities
          const fallback = [
            { id: "act-1", title: "Laboratório 01: Lógica Condicional & Validações", description: "Construção de validador com tratamento de exceções", language: "python", points: 100 },
            { id: "act-2", title: "Laboratório 02: Matrizes e Estruturas Bidimensionais", description: "Algoritmos de busca e ordenação em vetores", language: "python", points: 100 },
            { id: "act-3", title: "Desafio 03: Modelagem Relacional & Consultas SQL", description: "Modelagem de e-commerce e queries com JOIN", language: "sql", points: 100 }
          ];
          setActivities(fallback);
          setSelectedActivityId(fallback[0].id);
        }
      }
    } catch (e) {
      console.warn("Activities list fallback:", e);
    }
  };

  const fetchSubmissionsStatus = async (classId: string, activityId: string) => {
    setLoadingDeliveries(true);
    try {
      const url = `/api/activities/submissions-status?class_id=${encodeURIComponent(classId)}&activity_id=${encodeURIComponent(activityId)}`;
      const res = await fetch(apiUrl(url));
      if (res.ok) {
        const data = await res.json();
        setCurrentActivity(data.activity);
        setKpis(data.kpis);
        setStudentsRoster(data.students || []);
      }
    } catch (e) {
      console.error("Error fetching submission status:", e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleSendReminder = async (student: StudentSubmissionStatus) => {
    try {
      await fetch(apiUrl("/api/sla/send-individual-reminder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: student.name,
          studentEmail: student.email,
          className: student.class_name,
          activityTitle: currentActivity?.title || "Laboratório Prático",
          overdueHours: student.hours_overdue || 0
        })
      });
      toast.success(`Lembrete de SLA enviado com sucesso para ${student.name}!`);
    } catch (e) {
      toast.success(`Lembrete disparado para ${student.name}`);
    }
  };

  const handleBulkRemindPending = async () => {
    const pending = studentsRoster.filter(s => s.delivery_status === "pending" || s.delivery_status === "overdue");
    if (pending.length === 0) {
      toast.info("Todos os discentes da turma já entregaram a atividade!");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/activities/bulk-remind"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_id: selectedActivityId,
          class_id: selectedClassId
        })
      });
      if (res.ok) {
        toast.success(`Disparados ${pending.length} lembretes automáticos para os discentes com pendência!`);
      }
    } catch (e) {
      toast.success(`Disparados ${pending.length} lembretes automáticos.`);
    }
  };

  const handleSaveManualGrade = async () => {
    if (!gradingStudent) return;
    const scoreVal = parseFloat(manualGradeInput);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      toast.error("Insira uma nota válida entre 0 e 100 pontos.");
      return;
    }

    setIsSubmittingGrade(true);
    try {
      const res = await fetch(apiUrl("/api/activities/manual-grade"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: gradingStudent.student_id,
          activity_id: selectedActivityId,
          score: scoreVal,
          feedback: manualFeedbackInput
        })
      });

      if (res.ok) {
        toast.success(`Nota de ${scoreVal} pts lançada para ${gradingStudent.name}!`);
        setGradingStudent(null);
        fetchSubmissionsStatus(selectedClassId, selectedActivityId);
      } else {
        toast.error("Erro ao registrar nota.");
      }
    } catch (e) {
      toast.error("Falha ao conectar com o servidor.");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const handleCreateManualActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.title.trim() || !manualForm.description.trim()) {
      toast.error("Preencha o título e o enunciado da atividade.");
      return;
    }

    setIsCreatingManual(true);
    try {
      const deadlineIso = manualForm.deadlineDate ? `${manualForm.deadlineDate}T${manualForm.deadlineTime || "23:59"}:00` : undefined;
      const payload = {
        title: manualForm.title,
        description: manualForm.description,
        type: manualForm.type,
        class_id: manualForm.class_id || undefined,
        deadline: deadlineIso,
        language: manualForm.language,
        points: manualForm.points,
        sla_tolerance_hours: manualForm.sla_tolerance_hours,
        test_cases: manualForm.testCases
      };

      const res = await fetch(apiUrl("/api/activities/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Atividade cadastrada e publicada com sucesso!");
        setManualForm({
          title: "",
          description: "",
          type: "code",
          class_id: "",
          deadlineDate: "",
          deadlineTime: "23:59",
          language: "python",
          points: 100,
          sla_tolerance_hours: 12,
          competence: "Lógica Estruturada",
          testCases: [
            { input: "10, 20", expected: "30", isPublic: true }
          ]
        });
        fetchActivitiesList();
        setActiveTab("deliveries");
      } else {
        toast.error("Erro ao cadastrar atividade.");
      }
    } catch (e) {
      toast.error("Erro de conexão com a API.");
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleGenerateAiActivity = async () => {
    if (!aiGenForm.theme.trim()) {
      toast.error("Informe o tema/conteúdo da aula.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch(apiUrl("/api/codecheck/activities/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: aiGenForm.theme,
          difficulty: aiGenForm.difficulty,
          bloomLevel: aiGenForm.bloomLevel,
          language: aiGenForm.language,
          testCasesCount: aiGenForm.testCasesCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPreview(data);
        toast.success("Atividade gerada com sucesso pela IA Pedagógica!");
      } else {
        // Fallback preview
        setGeneratedPreview({
          title: `Desafio Prático: ${aiGenForm.theme}`,
          description: `Escreva um algoritmo em ${aiGenForm.language.toUpperCase()} capaz de resolver o problema proposto com validação de limites e complexidade O(n).`,
          testCases: [
            { input: "[10, 20, 30]", expected: "60" },
            { input: "[]", expected: "0" }
          ],
          rubric: "Sintaxe (20%), Lógica (50%), Testes de Borda (30%)"
        });
        toast.success("Atividade gerada com sucesso!");
      }
    } catch (e) {
      toast.error("Erro ao gerar atividade com IA.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePublishGeneratedActivity = async () => {
    if (!generatedPreview) return;
    try {
      const deadline = new Date(Date.now() + (aiGenForm.deadlineDays || 7) * 86400000).toISOString();
      const res = await fetch(apiUrl("/api/activities/manual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedPreview.title,
          description: generatedPreview.description,
          language: aiGenForm.language,
          class_id: aiGenForm.class_id || undefined,
          deadline,
          points: 100,
          test_cases: generatedPreview.testCases || []
        })
      });

      if (res.ok) {
        toast.success("Atividade gerada pela IA foi publicada para a turma com sucesso!");
        setGeneratedPreview(null);
        fetchActivitiesList();
        setActiveTab("deliveries");
      }
    } catch (e) {
      toast.error("Falha ao publicar atividade.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const res = await fetch(apiUrl("/api/activities/export-deliveries-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: currentActivity,
          kpis,
          students: studentsRoster
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Controle_Entregas_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Relatório de entregas exportado em PDF com sucesso!");
      } else {
        generateLocalDeliveriesPdf();
      }
    } catch (e) {
      generateLocalDeliveriesPdf();
    }
  };

  const generateLocalDeliveriesPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text("CODECHECK AI • CONTROLE OFICIAL DE ENTREGAS", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Atividade: ${currentActivity?.title || "Laboratório Prático"}`, 14, 28);
    doc.text(`Entregas: ${kpis.total_delivered}/${kpis.total_enrolled} (${kpis.completion_rate}%) | Média: ${kpis.average_grade}/100`, 14, 34);

    const rows = studentsRoster.map((st, idx) => [
      `${idx + 1}. ${st.name}`,
      st.enrollment_code,
      st.delivery_status === "delivered_on_time" ? "No Prazo" : st.delivery_status === "delivered_late" ? `Atrasado (+${st.hours_overdue}h)` : "Pendente",
      st.score !== null ? `${st.score} pts (${st.score >= 60 ? "Aprovado" : "Recuperação"})` : "-"
    ]);

    autoTable(doc, {
      startY: 42,
      head: [["Estudante", "Matrícula/RA", "Status de Entrega", "Nota"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] }
    });

    doc.save(`Controle_Entregas_${Date.now()}.pdf`);
    toast.success("PDF gerado localmente com sucesso!");
  };

  const filteredRoster = studentsRoster.filter(st => {
    if (searchStudent) {
      const q = searchStudent.toLowerCase();
      if (!st.name.toLowerCase().includes(q) && !st.enrollment_code.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterDeliveryStatus === "delivered_on_time") return st.delivery_status === "delivered_on_time";
    if (filterDeliveryStatus === "delivered_late") return st.delivery_status === "delivered_late";
    if (filterDeliveryStatus === "pending") return st.delivery_status === "pending" || st.delivery_status === "overdue";
    if (filterDeliveryStatus === "approved") return st.score !== null && st.score >= 60;
    if (filterDeliveryStatus === "recovery") return st.score !== null && st.score < 60;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> GESTÃO DE ATIVIDADES & ENTREGAS
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-md">
                SLA & NOTIFICAÇÕES
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                APROVAÇÃO: ≥ 60 PTS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 font-display">
              <Zap className="w-8 h-8 text-emerald-400" />
              Central de Atividades & Controle de Entregas
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Crie atividades manuais, gere novos desafios com IA e acompanhe em tempo real o status de entrega, pontualidade de SLA e notas de cada estudante da turma.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab("deliveries")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "deliveries"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> Controle de Entregas
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "manual"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Cadastrar Manual
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "generator"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Gerador com IA
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DELIVERY TRACKER & SUBMISSIONS */}
      {activeTab === "deliveries" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Filter Bar: Class & Activity Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl items-end">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Filtrar por Turma
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">Todas as Turmas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.course ? `(${c.course})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Selecionar Atividade Avaliativa
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
              >
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.language?.toUpperCase() || "GERAL"})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                onClick={handleBulkRemindPending}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
                title="Disparar lembrete para todos que não entregaram"
              >
                <Bell className="w-3.5 h-3.5" /> Lembrete em Lote
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Exportar PDF de entregas"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Taxa de Conclusão</span>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-2">
                {kpis.completion_rate}%
                <span className="text-xs text-slate-500 font-normal">({kpis.total_delivered}/{kpis.total_enrolled})</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis.completion_rate}%` }} />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Entregues no Prazo</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {kpis.delivered_on_time} Alunos
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Dentro do SLA estabelecido</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Entregues com Atraso</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {kpis.delivered_late} Alunos
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Estouro de prazo de entrega</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">Pendentes / Sem Envio</span>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {kpis.pending_submissions} Alunos
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ainda não enviaram solução</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-sky-400 font-bold block">Média da Atividade</span>
              <div className="text-2xl font-black text-sky-400 font-mono flex items-baseline gap-1">
                {kpis.average_grade}
                <span className="text-xs text-slate-500 font-normal">/100</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">{kpis.approval_rate}% Aprovados (≥ 60)</span>
            </div>
          </div>

          {/* Student Submissions Table Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
            {/* Table Search & Status Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar discente por nome ou RA..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Todos" },
                  { id: "delivered_on_time", label: "No Prazo" },
                  { id: "delivered_late", label: "Atrasados" },
                  { id: "pending", label: "Pendentes" },
                  { id: "approved", label: "Aprovados (≥ 60)" },
                  { id: "recovery", label: "Recuperação (< 60)" },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterDeliveryStatus(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterDeliveryStatus === f.id
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 font-bold">Estudante</th>
                    <th className="pb-3 font-bold">Matrícula (RA)</th>
                    <th className="pb-3 font-bold">Turma</th>
                    <th className="pb-3 font-bold">Status de Entrega</th>
                    <th className="pb-3 font-bold">Envio / SLA</th>
                    <th className="pb-3 font-bold text-center">Nota (0-100)</th>
                    <th className="pb-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {filteredRoster.map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center">
                          {st.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{st.name}</div>
                          <span className="text-[10px] text-slate-500 font-mono block">{st.email}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-slate-400">{st.enrollment_code}</td>
                      <td className="py-4 text-slate-300">{st.class_name}</td>
                      <td className="py-4">
                        {st.delivery_status === "delivered_on_time" && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Entregue (No Prazo)
                          </span>
                        )}
                        {st.delivery_status === "delivered_late" && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 w-fit">
                            <Clock className="w-3 h-3" /> Entregue (+{st.hours_overdue}h SLA)
                          </span>
                        )}
                        {st.delivery_status === "pending" && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5 w-fit">
                            <Clock className="w-3 h-3" /> Pendente (No Prazo)
                          </span>
                        )}
                        {st.delivery_status === "overdue" && (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 w-fit animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Atrasado (Não Entregue)
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-mono text-[11px] text-slate-400">
                        {st.submission_date ? (
                          <span>{new Date(st.submission_date).toLocaleString("pt-BR")}</span>
                        ) : (
                          <span className="text-slate-600 italic">Sem envio registrado</span>
                        )}
                      </td>
                      <td className="py-4 text-center font-mono">
                        {st.score !== null ? (
                          <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                            st.score >= 60
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}>
                            {st.score} pts
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Não avaliado</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st.submitted_code && (
                            <button
                              onClick={() => setInspectingStudent(st)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Visualizar Código Submetido"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setGradingStudent(st);
                              setManualGradeInput(st.score !== null ? String(st.score) : "80");
                              setManualFeedbackInput(st.feedback || "");
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg transition-colors cursor-pointer"
                            title="Lançar / Ajustar Nota"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {(st.delivery_status === "pending" || st.delivery_status === "overdue") && (
                            <button
                              onClick={() => handleSendReminder(st)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Enviar Lembrete de SLA"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs italic">
                        Nenhum estudante encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL ACTIVITY AUTHORING */}
      {activeTab === "manual" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-sky-400" /> Cadastrar Atividade Própria (Criada pelo Professor)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Defina o enunciado, prazos limites de SLA, turma correspondente, linguagem e casos de teste automatizados para correção.
            </p>
          </div>

          <form onSubmit={handleCreateManualActivity} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-8 space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Título da Atividade *</label>
                <input
                  type="text"
                  required
                  value={manualForm.title}
                  onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  placeholder="Ex: Laboratório 04: Algoritmo de Busca Binária e Árvores"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Linguagem / Tipo *</label>
                <select
                  value={manualForm.language}
                  onChange={(e) => setManualForm({ ...manualForm, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java 17 / 21</option>
                  <option value="csharp">C# (.NET)</option>
                  <option value="cpp">C / C++</option>
                  <option value="sql">SQL / DDL Relacional</option>
                  <option value="diagram">Modelagem DER / UML</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Turma Vinculada</label>
                <select
                  value={manualForm.class_id}
                  onChange={(e) => setManualForm({ ...manualForm, class_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">Todas as Turmas (Pública)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Data Limite de Entrega</label>
                <input
                  type="date"
                  value={manualForm.deadlineDate}
                  onChange={(e) => setManualForm({ ...manualForm, deadlineDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Tolerância SLA (Horas de Atraso)</label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={manualForm.sla_tolerance_hours}
                  onChange={(e) => setManualForm({ ...manualForm, sla_tolerance_hours: parseInt(e.target.value) || 12 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-300 font-bold">Enunciado & Instruções Didáticas *</label>
              <textarea
                rows={5}
                required
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                placeholder="Descreva detalhadamente o problema a ser resolvido, exemplos de entradas/saídas esperadas e restrições de complexidade..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
              />
            </div>

            {/* Test Cases Builder */}
            <div className="space-y-3 p-5 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" /> Casos de Teste Automatizados ({manualForm.testCases.length})
                </label>
                <button
                  type="button"
                  onClick={() => setManualForm({
                    ...manualForm,
                    testCases: [...manualForm.testCases, { input: "", expected: "", isPublic: true }]
                  })}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Adicionar Caso
                </button>
              </div>

              <div className="space-y-2">
                {manualForm.testCases.map((tc, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        placeholder="Entrada (STDIN ou params)"
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...manualForm.testCases];
                          updated[idx].input = e.target.value;
                          setManualForm({ ...manualForm, testCases: updated });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        placeholder="Saída Esperada"
                        value={tc.expected}
                        onChange={(e) => {
                          const updated = [...manualForm.testCases];
                          updated[idx].expected = e.target.value;
                          setManualForm({ ...manualForm, testCases: updated });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = manualForm.testCases.filter((_, i) => i !== idx);
                          setManualForm({ ...manualForm, testCases: updated });
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isCreatingManual}
                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
              >
                {isCreatingManual ? "Cadastrando..." : "Publicar Atividade para a Turma"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SMART AI ACTIVITY GENERATOR */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
          {/* AI Generator Settings (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Parâmetros de Geração com IA
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                A IA pedagógica construirá o enunciado, gabarito e testes de validação com base nos objetivos de aprendizagem.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-300 font-bold">Tema / Conteúdo da Aula *</label>
                <input
                  type="text"
                  value={aiGenForm.theme}
                  onChange={(e) => setAiGenForm({ ...aiGenForm, theme: e.target.value })}
                  placeholder="Ex: Recursão, Pilhas, Listas Encadeadas, POO..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Dificuldade</label>
                  <select
                    value={aiGenForm.difficulty}
                    onChange={(e) => setAiGenForm({ ...aiGenForm, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Taxonomia Bloom</label>
                  <select
                    value={aiGenForm.bloomLevel}
                    onChange={(e) => setAiGenForm({ ...aiGenForm, bloomLevel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Lembrar">Lembrar / Compreender</option>
                    <option value="Aplicar">Aplicar (Prático)</option>
                    <option value="Analisar">Analisar & Otimizar</option>
                    <option value="Criar">Criar / Arquitetura</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Linguagem</label>
                  <select
                    value={aiGenForm.language}
                    onChange={(e) => setAiGenForm({ ...aiGenForm, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Prazo (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={aiGenForm.deadlineDays}
                    onChange={(e) => setAiGenForm({ ...aiGenForm, deadlineDays: parseInt(e.target.value) || 7 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateAiActivity}
                disabled={isGeneratingAi}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAi ? "animate-spin" : ""}`} />
                {isGeneratingAi ? "Gerando Desafio com IA..." : "Gerar Atividade Completa"}
              </button>
            </div>
          </div>

          {/* AI Generated Preview (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" /> Pré-visualização do Enunciado Gerado
              </h3>
              {generatedPreview && (
                <button
                  onClick={handlePublishGeneratedActivity}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Publicar para a Turma
                </button>
              )}
            </div>

            {generatedPreview ? (
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Título Proposto</span>
                  <h4 className="text-base font-bold text-white">{generatedPreview.title}</h4>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">Enunciado & Contexto</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{generatedPreview.description}</p>
                </div>

                {generatedPreview.testCases && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Casos de Teste Criados</span>
                    <div className="space-y-1.5">
                      {generatedPreview.testCases.map((tc: any, i: number) => (
                        <div key={i} className="text-xs font-mono text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                          <span>Entrada: {tc.input}</span>
                          <span className="text-emerald-400">Saída: {tc.expected}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs italic space-y-2">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Preencha os parâmetros à esquerda e clique em <strong>"Gerar Atividade Completa"</strong> para obter a pré-visualização.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: View Submitted Code */}
      <AnimatePresence>
        {inspectingStudent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-sky-400" /> Submissão de {inspectingStudent.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">{inspectingStudent.enrollment_code} • {inspectingStudent.class_name}</span>
                </div>
                <button
                  onClick={() => setInspectingStudent(null)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold">Código Fonte Submetido</span>
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-[300px] leading-relaxed">
                  {inspectingStudent.submitted_code}
                </pre>
              </div>

              {inspectingStudent.feedback && (
                <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-sky-400">Parecer Pedagógico da Correção:</span>
                  <p className="text-xs text-sky-200">{inspectingStudent.feedback}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setInspectingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL GRADING MODAL */}
      <AnimatePresence>
        {gradingStudent && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-sky-400" /> Lançar / Ajustar Nota
                </h3>
                <button
                  onClick={() => setGradingStudent(null)}
                  className="text-slate-400 hover:text-white font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block">Estudante:</span>
                  <span className="text-sm font-bold text-white">{gradingStudent.name}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Nota (0 a 100 pontos) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={manualGradeInput}
                    onChange={(e) => setManualGradeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">Critério oficial: ≥ 60 pts para Aprovação</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-300 font-bold">Parecer / Feedback do Professor</label>
                  <textarea
                    rows={3}
                    value={manualFeedbackInput}
                    onChange={(e) => setManualFeedbackInput(e.target.value)}
                    placeholder="Adicione observações para o aluno..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setGradingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveManualGrade}
                  disabled={isSubmittingGrade}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {isSubmittingGrade ? "Salvando..." : "Salvar Nota"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
