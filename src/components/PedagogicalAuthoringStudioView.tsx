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
  Activity
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
  MasterTeachingPack
} from "../services/pedagogicalAuthoringSuiteService";
import { apiUrl } from "../config/api";

export default function PedagogicalAuthoringStudioView() {
  const [activeTab, setActiveTab] = useState<"pack" | "courseware" | "situation" | "debugLab" | "caseStudy" | "guidedResearch">("pack");

  // Global Parameters
  const [theme, setTheme] = useState("Arquitetura de Microsserviços, APIs REST Seguras & Resiliência com PostgreSQL");
  const [courseName, setCourseName] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [subject, setSubject] = useState("Programação de Soluções Computacionais & DevOps");
  const [language, setLanguage] = useState("typescript");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Generated Artifacts
  const [masterPack, setMasterPack] = useState<MasterTeachingPack | null>(null);
  const [courseware, setCourseware] = useState<CoursewareBooklet | null>(null);
  const [situation, setSituation] = useState<LearningSituation | null>(null);
  const [debugLab, setDebugLab] = useState<DebugLabScenario | null>(null);
  const [caseStudy, setCaseStudy] = useState<CaseStudyScenario | null>(null);
  const [guidedResearch, setGuidedResearch] = useState<GuidedResearchQuest | null>(null);

  // Sub-states
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [debugLabViewMode, setDebugLabViewMode] = useState<"buggy" | "fixed" | "tests">("buggy");
  const [revealedHintLevel, setRevealedHintLevel] = useState<number>(0);

  // Generate initial demo pack on mount
  useEffect(() => {
    handleGenerateMasterPack();
  }, []);

  const handleGenerateMasterPack = async () => {
    setLoading(true);
    try {
      const pack = await PedagogicalAuthoringSuiteService.generateMasterTeachingPack({
        theme,
        courseName,
        subject,
        language
      });
      setMasterPack(pack);
      setCourseware(pack.courseware);
      setSituation(pack.learningSituation);
      setDebugLab(pack.debugLab);
      setCaseStudy(pack.caseStudy);
      setGuidedResearch(pack.guidedResearch);
      setSelectedChapterIdx(0);
      setRevealedHintLevel(0);
      toast.success("Pacote Completo de Autoria Pedagógica gerado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar pacote pedagógico: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCoursewarePdf = () => {
    if (!courseware) return;
    try {
      const buffer = PedagogicalAuthoringSuiteService.exportCoursewarePdf(courseware);
      const blob = new Blob([new Uint8Array(buffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Apostila_SENAI_${courseware.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Apostila Didática em PDF exportada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar apostila: " + e.message);
    }
  };

  const handleExportSituationPdf = () => {
    if (!situation) return;
    try {
      const buffer = PedagogicalAuthoringSuiteService.exportLearningSituationPdf(situation);
      const blob = new Blob([new Uint8Array(buffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Situacao_Aprendizagem_${situation.code}_SENAI.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Situação de Aprendizagem Oficial em PDF exportada!");
    } catch (e: any) {
      toast.error("Erro ao exportar SA: " + e.message);
    }
  };

  const handleExportDebugLabPdf = () => {
    if (!debugLab) return;
    try {
      const buffer = PedagogicalAuthoringSuiteService.exportDebugLabPdf(debugLab);
      const blob = new Blob([new Uint8Array(buffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Debug_Lab_Forense_${debugLab.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Roteiro do Debug Lab em PDF exportado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao exportar Debug Lab: " + e.message);
    }
  };

  const handleExportCaseStudyPdf = () => {
    if (!caseStudy) return;
    try {
      const buffer = PedagogicalAuthoringSuiteService.exportCaseStudyPdf(caseStudy);
      const blob = new Blob([new Uint8Array(buffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Estudo_de_Caso_Autopsia_${caseStudy.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Estudo de Caso & ADR em PDF exportado!");
    } catch (e: any) {
      toast.error("Erro ao exportar Estudo de Caso: " + e.message);
    }
  };

  const handleExportGuidedResearchPdf = () => {
    if (!guidedResearch) return;
    try {
      const buffer = PedagogicalAuthoringSuiteService.exportGuidedResearchPdf(guidedResearch);
      const blob = new Blob([new Uint8Array(buffer as any)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Pesquisa_Guiada_${guidedResearch.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Roteiro de Pesquisa Guiada em PDF exportado!");
    } catch (e: any) {
      toast.error("Erro ao exportar Pesquisa Guiada: " + e.message);
    }
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
                Padrão SENAI / SAEP / Matriz CHA
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold tracking-wide uppercase">
                <Cpu className="w-3.5 h-3.5" />
                1-Click Full Pack
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Suíte Integrada de Produção Pedagógica
            </h1>
            
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Produza com IA e validação metodológica: <strong>Apostilas Modulares</strong>, <strong>Situações de Aprendizagem (SA)</strong>, <strong>Debug Labs Forenses</strong>, <strong>Estudos de Caso (ADR)</strong> e <strong>Pesquisas Guiadas</strong> com exportação institucional diagramada em PDF.
            </p>
          </div>

          {/* Master Generator Actions */}
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
              Gerar Pacote Mestre Completo (1-Click)
            </button>
          </div>
        </div>

        {/* Global Input Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Tema / Objeto de Conhecimento</label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Curso / Disciplina</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Linguagem / Stack</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="typescript">TypeScript / Node.js</option>
              <option value="python">Python 3 / FastAPI</option>
              <option value="java">Java 17+ / Spring Boot</option>
              <option value="csharp">C# / .NET Core</option>
              <option value="sql">PostgreSQL / SQL ANSI</option>
              <option value="cpp">C / C++ Moderno</option>
              <option value="go">Go (Golang)</option>
              <option value="rust">Rust</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pack")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pack"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Visão Geral do Pacote
          </button>

          <button
            onClick={() => setActiveTab("courseware")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "courseware"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            1. Apostila Modular
          </button>

          <button
            onClick={() => setActiveTab("situation")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "situation"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            2. Situação de Aprendizagem (CHA)
          </button>

          <button
            onClick={() => setActiveTab("debugLab")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "debugLab"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Terminal className="w-4 h-4 text-rose-400" />
            3. Debug Lab Forense
          </button>

          <button
            onClick={() => setActiveTab("caseStudy")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "caseStudy"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            4. Estudo de Caso (Post-Mortem)
          </button>

          <button
            onClick={() => setActiveTab("guidedResearch")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "guidedResearch"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            5. Pesquisa Guiada (WebQuest)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: MASTER PACK OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "pack" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Apostila */}
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
                {courseware?.subtitle || "Material didático estruturado com diagramas, dicas de especialistas, armadilhas e exercícios."}
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

          {/* Card 2: Situação de Aprendizagem */}
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

          {/* Card 3: Debug Lab */}
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

          {/* Card 4: Estudo de Caso */}
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

          {/* Card 5: Pesquisa Guiada */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Compass className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono text-slate-500">WebQuest</span>
              </div>
              <h3 className="text-base font-bold text-white">Pesquisa Guiada & Investigação</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Roteiro de pesquisa científica e tecnológica com curadoria de fontes oficiais e perguntas críticas.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={() => setActiveTab("guidedResearch")}
                className="text-xs font-mono font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver Roteiro de Pesquisa &rarr;
              </button>
              <button
                onClick={handleExportGuidedResearchPdf}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
                title="Exportar Pesquisa Guiada em PDF"
              >
                <Download className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COURSEWARE / APOSTILA MODULAR */}
      {/* ========================================================================= */}
      {activeTab === "courseware" && courseware && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chapter Selector Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" /> Capítulos da Apostila
                </span>
                <button
                  onClick={handleExportCoursewarePdf}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
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

          {/* Chapter Content Inspector */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {courseware.chapters[selectedChapterIdx] && (() => {
              const chap = courseware.chapters[selectedChapterIdx];
              return (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
                  
                  {/* Chapter Header */}
                  <div className="border-b border-slate-800 pb-4 space-y-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      CAPÍTULO {chap.chapterNumber}
                    </span>
                    <h2 className="text-xl font-bold text-white">{chap.title}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">{chap.conceptIntro}</p>
                  </div>

                  {/* Why it Matters in Industry */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> Por que isso importa na Indústria & Mercado
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{chap.industrialWhyItMatters}</p>
                  </div>

                  {/* Senior Dev Tip & Syntax Trap */}
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

                  {/* Theory Body */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-slate-300">Teoria & Fundamentação</span>
                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                      {chap.theoryMarkdown}
                    </div>
                  </div>

                  {/* Code Examples */}
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

                  {/* Hands-On Challenges */}
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

      {/* ========================================================================= */}
      {/* TAB 2: SITUAÇÃO DE APRENDIZAGEM (SENAI / CHA) */}
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

            <button
              onClick={handleExportSituationPdf}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar SA Oficial em PDF
            </button>
          </div>

          {/* Industrial Context & Problem */}
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

          {/* CHA Competencies Matrix (Padrão Metodologia SENAI) */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Matriz de Competências CHA (Conhecimentos, Habilidades e Atitudes)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Conhecimentos */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  🧠 Conhecimentos (Saber)
                </span>
                <ul className="space-y-1 text-xs text-blue-200/90 font-sans">
                  {situation.chaMatrix.knowledge.map((k, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-blue-400">•</span> {k}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Habilidades */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  🛠️ Habilidades (Saber Fazer)
                </span>
                <ul className="space-y-1 text-xs text-emerald-200/90 font-sans">
                  {situation.chaMatrix.skills.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Atitudes */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  🤝 Atitudes (Saber Ser/Conviver)
                </span>
                <ul className="space-y-1 text-xs text-purple-200/90 font-sans">
                  {situation.chaMatrix.attitudes.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* SAEP Rubrics Table */}
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

      {/* ========================================================================= */}
      {/* TAB 3: DEBUG LAB FORENSE */}
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

            <button
              onClick={handleExportDebugLabPdf}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Roteiro do Debug Lab
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-rose-400 uppercase">Cenário do Incidente Forense</span>
            <p className="text-xs text-slate-300 leading-relaxed">{debugLab.domainScenario}</p>
          </div>

          {/* Interactive Code Switcher */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDebugLabViewMode("buggy")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "buggy"
                      ? "bg-rose-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  ⚠️ Código com Bugs Ocultos
                </button>
                <button
                  onClick={() => setDebugLabViewMode("tests")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "tests"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🧪 Suíte de Testes (Que Falham)
                </button>
                <button
                  onClick={() => setDebugLabViewMode("fixed")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    debugLabViewMode === "fixed"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
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

          {/* Progressive Hints (Scaffolding) */}
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
                      revealedHintLevel >= lvl
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
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

      {/* ========================================================================= */}
      {/* TAB 4: ESTUDO DE CASO (POST-MORTEM & ADR) */}
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

            <button
              onClick={handleExportCaseStudyPdf}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Estudo de Caso em PDF
            </button>
          </div>

          {/* Incident Summary & Timeline */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase">Sumário Executivo do Incidente</span>
            <p className="text-xs text-slate-300 leading-relaxed">{caseStudy.incidentSummary}</p>
          </div>

          {/* Timeline */}
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

          {/* System Logs Snapshot */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">Evidência Forense: Logs do Sistema</span>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
              {caseStudy.systemLogsSnapshot}
            </pre>
          </div>

          {/* ADR Proposal (Architectural Decision Record) */}
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

      {/* ========================================================================= */}
      {/* TAB 5: PESQUISA GUIADA (WEBQUEST) */}
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

            <button
              onClick={handleExportGuidedResearchPdf}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Roteiro de Pesquisa em PDF
            </button>
          </div>

          {/* Main Inquiry Question */}
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">Pergunta Disparadora da Investigação Científica</span>
            <p className="text-sm font-bold text-amber-100 leading-relaxed font-sans">{guidedResearch.mainInquiryQuestion}</p>
          </div>

          {/* Curated Sources */}
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

          {/* Guiding Critical Questions (Bloom) */}
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

    </div>
  );
}
