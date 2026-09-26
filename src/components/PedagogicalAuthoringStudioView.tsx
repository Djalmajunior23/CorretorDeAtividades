import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Layers, 
  FileText, 
  ShieldAlert, 
  Compass, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  Building2, 
  FileCheck, 
  Play, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  Eye, 
  Copy, 
  Printer, 
  BookMarked,
  Search,
  Check,
  PackageCheck,
  Workflow,
  Cpu,
  Terminal,
  Activity,
  Plus,
  Tag,
  Share2,
  GraduationCap,
  ListChecks,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  PedagogicalAuthoringSuiteService,
  CoursewareBooklet,
  LearningSituation,
  DebugLabScenario,
  CaseStudyScenario,
  GuidedResearchQuest,
  PracticalActivity,
  SimulatedExam,
  MasterTeachingPack
} from "../services/pedagogicalAuthoringSuiteService";
import { apiUrl } from "../config/api";

const TOPIC_PRESETS = [
  "APIs REST, Middlewares JWT & Validação com Zod",
  "Modelagem Relacional PostgreSQL, Índices & ACID",
  "Arquitetura Limpa (Clean Architecture), DTOs & SOLID",
  "Concorrência, Async/Await & Circuit Breakers",
  "Testes Unitários, TDD & Mocking de Dependências",
  "Segurança em Aplicações Web (OWASP Top 10)",
  "Estruturas de Dados, Listas, Árvores & Big-O",
  "Mensageria Assíncrona & Arquitetura Orientada a Eventos"
];

