import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Sparkles,
  Zap,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sliders,
  HelpCircle,
  Clock,
  ShieldCheck,
  Flame,
  Award,
  BookOpen,
  FileText,
  TrendingUp,
  Cpu,
  BarChart3,
  Presentation,
  Radio,
  Gamepad2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  TeacherSuperpowersService,
  OmnikitLessonPlan,
  TurboBatchGradingResult,
  TurboBatchSubmission,
  SmartFeedbackCampaign,
  PreventiveInterventionPlan,
  LiveFlashQuiz,
  SmartDiaryRecord,
  TeacherProductivityMetrics
} from "../services/teacherSuperpowersService";

export default function TeacherSuperpowersCockpitView() {
  // Superpower Tab Selection
  const [activeTab, setActiveTab] = useState<
    "omnikit" | "turbo_batch" | "feedback_dispatcher" | "preventive_intervention" | "live_quiz" | "smart_diary"
  >("omnikit");

  // Productivity Metrics
  const [metrics, setMetrics] = useState<TeacherProductivityMetrics>(() =>
    TeacherSuperpowersService.getTeacherProductivityMetrics()
  );

  // Omnikit Form & State
  const [omnikitTopic, setOmnikitTopic] = useState("Construção de APIs RESTful e Otimização com Índices SQL");
  const [omnikitAudience, setOmnikitAudience] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [omnikitDuration, setOmnikitDuration] = useState(90);
  const [omnikitLanguage, setOmnikitLanguage] = useState("javascript");
  const [isGeneratingOmnikit, setIsGeneratingOmnikit] = useState(false);
  const [omnikitResult, setOmnikitResult] = useState<OmnikitLessonPlan | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTierTab, setActiveTierTab] = useState<"tier1" | "tier2" | "tier3">("tier1");

  // Turbo Batch State
  const [batchActivityTitle, setBatchActivityTitle] = useState("Exercício 04 - API REST e Validações de Payload");
  const [isGradingBatch, setIsGradingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<TurboBatchGradingResult | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TurboBatchSubmission | null>(null);
  const [editedFeedback, setEditedFeedback] = useState("");

  // Feedback Dispatcher State
  const [isDispatching, setIsDispatching] = useState(false);
  const [campaignResult, setCampaignResult] = useState<SmartFeedbackCampaign | null>(null);

  // Preventive Intervention State
  const [studentAtRisk, setStudentAtRisk] = useState("Mariana Oliveira Costa");
  const [isGeneratingIntervention, setIsGeneratingIntervention] = useState(false);
  const [interventionPlan, setInterventionPlan] = useState<PreventiveInterventionPlan | null>(null);

  // Live Flash Quiz State
  const [quizTopic, setQuizTopic] = useState("REST APIs, Métodos HTTP e Status Codes");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<LiveFlashQuiz | null>(null);
  const [activeQuizQuestion, setActiveQuizQuestion] = useState(0);

  // Smart Diary State
  const [diaryClassName, setDiaryClassName] = useState("Turma 2B - Desenvolvimento de Sistemas");
  const [diaryTopic, setDiaryTopic] = useState("Desenvolvimento de Endpoints RESTful e Validações");
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);
  const [diaryResult, setDiaryResult] = useState<SmartDiaryRecord | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado com sucesso para a área de transferência!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Initial Auto-load demo
  useEffect(() => {
    // Omnikit
    TeacherSuperpowersService.generateFullLessonOmnikit({
      topic: omnikitTopic,
      targetAudience: omnikitAudience,
      durationMinutes: omnikitDuration,
      language: omnikitLanguage
    }).then(res => setOmnikitResult(res));

    // Batch Auto-Grader
    TeacherSuperpowersService.gradeSubmissionsBatchTurbo({
      activityTitle: batchActivityTitle
    }).then(res => {
      setBatchResult(res);
      if (res.gradedSubmissions.length > 0) {
        setSelectedSubmission(res.gradedSubmissions[0]);
        setEditedFeedback(res.gradedSubmissions[0].pedagogicalFeedback || "");
      }
    });

    // Intervention default
    TeacherSuperpowersService.generatePreventiveInterventionPlan({
      studentId: "st-03",
      studentName: studentAtRisk,
      recentScores: [50, 48, 42],
      weaknesses: ["Desestruturação de JSON", "Tratamento de Exceções com try/catch"]
    }).then(res => setInterventionPlan(res));

    // Live Quiz default
    TeacherSuperpowersService.createLiveFlashQuiz({
      topic: quizTopic
    }).then(res => setQuizResult(res));

    // Smart Diary default
    TeacherSuperpowersService.generateSmartClassDiaryRecord({
      className: diaryClassName,
      lessonTopic: diaryTopic,
      competencies: ["Desenvolver endpoints de serviços web", "Aplicar validações defensivas"]
    }).then(res => setDiaryResult(res));
  }, []);

  const refreshMetrics = () => {
    setMetrics(TeacherSuperpowersService.getTeacherProductivityMetrics());
  };

  // Handlers
  const handleGenerateOmnikit = async () => {
    setIsGeneratingOmnikit(true);
    try {
      const res = await TeacherSuperpowersService.generateFullLessonOmnikit({
        topic: omnikitTopic,
        targetAudience: omnikitAudience,
        durationMinutes: omnikitDuration,
        language: omnikitLanguage
      });
      setOmnikitResult(res);
      setActiveSlideIndex(0);
      refreshMetrics();
      toast.success("Omnikit de Aula Completo gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar Omnikit.");
    } finally {
      setIsGeneratingOmnikit(false);
    }
  };

  const handleRunTurboGrading = async () => {
    setIsGradingBatch(true);
    try {
      const res = await TeacherSuperpowersService.gradeSubmissionsBatchTurbo({
        activityTitle: batchActivityTitle
      });
      setBatchResult(res);
      if (res.gradedSubmissions.length > 0) {
        setSelectedSubmission(res.gradedSubmissions[0]);
        setEditedFeedback(res.gradedSubmissions[0].pedagogicalFeedback || "");
      }
      refreshMetrics();
      toast.success(`Lote de ${res.totalSubmissions} submissões corrigido instantaneamente! Economia estimada: +${res.timeSavedMinutes} minutos.`);
    } catch {
      toast.error("Falha na correção turbo.");
    } finally {
      setIsGradingBatch(false);
    }
  };

  const handleApproveAllSubmissions = () => {
    if (!batchResult) return;
    const updated = {
      ...batchResult,
      approvedCount: batchResult.totalSubmissions,
      needsReviewCount: 0,
      recoveryCount: 0,
      gradedSubmissions: batchResult.gradedSubmissions.map(s => ({ ...s, status: "approved" as const }))
    };
    setBatchResult(updated);
    toast.success("Todas as notas e feedbacks foram aprovados e sincronizados!");
  };

  const handleSaveFeedbackEdit = () => {
    if (!selectedSubmission || !batchResult) return;
    const updatedList = batchResult.gradedSubmissions.map(s =>
      s.studentId === selectedSubmission.studentId ? { ...s, pedagogicalFeedback: editedFeedback } : s
    );
    setBatchResult({ ...batchResult, gradedSubmissions: updatedList });
    setSelectedSubmission({ ...selectedSubmission, pedagogicalFeedback: editedFeedback });
    toast.success("Feedback personalizado salvo com sucesso!");
  };

  const handleDispatchFeedbackCampaign = async () => {
    if (!batchResult) return;
    setIsDispatching(true);
    try {
      const res = await TeacherSuperpowersService.dispatchTargetedFeedbacks({
        gradedSubmissions: batchResult.gradedSubmissions
      });
      setCampaignResult(res);
      refreshMetrics();
      toast.success(`Campanha de Feedback disparada com sucesso para ${res.totalRecipients} estudantes!`);
    } catch {
      toast.error("Erro ao disparar campanha de feedback.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleGenerateIntervention = async () => {
    setIsGeneratingIntervention(true);
    try {
      const res = await TeacherSuperpowersService.generatePreventiveInterventionPlan({
        studentId: "st-03",
        studentName: studentAtRisk,
        recentScores: [52, 45, 40],
        weaknesses: ["Manipulação de JSON", "Try/Catch e Códigos HTTP"]
      });
      setInterventionPlan(res);
      refreshMetrics();
      toast.success("Plano de Intervenção Precoce gerado!");
    } catch {
      toast.error("Falha ao gerar plano de intervenção.");
    } finally {
      setIsGeneratingIntervention(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const res = await TeacherSuperpowersService.createLiveFlashQuiz({
        topic: quizTopic
      });
      setQuizResult(res);
      setActiveQuizQuestion(0);
      toast.success("Quiz Blitz Relâmpago criado com PIN gerado!");
    } catch {
      toast.error("Erro ao gerar quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGenerateDiary = async () => {
    setIsGeneratingDiary(true);
    try {
      const res = await TeacherSuperpowersService.generateSmartClassDiaryRecord({
        className: diaryClassName,
        lessonTopic: diaryTopic,
        competencies: ["Desenvolver endpoints de serviços web", "Aplicar validações defensivas"]
      });
      setDiaryResult(res);
      toast.success("Registro oficial do Diário de Classe sintetizado!");
    } catch {
      toast.error("Falha ao gerar registro do diário.");
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col gap-6">
      {/* HEADER: SUPERPOWER COCKPIT HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                TEACHER SUPERPOWERS & PILOTO AUTOMÁTICO
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v3.5 Omnichannel
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-emerald-400 drop-shadow-md" />
              Cockpit de Superpoderes Docentes
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl mt-1">
              Central de automações pedagógicas com ações de 1-clique: gere aulas completas, corrija pilhas de código em lote, dispare feedbacks empáticos e previna a evasão de estudantes.
            </p>
          </div>

          {/* REAL-TIME PRODUCTIVITY COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Economizados
              </div>
              <div className="text-xl font-black text-white mt-0.5">+{metrics.totalHoursSavedLifetime}h</div>
              <div className="text-[10px] text-slate-400 font-mono">Total no Semestre</div>
            </div>

            <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5" />
                Auto-Grading
              </div>
              <div className="text-xl font-black text-white mt-0.5">{metrics.autoGradedCount}</div>
              <div className="text-[10px] text-slate-400 font-mono">Projetos Avaliados</div>
            </div>

            <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                <Send className="w-3.5 h-3.5" />
                Feedbacks
              </div>
              <div className="text-xl font-black text-white mt-0.5">{metrics.feedbacksDispatchedCount}</div>
              <div className="text-[10px] text-slate-400 font-mono">Disparos IA</div>
            </div>

            <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                Engajamento
              </div>
              <div className="text-xl font-black text-white mt-0.5">{metrics.engagementHealthScore}%</div>
              <div className="text-[10px] text-emerald-400 font-mono">Saúde da Turma</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUPERPOWER NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-thin">
        {[
          { id: "omnikit", label: "Omnikit de Aula 1-Clique", icon: BookOpen, tag: "Mais Usado" },
          { id: "turbo_batch", label: "Correção Turbo em Lote", icon: Layers, tag: "10x Rápido" },
          { id: "feedback_dispatcher", label: "Disparador de Feedbacks", icon: Send, tag: "Multi-Canal" },
          { id: "preventive_intervention", label: "Intervenção & Evasão Zero", icon: ShieldCheck, tag: "Preditivo" },
          { id: "live_quiz", label: "Quiz Blitz Relâmpago", icon: Gamepad2, tag: "Gamificado" },
          { id: "smart_diary", label: "Diário Oficial 1-Clique", icon: FileCheck, tag: "Conformidade" }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
                  : "bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.tag && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? "bg-emerald-500/30 text-emerald-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* TAB 1: OMNIKIT DE AULA 1-CLIQUE */}
        {/* ========================================================================= */}
        {activeTab === "omnikit" && (
          <motion.div
            key="omnikit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Control Form Sidebar */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Parâmetros do Omnikit
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    1-Click Studio
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Tema ou Tópico da Aula</label>
                  <input
                    type="text"
                    value={omnikitTopic}
                    onChange={e => setOmnikitTopic(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Consultas SQL Avançadas e 3FN"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Público / Turma</label>
                  <input
                    type="text"
                    value={omnikitAudience}
                    onChange={e => setOmnikitAudience(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Duração (min)</label>
                    <select
                      value={omnikitDuration}
                      onChange={e => setOmnikitDuration(Number(e.target.value))}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={45}>45 min (Micro-Lab)</option>
                      <option value={60}>60 min (Padrão)</option>
                      <option value={90}>90 min (Aprofundado)</option>
                      <option value={180}>180 min (Workshop)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Tecnologia</label>
                    <select
                      value={omnikitLanguage}
                      onChange={e => setOmnikitLanguage(e.target.value)}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="javascript">JavaScript / Node</option>
                      <option value="typescript">TypeScript</option>
                      <option value="sql">SQL / Postgres</option>
                      <option value="python">Python</option>
                      <option value="java">Java / Spring</option>
                      <option value="csharp">C# / .NET</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateOmnikit}
                  disabled={isGeneratingOmnikit}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  {isGeneratingOmnikit ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Arquiteto IA Construindo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Omnikit Completo com 1-Clique
                    </>
                  )}
                </button>

                {omnikitResult && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(omnikitResult, null, 2), "omnikit-json")}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2 transition-all"
                  >
                    {copiedKey === "omnikit-json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Exportar Pacote JSON / Markdown
                  </button>
                )}
              </div>
            </div>

            {/* Main Omnikit Preview & Interactive Deck */}
            <div className="flex-1 flex flex-col gap-6">
              {omnikitResult ? (
                <>
                  {/* Overview Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                      <div>
                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Objetivo Pedagógico (Bloom & SAEP)</span>
                        <h2 className="text-lg font-bold text-white mt-0.5">{omnikitResult.topic}</h2>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {omnikitResult.durationMinutes} min • {omnikitResult.targetAudience}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                      🎯 <strong className="text-white">Objetivo:</strong> {omnikitResult.pedagogicalObjective}
                    </p>

                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                      <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-amber-300">Gancho Sensibilizador (Primeiros 5 minutos):</span>
                        <p className="text-xs text-amber-200/90 mt-0.5">{omnikitResult.sensitizingHook}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Executable Slides */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Slides e Instrução Direta Pronta para o Projetor</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {omnikitResult.directInstruction.slides.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                              activeSlideIndex === idx
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {omnikitResult.directInstruction.slides[activeSlideIndex] && (
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-emerald-300">
                            Slide {activeSlideIndex + 1}: {omnikitResult.directInstruction.slides[activeSlideIndex].title}
                          </h4>
                          <button
                            onClick={() =>
                              handleCopy(
                                omnikitResult.directInstruction.slides[activeSlideIndex].bulletPoints.join("\n"),
                                `slide-${activeSlideIndex}`
                              )
                            }
                            className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar Slide
                          </button>
                        </div>

                        <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-300">
                          {omnikitResult.directInstruction.slides[activeSlideIndex].bulletPoints.map((bp, i) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>

                        {omnikitResult.directInstruction.slides[activeSlideIndex].codeSnippet && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-800">
                            <div className="bg-slate-900 px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                              <span>Snippet de Exemplo (Ao Vivo)</span>
                              <span className="text-emerald-400 font-semibold">{omnikitLanguage}</span>
                            </div>
                            <div className="h-32">
                              <Editor
                                height="100%"
                                language={omnikitLanguage}
                                theme="vs-dark"
                                value={omnikitResult.directInstruction.slides[activeSlideIndex].codeSnippet}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 12,
                                  scrollBeyondLastLine: false,
                                  lineNumbers: "on"
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {omnikitResult.directInstruction.slides[activeSlideIndex].interactiveQuestion && (
                          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400" />
                            <span><strong>Pergunta Interativa para a Turma:</strong> {omnikitResult.directInstruction.slides[activeSlideIndex].interactiveQuestion}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3-Tier Differentiated Activities */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-white">Desafios Diferenciados em 3 Níveis (Inclusão e Nivelamento)</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTierTab("tier1")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            activeTierTab === "tier1" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-slate-400"
                          }`}
                        >
                          Nível 1: Fundações
                        </button>
                        <button
                          onClick={() => setActiveTierTab("tier2")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            activeTierTab === "tier2" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" : "text-slate-400"
                          }`}
                        >
                          Nível 2: Aplicação Real
                        </button>
                        <button
                          onClick={() => setActiveTierTab("tier3")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            activeTierTab === "tier3" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-slate-400"
                          }`}
                        >
                          Nível 3: Boss Challenge 👑
                        </button>
                      </div>
                    </div>

                    {activeTierTab === "tier1" && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-emerald-300">{omnikitResult.differentiatedChallenges.tier1_foundation.title}</h4>
                        <p className="text-xs text-slate-300">{omnikitResult.differentiatedChallenges.tier1_foundation.instructions}</p>
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-200">
                          💡 <strong>Dica de Scaffolding:</strong> {omnikitResult.differentiatedChallenges.tier1_foundation.scaffoldingHint}
                        </div>
                        <div className="h-28 rounded-lg overflow-hidden border border-slate-800">
                          <Editor
                            height="100%"
                            language={omnikitLanguage}
                            theme="vs-dark"
                            value={omnikitResult.differentiatedChallenges.tier1_foundation.starterCode}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                          />
                        </div>
                      </div>
                    )}

                    {activeTierTab === "tier2" && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-indigo-300">{omnikitResult.differentiatedChallenges.tier2_application.title}</h4>
                        <p className="text-xs text-slate-300">{omnikitResult.differentiatedChallenges.tier2_application.instructions}</p>
                        <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-200">
                          🎯 <strong>Saída Esperada:</strong> {omnikitResult.differentiatedChallenges.tier2_application.expectedOutput}
                        </div>
                        <div className="h-28 rounded-lg overflow-hidden border border-slate-800">
                          <Editor
                            height="100%"
                            language={omnikitLanguage}
                            theme="vs-dark"
                            value={omnikitResult.differentiatedChallenges.tier2_application.starterCode}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                          />
                        </div>
                      </div>
                    )}

                    {activeTierTab === "tier3" && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-purple-300">{omnikitResult.differentiatedChallenges.tier3_boss.title}</h4>
                        <p className="text-xs text-slate-300">{omnikitResult.differentiatedChallenges.tier3_boss.instructions}</p>
                        <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-200">
                          ⚡ <strong>Restrição Hardcore:</strong> {omnikitResult.differentiatedChallenges.tier3_boss.extraConstraint}
                        </div>
                        <div className="h-28 rounded-lg overflow-hidden border border-slate-800">
                          <Editor
                            height="100%"
                            language={omnikitLanguage}
                            theme="vs-dark"
                            value={omnikitResult.differentiatedChallenges.tier3_boss.starterCode}
                            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bug Hunt & SAEP Rubrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bug Hunt */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 shadow-xl">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-400" />
                        <h3 className="text-xs font-bold text-white">{omnikitResult.bugHuntChallenge.title}</h3>
                      </div>
                      <div className="h-28 rounded-lg overflow-hidden border border-slate-800">
                        <Editor
                          height="100%"
                          language={omnikitLanguage}
                          theme="vs-dark"
                          value={omnikitResult.bugHuntChallenge.brokenCode}
                          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11 }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        <strong className="text-rose-300">Erro Oculto:</strong> {omnikitResult.bugHuntChallenge.hiddenBugDescription}
                      </p>
                    </div>

                    {/* SAEP Rubrics */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 shadow-xl">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white">Matriz de Rubrica SAEP (Critérios)</h3>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {omnikitResult.saepRubricCriteria.map((r, i) => (
                          <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                            <span className="font-bold text-emerald-300">{r.dimension}</span>
                            <div className="grid grid-cols-2 gap-1.5 mt-1 text-slate-300">
                              <span className="bg-slate-900 p-1 rounded"><strong>Proficiente:</strong> {r.proficient}</span>
                              <span className="bg-slate-900 p-1 rounded"><strong>Avançado:</strong> {r.advanced}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                  <BookOpen className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce" />
                  <p>Configure os parâmetros e clique em <strong>"Gerar Omnikit Completo com 1-Clique"</strong> para materializar a aula.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CORREÇÃO TURBO EM LOTE (BATCH AUTO-GRADER) */}
        {/* ========================================================================= */}
        {activeTab === "turbo_batch" && (
          <motion.div
            key="turbo_batch"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Top Batch Action Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Correção em Lote Turbo & IA</h3>
                  <p className="text-xs text-slate-400">{batchActivityTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunTurboGrading}
                  disabled={isGradingBatch}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isGradingBatch ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Recalcular Lote com IA
                </button>

                <button
                  onClick={handleApproveAllSubmissions}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar Todos com 1-Clique
                </button>
              </div>
            </div>

            {/* Batch Metrics Grid */}
            {batchResult && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400">Total Submissões</span>
                  <span className="text-xl font-bold text-white">{batchResult.totalSubmissions}</span>
                </div>
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-emerald-400">Média da Turma</span>
                  <span className="text-xl font-bold text-emerald-300">{batchResult.averageScore}/100</span>
                </div>
                <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-emerald-400">Aprovados</span>
                  <span className="text-xl font-bold text-emerald-400">{batchResult.approvedCount}</span>
                </div>
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-amber-400">Em Revisão</span>
                  <span className="text-xl font-bold text-amber-400">{batchResult.needsReviewCount}</span>
                </div>
                <div className="bg-slate-900/80 border border-rose-500/20 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-rose-400">Recuperação</span>
                  <span className="text-xl font-bold text-rose-400">{batchResult.recoveryCount}</span>
                </div>
              </div>
            )}

            {/* Submissions List & Inspector View */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Student List */}
              <div className="w-full lg:w-96 shrink-0 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Submissões Recebidas</span>
                {batchResult?.gradedSubmissions.map(sub => {
                  const isSelected = selectedSubmission?.studentId === sub.studentId;
                  const isApproved = sub.status === "approved";
                  const isRecovery = sub.status === "recovery_suggested";

                  return (
                    <div
                      key={sub.studentId}
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setEditedFeedback(sub.pedagogicalFeedback || "");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-slate-800/90 border-emerald-500 shadow-md"
                          : "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                          {sub.studentName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{sub.studentName}</h4>
                          <span className="text-[10px] text-slate-400">{sub.submissionDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isApproved ? "bg-emerald-500/20 text-emerald-300" : isRecovery ? "bg-rose-500/20 text-rose-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {sub.evaluatedScore} pts
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Code & Feedback Inspector */}
              <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                {selectedSubmission ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-mono text-emerald-400">Inspecionando Submissão</span>
                        <h3 className="text-sm font-bold text-white">{selectedSubmission.studentName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">Nota Sugerida:</span>
                        <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 font-mono">
                          {selectedSubmission.evaluatedScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Code Viewer */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-slate-300">Código Enviado pelo Aluno:</span>
                      <div className="h-44 rounded-lg overflow-hidden border border-slate-800">
                        <Editor
                          height="100%"
                          language="javascript"
                          theme="vs-dark"
                          value={selectedSubmission.submittedCode}
                          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12 }}
                        />
                      </div>
                    </div>

                    {/* Rubric Breakdown */}
                    {selectedSubmission.rubricScores && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Lógica</span>
                          <span className="text-xs font-bold text-emerald-400">{selectedSubmission.rubricScores.logic}/25</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Sintaxe</span>
                          <span className="text-xs font-bold text-indigo-400">{selectedSubmission.rubricScores.syntax}/25</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Clean Code</span>
                          <span className="text-xs font-bold text-amber-400">{selectedSubmission.rubricScores.bestPractices}/25</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block">Eficiência</span>
                          <span className="text-xs font-bold text-purple-400">{selectedSubmission.rubricScores.efficiency}/25</span>
                        </div>
                      </div>
                    )}

                    {/* Strengths and Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-xs font-bold text-emerald-300 block mb-1">✨ Pontos Fortes</span>
                        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                          {selectedSubmission.strengths?.map((st, i) => <li key={i}>{st}</li>)}
                        </ul>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <span className="text-xs font-bold text-amber-300 block mb-1">🔍 Oportunidades de Melhoria</span>
                        <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                          {selectedSubmission.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Editable Feedback */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Feedback Pedagógico Formatado para Envio:</span>
                        <button
                          onClick={handleSaveFeedbackEdit}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Salvar Edição
                        </button>
                      </span>
                      <textarea
                        rows={3}
                        value={editedFeedback}
                        onChange={e => setEditedFeedback(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-400">Selecione uma submissão para inspecionar.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DISPARADOR DE FEEDBACKS INTELIGENTES */}
        {/* ========================================================================= */}
        {activeTab === "feedback_dispatcher" && (
          <motion.div
            key="feedback_dispatcher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Disparador Multi-Canal de Feedbacks & Planos de Ação
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Envia mensagens calibradas de acordo com a performance de cada estudante (Portal do Aluno, E-mail ou WhatsApp).
                </p>
              </div>

              <button
                onClick={handleDispatchFeedbackCampaign}
                disabled={isDispatching}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
              >
                {isDispatching ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Disparar Campanha para a Turma (1-Clique)
              </button>
            </div>

            {campaignResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaignResult.recipients.map(r => (
                  <div key={r.studentId} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {r.studentName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">{r.studentName}</h4>
                            <span className="text-[10px] text-slate-400">{r.channel.toUpperCase()} • Nota {r.score}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.category === "high_performer"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : r.category === "struggling"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-indigo-500/20 text-indigo-300"
                          }`}
                        >
                          {r.category === "high_performer" ? "Alta Performance" : r.category === "struggling" ? "Reforço Necessário" : "Regular"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 italic">
                        "{r.personalizedMessage}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] border-t border-slate-800 pt-2 text-slate-400">
                      <span><strong>Ação sugerida:</strong> {r.suggestedAction}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pronto para Disparo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                Clique em <strong>"Disparar Campanha para a Turma (1-Clique)"</strong> para gerar e despachar os comunicados.
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: INTERVENÇÃO PREVENTIVA & RETENÇÃO ZERO */}
        {/* ========================================================================= */}
        {activeTab === "preventive_intervention" && (
          <motion.div
            key="preventive_intervention"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Left Controls */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Alunos Sinalizados pelo Radar
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Selecione o Estudante em Atenção</label>
                  <select
                    value={studentAtRisk}
                    onChange={e => setStudentAtRisk(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Mariana Oliveira Costa">Mariana Oliveira Costa (Score: 48 - Crítico)</option>
                    <option value="Carlos Eduardo Santos">Carlos Eduardo Santos (Score: 65 - Atenção)</option>
                    <option value="Lucas Ferreira Lima">Lucas Ferreira Lima (Score: 68 - Atenção)</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateIntervention}
                  disabled={isGeneratingIntervention}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-all disabled:opacity-50"
                >
                  {isGeneratingIntervention ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Gerar Plano de Recuperação 1-Clique
                </button>
              </div>
            </div>

            {/* Right Plan View */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
              {interventionPlan ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-rose-400">Dossiê de Intervenção Precoce</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{interventionPlan.studentName}</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Risco {interventionPlan.riskLevel} ({interventionPlan.riskScore}%)
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-amber-300">Diagnóstico de Causas-Raiz:</span>
                    <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                      {interventionPlan.rootCauses.map((rc, i) => (
                        <li key={i}>{rc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Micro Tracks */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-slate-300">Micro-Trilhas de Recuperação Paralela (Portal do Aluno):</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interventionPlan.recommendedMicroTracks.map((track, i) => (
                        <div key={i} className="p-3 bg-slate-950 rounded-xl border border-emerald-500/20 flex flex-col justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase">{track.type} • {track.durationMinutes} min</span>
                            <h4 className="text-xs font-bold text-white mt-0.5">{track.moduleTitle}</h4>
                          </div>
                          <button
                            onClick={() => toast.success(`Módulo '${track.moduleTitle}' vinculado ao perfil de ${interventionPlan.studentName}!`)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> {track.directLinkText}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Peer Mentor Pairing */}
                  {interventionPlan.peerMentorAssigned && (
                    <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-6 h-6 text-indigo-400" />
                        <div>
                          <span className="text-xs font-bold text-indigo-200">
                            Mentor de Dupla Sugerido: {interventionPlan.peerMentorAssigned.name}
                          </span>
                          <p className="text-[11px] text-indigo-300/80">{interventionPlan.peerMentorAssigned.rationale}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success("Notificação enviada para a dupla de mentoria!")}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shrink-0"
                      >
                        Ativar Dupla
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-slate-400">Carregando plano...</div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: QUIZ BLITZ RELÂMPAGO (KAHOOT-STYLE) */}
        {/* ========================================================================= */}
        {activeTab === "live_quiz" && (
          <motion.div
            key="live_quiz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  Quiz Blitz Relâmpago (Engajamento em Sala com 1-Clique)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gere desafios interativos com PIN ao vivo para iniciar ou fechar a aula com alta energia.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={quizTopic}
                  onChange={e => setQuizTopic(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-64"
                  placeholder="Tópico do Quiz..."
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGeneratingQuiz}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isGeneratingQuiz ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Gerar Novo Blitz
                </button>
              </div>
            </div>

            {quizResult && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-purple-400 uppercase">Sala de Jogo Ativa</span>
                    <h2 className="text-lg font-bold text-white">{quizResult.title}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-2 text-center">
                      <span className="text-[10px] text-purple-300 block font-mono">PIN DA SALA</span>
                      <span className="text-xl font-black text-purple-200 tracking-widest">{quizResult.pinCode}</span>
                    </div>
                  </div>
                </div>

                {/* Question Navigation */}
                <div className="flex items-center gap-2">
                  {quizResult.questions.map((q, idx) => (
                    <button
                      key={q.questionId}
                      onClick={() => setActiveQuizQuestion(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        activeQuizQuestion === idx
                          ? "bg-purple-600 text-white shadow-md shadow-purple-900/50"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      Questão {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Active Question Display */}
                {quizResult.questions[activeQuizQuestion] && (
                  <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col gap-5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                        <Clock className="w-4 h-4" /> {quizResult.questions[activeQuizQuestion].timeLimitSeconds}s por resposta
                      </span>
                      <span className="font-mono text-emerald-400">+{quizResult.questions[activeQuizQuestion].points} pts</span>
                    </div>

                    <h3 className="text-base font-bold text-white text-center py-2">
                      {quizResult.questions[activeQuizQuestion].question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quizResult.questions[activeQuizQuestion].options.map((opt, i) => {
                        const isCorrect = i === quizResult.questions[activeQuizQuestion].correctOptionIndex;
                        const colors = [
                          "border-rose-500/30 bg-rose-500/10 text-rose-200",
                          "border-blue-500/30 bg-blue-500/10 text-blue-200",
                          "border-amber-500/30 bg-amber-500/10 text-amber-200",
                          "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        ];

                        return (
                          <div
                            key={i}
                            className={`p-4 rounded-xl border flex items-center justify-between font-semibold text-xs ${colors[i % 4]} ${
                              isCorrect ? "ring-2 ring-emerald-500" : ""
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && (
                              <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                                GABARITO
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <strong className="text-emerald-400">Explicação Pedagógica:</strong> {quizResult.questions[activeQuizQuestion].explanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DIÁRIO OFICIAL 1-CLIQUE */}
        {/* ========================================================================= */}
        {activeTab === "smart_diary" && (
          <motion.div
            key="smart_diary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col lg:flex-row gap-6"
          >
            {/* Left Params */}
            <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Parâmetros do Diário
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Turma</label>
                  <input
                    type="text"
                    value={diaryClassName}
                    onChange={e => setDiaryClassName(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Tema da Aula</label>
                  <input
                    type="text"
                    value={diaryTopic}
                    onChange={e => setDiaryTopic(e.target.value)}
                    className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleGenerateDiary}
                  disabled={isGeneratingDiary}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  {isGeneratingDiary ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Sintetizar Diário de Classe Oficial
                </button>
              </div>
            </div>

            {/* Right Diary Preview */}
            <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
              {diaryResult ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-emerald-400">Diário Institucional Padronizado</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{diaryResult.className}</h3>
                    </div>
                    <button
                      onClick={() => handleCopy(diaryResult.formalInstitutionalText, "diary-text")}
                      className="py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition-all"
                    >
                      {copiedKey === "diary-text" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar Texto Oficial para o Diário
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Data</span>
                      <span className="text-xs font-bold text-white">{diaryResult.date}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Carga Horária</span>
                      <span className="text-xs font-bold text-white">{diaryResult.hoursTaught}h / aula</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Presença</span>
                      <span className="text-xs font-bold text-emerald-400">{diaryResult.attendanceSummary.ratePercent}% ({diaryResult.attendanceSummary.present}/{diaryResult.attendanceSummary.totalEnrolled})</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block">Status</span>
                      <span className="text-xs font-bold text-indigo-400">Pronto p/ Envio</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-400">Texto Formal Institucional:</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-serif bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {diaryResult.formalInstitutionalText}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-indigo-300">Metodologia e Observações Pedagógicas:</span>
                    <p className="text-xs text-slate-300">{diaryResult.methodologyApplied}</p>
                    <p className="text-xs text-slate-400 mt-1 italic">{diaryResult.pedagogicalObservations}</p>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-slate-400">Carregando registro do diário...</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
