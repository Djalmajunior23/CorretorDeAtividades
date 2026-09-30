import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Sparkles,
  Layers,
  Users,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Download,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Play,
  Bug,
  Activity,
  Briefcase,
  Sliders,
  HelpCircle,
  Clock,
  ShieldCheck,
  Flame,
  Award,
  Zap,
  Terminal,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import {
  TeacherGlobalSuperAuthoringService,
  MultiTierDifferentiatedPackage,
  SyntheticStudentSimulationReport,
  ExecutableSlideDeck,
  BloomSaepRubricMatrix,
  BugHuntChallenge,
  LiveClassroomSessionState,
  IndustryCaseStudy
} from "../services/teacherGlobalSuperAuthoringService";

export default function TeacherGlobalSuperAuthoringView() {
  const [activeTab, setActiveTab] = useState<
    "differentiator" | "preflight" | "slides" | "rubrics" | "bughunt" | "orchestrator" | "industry"
  >("differentiator");

  // Form State
  const [topicInput, setTopicInput] = useState("Otimização de Consultas SQL e Normalização 3FN");
  const [languageInput, setLanguageInput] = useState("sql");
  const [contextRulesInput, setContextRulesInput] = useState("Sistema Financeiro de Gateway de Pagamentos e Faturas");
  const [industrySegment, setIndustrySegment] = useState<IndustryCaseStudy["industrySegment"]>("Fintech");

  // Loading States
  const [isGeneratingTier, setIsGeneratingTier] = useState(false);
  const [isSimulatingPreflight, setIsSimulatingPreflight] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [isGeneratingRubrics, setIsGeneratingRubrics] = useState(false);
  const [isGeneratingBugHunt, setIsGeneratingBugHunt] = useState(false);
  const [isGeneratingSession, setIsGeneratingSession] = useState(false);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);

  // Result States
  const [tierResult, setTierResult] = useState<MultiTierDifferentiatedPackage | null>(() =>
    TeacherGlobalSuperAuthoringService.generateMultiTierDifferentiatedContent("Otimização de Consultas SQL e Normalização 3FN", "sql")
  );
  const [preflightResult, setPreflightResult] = useState<SyntheticStudentSimulationReport | null>(() =>
    TeacherGlobalSuperAuthoringService.runSyntheticStudentSimulation(
      "Otimização de Consultas SQL",
      "Crie uma consulta otimizada com índices e normalização 3FN para gateway de pagamentos."
    )
  );
  const [slidesResult, setSlidesResult] = useState<ExecutableSlideDeck | null>(() =>
    TeacherGlobalSuperAuthoringService.generateExecutableSlideDeck("Otimização SQL e Índices B-Tree", "Turma SENAI", "sql")
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [rubricsResult, setRubricsResult] = useState<BloomSaepRubricMatrix | null>(() =>
    TeacherGlobalSuperAuthoringService.generateBloomSaepRubricMatrix("Projeto de Gateway Financeiro", "Banco de Dados SENAI")
  );
  const [bugHuntResult, setBugHuntResult] = useState<BugHuntChallenge | null>(() =>
    TeacherGlobalSuperAuthoringService.generateBugHuntChallenge("Segurança em Login e SQL Injection", "SECURITY_INJECTION")
  );
  const [orchestratorResult, setOrchestratorResult] = useState<LiveClassroomSessionState | null>(() =>
    TeacherGlobalSuperAuthoringService.generateLiveClassroomSession("Consultas com JOIN e Normalização")
  );
  const [industryResult, setIndustryResult] = useState<IndustryCaseStudy | null>(() =>
    TeacherGlobalSuperAuthoringService.generateIndustryCaseStudy("Fintech", "Arquitetura Resiliente de Pagamentos")
  );

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Handlers
  const handleGenerateTier = async () => {
    setIsGeneratingTier(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/differentiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput, language: languageInput, contextRules: contextRulesInput })
      });
      if (res.ok) {
        const data = await res.json();
        setTierResult(data.result);
        toast.success("✓ Conteúdo diferenciado em 3 níveis gerado com sucesso!");
      } else {
        setTierResult(TeacherGlobalSuperAuthoringService.generateMultiTierDifferentiatedContent(topicInput, languageInput, contextRulesInput));
        toast.success("✓ Conteúdo gerado (modo local)!");
      }
    } catch {
      setTierResult(TeacherGlobalSuperAuthoringService.generateMultiTierDifferentiatedContent(topicInput, languageInput, contextRulesInput));
      toast.success("✓ Conteúdo gerado com motor local!");
    } finally {
      setIsGeneratingTier(false);
    }
  };

  const handleRunPreflight = async () => {
    setIsSimulatingPreflight(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/pre-flight-simulation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityTitle: topicInput, activityPrompt: contextRulesInput })
      });
      if (res.ok) {
        const data = await res.json();
        setPreflightResult(data.report);
        toast.success("✓ Teste Pré-Aula com Alunos Virtuais concluído!");
      } else {
        setPreflightResult(TeacherGlobalSuperAuthoringService.runSyntheticStudentSimulation(topicInput, contextRulesInput));
        toast.success("✓ Simulação prévia executada!");
      }
    } catch {
      setPreflightResult(TeacherGlobalSuperAuthoringService.runSyntheticStudentSimulation(topicInput, contextRulesInput));
      toast.success("✓ Simulação prévia executada!");
    } finally {
      setIsSimulatingPreflight(false);
    }
  };

  const handleGenerateSlides = async () => {
    setIsGeneratingSlides(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/slides"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicTitle: topicInput, targetAudience: "Estudantes Técnicos SENAI", codeLanguage: languageInput })
      });
      if (res.ok) {
        const data = await res.json();
        setSlidesResult(data.deck);
        setActiveSlideIndex(0);
        toast.success("✓ Slides interativos executáveis gerados!");
      } else {
        setSlidesResult(TeacherGlobalSuperAuthoringService.generateExecutableSlideDeck(topicInput, "Estudantes Técnicos SENAI", languageInput as any));
        setActiveSlideIndex(0);
        toast.success("✓ Slides gerados com sucesso!");
      }
    } catch {
      setSlidesResult(TeacherGlobalSuperAuthoringService.generateExecutableSlideDeck(topicInput, "Estudantes Técnicos SENAI", languageInput as any));
      setActiveSlideIndex(0);
      toast.success("✓ Slides gerados com sucesso!");
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  const handleGenerateRubrics = async () => {
    setIsGeneratingRubrics(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/rubrics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityTitle: topicInput, domainCompetency: "Desenvolvimento SENAI" })
      });
      if (res.ok) {
        const data = await res.json();
        setRubricsResult(data.rubrics);
        toast.success("✓ Matriz de Rubricas SAEP / Bloom gerada!");
      } else {
        setRubricsResult(TeacherGlobalSuperAuthoringService.generateBloomSaepRubricMatrix(topicInput));
        toast.success("✓ Rubricas geradas!");
      }
    } catch {
      setRubricsResult(TeacherGlobalSuperAuthoringService.generateBloomSaepRubricMatrix(topicInput));
      toast.success("✓ Rubricas geradas!");
    } finally {
      setIsGeneratingRubrics(false);
    }
  };

  const handleGenerateBugHunt = async () => {
    setIsGeneratingBugHunt(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/bug-hunt"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput, category: "SECURITY_INJECTION" })
      });
      if (res.ok) {
        const data = await res.json();
        setBugHuntResult(data.challenge);
        toast.success("✓ Desafio de Caça ao Bug & Parsons gerado!");
      } else {
        setBugHuntResult(TeacherGlobalSuperAuthoringService.generateBugHuntChallenge(topicInput));
        toast.success("✓ Desafio de Caça ao Bug gerado!");
      }
    } catch {
      setBugHuntResult(TeacherGlobalSuperAuthoringService.generateBugHuntChallenge(topicInput));
      toast.success("✓ Desafio gerado!");
    } finally {
      setIsGeneratingBugHunt(false);
    }
  };

  const handleGenerateSession = async () => {
    setIsGeneratingSession(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/live-orchestrator"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput })
      });
      if (res.ok) {
        const data = await res.json();
        setOrchestratorResult(data.session);
        toast.success("✓ Sessão de Orquestração ao Vivo atualizada!");
      } else {
        setOrchestratorResult(TeacherGlobalSuperAuthoringService.generateLiveClassroomSession(topicInput));
        toast.success("✓ Sessão ao vivo atualizada!");
      }
    } catch {
      setOrchestratorResult(TeacherGlobalSuperAuthoringService.generateLiveClassroomSession(topicInput));
      toast.success("✓ Sessão ao vivo atualizada!");
    } finally {
      setIsGeneratingSession(false);
    }
  };

  const handleGenerateCase = async () => {
    setIsGeneratingCase(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/super-authoring/industry-case"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment: industrySegment, topic: topicInput })
      });
      if (res.ok) {
        const data = await res.json();
        setIndustryResult(data.caseStudy);
        toast.success("✓ Estudo de caso com dados sintéticos injetado!");
      } else {
        setIndustryResult(TeacherGlobalSuperAuthoringService.generateIndustryCaseStudy(industrySegment, topicInput));
        toast.success("✓ Estudo de caso gerado!");
      }
    } catch {
      setIndustryResult(TeacherGlobalSuperAuthoringService.generateIndustryCaseStudy(industrySegment, topicInput));
      toast.success("✓ Estudo de caso gerado!");
    } finally {
      setIsGeneratingCase(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Super-Autoria Docente • 7 Super-Poderes Globais de Sala de Aula
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Estúdio Global de Autoria & Orquestração de Aulas
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Gere diferenciação multinível em 1 clique, simule provas com alunos virtuais de IA antes da aula, crie slides interativos com código executável e orquestre o laboratório com o Modo Fantasma anticonstrangimento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (activeTab === "differentiator") handleGenerateTier();
                else if (activeTab === "preflight") handleRunPreflight();
                else if (activeTab === "slides") handleGenerateSlides();
                else if (activeTab === "rubrics") handleGenerateRubrics();
                else if (activeTab === "bughunt") handleGenerateBugHunt();
                else if (activeTab === "orchestrator") handleGenerateSession();
                else if (activeTab === "industry") handleGenerateCase();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-hover" />
              Executar com IA
            </button>
          </div>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="md:col-span-2">
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Tópico ou Conceito-Chave da Aula
          </label>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
            placeholder="Ex: Otimização de Consultas SQL e Normalização 3FN"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Linguagem / Stack
          </label>
          <select
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
          >
            <option value="sql">SQL (PostgreSQL / MySQL)</option>
            <option value="typescript">TypeScript / Node.js</option>
            <option value="python">Python 3 (FastAPI / Pandas)</option>
            <option value="java">Java 21 (Spring Boot)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> Segmento de Mercado
          </label>
          <select
            value={industrySegment}
            onChange={(e) => setIndustrySegment(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
          >
            <option value="Fintech">Fintech & Meios de Pagamento</option>
            <option value="HealthTech">HealthTech & Prontuários</option>
            <option value="E-Commerce">E-Commerce & Logística</option>
            <option value="Logística 4.0">Indústria 4.0 & Supply Chain</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("differentiator")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "differentiator"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> 1. Diferenciador 1-Click (3 Níveis)
        </button>

        <button
          onClick={() => setActiveTab("preflight")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "preflight"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> 2. Alunos Virtuais (Pre-Flight)
        </button>

        <button
          onClick={() => setActiveTab("slides")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "slides"
              ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Presentation className="w-3.5 h-3.5" /> 3. Slides Interativos Executáveis
        </button>

        <button
          onClick={() => setActiveTab("rubrics")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "rubrics"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> 4. Matriz SAEP & Bloom
        </button>

        <button
          onClick={() => setActiveTab("bughunt")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "bughunt"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Bug className="w-3.5 h-3.5" /> 5. Caça ao Bug & Parsons
        </button>

        <button
          onClick={() => setActiveTab("orchestrator")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "orchestrator"
              ? "bg-amber-600 text-slate-950 shadow-lg shadow-amber-600/30 font-black"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> 6. Live Orchestrator & Ghost Mode
        </button>

        <button
          onClick={() => setActiveTab("industry")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === "industry"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> 7. Injetor de Casos Reais
        </button>
      </div>

      {/* TAB 1: DIFFERENTIATOR (3 NÍVEIS SIMULTÂNEOS) */}
      {activeTab === "differentiator" && tierResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Tier 1: Scaffolding / Parsons */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-slate-900/90 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                Nível 1 • Básico / Guiado
              </span>
              <span className="text-[10px] font-mono text-slate-400">Scaffolding Reduzido</span>
            </div>

            <h3 className="font-bold text-white text-sm">{tierResult.tier1_beginner.name}</h3>
            <p className="text-xs text-slate-300">{tierResult.tier1_beginner.scaffoldingStrategy}</p>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5" /> Blocos de Parsons (Ordenar & Indentar):
              </span>
              <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {tierResult.tier1_beginner.parsonsBlocks.map((blk, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-200 border border-slate-800 cursor-move hover:border-emerald-500/50 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-500 font-bold">#{idx + 1}</span>
                    <span className="truncate">{blk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-slate-400">Pistas Conceituais:</span>
              <ul className="text-xs text-slate-400 space-y-1 font-sans">
                {tierResult.tier1_beginner.conceptualHints.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tier 2: Proficient / Standard */}
          <div className="p-5 rounded-2xl border border-sky-500/30 bg-slate-900/90 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase">
                Nível 2 • Proficiente
              </span>
              <span className="text-[10px] font-mono text-slate-400">Padrão Mercado</span>
            </div>

            <h3 className="font-bold text-white text-sm">{tierResult.tier2_proficient.name}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{tierResult.tier2_proficient.problemStatement}</p>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-sky-400">Regras de Negócio:</span>
              <ul className="text-xs text-slate-300 space-y-1">
                {tierResult.tier2_proficient.businessRules.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-slate-400">Testes Unitários Automatizados:</span>
              <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[140px]">
                {tierResult.tier2_proficient.unitTestsCode}
              </pre>
            </div>
          </div>

          {/* Tier 3: Challenger / Master Class */}
          <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-900/90 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                Nível 3 • Challenger
              </span>
              <span className="text-[10px] font-mono text-slate-400">Alta Performance</span>
            </div>

            <h3 className="font-bold text-white text-sm">{tierResult.tier3_challenger.name}</h3>
            
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-rose-400">Restrições Extremas:</span>
              <ul className="text-xs text-slate-300 space-y-1">
                {tierResult.tier3_challenger.extremeConstraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-amber-400">Corner Cases & Concorrência:</span>
              <ul className="text-xs text-slate-300 space-y-1">
                {tierResult.tier3_challenger.cornerCases.map((cc, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{cc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNTHETIC STUDENT PRE-FLIGHT SIMULATOR */}
      {activeTab === "preflight" && preflightResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Laudo de Calibração Pré-Aula:</span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {preflightResult.activityTitle}
              </h2>
              <p className="text-xs text-slate-300 mt-1">{preflightResult.teacherCalibrationAdvice}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-3xl font-black font-mono text-emerald-400">
                  {preflightResult.overallReadinessScore}<span className="text-sm text-slate-500 font-normal">/100</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Índice de Prontidão</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preflightResult.personas.map((persona, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-indigo-400">{persona.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {persona.timeSpentMinutes} min
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs italic text-slate-300">
                  "{persona.feedbackQuote}"
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-slate-400">Pontos de Fricção:</span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {persona.frictionSpots.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                  <span className="font-bold text-indigo-300 font-mono text-[10px] uppercase">Ajuste Sugerido ao Professor:</span>
                  <p className="text-slate-300">{persona.suggestedTeacherAdjustment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTABLE SLIDE DECKS (REVEAL / MARP) */}
      {activeTab === "slides" && slidesResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Slide List Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase">Slides da Aula ({slidesResult.slides.length})</span>
              <button
                onClick={() => handleCopy(slidesResult.exportFormats.marpMarkdown, "marp")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === "marp" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Exportar Marp Markdown
              </button>
            </div>

            <div className="space-y-2">
              {slidesResult.slides.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeSlideIndex === idx
                      ? "bg-sky-500/10 border-sky-500/50 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-sky-400">SLIDE {s.slideIndex}</span>
                    <span className="text-[10px] font-mono text-slate-500">{s.executableCodeBlock ? "Código Vivo" : s.mermaidDiagram ? "Diagrama" : "Conceitual"}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{s.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Preview & Interactive Player */}
          <div className="lg:col-span-8 p-6 rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md space-y-6 shadow-2xl flex flex-col justify-between min-h-[480px]">
            {slidesResult.slides[activeSlideIndex] && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-sky-400 uppercase">
                      Slide {slidesResult.slides[activeSlideIndex].slideIndex} de {slidesResult.slides.length}
                    </span>
                    <h2 className="text-xl font-black text-white">
                      {slidesResult.slides[activeSlideIndex].title}
                    </h2>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                    {slidesResult.estimatedDurationMinutes} min aula
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-mono">
                  🎯 <strong>Objetivo Pedagógico:</strong> {slidesResult.slides[activeSlideIndex].pedagogicalObjective}
                </p>

                <ul className="text-sm text-slate-200 space-y-2 list-disc list-inside">
                  {slidesResult.slides[activeSlideIndex].bulletPoints.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>

                {slidesResult.slides[activeSlideIndex].executableCodeBlock && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                        <Terminal className="w-3.5 h-3.5" /> Bloco Executável em Sala ({slidesResult.slides[activeSlideIndex].executableCodeBlock?.language.toUpperCase()}):
                      </span>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                      {slidesResult.slides[activeSlideIndex].executableCodeBlock?.code}
                    </pre>
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                      ⚡ Saída Esperada: {slidesResult.slides[activeSlideIndex].executableCodeBlock?.expectedOutput}
                    </div>
                  </div>
                )}

                {slidesResult.slides[activeSlideIndex].livePollCheckpoint && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                    <span className="text-xs font-mono font-bold text-purple-300 uppercase flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Checkpoint Interativo / Enquete ao Vivo:
                    </span>
                    <p className="text-xs font-bold text-white">
                      {slidesResult.slides[activeSlideIndex].livePollCheckpoint?.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {slidesResult.slides[activeSlideIndex].livePollCheckpoint?.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg text-xs font-mono border ${
                            oIdx === slidesResult.slides[activeSlideIndex].livePollCheckpoint?.correctIndex
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Speaking Notes for Teacher */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-sans text-slate-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-mono text-[11px] block">Notas de Fala do Professor:</strong>
                {slidesResult.slides[activeSlideIndex]?.teacherSpeakingNotes}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RUBRICS SAEP & BLOOM */}
      {activeTab === "rubrics" && rubricsResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase">Matriz de Rubricas Padronizada</span>
              <h2 className="text-lg font-bold text-white">{rubricsResult.activityTitle}</h2>
              <p className="text-xs text-slate-400 mt-1">{rubricsResult.domainCompetency}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
              Peso Total: {rubricsResult.totalWeight}%
            </span>
          </div>

          <div className="space-y-4">
            {rubricsResult.dimensions.map((dim, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{dim.dimensionName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      Bloom: {dim.bloomLevel}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">Peso: {dim.weightPercent}%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Insuficiente (0-49%)</span>
                    <p className="text-xs text-slate-300">{dim.levels.insufficient}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">Básico (50-69%)</span>
                    <p className="text-xs text-slate-300">{dim.levels.basic}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">Adequado (70-89%)</span>
                    <p className="text-xs text-slate-300">{dim.levels.adequate}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Avançado (90-100%)</span>
                    <p className="text-xs text-slate-300">{dim.levels.advanced}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BUG HUNT & PARSONS */}
      {activeTab === "bughunt" && bugHuntResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase">
                  Desafio de Investigação de Vulnerabilidades
                </span>
                <span className="text-xs font-mono text-slate-400">{bugHuntResult.challengeId}</span>
              </div>
              <h3 className="text-base font-bold text-white">{bugHuntResult.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{bugHuntResult.investigatorBriefing}</p>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <Editor
                  height="260px"
                  language="javascript"
                  theme="vs-dark"
                  value={bugHuntResult.brokenCodeSnippet}
                  options={{ minimap: { enabled: false }, fontSize: 12, lineNumbers: "on", readOnly: true }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase">Bugs Ocultos para Detecção ({bugHuntResult.hiddenBugs.length}):</span>
              
              {bugHuntResult.hiddenBugs.map((bug, bIdx) => (
                <div key={bIdx} className="p-3 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">Linha {bug.line}: {bug.bugType}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">{bug.severity}</span>
                  </div>
                  <p className="text-xs text-slate-300">{bug.explanation}</p>
                  <pre className="p-2 rounded bg-slate-900 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {bug.fixedLine}
                  </pre>
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase">Quebra-Cabeça de Correção Parsons:</span>
                <div className="space-y-1 mt-2">
                  {bugHuntResult.parsonsReorderPuzzle.map((p, pIdx) => (
                    <div key={pIdx} className="p-2 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE ORCHESTRATOR & GHOST MODE */}
      {activeTab === "orchestrator" && orchestratorResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orchestratorResult.confusionHeatmap.map((heat, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border space-y-2 ${
                  heat.status === "CRITICO"
                    ? "bg-rose-950/20 border-rose-500/40"
                    : heat.status === "ALERTA"
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-emerald-950/20 border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">Radar de Dúvidas</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    heat.status === "CRITICO" ? "bg-rose-500 text-white" : heat.status === "ALERTA" ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-white"
                  }`}>
                    {heat.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{heat.concept}</h4>
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span>Alunos com Dificuldade:</span>
                  <span className="text-lg font-bold">{heat.strugglingPercent}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ghost Mode Projector */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Modo Fantasma (Projeção Anônima para Debate)
                </span>
                <span className="text-[10px] font-mono text-slate-400">100% Sem Constrangimento</span>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <pre className="p-4 text-xs font-mono text-amber-200 overflow-x-auto">
                  {orchestratorResult.ghostModeSnippet.flawedCode}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                <strong className="text-amber-300 font-mono text-[11px] block">Pergunta Socrática para o Telão:</strong>
                <p className="text-slate-200">{orchestratorResult.ghostModeSnippet.socraticQuestionForClass}</p>
              </div>
            </div>

            {/* Pop Challenge */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Desafio Relâmpago ({orchestratorResult.popChallenge.durationMinutes} Minutos)
                </span>
                <button
                  onClick={() => toast.success("Desafio lançado nas telas dos alunos com contagem regressiva!")}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold cursor-pointer"
                >
                  Lançar na Sala
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-bold">
                {orchestratorResult.popChallenge.prompt}
              </p>

              <div className="space-y-2">
                {orchestratorResult.popChallenge.quickQuizOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                      idx === orchestratorResult.popChallenge.correctOptionIndex
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>{String.fromCharCode(65 + idx)}) {opt}</span>
                    {idx === orchestratorResult.popChallenge.correctOptionIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: REAL-WORLD INDUSTRY CASE */}
      {activeTab === "industry" && industryResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase">Cenário Corporativo Real • {industryResult.industrySegment}</span>
              <h2 className="text-lg font-bold text-white">{industryResult.companyName}</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">{industryResult.incidentNarrative}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Massa de Dados Sintética (CSV / LGPD-Safe):</span>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[160px]">
                  {industryResult.syntheticDataSetCsv}
                </pre>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-xl">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">Requisitos da Diretoria Executiva:</span>
                <ul className="text-xs text-slate-300 space-y-1.5 font-sans">
                  {industryResult.executiveRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-xl">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Entregáveis Técnicos Esperados dos Alunos:</span>
                <ul className="text-xs text-slate-300 space-y-1.5 font-sans">
                  {industryResult.technicalDeliverables.map((del, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1">
                <strong className="text-cyan-300 font-mono text-[11px] block">Critério de Avaliação:</strong>
                <p className="text-slate-300">{industryResult.evaluationRubricSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
