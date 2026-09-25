import React, { useState, useEffect, useMemo } from "react";
import { 
  Copy, 
  Sparkles, 
  FileText, 
  Download, 
  ShieldCheck, 
  Layers, 
  Shuffle, 
  CheckCircle2, 
  Eye, 
  Code2, 
  Users, 
  RefreshCw, 
  Clock, 
  Send, 
  BookOpen,
  FileCheck,
  CheckSquare,
  Square,
  Search,
  Check,
  GraduationCap,
  Play,
  Award,
  AlertCircle,
  HelpCircle,
  Hash,
  ListOrdered,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  ParametricExamService, 
  ParametricExamMaster, 
  ParametricVariant, 
  ExamVariantLetter,
  MultipleChoiceQuestion,
  StudentIndividualBooklet
} from "../services/parametricExamService";
import { apiUrl } from "../config/api";

const PROGRAMMING_LANGUAGES = [
  { id: "python", name: "Python", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  { id: "javascript", name: "JavaScript", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  { id: "typescript", name: "TypeScript", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { id: "java", name: "Java", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  { id: "csharp", name: "C# (.NET)", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { id: "cpp", name: "C / C++", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  { id: "sql", name: "SQL Relacional", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  { id: "php", name: "PHP 8+", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30" },
  { id: "go", name: "Go (Golang)", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" },
  { id: "rust", name: "Rust", color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
  { id: "html_css", name: "HTML5 / CSS3", color: "text-teal-400 bg-teal-400/10 border-teal-400/30" }
];

export default function ParametricExamGeneratorView() {
  // Main Navigation Tabs
  const [activeMainTab, setActiveMainTab] = useState<"builder" | "booklets" | "variants" | "simulator">("builder");

  // Exam Configuration State
  const [examTitle, setExamTitle] = useState("Avaliação Oficial & Simulado de Programação");
  const [courseName, setCourseName] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [subject, setSubject] = useState("Lógica, Estruturas de Dados & Linguagens de Programação");
  const [language, setLanguage] = useState("typescript");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["python", "javascript", "typescript", "java", "sql", "csharp"]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [variantCount, setVariantCount] = useState<number>(4);
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [examType, setExamType] = useState<"multiple_choice" | "mixed" | "practical_code">("multiple_choice");
  const [basePrompt, setBasePrompt] = useState("Criar questões técnicas e desafiadoras sobre manipulação de estruturas de dados, POO, async/await, closures, consultas SQL e complexidade algorítmica com foco prático.");

  // Classes & Students State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Exam Generation State
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingBatchPdf, setExportingBatchPdf] = useState(false);
  const [currentExam, setCurrentExam] = useState<ParametricExamMaster | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<ExamVariantLetter>("A");
  const [showSolutionCode, setShowSolutionCode] = useState(false);

  // Student Booklet Inspector State
  const [selectedBookletStudentId, setSelectedBookletStudentId] = useState<string>("");
  const [showBookletAnswers, setShowBookletAnswers] = useState(false);

  // Interactive Online Simulator State
  const [simulatorStudentAnswers, setSimulatorStudentAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [simulatorSubmitted, setSimulatorSubmitted] = useState(false);
  const [simulatorCurrentQuestion, setSimulatorCurrentQuestion] = useState(1);

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // When class changes, fetch students
  useEffect(() => {
    if (selectedClassId) {
      fetchStudentsForClass(selectedClassId);
    }
  }, [selectedClassId]);

  // Generate initial dataset when ready
  useEffect(() => {
    handleGenerateExam();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch(apiUrl("/api/classes"));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.classes || [];
        setClasses(list);
        if (list.length > 0 && !selectedClassId) {
          setSelectedClassId(list[0].id || list[0].name);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch(apiUrl(`/api/students?class_id=${encodeURIComponent(classId)}`));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.students || data.records || []);
        
        if (list.length > 0) {
          setClassStudents(list);
          // Default: select all students in the class
          setSelectedStudentIds(new Set(list.map((s: any) => s.id || s._id)));
        } else {
          // If class has no students in DB, provide standard demo cohort
          setDefaultDemoCohort();
        }
      } else {
        setDefaultDemoCohort();
      }
    } catch {
      setDefaultDemoCohort();
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const setDefaultDemoCohort = () => {
    const demo = [
      { id: "std_01", name: "Ana Clara Silva", enrollment_code: "SENAI-2026-001" },
      { id: "std_02", name: "Bruno Henrique Santos", enrollment_code: "SENAI-2026-002" },
      { id: "std_03", name: "Carlos Eduardo Souza", enrollment_code: "SENAI-2026-003" },
      { id: "std_04", name: "Daniela Ferreira Lima", enrollment_code: "SENAI-2026-004" },
      { id: "std_05", name: "Enzo Gabriel Martins", enrollment_code: "SENAI-2026-005" },
      { id: "std_06", name: "Fernanda Alves Rocha", enrollment_code: "SENAI-2026-006" },
      { id: "std_07", name: "Gabriel Monteiro Cruz", enrollment_code: "SENAI-2026-007" },
      { id: "std_08", name: "Helena Beatriz Barbosa", enrollment_code: "SENAI-2026-008" }
    ];
    setClassStudents(demo);
    setSelectedStudentIds(new Set(demo.map(s => s.id)));
  };

  const toggleStudentSelection = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  const selectAllStudents = () => {
    setSelectedStudentIds(new Set(classStudents.map(s => s.id || s._id)));
  };

  const deselectAllStudents = () => {
    setSelectedStudentIds(new Set());
  };

  const toggleLanguage = (langId: string) => {
    if (selectedLanguages.includes(langId)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== langId));
      } else {
        toast.info("Mantenha ao menos uma linguagem selecionada para o simulado.");
      }
    } else {
      setSelectedLanguages([...selectedLanguages, langId]);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return classStudents;
    const q = studentSearchQuery.toLowerCase();
    return classStudents.filter(s => 
      (s.name || "").toLowerCase().includes(q) || 
      (s.enrollment_code || "").toLowerCase().includes(q)
    );
  }, [classStudents, studentSearchQuery]);

  const handleGenerateExam = async () => {
    setLoading(true);
    try {
      let result: ParametricExamMaster | null = null;

      // Filter chosen students from state
      const targetStudents = classStudents
        .filter(s => selectedStudentIds.has(s.id || s._id))
        .map(s => ({
          id: s.id || s._id,
          name: s.name,
          enrollmentCode: s.enrollment_code || s.enrollmentCode || `MAT-${s.id}`
        }));

      const activeClassName = classes.find(c => c.id === selectedClassId)?.name || "Turma Principal";

      // 1. Try server API endpoint
      try {
        const res = await fetch(apiUrl("/api/parametric-exam/generate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examTitle,
            courseName,
            subject,
            basePrompt,
            language,
            selectedLanguages,
            questionCount,
            examType,
            variantCount,
            durationMinutes,
            classId: selectedClassId,
            className: activeClassName,
            students: targetStudents.length > 0 ? targetStudents : undefined,
            providerConfig: {
              apiKey: localStorage.getItem("codecheck_ai_api_key") || undefined
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.exam) {
            result = data.exam;
          }
        }
      } catch (backendErr) {
        console.warn("[ParametricExamView] Backend endpoint indisponível, usando serviço local:", backendErr);
      }

      // 2. Client-side fallback service
      if (!result) {
        result = await ParametricExamService.generateParametricExam({
          examTitle,
          courseName,
          subject,
          basePrompt,
          language,
          selectedLanguages,
          questionCount,
          examType,
          variantCount,
          durationMinutes,
          classId: selectedClassId,
          className: activeClassName,
          students: targetStudents.length > 0 ? targetStudents : undefined
        });
      }

      setCurrentExam(result);
      setActiveVariantTab(result.variants[0]?.variantId || "A");
      if (result.studentBooklets.length > 0) {
        setSelectedBookletStudentId(result.studentBooklets[0].studentId);
      }
      // Reset simulator
      setSimulatorStudentAnswers({});
      setSimulatorSubmitted(false);
      setSimulatorCurrentQuestion(1);

      toast.success(`Simulado gerado: ${result.questionCount} questões em ${result.variants.length} cadernos individuais!`);
    } catch (err: any) {
      toast.error("Erro ao gerar exame: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMasterPdf = async () => {
    if (!currentExam) return;
    setExportingPdf(true);
    try {
      let downloaded = false;
      try {
        const res = await fetch(apiUrl("/api/parametric-exam/export-pdf"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam: currentExam })
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `dossie_mestre_simulado_${currentExam.examId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloaded = true;
          toast.success("Dossiê Mestre Oficial em PDF exportado com sucesso!");
        }
      } catch (e) {
        console.warn("Backend PDF falhou, usando fallback local:", e);
      }

      if (!downloaded) {
        const pdfBuffer = await ParametricExamService.generateMasterExamPdf(currentExam);
        const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dossie_mestre_simulado_${currentExam.examId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Dossiê Mestre Oficial em PDF exportado com sucesso!");
      }
    } catch (err: any) {
      toast.error("Erro ao exportar PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSingleStudentBooklet = (booklet: StudentIndividualBooklet) => {
    try {
      const pdfBuffer = ParametricExamService.exportStudentIndividualBookletPdf(booklet);
      const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Caderno_Individual_${booklet.studentName.replace(/\s+/g, "_")}_Variante_${booklet.assignedVariant}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`📄 Caderno Individual do(a) aluno(a) ${booklet.studentName} exportado!`);
    } catch (err: any) {
      toast.error("Erro ao gerar PDF do caderno: " + err.message);
    }
  };

  const handleExportAllClassBooklets = () => {
    if (!currentExam || !currentExam.studentBooklets || currentExam.studentBooklets.length === 0) {
      toast.error("Nenhum caderno de aluno disponível para exportação.");
      return;
    }
    setExportingBatchPdf(true);
    try {
      const pdfBuffer = ParametricExamService.exportAllClassBookletsPdf(currentExam.studentBooklets);
      const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cadernos_Turma_Completa_${currentExam.studentBooklets.length}_Alunos.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`🎉 Lote de ${currentExam.studentBooklets.length} Cadernos da Turma exportado em PDF unificado!`);
    } catch (err: any) {
      toast.error("Erro ao gerar lote de cadernos: " + err.message);
    } finally {
      setExportingBatchPdf(false);
    }
  };

  const handleExportSingleVariantPdf = (variant: ParametricVariant) => {
    try {
      const pdfBuffer = ParametricExamService.exportSingleVariantPdf(variant, {
        examTitle,
        courseName,
        durationMinutes,
        subject
      });
      const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Caderno_Prova_Variante_${variant.variantId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`PDF da Variante ${variant.variantId} exportado com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao exportar variante: " + err.message);
    }
  };

  const handleExportAnswerSheetPdf = (variantId: ExamVariantLetter) => {
    try {
      const pdfBuffer = ParametricExamService.exportAnswerSheetPdf({
        examTitle,
        courseName,
        variantId
      });
      const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Folha_Respostas_SENAI_Variante_${variantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Folha Oficial de Respostas (Variante ${variantId}) exportada!`);
    } catch (err: any) {
      toast.error("Erro ao gerar Folha de Respostas: " + err.message);
    }
  };

  const handleExportMoodleXml = (variant: ParametricVariant) => {
    try {
      const xml = ParametricExamService.exportVariantMoodleXml(variant);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moodle_simulado_variante_${variant.variantId}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Moodle XML da Variante ${variant.variantId} exportado!`);
    } catch (err: any) {
      toast.error("Erro ao exportar Moodle XML: " + err.message);
    }
  };

  const handlePublishToClass = async () => {
    if (!currentExam) return;
    setIsPublishing(true);
    try {
      const targetClass = selectedClassId || (classes[0]?.id || "turma-geral");
      const res = await fetch(apiUrl("/api/teacher/complex-activities/publish-to-class"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: {
            title: `${currentExam.examTitle} [${currentExam.questionCount} Questões]`,
            questionCommand: currentExam.basePrompt,
            languageOrDialect: currentExam.selectedLanguages.join(", "),
            variantsCount: currentExam.variants.length,
            assignedStudentsCount: currentExam.studentBooklets.length
          },
          classId: targetClass
        })
      });
      if (res.ok) {
        toast.success(`Avaliação/Simulado atribuído com sucesso à turma!`);
      } else {
        toast.success(`Cadernos vinculados à turma selecionada!`);
      }
    } catch (e: any) {
      toast.error("Erro ao publicar: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Selected Variant and Selected Booklet
  const currentVariant = currentExam?.variants.find(v => v.variantId === activeVariantTab) || currentExam?.variants[0];
  const currentSelectedBooklet = currentExam?.studentBooklets.find(b => b.studentId === selectedBookletStudentId) || currentExam?.studentBooklets[0];

  // Simulator stats
  const simulatorQuestions = currentVariant?.questions || [];
  const simulatorScore = useMemo(() => {
    if (!simulatorSubmitted || !simulatorQuestions.length) return 0;
    let correctCount = 0;
    simulatorQuestions.forEach(q => {
      if (simulatorStudentAnswers[q.questionNumber] === q.correctOption) {
        correctCount++;
      }
    });
    return Math.round((correctCount / simulatorQuestions.length) * 100);
  }, [simulatorSubmitted, simulatorStudentAnswers, simulatorQuestions]);

  const variantBadgeColors: Record<ExamVariantLetter, { bg: string; text: string; border: string }> = {
    A: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    B: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    C: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    D: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Gerador Paramétrico Anti-Cola
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                4 Alternativas (A, B, C, D)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wide uppercase">
                <Users className="w-3.5 h-3.5" />
                Cadernos Individuais por Turma
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Gerador de Provas & Simulados Multi-Linguagens
            </h1>
            
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Crie provas e simulados com a quantidade exata de questões desejada, com 4 alternativas por questão e conteúdo cobrindo diversas linguagens de programação. Gere e exporte cadernos individualizados por aluno cadastrado na turma com gabaritos sincronizados.
            </p>
          </div>

          {/* Master Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportMasterPdf}
              disabled={exportingPdf || !currentExam}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              title="Baixar Dossiê Mestre Completo com Folha de Sala e Gabarito"
            >
              {exportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Download className="w-4 h-4 text-indigo-400" />
              )}
              Dossiê PDF Mestre
            </button>

            <button
              onClick={handleExportAllClassBooklets}
              disabled={exportingBatchPdf || !currentExam || !currentExam.studentBooklets?.length}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              title="Baixar todos os Cadernos da Turma em PDF unificado pronto para impressão"
            >
              {exportingBatchPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Printer className="w-4 h-4 text-emerald-400" />
              )}
              Lote Turma ({currentExam?.studentBooklets?.length || 0} Cadernos)
            </button>

            <button
              onClick={handleGenerateExam}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar Simulado / Prova
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveMainTab("builder")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "builder"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Configuração & Gerador ({questionCount} Questões)
          </button>

          <button
            onClick={() => setActiveMainTab("booklets")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "booklets"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            2. Cadernos Individuais dos Alunos ({currentExam?.studentBooklets?.length || 0})
          </button>

          <button
            onClick={() => setActiveMainTab("variants")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "variants"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            3. Variantes A/B/C/D & Gabarito Mestre
          </button>

          <button
            onClick={() => setActiveMainTab("simulator")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "simulator"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400" />
            4. Simulado Online Interativo
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BUILDER & CONFIGURATION STUDIO */}
      {/* ========================================================================= */}
      {activeMainTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Exam Parameters */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Parâmetros da Avaliação / Simulado
                </span>
                <span className="text-[10px] font-mono text-slate-500">Módulo Paramétrico SENAI</span>
              </div>

              {/* Title, Subject and Duration */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Título da Prova / Simulado</label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Curso / Programa</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Unidade Curricular / Disciplina</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                    />
                  </div>
                </div>

                {/* Question Count Selection (Presets + Custom Slider) */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-400" />
                      Quantidade de Questões Solicitadas:
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold text-sm">
                        {questionCount} Questões
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">4 Alternativas (A, B, C, D) por questão</span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[5, 10, 15, 20, 25, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                          questionCount === num
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {num} Questões
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500">1</span>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      step={1}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-slate-500">40</span>
                  </div>
                </div>

                {/* Multi-Language Selection Badges */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      Linguagens de Programação no Conteúdo:
                      <span className="text-xs text-slate-500">({selectedLanguages.length} selecionadas)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedLanguages(PROGRAMMING_LANGUAGES.map(l => l.id))}
                        className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                      >
                        Todas
                      </button>
                      <span className="text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedLanguages(["python", "javascript", "typescript", "java", "sql"])}
                        className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                      >
                        Padrão SENAI
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PROGRAMMING_LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguages.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id)}
                          className={`p-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? `${lang.color} shadow-sm`
                              : "bg-slate-900/60 text-slate-500 border-slate-800/80 hover:text-slate-300"
                          }`}
                        >
                          <span>{lang.name}</span>
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 block rounded-full border border-slate-700" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Duração Oficial</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Cadernos Anti-Cola</label>
                    <select
                      value={variantCount}
                      onChange={(e) => setVariantCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    >
                      <option value={2}>2 Variantes (A, B)</option>
                      <option value={3}>3 Variantes (A, B, C)</option>
                      <option value={4}>4 Variantes (A, B, C, D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Formato</label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    >
                      <option value="multiple_choice">Múltipla Escolha (4 Opções)</option>
                      <option value="mixed">Híbrido (Teórica + Prática)</option>
                      <option value="practical_code">Desafios de Código</option>
                    </select>
                  </div>
                </div>

                {/* Context / Prompt */}
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Diretrizes & Conteúdo Programático</label>
                  <textarea
                    rows={3}
                    value={basePrompt}
                    onChange={(e) => setBasePrompt(e.target.value)}
                    placeholder="Instruções para o gerador de questões..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs resize-none"
                  />
                </div>
              </div>

              {/* Generate Button in Card */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateExam}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Gerar {questionCount} Questões & Montar Cadernos para Alunos
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: Class Selection & Student Selector for Booklets */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Class & Student Selection Card */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Alunos Cadastrados na Turma
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedStudentIds.size} de {classStudents.length} selecionados
                </span>
              </div>

              {/* Class Selector Dropdown */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 text-xs">Selecionar Turma do Sistema</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <option key={cls.id || cls.name} value={cls.id || cls.name}>
                        {cls.name || cls.id} {cls.code ? `• Código: ${cls.code}` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="turma-geral">Turma Geral de Desenvolvimento de Sistemas (SENAI)</option>
                  )}
                </select>
              </div>

              {/* Student Search & Quick Select All / None */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="relative flex-1 mr-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou matrícula..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllStudents}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                    >
                      Nenhum
                    </button>
                  </div>
                </div>

                {/* Students Checklist */}
                <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {isLoadingStudents ? (
                    <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Carregando alunos da turma...
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((s, idx) => {
                      const isSelected = selectedStudentIds.has(s.id || s._id);
                      return (
                        <div
                          key={s.id || idx}
                          onClick={() => toggleStudentSelection(s.id || s._id)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-emerald-950/20 border-emerald-500/40 text-slate-200"
                              : "bg-slate-950/40 border-slate-800/60 text-slate-500 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold leading-none">{s.name}</p>
                              <p className="text-[10px] font-mono text-slate-500">{s.enrollment_code || `ID: ${s.id}`}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-slate-400">
                            Posto #{idx + 1}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      Nenhum aluno encontrado para os termos da busca.
                    </div>
                  )}
                </div>
              </div>

              {/* Publish to Class Button */}
              <div className="pt-2">
                <button
                  onClick={handlePublishToClass}
                  disabled={isPublishing || !currentExam}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isPublishing ? "Publicando Cadernos..." : "Atribuir Cadernos aos Alunos Selecionados"}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
                <Shuffle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>O sistema aloca automaticamente os alunos em padrão xadrez (Variantes A-B-C-D), garantindo que estudantes contíguos na sala recebam cadernos e gabaritos distintos.</p>
              </div>

            </div>

            {/* Quick Summary of Current Generation */}
            {currentExam && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Resumo do Simulado Ativo
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Questões Geradas</span>
                    <span className="text-indigo-400 font-bold text-sm">{currentExam.questionCount} Questões</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Cadernos por Aluno</span>
                    <span className="text-emerald-400 font-bold text-sm">{currentExam.studentBooklets?.length || 0} Cadernos</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INDIVIDUAL STUDENT BOOKLETS */}
      {/* ========================================================================= */}
      {activeMainTab === "booklets" && currentExam && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Student Booklets List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Cadernos dos Alunos
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">
                  {currentExam.studentBooklets.length} Gerados
                </span>
              </div>

              {/* Student Buttons */}
              <div className="max-h-[500px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                {currentExam.studentBooklets.map((b) => {
                  const isSelected = b.studentId === (currentSelectedBooklet?.studentId || selectedBookletStudentId);
                  const style = variantBadgeColors[b.assignedVariant] || variantBadgeColors.A;
                  return (
                    <button
                      key={b.studentId}
                      onClick={() => setSelectedBookletStudentId(b.studentId)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 border-indigo-500 shadow-md"
                          : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-300"
                      }`}
                    >
                      <div className="space-y-1 truncate pr-2">
                        <p className="text-xs font-bold text-white truncate">{b.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-500">
                          Matrícula: {b.enrollmentCode || b.studentId} • Posto #{b.seatNumber || 1}
                        </p>
                      </div>

                      <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold shrink-0 ${style.bg} ${style.text} border ${style.border}`}>
                        Variante {b.assignedVariant}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Batch Export Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleExportAllClassBooklets}
                  disabled={exportingBatchPdf}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {exportingBatchPdf ? "Gerando Lote PDF..." : "Exportar Todos os Cadernos (PDF Unificado)"}
                </button>
              </div>

            </div>
          </div>

          {/* Right: Individual Booklet Paper Preview */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {currentSelectedBooklet ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
                
                {/* Booklet Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${variantBadgeColors[currentSelectedBooklet.assignedVariant].bg} ${variantBadgeColors[currentSelectedBooklet.assignedVariant].text} border ${variantBadgeColors[currentSelectedBooklet.assignedVariant].border}`}>
                        VARIANTE {currentSelectedBooklet.assignedVariant}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Token: {currentSelectedBooklet.uniqueExamToken}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      Caderno Oficial de {currentSelectedBooklet.studentName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBookletAnswers(!showBookletAnswers)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      {showBookletAnswers ? "Ocultar Gabarito" : "Gabarito Professor"}
                    </button>

                    <button
                      onClick={() => handleExportSingleStudentBooklet(currentSelectedBooklet)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Caderno PDF deste Aluno
                    </button>
                  </div>
                </div>

                {/* Printable Exam Paper Header Simulation */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <p className="font-mono text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
                        SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SENAI
                      </p>
                      <h3 className="text-base font-bold text-white">{currentSelectedBooklet.courseName}</h3>
                      <p className="text-slate-400 text-xs">{currentSelectedBooklet.subject} • Duração: {currentSelectedBooklet.durationMinutes} min</p>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold block">
                        CADERNO [VARIANTE {currentSelectedBooklet.assignedVariant}]
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Posto #{currentSelectedBooklet.seatNumber || 1}</span>
                    </div>
                  </div>

                  {/* Student Identification Meta Box */}
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-mono">Nome do Estudante:</span>
                      <p className="text-white font-bold">{currentSelectedBooklet.studentName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono">Matrícula / ID:</span>
                      <p className="text-slate-300 font-mono">{currentSelectedBooklet.enrollmentCode || currentSelectedBooklet.studentId}</p>
                    </div>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4 text-indigo-400" /> Questões do Caderno ({currentSelectedBooklet.questions.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">4 Alternativas (A, B, C, D)</span>
                  </div>

                  {currentSelectedBooklet.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Questão {q.questionNumber || idx + 1} • [{q.language.toUpperCase()}] {q.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                            {q.difficulty.toUpperCase()}
                          </span>
                          {showBookletAnswers && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Gabarito: {q.correctOption}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">{q.enunciado}</p>

                      {q.codeSnippet && (
                        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                          {q.codeSnippet}
                        </pre>
                      )}

                      {/* 4 Options */}
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.isCorrect;
                          return (
                            <div
                              key={opt.letter}
                              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                                showBookletAnswers && isCorrect
                                  ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
                                  : "bg-slate-900/40 border-slate-800/60 text-slate-300"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                                showBookletAnswers && isCorrect
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}>
                                {opt.letter}
                              </span>
                              <div className="space-y-0.5">
                                <p className="leading-snug">{opt.text}</p>
                                {showBookletAnswers && (
                                  <p className="text-[10px] text-slate-500 italic leading-snug">{opt.explanation}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optical Answer Sheet Preview (Gabarito de Bolhas) */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Cartão de Respostas Óptico (Folha de Bolhas)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Padrão SENAI</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                    {currentSelectedBooklet.questions.map((q) => (
                      <div key={q.questionNumber} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 block font-bold">Q.{q.questionNumber}</span>
                        <div className="flex items-center justify-center gap-1.5">
                          {["A", "B", "C", "D"].map((letter) => (
                            <span
                              key={letter}
                              className={`w-5 h-5 rounded-full border text-[9px] font-mono font-bold flex items-center justify-center ${
                                showBookletAnswers && q.correctOption === letter
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950"
                                  : "bg-slate-950 border-slate-700 text-slate-400"
                              }`}
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/50 text-center text-slate-500">
                Selecione um aluno para inspecionar o caderno individual.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VARIANTS A/B/C/D & MASTER KEY */}
      {/* ========================================================================= */}
      {activeMainTab === "variants" && currentExam && (
        <div className="space-y-6">
          
          {/* Variant Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 gap-2">
            <div className="flex items-center gap-2 overflow-x-auto">
              {currentExam.variants.map((v) => {
                const isSelected = v.variantId === activeVariantTab;
                const style = variantBadgeColors[v.variantId];
                return (
                  <button
                    key={v.variantId}
                    onClick={() => setActiveVariantTab(v.variantId)}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? `${style.bg} ${style.text} border ${style.border} shadow-lg` 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    }`}
                  >
                    <span>Variante {v.variantId}</span>
                    <span className="text-[10px] opacity-75 font-sans font-normal truncate max-w-[120px] hidden md:inline">
                      ({v.domainScenario.split(" ")[0]})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {currentVariant && (
                <>
                  <button
                    onClick={() => handleExportSingleVariantPdf(currentVariant)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Caderno da Variante
                  </button>

                  <button
                    onClick={() => handleExportAnswerSheetPdf(currentVariant.variantId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                    Folha de Respostas
                  </button>

                  <button
                    onClick={() => handleExportMoodleXml(currentVariant)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Moodle XML
                  </button>
                </>
              )}

              <button
                onClick={() => setShowSolutionCode(!showSolutionCode)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                {showSolutionCode ? "Ocultar Gabarito" : "Ver Gabarito"}
              </button>
            </div>
          </div>

          {/* Active Variant Details */}
          {currentVariant && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${variantBadgeColors[currentVariant.variantId].bg} ${variantBadgeColors[currentVariant.variantId].text} border ${variantBadgeColors[currentVariant.variantId].border}`}>
                      VARIANTE {currentVariant.variantId}
                    </span>
                    <span className="text-xs font-mono text-slate-400">• Cenário: {currentVariant.domainScenario}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{currentVariant.title}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Checksum: {currentVariant.antiPlagiarismChecksum.substring(0, 10)}...
                  </span>
                </div>
              </div>

              {/* Questions Grid with 4 Options */}
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Questões de Múltipla Escolha ({currentVariant.questions.length})
                </span>

                <div className="grid grid-cols-1 gap-4">
                  {currentVariant.questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          Questão {q.questionNumber || qIdx + 1} • [{q.language.toUpperCase()}] {q.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                            {q.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Gabarito: {q.correctOption}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200">{q.enunciado}</p>

                      {q.codeSnippet && (
                        <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                          {q.codeSnippet}
                        </pre>
                      )}

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = opt.isCorrect;
                          return (
                            <div
                              key={opt.letter}
                              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                                isCorrect
                                  ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200 font-medium"
                                  : "bg-slate-900/40 border-slate-800/60 text-slate-400"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                                isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                              }`}>
                                {opt.letter}
                              </span>
                              <div className="space-y-0.5">
                                <p className="leading-snug">{opt.text}</p>
                                <p className="text-[10px] text-slate-500 italic leading-snug">{opt.explanation}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rubric Criteria */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Rubrica Analítica de Correção (Pesos)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentVariant.rubric.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-200">{r.criterion}</span>
                        <p className="text-[10px] text-slate-400 leading-snug">{r.description}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold shrink-0">
                        {r.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INTERACTIVE ONLINE SIMULATOR */}
      {/* ========================================================================= */}
      {activeMainTab === "simulator" && currentExam && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5 mb-1">
                <Play className="w-3.5 h-3.5" /> Ambiente de Simulado Online do Estudante
              </span>
              <h2 className="text-lg font-bold text-white">{currentExam.examTitle}</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Duração: {currentExam.durationMinutes} min
              </span>

              {simulatorSubmitted && (
                <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
                  simulatorScore >= 60 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                }`}>
                  Nota Final: {simulatorScore}/100 pts
                </span>
              )}
            </div>
          </div>

          {/* Question Navigation Bubbles */}
          <div className="flex flex-wrap items-center gap-2">
            {simulatorQuestions.map((q) => {
              const isAnswered = Boolean(simulatorStudentAnswers[q.questionNumber]);
              const isCurrent = simulatorCurrentQuestion === q.questionNumber;
              return (
                <button
                  key={q.questionNumber}
                  onClick={() => setSimulatorCurrentQuestion(q.questionNumber)}
                  className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : isAnswered
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {q.questionNumber}
                </button>
              );
            })}
          </div>

          {/* Current Question Body */}
          {simulatorQuestions.length > 0 && (() => {
            const currentQ = simulatorQuestions.find(q => q.questionNumber === simulatorCurrentQuestion) || simulatorQuestions[0];
            const currentSelected = simulatorStudentAnswers[currentQ.questionNumber];

            return (
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm font-bold text-white">
                    Questão {currentQ.questionNumber} de {simulatorQuestions.length} • [{currentQ.language.toUpperCase()}] {currentQ.topic}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Dificuldade: {currentQ.difficulty.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-sans">{currentQ.enunciado}</p>

                {currentQ.codeSnippet && (
                  <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                    {currentQ.codeSnippet}
                  </pre>
                )}

                {/* 4 Options Selection */}
                <div className="space-y-2 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = currentSelected === opt.letter;
                    const isCorrect = opt.isCorrect;
                    
                    let cardStyle = "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-indigo-500/50";
                    if (isSelected) {
                      cardStyle = "bg-indigo-950/40 border-indigo-500 text-white shadow-md";
                    }
                    if (simulatorSubmitted) {
                      if (isCorrect) {
                        cardStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-200";
                      } else if (isSelected && !isCorrect) {
                        cardStyle = "bg-rose-950/40 border-rose-500 text-rose-200";
                      }
                    }

                    return (
                      <button
                        key={opt.letter}
                        disabled={simulatorSubmitted}
                        onClick={() => {
                          setSimulatorStudentAnswers({
                            ...simulatorStudentAnswers,
                            [currentQ.questionNumber]: opt.letter
                          });
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${cardStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                        }`}>
                          {opt.letter}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-xs leading-relaxed">{opt.text}</p>
                          {simulatorSubmitted && (
                            <p className="text-[11px] text-slate-500 italic mt-1">{opt.explanation}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Question Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    disabled={simulatorCurrentQuestion <= 1}
                    onClick={() => setSimulatorCurrentQuestion(prev => Math.max(prev - 1, 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold disabled:opacity-40 cursor-pointer"
                  >
                    &larr; Questão Anterior
                  </button>

                  <div className="flex items-center gap-2">
                    {!simulatorSubmitted ? (
                      <button
                        onClick={() => {
                          setSimulatorSubmitted(true);
                          toast.success("Simulado finalizado! Confira seu desempenho.");
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        Finalizar Simulado & Calcular Nota
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSimulatorSubmitted(false);
                          setSimulatorStudentAnswers({});
                          setSimulatorCurrentQuestion(1);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer"
                      >
                        Reiniciar Simulado
                      </button>
                    )}

                    <button
                      disabled={simulatorCurrentQuestion >= simulatorQuestions.length}
                      onClick={() => setSimulatorCurrentQuestion(prev => Math.min(prev + 1, simulatorQuestions.length))}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Próxima Questão &rarr;
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
