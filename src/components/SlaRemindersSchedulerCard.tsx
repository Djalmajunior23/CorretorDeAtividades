import React, { useState, useEffect } from "react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { exportSlaViolationsHistoryXLSX, SlaViolationRecord } from "../utils/dataExport";
import {
  Clock,
  Mail,
  Send,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Settings2,
  FileText,
  History,
  Eye,
  RefreshCw,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Check,
  ExternalLink,
  Sliders,
  Trash2,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle,
  FileCheck,
  Activity,
  BarChart2
} from "lucide-react";

interface SlaScheduleConfig {
  enabled: boolean;
  frequency: string;
  sendTime: string;
  daysOfWeek: string[];
  targetClassId: string;
  targetClassName: string;
  targetActivityTypes: string[];
  overdueThresholdHours: number;
  deliveryMethod: "email" | "inapp" | "both";
  ccTeacher: boolean;
  teacherEmail: string;
  respectQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  emailTemplate: {
    senderName: string;
    senderEmail: string;
    subject: string;
    greeting: string;
    body: string;
    callToActionText: string;
    callToActionUrl: string;
    footerNote: string;
  };
  frequentViolatorsConfig?: {
    enabled: boolean;
    frequency: string;
    minimumViolations: number;
    ccCoordination: boolean;
    coordinationEmail: string;
  };
  lastTriggeredAt: string | null;
  nextScheduledRun: string;
}

interface OverdueStudent {
  id: string;
  name: string;
  email: string;
  enrollment_code: string;
  class_id: string;
  class_name: string;
  activity_id: string;
  activity_title: string;
  deadline: string;
  overdue_hours: number;
  sla_limit_hours: number;
  urgency: "medium" | "high" | "critical";
  reminders_sent_count: number;
  last_reminder_at: string | null;
}

interface DispatchHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  className: string;
  activityTitle: string;
  subject: string;
  dispatchedAt: string;
  channel: string;
  status: "delivered" | "sent" | "queued" | "failed";
  deliveryDetails: string;
  bodyPreview: string;
  overdueHours: number;
}