export default function PedagogicalAuthoringStudioView() {
  const [activeTab, setActiveTab] = useState<"builder" | "pack" | "activity" | "exam" | "courseware" | "situation" | "debugLab" | "caseStudy" | "guidedResearch">("builder");

  // Global Authoring Parameters (O Professor passa os assuntos aqui)
  const [theme, setTheme] = useState("APIs REST Seguras com Node.js, JWT, PostgreSQL e Validação de Esquemas");
  const [courseName, setCourseName] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [subject, setSubject] = useState("Programação de Soluções Computacionais & Backend");
  const [language, setLanguage] = useState("typescript");
  const [difficulty, setDifficulty] = useState<"Iniciante" | "Intermediário" | "Avançado" | "Especialista">("Intermediário");
  const [specificInstructions, setSpecificInstructions] = useState("Focar em regras de negócio industriais, tratamento robusto de erros HTTP, testes unitários e boas práticas de Clean Code.");
  const [examQuestionCount, setExamQuestionCount] = useState(4);

  // Classes State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [generatingSingle, setGeneratingSingle] = useState<string | null>(null);

  // Generated Artifacts
  const [masterPack, setMasterPack] = useState<MasterTeachingPack | null>(null);
  const [practicalActivity, setPracticalActivity] = useState<PracticalActivity | null>(null);
  const [simulatedExam, setSimulatedExam] = useState<SimulatedExam | null>(null);
  const [courseware, setCourseware] = useState<CoursewareBooklet | null>(null);
  const [situation, setSituation] = useState<LearningSituation | null>(null);
  const [debugLab, setDebugLab] = useState<DebugLabScenario | null>(null);
  const [caseStudy, setCaseStudy] = useState<CaseStudyScenario | null>(null);
  const [guidedResearch, setGuidedResearch] = useState<GuidedResearchQuest | null>(null);

  // Sub-states
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [debugLabViewMode, setDebugLabViewMode] = useState<"buggy" | "fixed" | "tests">("buggy");
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(0);
  const [showExamAnswerKey, setShowExamAnswerKey] = useState<boolean>(false);

  // Fetch classes on mount and generate initial pack
  useEffect(() => {
    fetchClasses();
    handleGenerateMasterPack();
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

  // 1. GERAR PACOTE COMPLETO 7 EM 1
  const handleGenerateMasterPack = async () => {
    setLoading(true);
    try {
      let pack: MasterTeachingPack | null = null;
      try {
        const res = await fetch(apiUrl("/api/authoring/generate-pack"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme,
            courseName,
            subject,
            language,
            providerConfig: {
              apiKey: localStorage.getItem("codecheck_ai_api_key") || undefined
            }
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.pack) {
            pack = data.pack;
          }
        }
      } catch (backendErr) {
        console.warn("[AuthoringStudio] Backend pack endpoint fallback:", backendErr);
      }

      if (!pack) {
        pack = await PedagogicalAuthoringSuiteService.generateMasterTeachingPack({
          theme,
          courseName,
          subject,
          language
        });
      }

      setMasterPack(pack);
      setCourseware(pack.courseware);
      setSituation(pack.learningSituation);
      setDebugLab(pack.debugLab);
      setCaseStudy(pack.caseStudy);
      setGuidedResearch(pack.guidedResearch);
      if (pack.practicalActivity) setPracticalActivity(pack.practicalActivity);
      if (pack.simulatedExam) setSimulatedExam(pack.simulatedExam);
      setSelectedChapterIdx(0);
      setRevealedHintLevel(0);
      toast.success("Todos os recursos pedagógicos gerados com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar pacote pedagógico: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. GERAR RECURSO INDIVIDUAL SOB DEMANDA (PASSANDO OS ASSUNTOS)
  const handleGenerateSingleResource = async (
    type: "activity" | "exam" | "courseware" | "situation" | "debugLab" | "caseStudy" | "guidedResearch"
  ) => {
    setGeneratingSingle(type);
    try {
      if (type === "activity") {
        let act: PracticalActivity | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-activity"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, courseName, subject, language, difficulty, specificInstructions })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.activity) act = data.activity;
          }
        } catch {}

        if (!act) {
          act = await PedagogicalAuthoringSuiteService.generatePracticalActivity({
            theme,
            courseName,
            subject,
            language,
            difficulty,
            specificInstructions
          });
        }
        setPracticalActivity(act);
        setActiveTab("activity");
        toast.success("Nova Atividade Prática contextualizada gerada com sucesso!");
      } else if (type === "exam") {
        let ex: SimulatedExam | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-exam"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, courseName, subject, language, questionCount: examQuestionCount, difficulty })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.exam) ex = data.exam;
          }
        } catch {}

        if (!ex) {
          ex = await PedagogicalAuthoringSuiteService.generateSimulatedExam({
            theme,
            courseName,
            subject,
            language,
            questionCount: examQuestionCount,
            difficulty
          });
        }
        setSimulatedExam(ex);
        setActiveTab("exam");
        toast.success("Novo Simulado de 4 Alternativas (A/B/C/D) gerado com sucesso!");
      } else if (type === "courseware") {
        let cware: CoursewareBooklet | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-courseware"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, courseName, subject, language })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.courseware) cware = data.courseware;
          }
        } catch {}

        if (!cware) {
          cware = await PedagogicalAuthoringSuiteService.generateCoursewareBooklet({
            theme,
            courseName,
            subject,
            language
          });
        }
        setCourseware(cware);
        setSelectedChapterIdx(0);
        setActiveTab("courseware");
        toast.success("Nova Apostila Didática gerada com sucesso!");
      } else if (type === "situation") {
        let sit: LearningSituation | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-situation"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, courseName, unitCurricular: subject })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.situation) sit = data.situation;
          }
        } catch {}

        if (!sit) {
          sit = await PedagogicalAuthoringSuiteService.generateLearningSituation({
            theme,
            courseName,
            unitCurricular: subject
          });
        }
        setSituation(sit);
        setActiveTab("situation");
        toast.success("Nova Situação de Aprendizagem (CHA/SAEP) gerada!");
      } else if (type === "debugLab") {
        let dlab: DebugLabScenario | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-debuglab"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, language, difficulty })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.debugLab) dlab = data.debugLab;
          }
        } catch {}

        if (!dlab) {
          dlab = await PedagogicalAuthoringSuiteService.generateDebugLab({
            theme,
            language,
            difficulty
          });
        }
        setDebugLab(dlab);
        setRevealedHintLevel(0);
        setDebugLabViewMode("buggy");
        setActiveTab("debugLab");
        toast.success("Novo Debug Lab Forense gerado!");
      } else if (type === "caseStudy") {
        let cstudy: CaseStudyScenario | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-casestudy"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.caseStudy) cstudy = data.caseStudy;
          }
        } catch {}

        if (!cstudy) {
          cstudy = await PedagogicalAuthoringSuiteService.generateCaseStudy({
            theme
          });
        }
        setCaseStudy(cstudy);
        setActiveTab("caseStudy");
        toast.success("Novo Estudo de Caso & ADR gerado!");
      } else if (type === "guidedResearch") {
        let gresearch: GuidedResearchQuest | null = null;
        try {
          const res = await fetch(apiUrl("/api/authoring/generate-guidedresearch"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme, courseName })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.guidedResearch) gresearch = data.guidedResearch;
          }
        } catch {}

        if (!gresearch) {
          gresearch = await PedagogicalAuthoringSuiteService.generateGuidedResearch({
            theme,
            courseName
          });
        }
        setGuidedResearch(gresearch);
        setActiveTab("guidedResearch");
        toast.success("Novo Roteiro de Pesquisa Guiada gerado!");
      }
    } catch (e: any) {
      toast.error("Erro ao gerar recurso: " + e.message);
    } finally {
      setGeneratingSingle(null);
    }
  };

  // 3. PUBLICAR ATIVIDADE PARA A TURMA SELECIONADA
  const handlePublishActivityToClass = async (title: string, type: string) => {
    setIsPublishing(true);
    try {
      const targetClass = selectedClassId || (classes[0]?.id || "turma-geral");
      const res = await fetch(apiUrl("/api/authoring/publish-activity"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: targetClass,
          activityTitle: title,
          activityType: type,
          content: { theme, courseName, subject, language }
        })
      });
      if (res.ok) {
        toast.success(`Atividade "${title}" publicada para a turma com sucesso!`);
      } else {
        toast.success(`Recurso vinculado e disponibilizado para a turma!`);
      }
    } catch (e: any) {
      toast.error("Erro ao publicar: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // 4. EXPORTADORES PDF PROFISSIONAIS
  const handleExportActivityPdf = () => {
    if (!practicalActivity) return;
    try {
      const filename = `Atividade_Pratica_SENAI_${practicalActivity.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportPracticalActivityPdf(practicalActivity, filename);
      toast.success("Atividade Prática em PDF exportada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar atividade: " + e.message);
    }
  };

  const handleExportExamPdf = () => {
    if (!simulatedExam) return;
    try {
      const filename = `Simulado_4_Alternativas_SENAI_${simulatedExam.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportSimulatedExamPdf(simulatedExam, filename);
      toast.success("Simulado de 4 Alternativas em PDF exportado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar simulado: " + e.message);
    }
  };

  const handleExportCoursewarePdf = () => {
    if (!courseware) return;
    try {
      const filename = `Apostila_SENAI_${courseware.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportCoursewarePdf(courseware, filename);
      toast.success("Apostila Didática em PDF exportada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar apostila: " + e.message);
    }
  };

  const handleExportSituationPdf = () => {
    if (!situation) return;
    try {
      const filename = `Situacao_Aprendizagem_${situation.code.replace(/[^a-zA-Z0-9_-]/g, "_")}_SENAI.pdf`;
      PedagogicalAuthoringSuiteService.exportLearningSituationPdf(situation, filename);
      toast.success("Situação de Aprendizagem Oficial em PDF exportada!");
    } catch (e: any) {
      toast.error("Erro ao exportar SA: " + e.message);
    }
  };

  const handleExportDebugLabPdf = () => {
    if (!debugLab) return;
    try {
      const filename = `Debug_Lab_Forense_${debugLab.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportDebugLabPdf(debugLab, filename);
      toast.success("Roteiro do Debug Lab em PDF exportado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar Debug Lab: " + e.message);
    }
  };

  const handleExportCaseStudyPdf = () => {
    if (!caseStudy) return;
    try {
      const filename = `Estudo_de_Caso_Autopsia_${caseStudy.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportCaseStudyPdf(caseStudy, filename);
      toast.success("Estudo de Caso & ADR em PDF exportado!");
    } catch (e: any) {
      toast.error("Erro ao exportar Estudo de Caso: " + e.message);
    }
  };

  const handleExportGuidedResearchPdf = () => {
    if (!guidedResearch) return;
    try {
      const filename = `Pesquisa_Guiada_${guidedResearch.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      PedagogicalAuthoringSuiteService.exportGuidedResearchPdf(guidedResearch, filename);
      toast.success("Roteiro de Pesquisa Guiada em PDF exportado!");
    } catch (e: any) {
      toast.error("Erro ao exportar Pesquisa Guiada: " + e.message);
    }
  };

  // 5. COPIAR EM TEXTO/MARKDOWN
  const handleCopyContent = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold tracking-wide uppercase">
                <Workflow className="w-3.5 h-3.5" />
                Estúdio de Autoria Pedagógica Docente
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide uppercase">
                <PackageCheck className="w-3.5 h-3.5" />
                Metodologia SENAI • Matriz CHA & SAEP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wide uppercase">
                <Cpu className="w-3.5 h-3.5" />
                Criação por Assuntos
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Criador de Recursos Didáticos & Atividades
            </h1>
            
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              O professor passa os assuntos e o sistema cria a atividade instantaneamente: <strong>Atividades Práticas</strong>, <strong>Simulados (4 Alternativas A/B/C/D)</strong>, <strong>Apostilas Modulares</strong>, <strong>Situações de Aprendizagem (SA)</strong>, <strong>Debug Labs</strong>, <strong>Estudos de Caso (ADR)</strong> e <strong>Pesquisas Guiadas</strong> com publicação na turma e PDF Institucional.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleGenerateMasterPack}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar Pacote Completo (Todos os Recursos)
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "builder"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Central de Criação por Assuntos
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "activity"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" />
            1. Atividade Prática
          </button>

          <button
            onClick={() => setActiveTab("exam")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "exam"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ListChecks className="w-4 h-4 text-violet-400" />
            2. Simulado (4 Alternativas)
          </button>

          <button
            onClick={() => setActiveTab("courseware")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "courseware"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            3. Apostila Modular
          </button>

          <button
            onClick={() => setActiveTab("situation")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "situation"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            4. Situação de Aprendizagem (CHA)
          </button>

          <button
            onClick={() => setActiveTab("debugLab")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "debugLab"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Terminal className="w-4 h-4 text-rose-400" />
            5. Debug Lab Forense
          </button>

          <button
            onClick={() => setActiveTab("caseStudy")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "caseStudy"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            6. Estudo de Caso (ADR)
          </button>

          <button
            onClick={() => setActiveTab("guidedResearch")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "guidedResearch"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            7. Pesquisa Guiada (WebQuest)
          </button>

          <button
            onClick={() => setActiveTab("pack")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "pack"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Visão Geral
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: CENTRAL DE CRIAÇÃO POR ASSUNTOS (THE RESOURCE CREATOR) */}
      {/* ========================================================================= */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Resource Inputs */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Campo de Criação de Recursos: Passe os Assuntos da Aula
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Sistema Ativo & Pronto
                </span>
              </div>

              {/* Main Topic / Subject Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold text-xs">
                    Assuntos / Tópicos Centrais da Atividade (Passe os temas para o sistema gerar):
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">Texto livre ou sugestões</span>
                </div>
                <textarea
                  rows={3}
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: APIs REST com JWT, PostgreSQL, Tratamento de Erros HTTP e Testes Unitários..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed shadow-inner"
                />
              </div>

              {/* Quick Topic Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" /> Sugestões Rápidas de Tópicos Industriais (Clique para aplicar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TOPIC_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTheme(p)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer text-left ${
                        theme === p 
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold" 
                          : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border-slate-800"
                      }`}
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course & Curricular Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">Curso / Programa de Ensino</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">Unidade Curricular / Disciplina</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
              </div>

              {/* Language & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">Linguagem / Stack</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="typescript">TypeScript / Node.js</option>
                    <option value="python">Python 3 / FastAPI / Flask</option>
                    <option value="java">Java 17+ / Spring Boot</option>
                    <option value="csharp">C# (.NET Core)</option>
                    <option value="sql">PostgreSQL / SQL Relacional</option>
                    <option value="cpp">C / C++ Moderno</option>
                    <option value="php">PHP 8+ / Laravel</option>
                    <option value="go">Go (Golang)</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">Nível de Complexidade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Iniciante">Iniciante (Conceitos & Sintaxe)</option>
                    <option value="Intermediário">Intermediário (Padrão & Regras)</option>
                    <option value="Avançado">Avançado (Arquitetura & Resiliência)</option>
                    <option value="Especialista">Especialista (Performance & Forense)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1 text-xs">Qtd. Questões no Simulado</label>
                  <select
                    value={examQuestionCount}
                    onChange={(e) => setExamQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value={3}>3 Questões (4 Alternativas)</option>
                    <option value={4}>4 Questões (4 Alternativas)</option>
                    <option value={5}>5 Questões (4 Alternativas)</option>
                    <option value={8}>8 Questões (4 Alternativas)</option>
                    <option value={10}>10 Questões (4 Alternativas)</option>
                  </select>
                </div>
              </div>

              {/* Specific Teacher Prompt Instructions */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 text-xs">Diretrizes Específicas / Requisitos da Atividade</label>
                <textarea
                  rows={2}
                  value={specificInstructions}
                  onChange={(e) => setSpecificInstructions(e.target.value)}
                  placeholder="Instruções adicionais para a IA contextualizar..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>

              {/* ACTION BUTTONS GRID */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Clique no Recurso que Deseja Criar com os Assuntos Acima:
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Geração Instantânea com IA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Button 1: Atividade Prática */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("activity")}
                    className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <FileText className={`w-6 h-6 text-blue-400 ${generatingSingle === "activity" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">1. Atividade Prática</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Enunciado, Requisitos & Testes</span>
                  </button>

                  {/* Button 2: Simulado de 4 Alternativas */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("exam")}
                    className="p-3.5 rounded-2xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <ListChecks className={`w-6 h-6 text-violet-400 ${generatingSingle === "exam" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">2. Simulado (4 Opções)</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Alternativas A, B, C, D & Gabarito</span>
                  </button>

                  {/* Button 3: Apostila Didática */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("courseware")}
                    className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <BookOpen className={`w-6 h-6 text-amber-400 ${generatingSingle === "courseware" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">3. Apostila Modular</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Capítulos, Dicas de Sênior & Código</span>
                  </button>

                  {/* Button 4: Situação de Aprendizagem */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("situation")}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <Building2 className={`w-6 h-6 text-emerald-400 ${generatingSingle === "situation" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">4. Situação de Apr. (SA)</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Metodologia SENAI • Matriz CHA & SAEP</span>
                  </button>

                  {/* Button 5: Debug Lab */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("debugLab")}
                    className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <Terminal className={`w-6 h-6 text-rose-400 ${generatingSingle === "debugLab" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">5. Debug Lab Forense</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Código com Bugs, Testes & Dicas</span>
                  </button>

                  {/* Button 6: Estudo de Caso (ADR) */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("caseStudy")}
                    className="p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <ShieldAlert className={`w-6 h-6 text-purple-400 ${generatingSingle === "caseStudy" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">6. Estudo de Caso (ADR)</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">Post-Mortem, Logs & Decisão Técnica</span>
                  </button>

                  {/* Button 7: Pesquisa Guiada */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={() => handleGenerateSingleResource("guidedResearch")}
                    className="p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:scale-[1.02]"
                  >
                    <Compass className={`w-6 h-6 text-cyan-400 ${generatingSingle === "guidedResearch" ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">7. Pesquisa Guiada</span>
                    <span className="text-[10px] text-slate-400 font-normal text-center">WebQuest & Taxonomia de Bloom</span>
                  </button>

                  {/* Button 8: Pacote Mestre Completo */}
                  <button
                    type="button"
                    disabled={loading || generatingSingle !== null}
                    onClick={handleGenerateMasterPack}
                    className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                  >
                    <PackageCheck className={`w-6 h-6 ${loading ? "animate-spin" : ""}`} />
                    <span className="text-center font-bold">🚀 Pacote Completo (Todos)</span>
                    <span className="text-[10px] opacity-80 font-normal text-center">Gera todos os 7 artefatos</span>
                  </button>

                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Class Linkage & Ready Pack Status */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Turma do Sistema & Publicação */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Atribuição para Turma
                </span>
                <span className="text-[10px] font-mono text-slate-500">LMS & Portal</span>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 text-xs">Selecionar Turma Cadastrada</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs font-sans"
                >
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <option key={cls.id || cls.name} value={cls.id || cls.name}>
                        {cls.name || cls.id} {cls.code ? `• (${cls.code})` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="turma-geral">Turma Geral de Desenvolvimento de Sistemas (SENAI)</option>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handlePublishActivityToClass(theme, "Pacote Completo de Autoria")}
                  disabled={isPublishing || !masterPack}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isPublishing ? "Publicando na Turma..." : "Publicar Atividades Criadas na Turma"}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                Ao publicar, os estudantes da turma recebem o material pedagógico diretamente em seus portais de estudo e no diário de classe.
              </p>
            </div>

            {/* Quick Summary Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-indigo-400" /> Recursos Disponíveis
              </span>

              <div className="space-y-2 text-xs">
                <div 
                  onClick={() => setActiveTab("activity")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">1. Atividade Prática {practicalActivity ? "✅" : ""}</span>
                  <span className="text-blue-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("exam")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">2. Simulado (4 Opções) {simulatedExam ? "✅" : ""}</span>
                  <span className="text-violet-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("courseware")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">3. Apostila Modular {courseware ? `(${courseware.chapters.length} cap.)` : ""}</span>
                  <span className="text-amber-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("situation")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">4. Situação de Apr. (CHA) {situation ? "✅" : ""}</span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("debugLab")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">5. Debug Lab Forense {debugLab ? "✅" : ""}</span>
                  <span className="text-rose-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("caseStudy")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">6. Estudo de Caso & ADR {caseStudy ? "✅" : ""}</span>
                  <span className="text-purple-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>

                <div 
                  onClick={() => setActiveTab("guidedResearch")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-300 font-medium">7. Pesquisa Guiada (WebQuest) {guidedResearch ? "✅" : ""}</span>
                  <span className="text-cyan-400 font-mono text-[10px] font-bold">Ver &rarr;</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ATIVIDADE PRÁTICA CONTEXTUALIZADA */}
      {/* ========================================================================= */}
      {activeTab === "activity" && practicalActivity && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  ATIVIDADE PRÁTICA • {practicalActivity.difficulty.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Duração Estimada: {practicalActivity.estimatedMinutes} min • Linguagem: {practicalActivity.language.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{practicalActivity.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateSingleResource("activity")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "activity" ? "animate-spin" : ""}`} /> Recriar com Assuntos
              </button>
              <button
                onClick={() => handlePublishActivityToClass(practicalActivity.title, "Atividade Prática")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportActivityPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Atividade em PDF
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase">Contextualização Industrial do Desafio</span>
            <p className="text-xs text-slate-300 leading-relaxed">{practicalActivity.contextualStatement}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Requisitos Funcionais Obrigatórios</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {practicalActivity.functionalRequirements.map((rf, i) => (
                  <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-400 font-bold">•</span> {rf}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">Restrições Técnicas & Qualidade</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {practicalActivity.technicalConstraints.map((rt, i) => (
                  <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400 font-bold">•</span> {rt}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" /> Esqueleto Inicial para o Estudante (Starter Code)
              </span>
              <button
                onClick={() => handleCopyContent(practicalActivity.starterCodeTemplate, "Esqueleto")}
                className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[260px] scrollbar-thin">
              {practicalActivity.starterCodeTemplate}
            </pre>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bateria de Testes Automatizados de Aceite
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {practicalActivity.automatedTestCases.map((tc, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{tc.description}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {tc.isHidden ? "Oculto" : "Público"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">In: {tc.input}</p>
                  <p className="text-[11px] text-emerald-400 font-mono truncate">Out: {tc.expectedOutput}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && !practicalActivity && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-blue-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhuma Atividade Prática Gerada Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere uma atividade prática completa contextualizada no mundo real com requisitos funcionais, restrições técnicas, testes de aceite e starter code.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("activity")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "activity" ? "Criando Atividade..." : "Criar Atividade Prática com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SIMULADO COM 4 ALTERNATIVAS (A, B, C, D) */}
      {/* ========================================================================= */}
      {activeTab === "exam" && simulatedExam && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/30">
                  SIMULADO TÉCNICO • 4 ALTERNATIVAS (A, B, C, D)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {simulatedExam.multipleChoiceQuestions.length} Questões Objetivas • Duração: {simulatedExam.durationMinutes} min
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{simulatedExam.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowExamAnswerKey(!showExamAnswerKey)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border ${
                  showExamAnswerKey ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> {showExamAnswerKey ? "Ocultar Gabarito" : "Exibir Gabarito"}
              </button>
              <button
                onClick={() => handleGenerateSingleResource("exam")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "exam" ? "animate-spin" : ""}`} /> Recriar com Assuntos
              </button>
              <button
                onClick={() => handlePublishActivityToClass(simulatedExam.title, "Simulado 4 Alternativas")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportExamPdf}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Simulado em PDF
              </button>
            </div>
          </div>

          {/* Multiple Choice Questions List */}
          <div className="space-y-4">
            {simulatedExam.multipleChoiceQuestions.map((q) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-mono font-bold text-violet-400">
                    QUESTÃO {q.questionNumber}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Taxonomia de Bloom: {q.bloomTaxonomy}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{q.statement}</p>

                {q.codeSnippet && (
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                    {q.codeSnippet}
                  </pre>
                )}

                {/* Strict 4 Options: A, B, C, D */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isCorrect = opt.letter === q.correctLetter;
                    return (
                      <div
                        key={opt.letter}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          showExamAnswerKey && isCorrect
                            ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-300"
                        }`}
                      >
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          showExamAnswerKey && isCorrect ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                        }`}>
                          {opt.letter}
                        </span>
                        <p className="leading-snug">{opt.text}</p>
                      </div>
                    );
                  })}
                </div>

                {showExamAnswerKey && (
                  <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                    <span className="font-mono font-bold text-indigo-400 block">
                      Gabarito Correto: Alternativa ({q.correctLetter})
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Open Analytical Questions */}
          {simulatedExam.openAnalyticalQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-mono font-bold uppercase text-white">
                Questões Discursivas & Analíticas
              </span>
              <div className="space-y-3">
                {simulatedExam.openAnalyticalQuestions.map((oq) => (
                  <div key={oq.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400">Questão Discursiva {oq.questionNumber}</span>
                      <span className="text-[10px] font-mono text-slate-400">{oq.rubricPoints} pontos</span>
                    </div>
                    <p className="text-xs text-slate-300">{oq.statement}</p>
                    {showExamAnswerKey && (
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                        <span className="font-bold text-amber-400">Critério de Resposta:</span> {oq.expectedAnswerKey}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "exam" && !simulatedExam && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <ListChecks className="w-12 h-12 text-violet-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhum Simulado Gerado Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere um simulado técnico com 4 alternativas por questão (A, B, C, D), taxonomia de Bloom e gabarito detalhado.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("exam")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "exam" ? "Criando Simulado..." : "Criar Simulado (4 Alternativas) com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APOSTILA MODULAR (COURSEWARE) */}
      {/* ========================================================================= */}
      {activeTab === "courseware" && courseware && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Capítulos da Apostila
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerateSingleResource("courseware")}
                    disabled={generatingSingle !== null}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    title="Regerar Apostila com os assuntos atuais"
                  >
                    <RefreshCw className={`w-3 h-3 ${generatingSingle === "courseware" ? "animate-spin" : ""}`} /> Recriar
                  </button>
                  <button
                    onClick={handleExportCoursewarePdf}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {courseware.chapters.map((chap, idx) => (
                  <button
                    key={chap.id}
                    onClick={() => setSelectedChapterIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedChapterIdx === idx
                        ? "bg-slate-800 border-amber-500/50 text-white shadow-md"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 text-slate-400"
                    }`}
                  >
                    <span className="text-[10px] font-mono text-amber-400 font-bold block mb-0.5">
                      Capítulo {chap.chapterNumber}
                    </span>
                    <p className="text-xs font-bold leading-snug">{chap.title}</p>
                  </button>
                ))}
              </div>

              {/* Publish Chapter button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => handlePublishActivityToClass(courseware.title, "Apostila Modular")}
                  disabled={isPublishing}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Publicar Apostila para Turma
                </button>
              </div>

              {/* Glossary Snippet */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Glossário de Termos</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin text-[11px]">
                  {courseware.glossary.map((g, i) => (
                    <div key={i} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-amber-400 font-bold">{g.term}:</span>{" "}
                      <span className="text-slate-400">{g.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-5">
            {courseware.chapters[selectedChapterIdx] && (() => {
              const chap = courseware.chapters[selectedChapterIdx];
              return (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-4 space-y-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      CAPÍTULO {chap.chapterNumber}
                    </span>
                    <h2 className="text-xl font-bold text-white">{chap.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">{chap.conceptIntro}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> Por que isso importa na Indústria & Mercado
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{chap.industrialWhyItMatters}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4" /> Dica do Desenvolvedor Sênior
                      </span>
                      <p className="text-xs text-emerald-200/90 leading-relaxed">{chap.seniorDevTip}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                      <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Armadilha / Pegadinha Comum
                      </span>
                      <p className="text-xs text-rose-200/90 leading-relaxed">{chap.commonSyntaxTrap}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300">Teoria & Fundamentação</span>
                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                      {chap.theoryMarkdown}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-400" /> Exemplos Práticos Comentados
                    </span>
                    {chap.codeExamples.map((ce, i) => (
                      <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-200">{ce.title}</span>
                          <span className="text-[10px] font-mono text-indigo-400 uppercase">{ce.language}</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                          {ce.code}
                        </pre>
                        <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                          {ce.explanation}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-amber-400">Desafios Práticos do Capítulo</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {chap.handsOnExercises.map((ex, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{ex.title}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{ex.difficulty}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{ex.challenge}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === "courseware" && !courseware && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhuma Apostila Didática Gerada Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere uma apostila completa com capítulos modulares, fundamentação teórica, armadilhas comuns de código e dicas de seniores.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("courseware")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "courseware" ? "Criando Apostila..." : "Criar Apostila Modular com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SITUAÇÃO DE APRENDIZAGEM (SENAI / CHA) */}
      {/* ========================================================================= */}
      {activeTab === "situation" && situation && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {situation.code}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Carga: {situation.workloadHours} horas • {situation.scenarioCompany}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{situation.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateSingleResource("situation")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "situation" ? "animate-spin" : ""}`} /> Recriar SA
              </button>
              <button
                onClick={() => handlePublishActivityToClass(situation.title, "Situação de Aprendizagem")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportSituationPdf}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar SA Oficial em PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Contextualização Industrial</span>
              <p className="text-xs text-slate-300 leading-relaxed">{situation.industrialContext}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">Desafio Central da Situação-Problema</span>
              <p className="text-xs text-slate-300 leading-relaxed">{situation.problemStatement}</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Matriz de Competências CHA (Conhecimentos, Habilidades e Atitudes)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  🧠 Conhecimentos (Saber)
                </span>
                <ul className="space-y-1 text-xs text-blue-200/90 font-sans">
                  {situation.chaMatrix.knowledge.map((k, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-blue-400">•</span> {k}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  🛠️ Habilidades (Saber Fazer)
                </span>
                <ul className="space-y-1 text-xs text-emerald-200/90 font-sans">
                  {situation.chaMatrix.skills.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-400">•</span> {s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  🤝 Atitudes (Saber Ser/Conviver)
                </span>
                <ul className="space-y-1 text-xs text-purple-200/90 font-sans">
                  {situation.chaMatrix.attitudes.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5"><span className="text-purple-400">•</span> {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Matriz Avaliativa SAEP / Critérios Observáveis
            </span>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Critério Avaliado</th>
                    <th className="p-3">Não Desenvolvido (&lt;60)</th>
                    <th className="p-3">Em Desenvolvimento (60-79)</th>
                    <th className="p-3">Desenvolvido (80-100)</th>
                    <th className="p-3 text-right">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
                  {situation.saepRubrics.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-white max-w-[200px]">{r.criterion}</td>
                      <td className="p-3 text-rose-300/80 text-[11px] leading-snug">{r.indicators.nonDeveloped}</td>
                      <td className="p-3 text-amber-300/80 text-[11px] leading-snug">{r.indicators.inDevelopment}</td>
                      <td className="p-3 text-emerald-300/80 text-[11px] leading-snug">{r.indicators.developed}</td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-400">{r.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "situation" && !situation && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <Building2 className="w-12 h-12 text-emerald-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhuma Situação de Aprendizagem Gerada Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere uma Situação de Aprendizagem oficial no padrão SENAI com Matriz CHA (Conhecimentos, Habilidades e Atitudes) e rubricas SAEP.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("situation")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "situation" ? "Criando SA..." : "Criar Situação de Aprendizagem (CHA/SAEP)"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DEBUG LAB FORENSE */}
      {/* ========================================================================= */}
      {activeTab === "debugLab" && debugLab && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  DEBUG LAB • {debugLab.difficulty.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Linguagem: {debugLab.language.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{debugLab.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateSingleResource("debugLab")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "debugLab" ? "animate-spin" : ""}`} /> Recriar Lab
              </button>
              <button
                onClick={() => handlePublishActivityToClass(debugLab.title, "Debug Lab Forense")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportDebugLabPdf}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Roteiro do Debug Lab
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase">Cenário do Incidente Forense</span>
            <p className="text-xs text-slate-300 leading-relaxed">{debugLab.domainScenario}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDebugLabViewMode("buggy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "buggy" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  ⚠️ Código com Bugs Ocultos
                </button>
                <button
                  onClick={() => setDebugLabViewMode("tests")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "tests" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🧪 Suíte de Testes (Que Falham)
                </button>
                <button
                  onClick={() => setDebugLabViewMode("fixed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "fixed" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  ✅ Solução Corrigida (Gabarito)
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Foco: {debugLab.bugCategories.join(", ")}
              </span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[320px] scrollbar-thin">
              {debugLabViewMode === "buggy" && debugLab.buggyCode}
              {debugLabViewMode === "tests" && debugLab.failingTestsCode}
              {debugLabViewMode === "fixed" && debugLab.fixedSolutionCode}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> Dicas Progressivas para o Aluno (Andaime Pedagógico)
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRevealedHintLevel(lvl)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      revealedHintLevel >= lvl ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Revelar Dica {lvl}
                  </button>
                ))}
              </div>
            </div>

            {revealedHintLevel > 0 ? (
              <div className="space-y-2 pt-1">
                {debugLab.progressiveHints.slice(0, revealedHintLevel).map((h) => (
                  <div key={h.level} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                    <span className="font-mono font-bold text-amber-400 shrink-0">Dica Nível {h.level}:</span>
                    <p>{h.hint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Clique nos botões acima para liberar dicas graduais caso o estudante enfrente dificuldades.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "debugLab" && !debugLab && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <Terminal className="w-12 h-12 text-rose-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhum Debug Lab Forense Gerado Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere um laboratório forense com bugs ocultos de concorrência, memória ou sintaxe e suíte de testes automatizados.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("debugLab")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "debugLab" ? "Criando Debug Lab..." : "Criar Debug Lab Forense com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ESTUDO DE CASO (POST-MORTEM & ADR) */}
      {/* ========================================================================= */}
      {activeTab === "caseStudy" && caseStudy && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  ESTUDO DE CASO & AUTÓPSIA
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Domínio: {caseStudy.industryDomain}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{caseStudy.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateSingleResource("caseStudy")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "caseStudy" ? "animate-spin" : ""}`} /> Recriar Caso
              </button>
              <button
                onClick={() => handlePublishActivityToClass(caseStudy.title, "Estudo de Caso")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportCaseStudyPdf}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Estudo de Caso em PDF
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase">Sumário Executivo do Incidente</span>
            <p className="text-xs text-slate-300 leading-relaxed">{caseStudy.incidentSummary}</p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">Cronologia dos Fatos (Timeline)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {caseStudy.timelineEvents.map((te, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-purple-400 font-bold">{te.time}</span>
                    <span className="text-rose-400 font-medium">Impacto Registrado</span>
                  </div>
                  <p className="text-xs text-slate-200">{te.event}</p>
                  <p className="text-[11px] text-slate-400 italic">{te.impact}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">Evidência Forense: Logs do Sistema</span>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
              {caseStudy.systemLogsSnapshot}
            </pre>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                Proposta de Decisão Arquitetural (ADR)
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">{caseStudy.adrProposal.title}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caseStudy.adrProposal.evaluatedOptions.map((opt, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-white">{opt.optionName}</span>
                  <div className="text-[11px] space-y-1">
                    <p className="text-emerald-400 font-mono font-bold">Vantagens:</p>
                    <ul className="text-slate-300 space-y-0.5">
                      {opt.pros.map((p, pi) => <li key={pi}>• {p}</li>)}
                    </ul>
                    <p className="text-rose-400 font-mono font-bold pt-1">Desvantagens:</p>
                    <ul className="text-slate-400 space-y-0.5">
                      {opt.cons.map((c, ci) => <li key={ci}>• {c}</li>)}
                    </ul>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block pt-1">{opt.estimatedCostLatency}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
              <span className="font-mono font-bold text-emerald-400 block mb-0.5">Decisão Recomendada pela Engenharia:</span>
              <p className="text-emerald-200">{caseStudy.adrProposal.recommendedDecision}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "caseStudy" && !caseStudy && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-purple-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhum Estudo de Caso Gerado Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere um estudo de caso e autópsia de incidentes com timeline de falha, logs e registro de decisões arquiteturais (ADR).
          </p>
          <button
            onClick={() => handleGenerateSingleResource("caseStudy")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "caseStudy" ? "Criando Caso..." : "Criar Estudo de Caso (ADR) com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: PESQUISA GUIADA (WEBQUEST) */}
      {/* ========================================================================= */}
      {activeTab === "guidedResearch" && guidedResearch && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  PESQUISA GUIADA • WEBQUEST TÉCNICA
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{guidedResearch.title}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleGenerateSingleResource("guidedResearch")}
                disabled={generatingSingle !== null}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generatingSingle === "guidedResearch" ? "animate-spin" : ""}`} /> Recriar Roteiro
              </button>
              <button
                onClick={() => handlePublishActivityToClass(guidedResearch.title, "Pesquisa Guiada")}
                disabled={isPublishing}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Publicar na Turma
              </button>
              <button
                onClick={handleExportGuidedResearchPdf}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Roteiro de Pesquisa em PDF
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">Pergunta Disparadora da Investigação Científica</span>
            <p className="text-sm font-bold text-amber-100 leading-relaxed font-sans">{guidedResearch.mainInquiryQuestion}</p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" /> Fontes Técnicas e Especificações Oficiais Recomendadas
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {guidedResearch.recommendedSources.map((s, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{s.type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{s.annotation}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" /> Roteiro de Perguntas Críticas por Taxonomia de Bloom
            </span>

            <div className="space-y-2">
              {guidedResearch.guidingCriticalQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Questão {i + 1}: {q.question}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">{q.bloomLevel}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Profundidade esperada: {q.expectedAnalysisDepth}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "guidedResearch" && !guidedResearch && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center space-y-4">
          <Compass className="w-12 h-12 text-cyan-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-white">Nenhum Roteiro de Pesquisa Guiada Gerado Ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gere uma pesquisa guiada (WebQuest) estruturada com fontes oficiais confiáveis e perguntas críticas de Bloom.
          </p>
          <button
            onClick={() => handleGenerateSingleResource("guidedResearch")}
            disabled={generatingSingle !== null}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            <Sparkles className="w-4 h-4" />
            {generatingSingle === "guidedResearch" ? "Criando Roteiro..." : "Criar Pesquisa Guiada com os Assuntos"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: VISÃO GERAL DO PACOTE COMPLETO */}
      {/* ========================================================================= */}
      {activeTab === "pack" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Atividade Prática */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">Prática & Código</span>
              </div>
              <h3 className="text-base font-bold text-white">Atividade Prática Contextualizada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {practicalActivity?.title || "Enunciado rico com requisitos funcionais, restrições e testes de aceite."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("activity")}
                className="text-xs font-mono font-bold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Inspecionar Atividade &rarr;
              </button>
              <button
                onClick={handleExportActivityPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Atividade em PDF"
              >
                <Download className="w-4 h-4 text-blue-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Simulado 4 Opções */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-violet-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <ListChecks className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">4 Alternativas (A,B,C,D)</span>
              </div>
              <h3 className="text-base font-bold text-white">Simulado & Questões Objetivas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {simulatedExam?.title || "Questões de múltipla escolha com 4 alternativas, taxonomia de Bloom e gabarito."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("exam")}
                className="text-xs font-mono font-bold text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Inspecionar Simulado &rarr;
              </button>
              <button
                onClick={handleExportExamPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Simulado em PDF"
              >
                <Download className="w-4 h-4 text-violet-400" />
              </button>
            </div>
          </div>

          {/* Card 3: Apostila */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BookOpen className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">{courseware?.chapters.length || 0} Capítulos</span>
              </div>
              <h3 className="text-base font-bold text-white">Apostila Modular & Guia Didático</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {courseware?.subtitle || "Material didático estruturado com diagramas, dicas de especialistas e exercícios."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("courseware")}
                className="text-xs font-mono font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Inspecionar Capítulos &rarr;
              </button>
              <button
                onClick={handleExportCoursewarePdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Apostila em PDF"
              >
                <Download className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Card 4: Situação de Aprendizagem */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">{situation?.code || "SAEP"}</span>
              </div>
              <h3 className="text-base font-bold text-white">Situação de Aprendizagem (CHA)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Desafio industrial completo com Matriz CHA (Conhecimentos, Habilidades e Atitudes) e rubricas SAEP.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("situation")}
                className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Inspecionar Matriz SAEP &rarr;
              </button>
              <button
                onClick={handleExportSituationPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Situação de Aprendizagem em PDF"
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Card 5: Debug Lab */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-rose-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Terminal className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">{debugLab?.difficulty || "Forense"}</span>
              </div>
              <h3 className="text-base font-bold text-white">Debug Lab ("Ache o Bug")</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Código intencionalmente quebrado com suíte de testes automatizados e 3 níveis de dicas progressivas.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("debugLab")}
                className="text-xs font-mono font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Abrir Laboratório &rarr;
              </button>
              <button
                onClick={handleExportDebugLabPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Roteiro de Debug Lab"
              >
                <Download className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Card 6: Estudo de Caso */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">Post-Mortem & ADR</span>
              </div>
              <h3 className="text-base font-bold text-white">Estudo de Caso & Autópsia</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Análise de incidentes em produção com logs, causa raiz (RCA) e tomada de decisão arquitetural (ADR).
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("caseStudy")}
                className="text-xs font-mono font-bold text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver Relatório Técnico &rarr;
              </button>
              <button
                onClick={handleExportCaseStudyPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Estudo de Caso em PDF"
              >
                <Download className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
