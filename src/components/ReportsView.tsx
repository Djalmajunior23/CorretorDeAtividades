import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Sparkles,
  Search,
  FileText,
  Download,
  ChevronRight,
  RefreshCw,
  Users,
  CheckCircle2,
  Calendar,
  X,
  FileCode,
  AlertCircle,
  TrendingUp,
  Bookmark,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { GeneratedReport } from "../types";
import { apiUrl, safeJsonResponse } from "../config/api";
import { ConsolidatedPdfReportModal } from "./ConsolidatedPdfReportModal";

export default function ReportsView() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsolidatedModal, setShowConsolidatedModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"reports" | "generator">("reports");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);

  // Form selections
  const [reportType, setReportType] = useState("student_summary");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  useEffect(() => {
    fetchReports();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/reports"));
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      toast.error("Erro ao carregar pareceres.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(apiUrl("/api/classes"));
      if (res.ok) {
        const data = await res.json();
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load classes", e);
    }
  };

  const fetchStudents = async (classId: string) => {
    const isInvalidClassId = (cid: string | undefined) => {
      if (!cid) return true;
      if (typeof cid !== "string") return true;
      if (cid.includes("$") || cid.includes("{") || cid.includes("}")) return true;
      return false;
    };

    if (isInvalidClassId(classId)) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/students?class_id=${encodeURIComponent(classId)}`));
      if (res.ok) {
        const data = await res.json();
        setStudents(data || []);
        if (data && data.length > 0) {
          setSelectedStudentId(data[0].id);
        } else {
          setSelectedStudentId("");
        }
      }
    } catch (e) {
      console.error("Failed to load students", e);
    }
  };

  const generateReport = async () => {
    if (!selectedClassId) {
      toast.error("É necessário selecionar uma turma!");
      return;
    }
    if (reportType === "student_summary" && !selectedStudentId) {
      toast.error("É necessário selecionar um estudante!");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        type: reportType,
        class_id: selectedClassId,
        student_id: reportType === "student_summary" ? selectedStudentId : undefined,
        title: customTitle || undefined,
        teacher_notes: teacherNotes || undefined
      };

      const res = await fetch(apiUrl("/api/reports/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Parecer consolidado gerado com sucesso!");
        setActiveTab("reports");
        setTeacherNotes("");
        setCustomTitle("");
        fetchReports();
      } else {
        toast.error("Erro ao processar dados de rendimento.");
      }
    } catch {
      toast.error("Falha na chamada do serviço de pareceres.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiUrl(`/api/reports/${id}/export/pdf`), "_blank");
  };

  const exportDOCX = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiUrl(`/api/reports/${id}/export/docx`), "_blank");
  };

  const exportXLSX = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(apiUrl(`/api/reports/${id}/export/xlsx`), "_blank");
  };

  const openReportDetails = (report: GeneratedReport) => {
    setSelectedReport(report);
  };

  const parseContent = (content: any) => {
    if (!content) return {};
    if (typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch {
        return { raw: content };
      }
    }
    return content;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            Módulo de Consolidação Curricular
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FileCheck className="w-8 h-8 text-emerald-400" />
            Relatórios e Pareceres Práticos
          </h1>
          <p className="text-slate-400 mt-2">
            Emita análises individuais ou coletivas detalhadas com download multiplataforma (PDF, Word, Excel).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setShowConsolidatedModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-sm"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Relatório Consolidado de Turma (PDF)
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === "reports"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Meus Pareceres Emitidos
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "generator"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Gerar com Fórmulas / IA
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {activeTab === "reports" ? (
          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                <p className="text-xs font-mono text-slate-500">Recuperando histórico de relatórios...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#0f172a]/20">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-300 font-bold">Nenhum parecer foi consolidado ainda</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Para emitir um novo parecer individual de alunos ou um fechamento coletivo de turmas para coordenação, utilize o assistente de geração.
                </p>
                <button
                  onClick={() => setActiveTab("generator")}
                  className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-mono font-bold rounded-lg hover:text-emerald-400 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Ir para Assistente
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => openReportDetails(r)}
                    className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6 hover:bg-slate-900/60 hover:border-slate-700 transition-all border-l-4 border-l-emerald-500 flex flex-col cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-900 text-emerald-400 border border-emerald-500/10 rounded-full">
                        {r.type === 'student_summary' ? 'Aluno' : 'Turma'}
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => exportPDF(r.id, e)}
                          title="Exportar PDF"
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <FileText className="w-4 h-4 text-rose-400" />
                        </button>
                        <button
                          onClick={(e) => exportDOCX(r.id, e)}
                          title="Exportar Word"
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <FileCode className="w-4 h-4 text-sky-400" />
                        </button>
                        <button
                          onClick={(e) => exportXLSX(r.id, e)}
                          title="Exportar Excel"
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-all mb-1 leading-snug line-clamp-2">
                      {r.title}
                    </h3>
                    
                    {r.teacher_notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1 leading-relaxed">
                        &ldquo;{r.teacher_notes}&rdquo;
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span className="uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {r.status || 'draft'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 max-w-2xl mx-auto space-y-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider text-emerald-400">
                    Assistente de Pareceres
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Analise o aproveitamento do percurso com um clique</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Tipo de Parecer Pedagógico
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-emerald-500 transition-all font-mono"
                  >
                    <option value="student_summary">Análise Individual de Rendimento (Ficha do Aluno)</option>
                    <option value="class_summary">Parecer Amplo de Aproveitamento (Análise de Turma)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Selecione a Turma
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-emerald-500 transition-all"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      {classes.length === 0 && <option value="">Nenhuma turma cadastrada</option>}
                    </select>
                  </div>

                  {reportType === "student_summary" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                        Selecione o Estudante
                      </label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-emerald-500 transition-all"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.enrollment_code})</option>
                        ))}
                        {students.length === 0 && (
                          <option value="">
                            {!selectedClassId ? "Selecione uma turma para carregar os alunos." : "Sem alunos nesta turma"}
                          </option>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Título do Parecer (Opcional - Deixe em branco para auto-gerar)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ex: Rendimento de Lógica de Bruno Souza"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Observações Customizadas do Professor (Inserção Manual)
                  </label>
                  <textarea
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    rows={4}
                    placeholder="Adicione observações, justificativas de comportamento ou recomendações extras que queira incorporar nativamente ao arquivo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none text-xs text-slate-200 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10 border-none"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Analisando Percurso Curricular...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Consolidar Base de Dados & Gerar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: REPORT DETAILS WITH DRILL DOWN */}
      <AnimatePresence>
        {selectedReport && (() => {
          const content = parseContent(selectedReport.content);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-900 text-emerald-400 border border-emerald-500/10 rounded">
                      Ficha Analítica de Parecer
                    </span>
                    <h2 className="text-sm font-bold text-white font-mono mt-1">
                      {selectedReport.title}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white transition-all cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-300 text-xs">
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 border border-slate-900 rounded-xl">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Data de Consolidação
                      </span>
                      <p className="text-xs font-semibold text-slate-200 mt-1">
                        {new Date(selectedReport.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Tipo de Ficha
                      </span>
                      <p className="text-xs font-semibold text-slate-200 mt-1 uppercase">
                        {selectedReport.type === "student_summary" ? "Individual" : "Coletiva"}
                      </p>
                    </div>
                    {content.average_score !== undefined && (
                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          Média Percurso
                        </span>
                        <p className="text-xs font-bold text-emerald-400 mt-1">
                          {content.average_score} / 100
                        </p>
                      </div>
                    )}
                    {content.class_average !== undefined && (
                      <div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                          Média Turma
                        </span>
                        <p className="text-xs font-bold text-emerald-400 mt-1">
                          {content.class_average} / 100
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Status Parecer
                      </span>
                      <p className="text-xs font-bold text-emerald-400 mt-1 uppercase">
                        {selectedReport.status || "draft"}
                      </p>
                    </div>
                  </div>

                  {/* Summary / Ai remarks */}
                  {content.summary && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Comentário Consolidado (IA)
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {content.summary}
                      </p>
                    </div>
                  )}

                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content.strengths && content.strengths.length > 0 && (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                          Pontos Fortes Pedagógicos
                        </span>
                        <ul className="space-y-1">
                          {content.strengths.map((str: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                              {str}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {content.improvements && content.improvements.length > 0 && (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest block">
                          Pontos de Atenção / Melhoria
                        </span>
                        <ul className="space-y-1">
                          {content.improvements.map((imp: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0"></span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Evidences & Action Plan */}
                  {content.evidences && content.evidences.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Evidências Vinculadas de Aprendizagem
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {content.evidences.map((ev: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-300">
                            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {content.recommendations && content.recommendations.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-emerald-550/5 to-[#1c2e3d] border border-emerald-500/10 rounded-xl space-y-2">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block font-bold">
                        Plano de Ação e Trilha Complementar Recomendada
                      </span>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                        {content.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="leading-relaxed">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Custom notes */}
                  {selectedReport.teacher_notes && (
                    <div className="space-y-2 border-t border-slate-900 pt-4">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        Notas Manuais Adicionadas do Professor
                      </span>
                      <div className="p-4 rounded-xl bg-slate-950 text-slate-400 border border-slate-900 italic font-mono uppercase">
                        &ldquo;{selectedReport.teacher_notes}&rdquo;
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer with download list */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800 bg-slate-950/40">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => exportPDF(selectedReport.id, e)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={(e) => exportDOCX(selectedReport.id, e)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer border border-cyan-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      WORD / DOCX
                    </button>
                    <button
                      onClick={(e) => exportXLSX(selectedReport.id, e)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      EXCEL / XLSX
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-mono font-bold rounded-xl text-xs transition-colors cursor-pointer border border-slate-800"
                  >
                    Fechar Parecer
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {showConsolidatedModal && (
        <ConsolidatedPdfReportModal onClose={() => setShowConsolidatedModal(false)} />
      )}
    </div>
  );
}
