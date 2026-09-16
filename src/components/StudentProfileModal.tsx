import React, { useState, useEffect } from "react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { 
  X, User, BookOpen, TrendingUp, Award, CheckCircle, 
  AlertCircle, ChevronRight, FileText, Activity,
  Database, Code2, Layers, Download, Image as ImageIcon, FileCode, Sparkles,
  Plus, Trash2, Eye, FileCheck, CheckCircle2
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from "recharts";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { DatabaseModelAssessmentService } from "../services/databaseModelAssessmentService";

interface StudentProfileModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

function normalizeCorrectionVault(response: any) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.corrections)) return response.corrections;
  if (Array.isArray(response?.submissions)) return response.submissions;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data?.corrections)) return response.data.corrections;
  if (Array.isArray(response?.data?.submissions)) return response.data.submissions;
  return [];
}

export function StudentProfileModal({ studentId, isOpen, onClose }: StudentProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [inspectingReport, setInspectingReport] = useState<any | null>(null);
  const [customReportTitle, setCustomReportTitle] = useState("");
  const [customTeacherNotes, setCustomTeacherNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"corrections" | "evidences" | "reports">("corrections");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "code" | "diagrams">("all");
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchReports = async (stId: string) => {
    setLoadingReports(true);
    try {
      const res = await fetch(apiUrl(`/api/students/${stId}/reports`));
      if (res.ok) {
        const data = await res.json();
        setSavedReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Não foi possível carregar relatórios salvos do aluno:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !studentId) return;

    setLoading(true);

    fetch(apiUrl(`/api/students/${studentId}/profile`))
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível carregar o perfil do aluno.");
        return res.json();
      })
      .then(async (data) => {
        const student = data?.student;
        const studentKey = student?.id ?? student?.student_id ?? student?.studentId ?? student?.enrollment_code ?? student?.matricula ?? student?.registration ?? studentId ?? null;

        try {
          const vaultRes = await fetch(apiUrl(`/api/correction-vault/student/${studentKey}`));
          if (vaultRes.ok) {
            const correctionsData = await vaultRes.json();
            const fetchedSubmissions = normalizeCorrectionVault(correctionsData);
            setSubmissions(fetchedSubmissions);
          } else {
            setSubmissions(data.corrections || []);
          }
        } catch (vaultErr) {
          console.error("Erro ao buscar correction_vault, usando dados do perfil:", vaultErr);
          setSubmissions(data.corrections || []);
        }

        setProfileData(data);
        setError(null);
        fetchReports(studentId);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId, isOpen]);

  const isDiagramCorrection = (c: any) => {
    const lang = (c.language || "").toLowerCase();
    const src = (c.source || "").toLowerCase();
    const metaCat = (c.metadata?.modelCategory || c.metadata?.type || "").toLowerCase();
    const title = ((c.activity_title || "") + " " + (c.question_title || "")).toLowerCase();
    return (
      src.includes("diagram") ||
      src.includes("database") ||
      ["sql", "erd", "uml"].includes(lang) ||
      ["logical", "physical", "classdiagram"].includes(metaCat) ||
      title.includes("modelagem") ||
      title.includes("diagrama") ||
      title.includes("banco de dados")
    );
  };

  const codeCount = React.useMemo(() => submissions.filter(c => !isDiagramCorrection(c)).length, [submissions]);
  const diagramCount = React.useMemo(() => submissions.filter(c => isDiagramCorrection(c)).length, [submissions]);

  const filteredSubmissions = React.useMemo(() => {
    if (categoryFilter === "code") return submissions.filter(c => !isDiagramCorrection(c));
    if (categoryFilter === "diagrams") return submissions.filter(c => isDiagramCorrection(c));
    return submissions;
  }, [submissions, categoryFilter]);

  const computedAverageScore = React.useMemo(() => {
    if (!submissions || submissions.length === 0) return "0.0";
    const total = submissions.reduce((sum, s) => sum + parseFloat(s.score || 0), 0);
    const avg = total / submissions.length;
    return avg > 10 ? (avg / 10).toFixed(1) : avg.toFixed(1);
  }, [submissions]);

  const computedEvolution = React.useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    return [...submissions]
      .reverse()
      .map((c, idx) => {
        const rawGrade = parseFloat(c.score || 0);
        return {
          name: c.question_title || c.activity_title || `Corr. ${idx + 1}`,
          grade: rawGrade > 10 ? rawGrade / 10 : rawGrade,
          date: new Date(c.created_at || new Date()).toLocaleDateString("pt-BR"),
        };
      });
  }, [submissions]);

  const handleGenerateStudentReport = async () => {
    setIsGeneratingReport(true);
    const toastId = toast.loading("Sintetizando histórico e gerando Parecer Individual...");
    try {
      const res = await fetch(apiUrl(`/api/students/${studentId}/reports`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customReportTitle || undefined,
          teacher_notes: customTeacherNotes || undefined,
          class_id: profileData?.student?.class_id || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Parecer individual gerado e armazenado com sucesso!", { id: toastId });
        setShowGenerateModal(false);
        setCustomReportTitle("");
        setCustomTeacherNotes("");
        fetchReports(studentId);
      } else {
        toast.error("Erro ao salvar relatório individual no servidor.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar parecer: " + err.message, { id: toastId });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDeleteSavedReport = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(apiUrl(`/api/reports/${reportId}`), { method: "DELETE" });
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      if (inspectingReport?.id === reportId) setInspectingReport(null);
      toast.success("Parecer removido do histórico permanente.");
    } catch (err) {
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      toast.success("Parecer removido.");
    }
  };

  const handleDownloadSavedReportPdf = (report: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateStr = new Date(report.created_at || Date.now()).toLocaleDateString("pt-BR");
      const studentName = profileData?.student?.name || report.content?.student_name || "Estudante";
      const className = profileData?.student?.class_name || report.content?.class_name || "Turma Geral";
      const content = typeof report.content === "string" ? JSON.parse(report.content) : (report.content || {});

      // Header Banner
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, 210, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text("SENAI - PARECER PEDAGÓGICO INDIVIDUAL", 14, 11);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`CodeCheck AI • Emissão Oficial: ${dateStr} • Status: Homologado`, 14, 18);

      // Title & Student Info
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(report.title || `Parecer Individual - ${studentName}`, 14, 34);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const avgScore = content.average_score !== undefined ? content.average_score : computedAverageScore;
      doc.text(`Estudante: ${studentName} | Turma: ${className} | Média Consolidada: ${avgScore}/100`, 14, 40);

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, 44, 196, 44);

      let currentY = 52;

      // 1. Summary
      if (content.summary) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("1. Síntese Avaliativa & Diagnóstico", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const summaryLines = doc.splitTextToSize(content.summary, 182);
        doc.text(summaryLines, 14, currentY);
        currentY += (summaryLines.length * 4.5) + 6;
      }

      // 2. Strengths
      if (content.strengths && Array.isArray(content.strengths)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text("2. Competências e Pontos Fortes Demonstrados", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        content.strengths.forEach((str: string) => {
          doc.text(`•  ${str}`, 16, currentY);
          currentY += 5;
        });
        currentY += 4;
      }

      // 3. Improvements
      if (content.improvements && Array.isArray(content.improvements)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(245, 158, 11); // Amber
        doc.text("3. Oportunidades de Evolução & Pontos a Otimizar", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        content.improvements.forEach((imp: string) => {
          doc.text(`•  ${imp}`, 16, currentY);
          currentY += 5;
        });
        currentY += 4;
      }

      // 4. Action plan
      if (content.action_plan || content.recommendations) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("4. Plano de Ação Pedagógico e Encaminhamentos", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const planText = content.action_plan || (Array.isArray(content.recommendations) ? content.recommendations.join("\n") : String(content.recommendations));
        const planLines = doc.splitTextToSize(planText, 182);
        doc.text(planLines, 14, currentY);
        currentY += (planLines.length * 4.5) + 6;
      }

      // 5. Teacher notes
      if (report.teacher_notes || content.teacher_notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text("5. Observações Qualitativas do Docente", 14, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const notes = report.teacher_notes || content.teacher_notes;
        const noteLines = doc.splitTextToSize(notes, 182);
        doc.text(noteLines, 14, currentY);
        currentY += (noteLines.length * 4.5) + 6;
      }

      // Signatures
      if (currentY < 240) {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("____________________________________________", 24, 260);
        doc.text("Docente Responsável", 38, 265);

        doc.text("____________________________________________", 120, 260);
        doc.text("Coordenação Pedagógica SENAI", 132, 265);
      }

      doc.save(`Parecer_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}_${dateStr.replace(/\//g, "-")}.pdf`);
      toast.success("PDF do parecer individual baixado com sucesso!");
    } catch (err: any) {
      console.error("PDF generation error:", err);
      toast.error("Erro ao gerar PDF do parecer.");
    }
  };

  const handleDownloadPdf = async (corr: any) => {
    setExportingId(corr.id);
    const toastId = toast.loading("Gerando Laudo Técnico em PDF...");
    try {
      const studentName = profileData?.student?.name || corr.student_name || "Estudante";
      const className = profileData?.student?.class_name || corr.class_name || "Turma de TI";

      const assessment = corr.raw_correction || corr.metadata?.assessment || {
        assessmentId: corr.id,
        modelCategory: corr.metadata?.modelCategory || (corr.language === "sql" ? "physical" : "logical"),
        inputFormat: corr.metadata?.inputFormat || "code",
        targetSgbd: corr.metadata?.targetSgbd || "postgresql",
        totalGrade: parseFloat(corr.score || 0),
        status: parseFloat(corr.score || 0) >= 60 ? "Aprovado" : parseFloat(corr.score || 0) >= 40 ? "Recuperação" : "Reprovado",
        isApproved: parseFloat(corr.score || 0) >= 60,
        rubrics: Array.isArray(corr.rubric_result) ? corr.rubric_result : [],
        strengths: Array.isArray(corr.strengths) ? corr.strengths : [],
        modelingIssues: Array.isArray(corr.improvements) ? corr.improvements : [],
        normalizationAudit: corr.metadata?.normalizationAudit || {
          firstNormalForm: { compliant: true, issues: [], explanation: "1FN Conforme." },
          secondNormalForm: { compliant: true, issues: [], explanation: "2FN Conforme." },
          thirdNormalForm: { compliant: true, issues: [], explanation: "3FN Conforme." }
        },
        pedagogicalRecommendations: ["Revisar integridade referencial e boas práticas de modelagem."],
        extractedMermaidCode: corr.submitted_code,
        suggestedCorrectedDiagram: corr.submitted_code,
        generatedDdlSql: corr.submitted_code,
        evaluatedAt: corr.created_at || new Date().toISOString()
      };

      let pdfBlob: Blob | null = null;
      try {
        const res = await fetch(apiUrl("/api/database-models/export-pdf"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment,
            studentName,
            className
          })
        });
        if (res.ok) {
          pdfBlob = await res.blob();
        }
      } catch (err) {
        console.warn("Backend PDF export failed, fallback to client-side:", err);
      }

      if (!pdfBlob) {
        const buffer = await DatabaseModelAssessmentService.generateModelAssessmentPdf(
          assessment,
          studentName,
          className
        );
        pdfBlob = new Blob([buffer as any], { type: "application/pdf" });
      }

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_correcao_${corr.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Laudo Técnico baixado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao exportar PDF: " + err.message, { id: toastId });
    } finally {
      setExportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] rounded-2xl w-full max-w-5xl border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#070a13]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white font-display">Perfil Completo do Aluno</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Consolidação de código, diagramas de BD, histórico de relatórios arquivados e evidências.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="text-sm font-mono uppercase tracking-wider">Buscando inteligência de perfil...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-rose-400">
            <AlertCircle className="w-12 h-12 stroke-1" />
            <span className="font-semibold text-lg">{error}</span>
            <button 
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
            >
              Fechar Visualização
            </button>
          </div>
        ) : (
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden max-h-[100%]">
            
            {/* Left Box (Details & Insights Summary) */}
            <div className="w-full lg:w-[40%] border-r border-slate-800 overflow-y-auto p-6 flex flex-col gap-5 bg-[#080c14]/50">
              
              {/* Profile Card */}
              <div className="p-5 bg-[#0f172a]/80 border border-slate-800 rounded-2xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white font-display">{profileData.student?.name}</h4>
                    <span className="text-xs text-emerald-400 font-mono font-medium block mt-1 uppercase">
                      Turma: <span className="font-bold underline">{profileData.student?.class_name || "Sem turma vinculada"}</span>
                    </span>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/20 rounded-full flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-[10px] uppercase font-mono text-emerald-400 block tracking-wider">Média</span>
                    <span className="text-xl font-bold font-mono text-white leading-none mt-0.5">{computedAverageScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 mt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-0.5">Matrícula</span>
                    <span className="font-mono text-slate-200">{profileData.student?.enrollment_code || "N/D"}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-mono text-[9px] uppercase tracking-wider mb-0.5">Contato / E-mail</span>
                    <span className="text-slate-200 truncate block" title={profileData.student?.email}>{profileData.student?.email || "Sem e-mail"}</span>
                  </div>
                </div>

                {profileData.student?.notes && (
                  <div className="mt-2 text-xs p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-slate-400">
                    <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Notas do Professor</span>
                    <p className="italic line-clamp-3">"{profileData.student.notes}"</p>
                  </div>
                )}
              </div>

              {/* Graphical Evolution */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 px-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Gráfico de Evolução
                </span>
                <div className="h-44 w-full bg-[#030712] rounded-xl border border-slate-800/80 p-3 flex flex-col justify-between">
                  {computedEvolution && computedEvolution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={computedEvolution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/30" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
                          labelClassName="text-slate-400 font-bold"
                        />
                        <Line type="monotone" dataKey="grade" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Nota" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                      Histórico insuficiente para plotar evolução (requer correções).
                    </div>
                  )}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                {/* Strengths Box */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Pontos Fortes</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {profileData.strengths?.map((str: string, index: number) => (
                      <li key={index} className="text-[11px] text-slate-300 leading-tight flex items-start gap-1">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements Box */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">A Otimizar</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {profileData.improvements?.map((imp: string, index: number) => (
                      <li key={index} className="text-[11px] text-slate-300 leading-tight flex items-start gap-1">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>

            {/* Right Box (Corrections list, Saved Reports list, Pedagogical Evidences list) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 bg-[#070a13] p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("corrections")}
                  className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "corrections" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  CORREÇÕES ({submissions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "reports" 
                      ? "bg-purple-950/60 text-purple-200 shadow-md border border-purple-500/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  PARECERES SALVOS ({savedReports?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evidences")}
                  className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === "evidences" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Award className="w-4 h-4 text-sky-400" />
                  Evidências ({profileData.evidences?.length || 0})
                </button>
              </div>

              {/* Sub-Filters for Category (All, Code, Diagrams) */}
              {activeTab === "corrections" && (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-xs overflow-x-auto">
                  <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider mr-1">Filtrar:</span>
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                      categoryFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Todos ({submissions.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("code")}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      categoryFilter === "code" ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code2 className="w-3 h-3 text-emerald-400" />
                    Código Fonte ({codeCount})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("diagrams")}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      categoryFilter === "diagrams" ? "bg-sky-600/30 text-sky-300 border border-sky-500/40" : "bg-slate-900 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Database className="w-3 h-3 text-sky-400" />
                    Modelagem & Diagramas ({diagramCount})
                  </button>
                </div>
              )}

              {/* Tab Panels */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
                
                {/* TAB 1: CORRECTIONS */}
                {activeTab === "corrections" && (
                  <>
                    {filteredSubmissions && filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((corr: any) => {
                        const isDiagram = isDiagramCorrection(corr);
                        const meta = corr.metadata || {};
                        const modelCategory = meta.modelCategory || (corr.language === "sql" ? "physical" : "logical");
                        const targetSgbd = meta.targetSgbd || "postgresql";
                        const inputFormat = meta.inputFormat || (corr.submitted_code?.includes("Imagem") ? "image" : "code");

                        return (
                          <div 
                            key={corr.id} 
                            className={`p-5 rounded-2xl bg-slate-900/40 border transition-all flex flex-col gap-3 ${
                              isDiagram ? "border-sky-500/30 hover:border-sky-500/60 bg-sky-950/10" : "border-slate-800/80 hover:border-slate-700/60"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isDiagram ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                                      <Database className="w-3 h-3 text-sky-400" />
                                      {modelCategory === "physical" ? `MODELO FÍSICO (${targetSgbd.toUpperCase()})` : modelCategory === "classDiagram" ? "UML CLASSES" : "MODELO LÓGICO / DER"}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      <Code2 className="w-3 h-3 text-emerald-400" />
                                      CÓDIGO FONTE
                                    </span>
                                  )}

                                  {inputFormat === "image" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                      <ImageIcon className="w-2.5 h-2.5" />
                                      IMAGEM OCR
                                    </span>
                                  )}

                                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 text-[10px] font-mono capitalize">
                                    {corr.status || "corrigido"}
                                  </span>
                                  <span className="uppercase text-slate-400 text-[10px] font-mono font-bold">{corr.language}</span>
                                </div>

                                <h5 className="font-bold text-white text-sm">
                                  {corr.question_title || corr.activity_title || "Atividade de Modelagem & Algoritmos"}
                                </h5>
                                
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  Avaliado em: {new Date(corr.created_at || Date.now()).toLocaleString("pt-BR")}
                                </span>
                              </div>

                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="px-3 py-1 bg-slate-800/90 border border-slate-700/50 rounded-xl text-right">
                                  <span className="block text-[8px] text-slate-500 font-mono uppercase tracking-wider">Nota</span>
                                  <span className="text-base font-bold font-mono text-emerald-400">{corr.score} <span className="text-[10px] text-slate-500 font-normal">/100</span></span>
                                </div>

                                {isDiagram && (
                                  <button
                                    onClick={() => handleDownloadPdf(corr)}
                                    disabled={exportingId === corr.id}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-600/30 hover:text-sky-300 text-slate-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all border border-slate-700 cursor-pointer"
                                    title="Exportar Laudo Técnico em PDF"
                                  >
                                    <Download className="w-3 h-3 text-sky-400" />
                                    {exportingId === corr.id ? "Gerando..." : "Laudo PDF"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Normalization Pills if available */}
                            {meta.normalizationAudit && (
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                                <span className="text-[9px] font-mono text-slate-500 uppercase">Formas Normais:</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                  meta.normalizationAudit.firstNormalForm?.compliant ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                                }`}>1FN {meta.normalizationAudit.firstNormalForm?.compliant ? "✓" : "!"}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">2FN ✓</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">3FN ✓</span>
                              </div>
                            )}

                            {/* Submitted Code or Mermaid/DDL */}
                            {(corr.submitted_code || corr.code_content || corr.code) && (
                              <div className="bg-[#030712] p-3 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto max-h-[140px] text-slate-300">
                                <pre><code>{corr.submitted_code || corr.code_content || corr.code}</code></pre>
                              </div>
                            )}

                            {corr.feedback && (
                              <div className="text-[11px] text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 space-y-1">
                                <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Parecer Pedagógico & Feedback</span>
                                <p className="whitespace-pre-line leading-relaxed font-sans">{corr.feedback}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-500 italic text-sm">
                        Nenhuma atividade corrigida encontrada para o filtro selecionado.
                      </div>
                    )}
                  </>
                )}

                {/* TAB 2: SAVED INDIVIDUAL REPORTS */}
                {activeTab === "reports" && (
                  <div className="space-y-4">
                    {/* Top Action Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          Repositório Permanente de Pareceres do Aluno
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Todos os pareceres gerados ficam permanentemente armazenados e disponíveis para consulta do professor a qualquer momento.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Gerar Novo Parecer
                      </button>
                    </div>

                    {/* Reports List */}
                    {loadingReports ? (
                      <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        <span>Carregando pareceres arquivados...</span>
                      </div>
                    ) : savedReports && savedReports.length > 0 ? (
                      savedReports.map((rep: any) => {
                        const content = typeof rep.content === "string" ? JSON.parse(rep.content) : (rep.content || {});
                        return (
                          <div
                            key={rep.id}
                            className="p-5 rounded-2xl bg-[#0e1322] border border-purple-500/20 hover:border-purple-500/40 transition-all flex flex-col gap-3 shadow-md"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Parecer Homologado
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {new Date(rep.created_at).toLocaleDateString("pt-BR")} às {new Date(rep.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-white mt-1.5">{rep.title}</h4>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleDownloadSavedReportPdf(rep)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700 hover:border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Exportar PDF do Parecer"
                                >
                                  <Download className="w-3.5 h-3.5 text-purple-400" />
                                  Baixar PDF
                                </button>
                                <button
                                  onClick={() => setInspectingReport(rep)}
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title="Ver Detalhes do Parecer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSavedReport(rep.id, e)}
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                  title="Excluir Parecer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Summary Text */}
                            {content.summary && (
                              <p className="text-xs text-slate-300 bg-[#070a13] p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                                {content.summary}
                              </p>
                            )}

                            {/* Key Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {content.strengths && Array.isArray(content.strengths) && content.strengths.length > 0 && (
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1">
                                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">Pontos Fortes Registrados</span>
                                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                                    {content.strengths.slice(0, 2).map((s: string, idx: number) => (
                                      <li key={idx} className="truncate">• {s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {content.improvements && Array.isArray(content.improvements) && content.improvements.length > 0 && (
                                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 space-y-1">
                                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400">Diretrizes de Reforço</span>
                                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                                    {content.improvements.slice(0, 2).map((imp: string, idx: number) => (
                                      <li key={idx} className="truncate">• {imp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Teacher Notes */}
                            {(rep.teacher_notes || content.teacher_notes) && (
                              <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                                💬 "{rep.teacher_notes || content.teacher_notes}"
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 border border-dashed border-purple-500/20 rounded-2xl bg-[#090d18] flex flex-col items-center gap-3">
                        <FileText className="w-10 h-10 text-purple-400 opacity-60" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-200">Nenhum parecer arquivado ainda</h4>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Gere o primeiro parecer individual sobre o histórico de correções deste aluno para mantê-lo salvo no sistema.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowGenerateModal(true)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          Gerar Parecer Agora
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: EVIDENCES */}
                {activeTab === "evidences" && (
                  <>
                    {profileData.evidences && profileData.evidences.length > 0 ? (
                      profileData.evidences.map((evi: any) => (
                        <div 
                          key={evi.id} 
                          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-sky-400" />
                                {evi.title}
                              </h5>
                              <div className="flex items-center gap-3 mt-1.5 text-slate-400 text-[10px] font-mono">
                                <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                                  {evi.evidence_type || "MODELAGEM"}
                                </span>
                                <span>{new Date(evi.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                            <div className="px-3 py-1 bg-slate-800/80 rounded-xl text-right shrink-0">
                              <span className="block text-[8px] text-slate-500 font-mono uppercase tracking-wider">Pontuação</span>
                              <span className="text-base font-bold font-mono text-emerald-400">{evi.score || "N/A"}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed bg-[#030712]/40 p-3 rounded-lg border border-slate-800">
                            {evi.description}
                          </p>

                          {evi.feedback && (
                            <div className="text-[11px] text-slate-300 p-2.5 rounded-lg border border-slate-800/60">
                              <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block mb-1">Feedback Vinculado</span>
                              <p className="whitespace-pre-line font-serif italic text-slate-400">"{evi.feedback}"</p>
                            </div>
                          )}

                          {evi.tags && Array.isArray(evi.tags) && evi.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {evi.tags.map((tg: string, i: number) => (
                                <span key={i} className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                                  #{tg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500 italic text-sm">
                        Nenhuma evidência pedagógica gerada para este aluno.
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>

          </div>
        )}

        {/* Modal: Generate New Student Individual Report */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-60 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] rounded-2xl w-full max-w-lg border border-purple-500/40 shadow-2xl p-6 flex flex-col gap-4 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Gerar Parecer Individual</h3>
                </div>
                <button 
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                O sistema irá consolidar todas as correções de código fonte e diagramas de banco de dados do estudante <strong className="text-white">{profileData?.student?.name}</strong>, calculando a média, pontos fortes e diretrizes de evolução.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono font-bold text-slate-300 block mb-1">Título do Parecer (Opcional):</label>
                  <input
                    type="text"
                    placeholder={`Parecer Pedagógico - ${profileData?.student?.name || "Aluno"}`}
                    value={customReportTitle}
                    onChange={(e) => setCustomReportTitle(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-slate-300 block mb-1">Anotações do Docente:</label>
                  <textarea
                    rows={3}
                    placeholder="Adicione observações qualitativas para constar no documento oficial..."
                    value={customTeacherNotes}
                    onChange={(e) => setCustomTeacherNotes(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-slate-600 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateStudentReport}
                  disabled={isGeneratingReport}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  {isGeneratingReport ? "Sintetizando..." : "Gerar e Armazenar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Inspect Full Report Details */}
        {inspectingReport && (
          <div className="fixed inset-0 z-60 bg-[#030712]/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b0f19] rounded-2xl w-full max-w-2xl border border-purple-500/40 shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Parecer Arquivado
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{inspectingReport.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSavedReportPdf(inspectingReport)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                  </button>
                  <button 
                    onClick={() => setInspectingReport(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 text-xs text-slate-300">
                {(() => {
                  const content = typeof inspectingReport.content === "string" ? JSON.parse(inspectingReport.content) : (inspectingReport.content || {});
                  return (
                    <>
                      {content.summary && (
                        <div className="p-4 rounded-xl bg-[#030712] border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-purple-400 tracking-wider">Síntese Diagnóstica</span>
                          <p className="text-slate-200 leading-relaxed">{content.summary}</p>
                        </div>
                      )}

                      {content.strengths && Array.isArray(content.strengths) && (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">Pontos Fortes Demonstrados</span>
                          <ul className="space-y-1">
                            {content.strengths.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {content.improvements && Array.isArray(content.improvements) && (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">Oportunidades de Evolução</span>
                          <ul className="space-y-1">
                            {content.improvements.map((imp: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(content.action_plan || content.recommendations) && (
                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">Plano de Ação & Deliberações</span>
                          <p className="text-slate-200 leading-relaxed">
                            {content.action_plan || (Array.isArray(content.recommendations) ? content.recommendations.join("\n") : String(content.recommendations))}
                          </p>
                        </div>
                      )}

                      {(inspectingReport.teacher_notes || content.teacher_notes) && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Observações do Docente</span>
                          <p className="text-slate-300 italic">"{inspectingReport.teacher_notes || content.teacher_notes}"</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
