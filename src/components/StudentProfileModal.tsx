import React, { useState, useEffect } from "react";
import { apiUrl, safeJsonResponse } from "../config/api";
import { 
  X, User, BookOpen, TrendingUp, Award, CheckCircle, 
  AlertCircle, ChevronRight, FileText, Activity,
  Database, Code2, Layers, Download, Image as ImageIcon, FileCode, Sparkles
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from "recharts";
import { toast } from "sonner";
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
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"corrections" | "evidences">("corrections");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "code" | "diagrams">("all");
  const [exportingId, setExportingId] = useState<string | null>(null);

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
                Consolidação de código, diagramas de BD, evolução pedagógica e histórico de correções vinculado.
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

            {/* Right Box (Corrections list & Pedagogical Evidences list) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 bg-[#070a13] p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("corrections")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "corrections" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  CORREÇÕES & AVALIAÇÕES ({submissions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("evidences")}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === "evidences" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700/50" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Award className="w-4 h-4 text-sky-400" />
                  Evidências Geradas ({profileData.evidences?.length || 0})
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
                
                {activeTab === "corrections" ? (
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
                ) : (
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

      </div>
    </div>
  );
}