export default function SlaRemindersSchedulerCard({
  classes = [],
  teacherEmail = "professor.docente@senai.br"
}: {
  classes?: any[];
  teacherEmail?: string;
}) {
  const [activeTab, setActiveTab] = useState<"schedule" | "template" | "queue" | "history" | "violations">("schedule");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // SLA Violations History State
  const [violationsHistory, setViolationsHistory] = useState<SlaViolationRecord[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(false);
  const [violationsFilterClass, setViolationsFilterClass] = useState("all");
  const [violationsFilterAlert, setViolationsFilterAlert] = useState("all");
  const [violationsSearch, setViolationsSearch] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);

  // Configuration State
  const [config, setConfig] = useState<SlaScheduleConfig>({
    enabled: true,
    frequency: "daily",
    sendTime: "09:00",
    daysOfWeek: ["1", "2", "3", "4", "5"],
    targetClassId: "all",
    targetClassName: "Todas as Turmas (Global)",
    targetActivityTypes: ["desafios", "simulados", "projetos", "listas"],
    overdueThresholdHours: 24,
    deliveryMethod: "both",
    ccTeacher: true,
    teacherEmail: teacherEmail || "professor.docente@senai.br",
    respectQuietHours: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    emailTemplate: {
      senderName: "CodeCheck AI - Suporte Acadêmico",
      senderEmail: "notificacoes@codecheck.ai",
      subject: "⚠️ [Lembrete de SLA] Prazo de Entrega Excedido: {atividade}",
      greeting: "Olá, {nome_aluno}!",
      body: "Identificamos no sistema que a atividade prática **{atividade}** da turma **{turma}** está com o prazo de entrega expirado há **{tempo_atraso}**.\n\nPara garantir sua pontuação de SLA e acompanhamento no scorecard de competências, envie seu código-fonte o quanto antes pela plataforma.",
      callToActionText: "Submeter Atividade Agora",
      callToActionUrl: "https://codecheck.ai/student/submissions",
      footerNote: "Caso já tenha enviado sua submissão ou justificado o atraso com seu professor ({professor_responsavel}), desconsidere esta mensagem."
    },
    frequentViolatorsConfig: {
      enabled: false,
      frequency: "weekly",
      minimumViolations: 3,
      ccCoordination: false,
      coordinationEmail: ""
    },
    lastTriggeredAt: null,
    nextScheduledRun: new Date(Date.now() + 12 * 3600000).toISOString()
  });

  const [overdueStudents, setOverdueStudents] = useState<OverdueStudent[]>([]);
  const [history, setHistory] = useState<DispatchHistoryItem[]>([]);
  const [previewStudent, setPreviewStudent] = useState<OverdueStudent | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedStudentForIndividual, setSelectedStudentForIndividual] = useState<OverdueStudent | null>(null);
  const [individualSending, setIndividualSending] = useState(false);

  // Fetch SLA Violations History from Backend
  const fetchViolationsHistory = async () => {
    setViolationsLoading(true);
    try {
      const res = await fetch(apiUrl("/api/sla/violations-history"));
      if (res.ok) {
        const data = await safeJsonResponse(res);
        if (data?.violations) {
          setViolationsHistory(data.violations);
        }
      }
    } catch (err: any) {
      console.warn("Erro ao buscar histórico de violações de SLA:", err);
    } finally {
      setViolationsLoading(false);
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfgRes, studRes, histRes, violRes] = await Promise.all([
        fetch(apiUrl("/api/sla/reminders/config")),
        fetch(apiUrl("/api/sla/overdue-students")),
        fetch(apiUrl("/api/sla/email-dispatch-history")),
        fetch(apiUrl("/api/sla/violations-history"))
      ]);

      if (cfgRes.ok) {
        const cfgData = await safeJsonResponse(cfgRes);
        if (cfgData?.config) setConfig(cfgData.config);
      }
      if (studRes.ok) {
        const studData = await safeJsonResponse(studRes);
        if (studData?.students) setOverdueStudents(studData.students);
      }
      if (histRes.ok) {
        const histData = await safeJsonResponse(histRes);
        if (histData?.history) setHistory(histData.history);
      }
      if (violRes.ok) {
        const violData = await safeJsonResponse(violRes);
        if (violData?.violations) setViolationsHistory(violData.violations);
      }
    } catch (err: any) {
      console.warn("Error loading SLA scheduler data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportOverdueListToXLSX = () => {
    if (overdueStudents.length === 0) {
      toast.error("Não há estudantes em atraso para exportar.");
      return;
    }

    try {
      // Filtrar conforme a config atual na tela, igual ao contador gráfico
      const filteredOverdue = overdueStudents.filter(student => {
        if (config.targetClassId !== "all" && student.class_id !== config.targetClassId) return false;
        const title = student.activity_title.toLowerCase();
        return (config.targetActivityTypes || []).some(type => {
          if (type === "desafios" && title.includes("desafio")) return true;
          if (type === "simulados" && (title.includes("simulado") || title.includes("teste"))) return true;
          if (type === "projetos" && title.includes("projeto")) return true;
          if (type === "listas" && (title.includes("lista") || title.includes("exercício"))) return true;
          return false;
        });
      });

      if (filteredOverdue.length === 0) {
        toast.error("Nenhum estudante atende aos filtros atuais de Turma e Tipo de Atividade.");
        return;
      }

      const exportData = filteredOverdue.map(student => ({
        "Estudante": student.name,
        "Matrícula": student.enrollment_code,
        "Email": student.email,
        "Turma": student.class_name,
        "Atividade": student.activity_title,
        "Data Limite (Deadline)": new Date(student.deadline).toLocaleString("pt-BR"),
        "Tempo Excedido (SLA)": `${student.overdue_hours}h além do limite`,
        "Lembretes Enviados": student.reminders_sent_count,
        "Último Lembrete": student.last_reminder_at ? new Date(student.last_reminder_at).toLocaleString("pt-BR") : "Nenhum"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 25 }, // Estudante
        { wch: 15 }, // Matrícula
        { wch: 30 }, // Email
        { wch: 20 }, // Turma
        { wch: 35 }, // Atividade
        { wch: 22 }, // Deadline
        { wch: 25 }, // Tempo excedido
        { wch: 20 }, // Lembretes
        { wch: 20 }  // Último
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SLA_Ultrapassados");
      
      XLSX.writeFile(workbook, `SLA_Atrasos_Ativos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Falha ao gerar o arquivo Excel.");
    }
  };

  // Handle Export SLA Violations to XLSX
  const handleExportSlaViolations = async (useFiltered: boolean = true) => {
    setExportingXLSX(true);
    try {
      let dataToExport = violationsHistory;

      // Fallback: se o array local estiver vazio, gerar a partir de overdueStudents
      if (!dataToExport || dataToExport.length === 0) {
        dataToExport = overdueStudents.map(s => ({
          id: s.id,
          student_id: s.id,
          student_name: s.name,
          enrollment_code: s.enrollment_code,
          email: s.email,
          class_id: s.class_id,
          class_name: s.class_name,
          activity_id: s.activity_id,
          activity_title: s.activity_title,
          deadline: s.deadline,
          response_time: `${s.overdue_hours + s.sla_limit_hours} horas (decorrido)`,
          sla_limit: `${s.sla_limit_hours} horas`,
          alert_status: s.urgency === "critical" ? "Crítico" : s.urgency === "high" ? "Alto" : "Médio",
          overdue_hours: s.overdue_hours,
          reminders_sent_count: s.reminders_sent_count,
          last_reminder_at: s.last_reminder_at,
          channel: "E-mail Institucional & In-App",
          action_recommended: s.urgency === "critical" ? "Intervenção Pedagógica Urgente" : "Lembrete Automático"
        }));
      }

      if (useFiltered) {
        if (violationsFilterClass !== "all") {
          dataToExport = dataToExport.filter(v => 
            v.class_id === violationsFilterClass || 
            v.class_name.toLowerCase().includes(violationsFilterClass.toLowerCase())
          );
        }
        if (violationsFilterAlert !== "all") {
          dataToExport = dataToExport.filter(v => 
            v.alert_status.toLowerCase().includes(violationsFilterAlert.toLowerCase())
          );
        }
        if (violationsSearch.trim()) {
          const q = violationsSearch.toLowerCase();
          dataToExport = dataToExport.filter(v =>
            v.student_name.toLowerCase().includes(q) ||
            (v.enrollment_code && v.enrollment_code.toLowerCase().includes(q)) ||
            v.activity_title.toLowerCase().includes(q) ||
            v.class_name.toLowerCase().includes(q)
          );
        }
      }

      const selectedClassName = violationsFilterClass === "all" 
        ? "Todas as Turmas" 
        : (classes.find(c => String(c.id) === violationsFilterClass)?.name || violationsFilterClass);

      // Exportar usando utilitário XLSX
      exportSlaViolationsHistoryXLSX({
        violations: dataToExport,
        teacherName: teacherEmail.split("@")[0].replace(".", " "),
        institution: "SENAI - Serviço Nacional de Aprendizagem Industrial",
        filterClass: selectedClassName,
        fileName: `Relatorio_Violacoes_SLA_${selectedClassName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        includeSummarySheets: true
      });

      toast.success(`📊 Relatório XLSX exportado com sucesso contendo ${dataToExport.length} registros e campos de 'Tempo de Resposta', 'Limite SLA' e 'Status de Alerta'!`);
      setShowExportModal(false);
    } catch (err: any) {
      toast.error(`Falha ao exportar relatório XLSX: ${err.message}`);
    } finally {
      setExportingXLSX(false);
    }
  };

  // Save Settings
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/sla/reminders/config"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await safeJsonResponse(res);
      if (data?.success) {
        toast.success("✅ Configurações de lembretes automáticos de SLA salvas com sucesso!");
        localStorage.setItem("slaScheduleConfig", JSON.stringify(config));
      } else {
        toast.error("Erro ao salvar configurações de SLA.");
      }
    } catch (err: any) {
      toast.error(`Falha ao conectar com servidor: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Trigger Automatic Reminders Now for Batch
  const handleTriggerBatchNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch(apiUrl("/api/sla/trigger-automated-reminders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: config.frequency,
          method: config.deliveryMethod,
          classId: config.targetClassId,
          templateOverride: config.emailTemplate,
          ccTeacher: config.ccTeacher
        })
      });
      const data = await safeJsonResponse(res);
      if (data?.success) {
        toast.success(`🚀 ${data.message}`);
        await fetchData();
      } else {
        toast.error(`Falha no disparo: ${data?.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao disparar lembretes: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  };

  // Send Individual Email Reminder
  const handleSendIndividualEmail = async (student: OverdueStudent) => {
    setIndividualSending(true);
    try {
      const res = await fetch(apiUrl("/api/sla/send-individual-reminder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          className: student.class_name,
          activityTitle: student.activity_title,
          overdueHours: student.overdue_hours
        })
      });
      const data = await safeJsonResponse(res);
      if (data?.success) {
        toast.success(`✉️ E-mail enviado para ${student.name} (${student.email})!`);
        await fetchData();
        setSelectedStudentForIndividual(null);
      } else {
        toast.error(`Falha ao enviar e-mail: ${data?.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao enviar: ${err.message}`);
    } finally {
      setIndividualSending(false);
    }
  };

  // Send Test Email to Teacher
  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetch(apiUrl("/api/sla/test-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: config.teacherEmail || teacherEmail,
          template: config.emailTemplate
        })
      });
      const data = await safeJsonResponse(res);
      if (data?.success) {
        toast.success(`📬 ${data.message}`);
      } else {
        toast.error(`Erro ao enviar e-mail de teste: ${data?.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao testar envio: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  // Clear Email History
  const handleClearHistory = async () => {
    if (!window.confirm("Deseja realmente limpar o histórico de disparos de e-mail?")) return;
    try {
      const res = await fetch(apiUrl("/api/sla/email-dispatch-history"), {
        method: "DELETE"
      });
      const data = await safeJsonResponse(res);
      if (data?.success) {
        toast.info("Histórico de disparos limpo.");
        setHistory([]);
      }
    } catch (err: any) {
      toast.error(`Erro ao limpar histórico: ${err.message}`);
    }
  };

  // Insert Variable into Template
  const handleInsertVariable = (variableTag: string) => {
    setConfig({
      ...config,
      emailTemplate: {
        ...config.emailTemplate,
        body: config.emailTemplate.body + " " + variableTag
      }
    });
    toast.info(`Variável ${variableTag} adicionada ao template.`);
  };

  // Render Template Preview helper
  const sampleStudent = overdueStudents[0] || {
    id: "sample",
    name: "Ana Beatriz Silva",
    email: "ana.silva@aluno.senai.br",
    enrollment_code: "20260101",
    class_id: "class_1",
    class_name: "Dev Sistemas - 1A",
    activity_id: "act_04",
    activity_title: "Lista 04 - Ponteiros e Matrizes",
    deadline: new Date(Date.now() - 28 * 3600000).toISOString(),
    overdue_hours: 28,
    sla_limit_hours: 24,
    urgency: "high" as const,
    reminders_sent_count: 1,
    last_reminder_at: new Date().toISOString()
  };


  // Derived state for filtered students (Real-Time Impact)
  const filteredOverdueStudents = overdueStudents.filter(student => {
    if (config.targetClassId !== "all" && student.class_id !== config.targetClassId) return false;
    const title = student.activity_title.toLowerCase();
    return (config.targetActivityTypes || []).some(type => {
      if (type === "desafios" && title.includes("desafio")) return true;
      if (type === "simulados" && (title.includes("simulado") || title.includes("teste"))) return true;
      if (type === "projetos" && title.includes("projeto")) return true;
      if (type === "listas" && (title.includes("lista") || title.includes("exercício"))) return true;
      return false;
    });
  });

  const getRenderedPreview = (st: any) => {
    const overdueStr = st.overdue_hours >= 24
      ? `${Math.floor(st.overdue_hours / 24)}d e ${st.overdue_hours % 24}h`
      : `${st.overdue_hours} horas`;
    const deadlineStr = st.deadline ? new Date(st.deadline).toLocaleString("pt-BR") : "Ontem às 23:59";

    const subject = (config.emailTemplate.subject || "")
      .replace(/{nome_aluno}/g, st.name)
      .replace(/{turma}/g, st.class_name)
      .replace(/{atividade}/g, st.activity_title)
      .replace(/{tempo_atraso}/g, overdueStr)
      .replace(/{prazo_original}/g, deadlineStr);

    const greeting = (config.emailTemplate.greeting || "").replace(/{nome_aluno}/g, st.name);

    const body = (config.emailTemplate.body || "")
      .replace(/{nome_aluno}/g, st.name)
      .replace(/{turma}/g, st.class_name)
      .replace(/{atividade}/g, st.activity_title)
      .replace(/{tempo_atraso}/g, overdueStr)
      .replace(/{prazo_original}/g, deadlineStr)
      .replace(/{professor_responsavel}/g, "Prof. Djalma Batista Junior");

    const footer = (config.emailTemplate.footerNote || "")
      .replace(/{professor_responsavel}/g, "Prof. Djalma Batista Junior");

    return { subject, greeting, body, footer, overdueStr, deadlineStr };
  };

  const previewContent = getRenderedPreview(previewStudent || sampleStudent);

  return (
    <div id="sla-automated-scheduler-card" className="rounded-2xl border border-indigo-500/30 bg-[#0c1322] shadow-xl overflow-hidden text-slate-100 flex flex-col">
      {/* Top Header */}
      <div className="p-6 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-[#0d162d] to-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Agendamento de Lembretes Automáticos de SLA
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                config.enabled 
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse" 
                  : "bg-slate-700/30 text-slate-400 border border-slate-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? "bg-emerald-400" : "bg-slate-400"}`} />
                {config.enabled ? "Scheduler Ativo" : "Pausado"}
              </span>
              {/* Dynamic SLA Violations Global Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-3 h-3" />
                {filteredOverdueStudents.length} {filteredOverdueStudents.length === 1 ? 'Violação Ativa' : 'Violações Ativas'} (Filtrado)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dispara notificações e e-mails formatados automaticamente para estudantes com prazos vencidos via serviço SMTP institucional.
            </p>
          </div>
        </div>

        {/* Global On/Off Switch & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab("violations");
              setShowExportModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
            title="Exportar relatório XLSX consolidado com histórico de violações de SLA de todos os alunos"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar Relatório XLSX</span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer bg-[#030712]/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              {config.enabled ? "Ativado" : "Desativado"}
            </span>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-500 bg-[#030712] border-slate-700 focus:ring-indigo-500/20"
            />
          </label>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-[#080d19]/80 border-b border-indigo-500/10 text-xs">
        <div className="p-2.5 rounded-lg bg-[#0f172a]/60 border border-slate-800/60 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Alunos em Atraso (SLA)</span>
          <span className="text-sm font-bold text-amber-400 font-mono flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {filteredOverdueStudents.length} pendentes
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0f172a]/60 border border-slate-800/60 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Frequência Programada</span>
          <span className="text-sm font-bold text-indigo-300 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {config.frequency === "daily" ? `Diário às ${config.sendTime}` : config.frequency === "hourly" ? "A cada 1h" : config.frequency === "twice_daily" ? "2x ao dia" : "Semanal"}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0f172a]/60 border border-slate-800/60 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Canal de Envio</span>
          <span className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {config.deliveryMethod === "both" ? "E-mail + In-App" : config.deliveryMethod === "email" ? "Apenas E-mail" : "Apenas In-App"}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-[#0f172a]/60 border border-slate-800/60 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-400 uppercase font-mono">E-mails Disparados</span>
          <span className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {history.length} registrados
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-indigo-500/20 bg-[#090f1e] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "schedule"
              ? "bg-[#0c1322] text-indigo-300 border-indigo-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          1. Frequência & Horários
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("template")}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "template"
              ? "bg-[#0c1322] text-indigo-300 border-indigo-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          2. Template de E-mail & Preview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "queue"
              ? "bg-[#0c1322] text-indigo-300 border-indigo-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          3. Fila de Alunos em Atraso ({filteredOverdueStudents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "history"
              ? "bg-[#0c1322] text-indigo-300 border-indigo-400 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/30"
          }`}
        >
          <History className="w-3.5 h-3.5 text-cyan-400" />
          4. Histórico de Disparos ({history.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("violations")}
          className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "violations"
              ? "bg-[#0c1322] text-emerald-300 border-emerald-400 shadow-sm"
              : "text-slate-400 hover:text-emerald-300 border-transparent hover:bg-slate-800/30"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          5. Relatório de Violações (.XLSX) ({violationsHistory.length})
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="p-6 flex-1 flex flex-col gap-6">
        {/* TAB 1: SCHEDULE & RULES */}
        {activeTab === "schedule" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Impact Graphic Component */}
            {(() => {
              const filteredOverdueCount = overdueStudents.filter(student => {
                if (config.targetClassId !== "all" && student.class_id !== config.targetClassId) return false;
                const title = student.activity_title.toLowerCase();
                return (config.targetActivityTypes || []).some(type => {
                  if (type === "desafios" && title.includes("desafio")) return true;
                  if (type === "simulados" && (title.includes("simulado") || title.includes("teste"))) return true;
                  if (type === "projetos" && title.includes("projeto")) return true;
                  if (type === "listas" && (title.includes("lista") || title.includes("exercício"))) return true;
                  return false;
                });
              }).length;
              
              const totalStudents = overdueStudents.length || 1; // Prevent division by zero
              const impactPercentage = Math.min(100, Math.round((filteredOverdueCount / totalStudents) * 100));

              return (
                <div className="w-full bg-gradient-to-r from-slate-900 via-[#0a0f1c] to-slate-900 border border-slate-700/60 rounded-xl p-5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 shrink-0 relative">
                    <Activity className="w-7 h-7 text-rose-400" />
                    {filteredOverdueCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-slate-900"></span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-slate-400" />
                          Impacto do Agendador (Real-Time)
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Alunos que violaram o SLA das turmas e atividades selecionadas abaixo e receberão lembretes.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                          {filteredOverdueCount}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">afetados</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mt-1 border border-slate-700/50">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${impactPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Class Selection */}
              <div className="p-4 rounded-xl bg-[#030712]/50 border border-slate-800/60 flex flex-col gap-2">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Turma Alvo do Agendador
                </label>
                <select
                  value={config.targetClassId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = classes.find(c => String(c.id) === val);
                    setConfig({
                      ...config,
                      targetClassId: val,
                      targetClassName: found ? (found.name || `Turma ${found.id}`) : "Todas as Turmas (Global)"
                    });
                  }}
                  className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todas as Turmas (Global)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name || `Turma ${cls.id}`} ({cls.code || "Ativa"})
                    </option>
                  ))}
                  {classes.length === 0 && (
                    <>
                      <option value="class_1">Dev Sistemas - 1A</option>
                      <option value="class_2">Dev Sistemas - 2B</option>
                      <option value="class_3">Redes & IoT - Turma 3C</option>
                      <option value="class_4">Ciência de Dados - 1B</option>
                    </>
                  )}
                </select>
                <span className="text-[10px] text-slate-400">
                  Filtra quais turmas terão as submissões auditadas pelo agendador de SLA.
                </span>
              </div>

              {/* Activity Types Selection */}
              <div className="p-4 rounded-xl bg-[#030712]/50 border border-slate-800/60 flex flex-col gap-2 relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Tipos de Atividades Monitoradas
                  </label>
                  
                  {/* Indicator / Summary count */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-bold text-rose-400 font-mono">
                      {overdueStudents.filter(student => {
                        // Aplica filtro de turma e de tipo de atividade de forma simplificada
                        if (config.targetClassId !== "all" && student.class_id !== config.targetClassId) return false;
                        const title = student.activity_title.toLowerCase();
                        return (config.targetActivityTypes || []).some(type => {
                          if (type === "desafios" && title.includes("desafio")) return true;
                          if (type === "simulados" && (title.includes("simulado") || title.includes("teste"))) return true;
                          if (type === "projetos" && title.includes("projeto")) return true;
                          if (type === "listas" && (title.includes("lista") || title.includes("exercício"))) return true;
                          return false;
                        });
                      }).length} alunos em atraso (ativos)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { id: "desafios", label: "Desafios" },
                    { id: "simulados", label: "Simulados" },
                    { id: "projetos", label: "Projetos" },
                    { id: "listas", label: "Listas de Exercícios" }
                  ].map((type) => {
                    const isChecked = config.targetActivityTypes?.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-blue-500/10 border-blue-500/50 text-blue-300 font-bold"
                            : "bg-[#0c1322] border-slate-700 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...(config.targetActivityTypes || []), type.id]
                              : (config.targetActivityTypes || []).filter((t) => t !== type.id);
                            setConfig({ ...config, targetActivityTypes: newTypes });
                          }}
                          className="hidden"
                        />
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                        {type.label}
                      </label>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Define quais categorias de atividades acionarão o motor de lembretes automáticos.
                </span>
              </div>

              {/* Delivery Frequency */}
              <div className="p-4 rounded-xl bg-[#030712]/50 border border-slate-800/60 flex flex-col gap-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Frequência de Verificação e Envio
                </label>
                <select
                  value={config.frequency}
                  onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
                  className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="immediately">⚡ Imediatamente ao Estourar SLA (Tempo Real)</option>
                  <option value="hourly">⏱️ A cada 1 hora (Verificação Contínua)</option>
                  <option value="daily">📅 Diariamente (No Horário Programado)</option>
                  <option value="twice_daily">🌅 Duas vezes ao dia (08:00 e 17:00)</option>
                  <option value="weekly">📆 Semanalmente (Segundas-feiras)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  Determina a periodicidade com que o motor cron busca atrasos não resolvidos.
                </span>
              </div>

              {/* Send Time */}
              <div className="p-4 rounded-xl bg-[#030712]/50 border border-slate-800/60 flex flex-col gap-2">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Horário de Disparo Automático
                </label>
                <input
                  type="time"
                  value={config.sendTime}
                  onChange={(e) => setConfig({ ...config, sendTime: e.target.value })}
                  className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
                />
                <span className="text-[10px] text-slate-400">
                  Horário padrão para envio matinal do resumo e lembretes individuais aos estudantes.
                </span>
              </div>

              {/* Overdue Threshold Hours */}
              <div className="p-4 rounded-xl bg-[#030712]/50 border border-slate-800/60 flex flex-col gap-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Gatilho de Tolerância (Horas de Atraso)
                </label>
                <select
                  value={config.overdueThresholdHours}
                  onChange={(e) => setConfig({ ...config, overdueThresholdHours: parseInt(e.target.value) || 24 })}
                  className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value={1}>1 hora após o vencimento (Instantâneo)</option>
                  <option value={6}>6 horas após o vencimento</option>
                  <option value={12}>12 horas após o vencimento</option>
                  <option value={24}>24 horas após o vencimento (Recomendado)</option>
                  <option value={48}>48 horas após o vencimento (Crítico)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  O lembrete só é acionado para estudantes que ultrapassaram esta janela de tolerância.
                </span>
              </div>
            </div>

            {/* Frequent Violators Automation */}
            <div className="p-4 rounded-xl bg-[#030712]/40 border border-slate-800/80 flex flex-col gap-4 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-rose-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Agendador para Infratores Frequentes (Reincidentes)
                </h4>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] font-bold text-slate-300">
                    {config.frequentViolatorsConfig?.enabled ? "Ativo" : "Inativo"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.frequentViolatorsConfig?.enabled || false}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      frequentViolatorsConfig: { ...(config.frequentViolatorsConfig || { enabled: false, frequency: "weekly", minimumViolations: 3, ccCoordination: false, coordinationEmail: "" }), enabled: e.target.checked }
                    })}
                    className="w-3.5 h-3.5 rounded text-rose-500 bg-[#030712] border-slate-700 focus:ring-rose-500/20"
                  />
                </label>
              </div>
              
              <p className="text-[11px] text-slate-400">
                Dispare notificações pedagógicas escalonadas (automáticas) diretamente para o e-mail do estudante e da coordenação quando o aluno acumular múltiplas violações de prazo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-300">Gatilho (Nº Mín. de Violações)</label>
                  <select
                    value={config.frequentViolatorsConfig?.minimumViolations || 3}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      frequentViolatorsConfig: { ...(config.frequentViolatorsConfig || { enabled: false, frequency: "weekly", minimumViolations: 3, ccCoordination: false, coordinationEmail: "" }), minimumViolations: parseInt(e.target.value) }
                    })}
                    disabled={!config.frequentViolatorsConfig?.enabled}
                    className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                  >
                    <option value={2}>2+ atrasos registrados</option>
                    <option value={3}>3+ atrasos (Recomendado)</option>
                    <option value={4}>4+ atrasos acumulados</option>
                    <option value={5}>5+ atrasos (Estado Crítico)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-300">Periodicidade do Disparo</label>
                  <select
                    value={config.frequentViolatorsConfig?.frequency || "weekly"}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      frequentViolatorsConfig: { ...(config.frequentViolatorsConfig || { enabled: false, frequency: "weekly", minimumViolations: 3, ccCoordination: false, coordinationEmail: "" }), frequency: e.target.value }
                    })}
                    disabled={!config.frequentViolatorsConfig?.enabled}
                    className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-2 text-[11px] text-white focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                  >
                    <option value="immediate_on_breach">A cada novo SLA estourado</option>
                    <option value="weekly">Semanalmente (toda segunda-feira)</option>
                    <option value="biweekly">A cada 15 dias</option>
                    <option value="monthly">Mensalmente (Fechamento)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-300">Notificar Coordenação em Cópia (CC)?</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={config.frequentViolatorsConfig?.ccCoordination || false}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        frequentViolatorsConfig: { ...(config.frequentViolatorsConfig || { enabled: false, frequency: "weekly", minimumViolations: 3, ccCoordination: false, coordinationEmail: "" }), ccCoordination: e.target.checked }
                      })}
                      disabled={!config.frequentViolatorsConfig?.enabled}
                      className="w-3.5 h-3.5 rounded text-rose-500 bg-[#0c1322] border-slate-600 focus:ring-rose-500/20 disabled:opacity-50"
                    />
                    <input
                      type="email"
                      placeholder="coordenacao@escola.br"
                      value={config.frequentViolatorsConfig?.coordinationEmail || ""}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        frequentViolatorsConfig: { ...(config.frequentViolatorsConfig || { enabled: false, frequency: "weekly", minimumViolations: 3, ccCoordination: false, coordinationEmail: "" }), coordinationEmail: e.target.value }
                      })}
                      disabled={!config.frequentViolatorsConfig?.enabled || !config.frequentViolatorsConfig?.ccCoordination}
                      className="flex-1 bg-[#0c1322] border border-slate-700 rounded-md p-1.5 text-[11px] text-white focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Channels & CC Settings */}
            <div className="p-4 rounded-xl bg-[#030712]/40 border border-slate-800/80 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                Configurações do Serviço de Entrega
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0c1322] border border-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="both"
                    checked={config.deliveryMethod === "both"}
                    onChange={() => setConfig({ ...config, deliveryMethod: "both" })}
                    className="text-indigo-500 bg-[#030712] border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">E-mail + In-App</span>
                    <span className="text-[10px] text-slate-400">Máxima cobertura de entrega</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0c1322] border border-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="email"
                    checked={config.deliveryMethod === "email"}
                    onChange={() => setConfig({ ...config, deliveryMethod: "email" })}
                    className="text-indigo-500 bg-[#030712] border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Apenas E-mail</span>
                    <span className="text-[10px] text-slate-400">Disparo via servidor SMTP</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-[#0c1322] border border-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="inapp"
                    checked={config.deliveryMethod === "inapp"}
                    onChange={() => setConfig({ ...config, deliveryMethod: "inapp" })}
                    className="text-indigo-500 bg-[#030712] border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Apenas In-App</span>
                    <span className="text-[10px] text-slate-400">Alertas no portal do aluno</span>
                  </div>
                </label>
              </div>

              {/* CC Teacher & Quiet Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-[#0c1322] border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.ccTeacher}
                    onChange={(e) => setConfig({ ...config, ccTeacher: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-500 bg-[#030712] border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Enviar Cópia Oculta (CC) para o Docente</span>
                    <span className="text-[10px] text-slate-400">
                      Receba uma cópia de cada lembrete disparado no e-mail: <strong className="text-indigo-300 font-mono">{config.teacherEmail}</strong>
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg bg-[#0c1322] border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.respectQuietHours}
                    onChange={(e) => setConfig({ ...config, respectQuietHours: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-500 bg-[#030712] border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Respeitar Janela de Silêncio Noturno</span>
                    <span className="text-[10px] text-slate-400">
                      Adia envios entre as <strong className="text-amber-300 font-mono">{config.quietHoursStart}</strong> e <strong className="text-cyan-300 font-mono">{config.quietHoursEnd}</strong> para o próximo horário útil.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL TEMPLATE & LIVE PREVIEW */}
        {activeTab === "template" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Template Editor Form (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Editor do Template de E-mail
                </h4>
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  {testingEmail ? "Enviando teste..." : "Enviar E-mail de Teste"}
                </button>
              </div>

              {/* Sender info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Nome do Remetente</label>
                  <input
                    type="text"
                    value={config.emailTemplate.senderName}
                    onChange={(e) => setConfig({
                      ...config,
                      emailTemplate: { ...config.emailTemplate, senderName: e.target.value }
                    })}
                    className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">E-mail do Remetente (From)</label>
                  <input
                    type="email"
                    value={config.emailTemplate.senderEmail}
                    onChange={(e) => setConfig({
                      ...config,
                      emailTemplate: { ...config.emailTemplate, senderEmail: e.target.value }
                    })}
                    className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  value={config.emailTemplate.subject}
                  onChange={(e) => setConfig({
                    ...config,
                    emailTemplate: { ...config.emailTemplate, subject: e.target.value }
                  })}
                  className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-medium"
                />
              </div>

              {/* Body Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">Corpo da Mensagem (Suporta Markdown)</label>
                  <span className="text-[10px] text-slate-500 font-mono">Clique abaixo para inserir tags dinâmicas:</span>
                </div>

                {/* Variable chips */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {[
                    { tag: "{nome_aluno}", label: "Nome do Aluno" },
                    { tag: "{atividade}", label: "Nome da Atividade" },
                    { tag: "{turma}", label: "Turma" },
                    { tag: "{tempo_atraso}", label: "Tempo de Atraso" },
                    { tag: "{prazo_original}", label: "Prazo Original" },
                    { tag: "{professor_responsavel}", label: "Nome do Professor" }
                  ].map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertVariable(v.tag)}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-900/50 text-[10px] text-indigo-300 font-mono border border-slate-700 hover:border-indigo-500 transition-all"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  value={config.emailTemplate.body}
                  onChange={(e) => setConfig({
                    ...config,
                    emailTemplate: { ...config.emailTemplate, body: e.target.value }
                  })}
                  className="w-full bg-[#030712] border border-slate-700 rounded-lg p-3 text-xs text-white leading-relaxed font-sans"
                />
              </div>

              {/* CTA & Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    value={config.emailTemplate.callToActionText}
                    onChange={(e) => setConfig({
                      ...config,
                      emailTemplate: { ...config.emailTemplate, callToActionText: e.target.value }
                    })}
                    className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Nota de Rodapé / Justificativa</label>
                  <input
                    type="text"
                    value={config.emailTemplate.footerNote}
                    onChange={(e) => setConfig({
                      ...config,
                      emailTemplate: { ...config.emailTemplate, footerNote: e.target.value }
                    })}
                    className="w-full bg-[#030712] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Live Email Mock Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Pré-visualização do E-mail Real
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Destinatário: {sampleStudent.email}</span>
              </div>

              {/* Email Client Container */}
              <div className="rounded-xl border border-slate-800 bg-[#ffffff] text-slate-900 shadow-2xl p-5 flex flex-col gap-4 font-sans text-xs">
                {/* Email Client Header */}
                <div className="border-b border-slate-200 pb-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span><strong>De:</strong> {config.emailTemplate.senderName} &lt;{config.emailTemplate.senderEmail}&gt;</span>
                    <span className="font-mono">Hoje, 09:00</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong>Para:</strong> {sampleStudent.name} &lt;{sampleStudent.email}&gt;
                  </div>
                  {config.ccTeacher && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      <strong>CC:</strong> {config.teacherEmail}
                    </div>
                  )}
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {previewContent.subject}
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900">{previewContent.greeting}</p>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Atraso de SLA Detectado:</strong> Sua entrega está atrasada em <strong className="underline">{previewContent.overdueStr}</strong> (Prazo limite: {previewContent.deadlineStr}).
                    </div>
                  </div>
                  <p className="whitespace-pre-line text-slate-700 text-xs">
                    {previewContent.body}
                  </p>

                  {/* Button */}
                  <div className="pt-2 flex justify-center">
                    <span className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md text-xs inline-block text-center cursor-pointer">
                      {config.emailTemplate.callToActionText || "Submeter Atividade Agora"}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 italic">
                    {previewContent.footer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OVERDUE STUDENTS QUEUE */}
        {activeTab === "queue" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Fila Atual de Estudantes com SLA Excedido
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estudantes que não entregaram a atividade e ultrapassaram o tempo limite de tolerância ({config.overdueThresholdHours}h).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportOverdueListToXLSX}
                  disabled={filteredOverdueStudents.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar XLSX
                </button>
                <button
                  type="button"
                  onClick={handleTriggerBatchNow}
                  disabled={triggering || filteredOverdueStudents.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {triggering ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Disparando Lembretes...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Disparar Lembretes para Todos ({filteredOverdueStudents.length})
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Overdue Table */}
            <div className="rounded-xl border border-slate-800 bg-[#030712]/50 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#090f1e] text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Estudante / Contato</th>
                    <th className="py-3 px-4">Turma & Atividade</th>
                    <th className="py-3 px-4">Tempo de Atraso</th>
                    <th className="py-3 px-4">Urgência</th>
                    <th className="py-3 px-4">Histórico</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOverdueStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-indigo-950/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{st.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{st.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{st.activity_title}</span>
                          <span className="text-[10px] text-indigo-400">{st.class_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-amber-300 font-bold">
                          +{st.overdue_hours}h atrasado
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          st.urgency === "critical"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : st.urgency === "high"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {st.urgency === "critical" ? "Crítico" : st.urgency === "high" ? "Alto" : "Médio"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col text-[10px]">
                          <span className="text-slate-300">
                            {st.reminders_sent_count === 0 ? "Nenhum lembrete enviado" : `${st.reminders_sent_count} lembrete(s) enviado(s)`}
                          </span>
                          {st.last_reminder_at && (
                            <span className="text-slate-500">
                              Último: {new Date(st.last_reminder_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewStudent(st);
                              setActiveTab("template");
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Ver prévia personalizada do e-mail"
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            Ver E-mail
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendIndividualEmail(st)}
                            disabled={individualSending}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            title="Enviar e-mail para este aluno agora"
                          >
                            <Send className="w-3 h-3" />
                            Enviar Agora
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredOverdueStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        🎉 Nenhum estudante em atraso de SLA no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DISPATCH HISTORY & LOGS */}
        {activeTab === "history" && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Histórico & Auditoria de E-mails Disparados
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro detalhado dos disparos de lembretes com status de entrega SMTP.
                </p>
              </div>

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar Histórico
                </button>
              )}
            </div>

            {/* History Table */}
            <div className="rounded-xl border border-slate-800 bg-[#030712]/50 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#090f1e] text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Destinatário</th>
                    <th className="py-3 px-4">Atividade & Turma</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Status de Entrega</th>
                    <th className="py-3 px-4">Assunto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors font-sans">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(item.dispatchedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{item.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.studentEmail}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{item.activityTitle}</span>
                          <span className="text-[10px] text-indigo-400">{item.className}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 font-mono text-[11px]">{item.channel}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono">
                            {item.status === "delivered" ? "Entregue (SMTP 250)" : item.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {item.subject}
                      </td>
                    </tr>
                  ))}

                  {history.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        Nenhum registro de disparo de e-mail efetuado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SLA VIOLATIONS HISTORY & XLSX EXPORT */}
        {activeTab === "violations" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Header with Title and Fast Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d1a] p-4 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    Histórico Geral de Violações de SLA
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      {violationsHistory.length} Registros
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Relatório consolidado com campos obrigatórios: <strong>Tempo de Resposta</strong>, <strong>Limite SLA</strong> e <strong>Status de Alerta</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportSlaViolations(true)}
                  disabled={exportingXLSX}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${exportingXLSX ? "animate-bounce" : ""}`} />
                  {exportingXLSX ? "Gerando XLSX..." : "Exportar Relatório (.XLSX)"}
                </button>

                <a
                  href={apiUrl("/api/sla/export-violations/xlsx")}
                  download="Relatorio_Violacoes_SLA_Completo.xlsx"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 transition-all flex items-center gap-1.5"
                  title="Download direto do arquivo gerado pelo backend"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  Download Servidor
                </a>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#030712]/60 border border-slate-800 flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Total de Violações</span>
                <span className="text-xl font-bold text-white font-mono">{violationsHistory.length}</span>
                <span className="text-[10px] text-slate-500 font-mono">Ocorrências registradas</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030712]/60 border border-rose-500/20 flex flex-col gap-1">
                <span className="text-[10px] text-rose-400 uppercase font-mono">Alertas Críticos</span>
                <span className="text-xl font-bold text-rose-400 font-mono">
                  {violationsHistory.filter(v => v.alert_status.toLowerCase().includes("crítico") || v.alert_status.toLowerCase().includes("critico")).length}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Tempo {'>'} 2x Limite SLA</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030712]/60 border border-amber-500/20 flex flex-col gap-1">
                <span className="text-[10px] text-amber-400 uppercase font-mono">Alertas Altos / Médios</span>
                <span className="text-xl font-bold text-amber-300 font-mono">
                  {violationsHistory.filter(v => v.alert_status.toLowerCase().includes("alto") || v.alert_status.toLowerCase().includes("médio") || v.alert_status.toLowerCase().includes("medio")).length}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Requer acompanhamento</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#030712]/60 border border-emerald-500/20 flex flex-col gap-1">
                <span className="text-[10px] text-emerald-400 uppercase font-mono">Exportação Estruturada</span>
                <span className="text-sm font-bold text-emerald-300 font-mono flex items-center gap-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> 4 Abas XLSX
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Detalhes, Turmas e KPIs</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3.5 rounded-xl bg-[#030712]/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Field */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por aluno, matrícula, turma ou atividade..."
                    value={violationsSearch}
                    onChange={(e) => setViolationsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#090f1e] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Class Filter */}
                <select
                  value={violationsFilterClass}
                  onChange={(e) => setViolationsFilterClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#090f1e] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="all">Todas as Turmas</option>
                  <option value="Turma A">Turma A (Eng. Software)</option>
                  <option value="Turma B">Turma B (Ciência Comp.)</option>
                  <option value="Turma C">Turma C (Sistemas Info.)</option>
                </select>

                {/* Alert Status Filter */}
                <select
                  value={violationsFilterAlert}
                  onChange={(e) => setViolationsFilterAlert(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#090f1e] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="all">Todos os Status de Alerta</option>
                  <option value="crítico">Apenas Crítico</option>
                  <option value="alto">Apenas Alto</option>
                  <option value="médio">Apenas Médio</option>
                  <option value="resolvido">Resolvido com Atraso</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchViolationsHistory}
                  disabled={violationsLoading}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
                  title="Atualizar lista de violações"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${violationsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Violations Table */}
            <div className="rounded-xl border border-slate-800 bg-[#030712]/50 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#090f1e] text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Estudante / Matrícula</th>
                      <th className="py-3 px-4">Turma & Atividade</th>
                      <th className="py-3 px-4 text-center">Tempo de Resposta</th>
                      <th className="py-3 px-4 text-center">Limite SLA</th>
                      <th className="py-3 px-4 text-center">Status de Alerta</th>
                      <th className="py-3 px-4">Ação Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {violationsHistory
                      .filter((item) => {
                        if (violationsFilterClass !== "all") {
                          if (item.class_id !== violationsFilterClass && !item.class_name.toLowerCase().includes(violationsFilterClass.toLowerCase())) {
                            return false;
                          }
                        }
                        if (violationsFilterAlert !== "all") {
                          if (!item.alert_status.toLowerCase().includes(violationsFilterAlert.toLowerCase())) {
                            return false;
                          }
                        }
                        if (violationsSearch.trim()) {
                          const q = violationsSearch.toLowerCase();
                          return (
                            item.student_name.toLowerCase().includes(q) ||
                            (item.enrollment_code && item.enrollment_code.toLowerCase().includes(q)) ||
                            item.activity_title.toLowerCase().includes(q) ||
                            item.class_name.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((item) => {
                        const isCritical = item.alert_status.toLowerCase().includes("crítico") || item.alert_status.toLowerCase().includes("critico");
                        const isHigh = item.alert_status.toLowerCase().includes("alto");
                        const isMedium = item.alert_status.toLowerCase().includes("médio") || item.alert_status.toLowerCase().includes("medio");
                        const isResolved = item.alert_status.toLowerCase().includes("resolvido");

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* Student Info */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                  {item.student_name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Matrícula: {item.enrollment_code || "N/A"} • {item.email}
                                </span>
                              </div>
                            </td>

                            {/* Class and Activity */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="text-slate-200 font-medium">{item.activity_title}</span>
                                <span className="text-[10px] text-indigo-400 font-mono">{item.class_name}</span>
                              </div>
                            </td>

                            {/* Tempo de Resposta (Required Field) */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-[11px] font-bold text-amber-300">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {item.response_time}
                              </span>
                            </td>

                            {/* Limite SLA (Required Field) */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-slate-300">
                                {item.sla_limit}
                              </span>
                            </td>

                            {/* Status de Alerta (Required Field) */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                  isCritical
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                                    : isHigh
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : isMedium
                                    ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {item.alert_status}
                              </span>
                            </td>

                            {/* Recommended Action */}
                            <td className="py-3 px-4 text-[11px] text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono">
                                {item.action_recommended || "Notificação de Cobrança"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                    {violationsHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-mono">
                          Nenhum registro de violação de SLA localizado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 border-t border-indigo-500/20 bg-[#090f1e] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Os agendamentos são verificados periodicamente em background pelo servidor.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Salvando Regras...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Salvar Regras de Agendamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
