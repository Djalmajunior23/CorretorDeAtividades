import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Sparkles,
  Brain,
  ShieldCheck,
  Layers,
  Presentation,
  Mic,
  MicOff,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Users,
  Code2,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  BookOpen,
  Award,
  BarChart3,
  HelpCircle,
  Copy,
  Terminal,
  Send,
  Sliders,
  Compass
} from "lucide-react";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function TeacherAiPowerhouseView() {
  const [activeTab, setActiveTab] = useState<
    "socratic" | "forensics" | "clustering" | "lessons" | "audio_diary" | "adaptive_quiz"
  >("socratic");

  // ==========================================
  // 1. SOCRATIC ORAL DEFENSE STATE
  // ==========================================
  const [socraticCode, setSocraticCode] = useState(
    `def processar_pedidos(pedidos):\n    # Processamento de lista de compras\n    total = 0\n    for p in pedidos:\n        if p.get('status') == 'pago' and p.get('valor', 0) >= 60:\n            total += p['valor']\n    return total`
  );
  const [socraticStudentName, setSocraticStudentName] = useState("Carlos Henrique Souza");
  const [socraticQuestions, setSocraticQuestions] = useState<any[]>([]);
  const [socraticAnswers, setSocraticAnswers] = useState<{ [key: string]: string }>({});
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluatingDefense, setIsEvaluatingDefense] = useState(false);
  const [defenseResult, setDefenseResult] = useState<any | null>(null);

  // ==========================================
  // 2. CODE FORENSICS STATE
  // ==========================================
  const [forensicsCode, setForensicsCode] = useState(
    `def binary_search_recursive(arr, low, high, x):\n    """\n    Executa busca binária recursiva com complexidade temporal O(log n).\n    Parâmetros:\n        arr (list): Lista ordenada de elementos inteiros.\n        low (int): Índice inicial de busca.\n        high (int): Índice final de busca.\n        x (int): Valor alvo a ser localizado.\n    Retorna:\n        int: Índice do elemento ou -1 se não encontrado.\n    """\n    if high >= low:\n        mid = (high + low) // 2\n        if arr[mid] == x:\n            return mid\n        elif arr[mid] > x:\n            return binary_search_recursive(arr, low, mid - 1, x)\n        else:\n            return binary_search_recursive(arr, mid + 1, high, x)\n    else:\n        return -1`
  );
  const [forensicsLanguage, setForensicsLanguage] = useState("python");
  const [isAnalyzingForensics, setIsAnalyzingForensics] = useState(false);
  const [forensicsReport, setForensicsReport] = useState<any | null>(null);

  // ==========================================
  // 3. SEMANTIC CLUSTERING STATE
  // ==========================================
  const [isClustering, setIsClustering] = useState(false);
  const [clustersData, setClustersData] = useState<any | null>(null);
  const [selectedClusterForBulk, setSelectedClusterForBulk] = useState<any | null>(null);
  const [bulkGrade, setBulkGrade] = useState(90);
  const [bulkFeedback, setBulkFeedback] = useState("");
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // ==========================================
  // 4. LESSONS & SLIDES STATE
  // ==========================================
  const [lessonTopic, setLessonTopic] = useState("Recursão e Estruturas de Árvores");
  const [lessonDuration, setLessonDuration] = useState(90);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonData, setLessonData] = useState<any | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreenSlide, setIsFullscreenSlide] = useState(false);

  // ==========================================
  // 5. AUDIO CLASS DIARY STATE
  // ==========================================
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState(
    "Hoje na aula de Desenvolvimento de Sistemas ministrei Modelagem Relacional e scripts DDL em SQL. Criamos tabelas com chaves primárias e estrangeiras. A turma participou muito bem, mas os discentes tiveram dúvidas em ON DELETE CASCADE e na ordem de criação de tabelas dependentes."
  );
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [audioDiaryResult, setAudioDiaryResult] = useState<any | null>(null);
  const [isSavingDiary, setIsSavingDiary] = useState(false);

  // ==========================================
  // 6. ADAPTIVE QUIZ STATE
  // ==========================================
  const [quizTopic, setQuizTopic] = useState("Estruturas de Controle e Lógica");
  const [quizSession, setQuizSession] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [quizScoreStats, setQuizScoreStats] = useState({ correct: 0, total: 0 });
  const [quizCompletedResult, setQuizCompletedResult] = useState<any | null>(null);
  const [isLoadingQuizStep, setIsLoadingQuizStep] = useState(false);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // 1. Socratic
  const handleGenerateSocraticQuestions = async () => {
    setIsGeneratingQuestions(true);
    setDefenseResult(null);
    try {
      const res = await fetch(apiUrl("/api/ai/socratic/generate-questions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: socraticCode,
          student_name: socraticStudentName,
          language: "python"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.questions) {
        setSocraticQuestions(data.questions);
        toast.success("3 perguntas socráticas de autoria geradas pela IA!");
      }
    } catch (e: any) {
      toast.error("Erro ao gerar perguntas socráticas: " + e.message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEvaluateSocraticDefense = async () => {
    setIsEvaluatingDefense(true);
    try {
      const formattedAnswers = socraticQuestions.map((q) => ({
        question: q.question,
        answer: socraticAnswers[q.id] || "Explicação padrão do aluno demonstrando domínio do fluxo e das condicionais."
      }));

      const res = await fetch(apiUrl("/api/ai/socratic/evaluate-defense"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: socraticStudentName,
          code: socraticCode,
          answers: formattedAnswers
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.success) {
        setDefenseResult(data);
        toast.success(`Defesa avaliada! Domínio Cognitivo: ${data.cognitive_mastery_pct}%`);
      }
    } catch (e: any) {
      toast.error("Erro ao avaliar defesa: " + e.message);
    } finally {
      setIsEvaluatingDefense(false);
    }
  };

  const handleExportDefensePdf = async () => {
    try {
      const res = await fetch(apiUrl("/api/ai/socratic/export-defense-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: socraticStudentName,
          result: defenseResult
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_banca_${socraticStudentName.replace(/\s+/g, "_")}.pdf`;
        a.click();
        toast.success("Laudo de Defesa Socrática baixado com sucesso!");
      }
    } catch (e: any) {
      toast.error("Falha ao exportar PDF: " + e.message);
    }
  };

  // 2. Forensics
  const handleAnalyzeForensics = async () => {
    setIsAnalyzingForensics(true);
    try {
      const res = await fetch(apiUrl("/api/ai/forensics/analyze-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: forensicsCode,
          language: forensicsLanguage,
          student_name: "Aluno Sob Auditoria"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.success) {
        setForensicsReport(data);
        toast.success("Auditoria forense de código concluída!");
      }
    } catch (e: any) {
      toast.error("Erro na análise forense: " + e.message);
    } finally {
      setIsAnalyzingForensics(false);
    }
  };

  // 3. Clustering
  const handleRunClustering = async () => {
    setIsClustering(true);
    try {
      const res = await fetch(apiUrl("/api/ai/clustering/group-submissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_title: "Laboratório de Algoritmos e Filtragem",
          class_name: "Desenvolvimento de Sistemas 1A"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.clusters) {
        setClustersData(data);
        toast.success(`${data.clusters_count} clusters semânticos identificados!`);
      }
    } catch (e: any) {
      toast.error("Erro no agrupamento semântico: " + e.message);
    } finally {
      setIsClustering(false);
    }
  };

  const handleApplyBulkFeedback = async () => {
    if (!selectedClusterForBulk) return;
    setIsApplyingBulk(true);
    try {
      const res = await fetch(apiUrl("/api/ai/clustering/apply-bulk-feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cluster_id: selectedClusterForBulk.cluster_id,
          grade: bulkGrade,
          feedback: bulkFeedback || selectedClusterForBulk.suggested_feedback,
          student_ids: selectedClusterForBulk.students
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.success) {
        toast.success(`Nota ${bulkGrade} e feedback em lote aplicados para ${data.students_affected_count} alunos!`);
        setSelectedClusterForBulk(null);
      }
    } catch (e: any) {
      toast.error("Erro ao aplicar feedback em massa: " + e.message);
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // 4. Lessons & Slides
  const handleGenerateLesson = async () => {
    setIsGeneratingLesson(true);
    try {
      const res = await fetch(apiUrl("/api/ai/lessons/generate-plan-and-slides"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: lessonTopic,
          duration_minutes: lessonDuration,
          course_name: "Técnico em Desenvolvimento de Sistemas"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.slides) {
        setLessonData(data);
        setCurrentSlideIndex(0);
        toast.success(`Aula e ${data.slides_count} slides interativos gerados com sucesso!`);
      }
    } catch (e: any) {
      toast.error("Erro ao gerar aula: " + e.message);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleExportHandoutPdf = async () => {
    try {
      const res = await fetch(apiUrl("/api/ai/lessons/export-handout-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: lessonTopic,
          lesson_plan: lessonData?.lesson_plan
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `apostila_${lessonTopic.replace(/\s+/g, "_")}.pdf`;
        a.click();
        toast.success("Apostila e plano de aula baixados em PDF!");
      }
    } catch (e: any) {
      toast.error("Falha ao exportar apostila: " + e.message);
    }
  };

  // 5. Audio Diary
  const handleSynthesizeAudio = async () => {
    setIsSynthesizingAudio(true);
    try {
      const res = await fetch(apiUrl("/api/ai/audio-diary/synthesize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_transcript: audioTranscript,
          class_name: "Desenvolvimento de Sistemas 1A"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.diary) {
        setAudioDiaryResult(data.diary);
        toast.success("Síntese de aula estruturada para o Diário Oficial!");
      }
    } catch (e: any) {
      toast.error("Erro ao sintetizar áudio: " + e.message);
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  const handleSaveToDiary = async () => {
    if (!audioDiaryResult) return;
    setIsSavingDiary(true);
    try {
      const res = await fetch(apiUrl("/api/ai/audio-diary/save-to-diary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diary: audioDiaryResult })
      });
      const data = await safeJsonResponse(res);
      if (data && data.success) {
        toast.success("Registro persistido com sucesso no Diário de Classe!");
      }
    } catch (e: any) {
      toast.error("Erro ao salvar diário: " + e.message);
    } finally {
      setIsSavingDiary(false);
    }
  };

  // 6. Adaptive Quiz
  const handleStartAdaptiveQuiz = async () => {
    setIsLoadingQuizStep(true);
    setQuizCompletedResult(null);
    setQuizScoreStats({ correct: 0, total: 0 });
    setSelectedOptionId(null);
    try {
      const res = await fetch(apiUrl("/api/ai/adaptive-quiz/start"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTopic,
          student_name: "Carlos Henrique"
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.first_question) {
        setQuizSession(data.first_question);
        setCurrentQuestion(data.first_question);
        toast.success("Sessão adaptativa iniciada no Nível 1!");
      }
    } catch (e: any) {
      toast.error("Erro ao iniciar quiz adaptativo: " + e.message);
    } finally {
      setIsLoadingQuizStep(false);
    }
  };

  const handleAnswerQuizQuestion = async () => {
    if (!currentQuestion || !selectedOptionId) {
      toast.error("Por favor, selecione uma alternativa.");
      return;
    }

    const chosenOption = currentQuestion.options.find((o: any) => o.id === selectedOptionId);
    const isCorrect = chosenOption?.is_correct || false;

    const newCorrect = quizScoreStats.correct + (isCorrect ? 1 : 0);
    const newTotal = quizScoreStats.total + 1;
    setQuizScoreStats({ correct: newCorrect, total: newTotal });

    if (isCorrect) {
      toast.success("Correto! A IA elevará o nível de complexidade.");
    } else {
      toast.warning("Resposta incorreta. A IA ramificará para reforço guiado.");
    }

    setIsLoadingQuizStep(true);
    try {
      const res = await fetch(apiUrl("/api/ai/adaptive-quiz/next-question"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: quizSession?.session_id,
          current_step: currentQuestion.step || currentQuestion.current_step || 1,
          is_correct: isCorrect,
          current_level: currentQuestion.level || currentQuestion.current_level
        })
      });
      const data = await safeJsonResponse(res);
      if (data && data.is_completed) {
        // Conclude quiz
        const finishRes = await fetch(apiUrl("/api/ai/adaptive-quiz/finish"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: quizSession?.session_id,
            correct_count: newCorrect,
            total_count: newTotal
          })
        });
        const finishData = await safeJsonResponse(finishRes);
        setQuizCompletedResult(finishData);
        setCurrentQuestion(null);
      } else if (data && data.adapted_question) {
        setCurrentQuestion(data.adapted_question);
        setSelectedOptionId(null);
      }
    } catch (e: any) {
      toast.error("Erro ao transicionar pergunta: " + e.message);
    } finally {
      setIsLoadingQuizStep(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-slate-100 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-500/20 p-8 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 font-mono text-xs font-bold border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                ACADEMIC AI POWERHOUSE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                Padrão SENAI • Aprovação &ge; 60 pts
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-display">
              Suíte de Alta Inteligência Docente
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Recursos de IA de alto impacto: Arguição Socrática de Autoria, Detector Forense de Códigos Sintéticos, Agrupamento Semântico da Turma, Gerador de Aulas/Slides, Síntese de Diário por Áudio e Quizzes Adaptativos em Tempo Real.
            </p>
          </div>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pt-6 mt-4 border-t border-slate-800/80">
          {[
            { id: "socratic", label: "Banca Socrática & Autoria", icon: Brain, badge: "Anti-Cópia" },
            { id: "forensics", label: "Forense de IA & Estilometria", icon: ShieldCheck, badge: "Estilometria" },
            { id: "clustering", label: "Clusters Semânticos", icon: Layers, badge: "Lote IA" },
            { id: "lessons", label: "Arquiteto de Aulas & Slides", icon: Presentation, badge: "Tela Cheia" },
            { id: "audio_diary", label: "Diário por Áudio / Voz", icon: Mic, badge: "Transcrição" },
            { id: "adaptive_quiz", label: "Quizzes Adaptativos", icon: Compass, badge: "Tempo Real" }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 border border-violet-400/40 scale-[1.02]"
                    : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60 hover:border-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SOCRATIC ORAL DEFENSE SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "socratic" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left Column: Code & Student input */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Código Submetido pelo Discente</h3>
                </div>
                <input
                  type="text"
                  value={socraticStudentName}
                  onChange={(e) => setSocraticStudentName(e.target.value)}
                  placeholder="Nome do Aluno"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-violet-300 font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <textarea
                rows={10}
                value={socraticCode}
                onChange={(e) => setSocraticCode(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-violet-500 resize-none scrollbar-thin"
              />

              <button
                onClick={handleGenerateSocraticQuestions}
                disabled={isGeneratingQuestions}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-xs font-mono text-white shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingQuestions ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Elaborando Arguição Socrática com IA...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Gerar Perguntas de Autoria (Banca Virtual)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Socratic Questions, Answers & Result */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {socraticQuestions.length === 0 ? (
              <div className="h-full min-h-[360px] rounded-3xl border border-dashed border-slate-800 bg-[#0b0f24]/50 p-8 flex flex-col items-center justify-center text-center">
                <Brain className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">Nenhuma arguição socrática ativa</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Clique no botão ao lado para a IA analisar o código e formular 3 perguntas cirúrgicas sobre decisões de projeto e casos de borda.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Perguntas Socráticas de Defesa ({socraticQuestions.length})
                  </h3>
                  <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 font-bold">
                    Domínio Cognitivo
                  </span>
                </div>

                <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                  {socraticQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-[#030712] border border-slate-800/80 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-violet-400 uppercase tracking-wider">
                          Pergunta #{idx + 1} • {q.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Peso: {q.weight} pts</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 leading-relaxed">{q.question}</p>
                      <div className="text-[10px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                        💡 Guia para o Docente: {q.hint_for_teacher}
                      </div>
                      <input
                        type="text"
                        placeholder="Resposta transcrita do discente (ou áudio)..."
                        value={socraticAnswers[q.id] || ""}
                        onChange={(e) => setSocraticAnswers({ ...socraticAnswers, [q.id]: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500 mt-1"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleEvaluateSocraticDefense}
                  disabled={isEvaluatingDefense}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-xs font-mono text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isEvaluatingDefense ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Calculando Índice de Domínio Cognitivo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Avaliar Domínio & Emitir Veredito
                    </>
                  )}
                </button>

                {defenseResult && (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/30 flex flex-col gap-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase font-mono">Índice de Domínio Cognitivo</span>
                      <span className="text-xl font-black font-mono text-violet-400">
                        {defenseResult.cognitive_mastery_pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${defenseResult.cognitive_mastery_pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-300 font-medium leading-relaxed">
                      {defenseResult.defense_verdict}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {defenseResult.authorship_confidence}
                      </span>
                      <button
                        onClick={handleExportDefensePdf}
                        className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 font-mono text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Laudo PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CODE FORENSICS & PROVENANCE SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "forensics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Inspeção Forense de Código</h3>
                </div>
                <select
                  value={forensicsLanguage}
                  onChange={(e) => setForensicsLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <textarea
                rows={12}
                value={forensicsCode}
                onChange={(e) => setForensicsCode(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 resize-none scrollbar-thin"
              />

              <button
                onClick={handleAnalyzeForensics}
                disabled={isAnalyzingForensics}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-xs font-mono text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingForensics ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando Entropia e Estilometria...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Executar Auditoria Forense com IA
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            {!forensicsReport ? (
              <div className="h-full min-h-[360px] rounded-3xl border border-dashed border-slate-800 bg-[#0b0f24]/50 p-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">Aguardando análise forense</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  O detector forense avaliará taxa de entropia, padrões de docstring e anomalia em relação ao histórico do aluno.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Resultado da Auditoria</h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                    forensicsReport.llm_generated_probability < 40 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}>
                    {forensicsReport.llm_generated_probability}% Probabilidade IA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#030712] rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 font-mono">Confiança Autenticidade</span>
                    <span className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                      {forensicsReport.authenticity_confidence}%
                    </span>
                  </div>
                  <div className="p-3 bg-[#030712] rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 font-mono">Entropia de Tokens</span>
                    <span className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                      {forensicsReport.token_entropy_score}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 bg-[#030712] rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Estilometria de Código</span>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Convenção de Nomes:</span>
                    <span className="font-mono text-cyan-300">{forensicsReport.stylometry.naming_convention_consistency}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Proporção Comentários:</span>
                    <span className="font-mono text-cyan-300">{forensicsReport.stylometry.comment_to_code_ratio}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>Complexidade Ciclomática:</span>
                    <span className="font-mono text-cyan-300">{forensicsReport.stylometry.cyclomatic_complexity} pts</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-white block mb-1">Veredito do Modelo Forense:</span>
                  {forensicsReport.overall_verdict}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEMANTIC CODE CLUSTERING SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "clustering" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0b0f24] border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Agrupamento Semântico de Resoluções da Turma</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                A IA analisa 30-40 códigos da turma e os agrupa automaticamente por similaridade arquitetural e algorítmica para correção em massa.
              </p>
            </div>
            <button
              onClick={handleRunClustering}
              disabled={isClustering}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs font-mono text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isClustering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Agrupando Resoluções...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Clusterizar Turma em 1 Clique
                </>
              )}
            </button>
          </div>

          {!clustersData ? (
            <div className="py-20 text-center rounded-3xl border border-dashed border-slate-800 bg-[#0b0f24]/30 flex flex-col items-center justify-center">
              <Layers className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-300">Nenhum agrupamento gerado ainda</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Clique em "Clusterizar Turma em 1 Clique" para segmentar a turma por estratégias algorítmicas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {clustersData.clusters.map((cluster: any) => (
                <div key={cluster.cluster_id} className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <h4 className="text-sm font-bold text-white">{cluster.name}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono font-bold">
                      {cluster.count} alunos ({cluster.percentage}%)
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Padrão Arquitetural Representativo</span>
                    <pre className="p-3 bg-[#030712] rounded-xl border border-slate-800/80 text-xs font-mono text-indigo-200 overflow-x-auto">
                      {cluster.representative_snippet}
                    </pre>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-400 mr-1">Discentes:</span>
                    {cluster.students.map((st: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-300">
                        {st}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-xs text-slate-300">
                    <span className="font-bold text-white block mb-0.5">Sugestão de Feedback Coletivo:</span>
                    <p className="italic text-[11px] text-slate-400">"{cluster.suggested_feedback}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      Média estimada: {cluster.average_grade} pts
                    </span>
                    <button
                      onClick={() => {
                        setSelectedClusterForBulk(cluster);
                        setBulkGrade(Math.round(cluster.average_grade));
                        setBulkFeedback(cluster.suggested_feedback);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <Send className="w-3.5 h-3.5" /> Corrigir em Lote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bulk Feedback Modal */}
          {selectedClusterForBulk && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white font-mono">Correção em Lote do Cluster</h3>
                  <button onClick={() => setSelectedClusterForBulk(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-300">Cluster Alvo</span>
                  <span className="text-xs text-indigo-400 font-mono">{selectedClusterForBulk.name} ({selectedClusterForBulk.count} alunos)</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Nota a ser Atribuída (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bulkGrade}
                    onChange={(e) => setBulkGrade(parseInt(e.target.value) || 0)}
                    className="bg-[#030712] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-300">Feedback Didático Coletivo</label>
                  <textarea
                    rows={4}
                    value={bulkFeedback}
                    onChange={(e) => setBulkFeedback(e.target.value)}
                    className="bg-[#030712] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedClusterForBulk(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleApplyBulkFeedback}
                    disabled={isApplyingBulk}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono flex items-center gap-2"
                  >
                    {isApplyingBulk ? "Aplicando..." : "Disparar Notas e Feedbacks"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. LESSONS & SLIDES ARCHITECT SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "lessons" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-[#0b0f24] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder="Tema da Aula (ex: Recursão e Árvores AVL)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
              />
              <select
                value={lessonDuration}
                onChange={(e) => setLessonDuration(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 font-mono"
              >
                <option value={50}>50 Minutos (1 Aula)</option>
                <option value={90}>90 Minutos (2 Aulas)</option>
                <option value={100}>100 Minutos (Bloco Completo)</option>
              </select>
            </div>
            <button
              onClick={handleGenerateLesson}
              disabled={isGeneratingLesson}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-bold text-xs font-mono text-white shadow-lg shadow-violet-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isGeneratingLesson ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Estruturando Aula & Slides...
                </>
              ) : (
                <>
                  <Presentation className="w-4 h-4" />
                  Gerar Plano & Apresentação
                </>
              )}
            </button>
          </div>

          {lessonData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Timeline Card */}
              <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Cronograma Didático</h4>
                  <button
                    onClick={handleExportHandoutPdf}
                    className="px-3 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Apostila PDF
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {lessonData.lesson_plan.timeline.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#030712] rounded-2xl border border-slate-800/80 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-violet-400">{item.time_slot}</span>
                        <span className="text-xs font-bold text-white">{item.phase}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Presentation Slides Deck */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col justify-between shadow-xl min-h-[420px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">Apresentação de Slides</span>
                    <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                      Slide {currentSlideIndex + 1} de {lessonData.slides.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsFullscreenSlide(!isFullscreenSlide)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title={isFullscreenSlide ? "Sair da Tela Cheia" : "Apresentar em Tela Cheia"}
                  >
                    {isFullscreenSlide ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Active Slide Body */}
                <div className="py-6 flex flex-col gap-4">
                  <h3 className="text-xl font-black text-white font-display">
                    {lessonData.slides[currentSlideIndex].title}
                  </h3>
                  {lessonData.slides[currentSlideIndex].subtitle && (
                    <p className="text-xs text-violet-300 font-mono font-semibold">
                      {lessonData.slides[currentSlideIndex].subtitle}
                    </p>
                  )}

                  <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-4 list-disc">
                    {lessonData.slides[currentSlideIndex].bullets.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>

                  {lessonData.slides[currentSlideIndex].code_snippet && (
                    <pre className="p-3.5 rounded-xl bg-[#030712] border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                      {lessonData.slides[currentSlideIndex].code_snippet}
                    </pre>
                  )}

                  {lessonData.slides[currentSlideIndex].teacher_notes && (
                    <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20 text-[10px] font-mono text-violet-300">
                      🎙️ Nota do Professor: {lessonData.slides[currentSlideIndex].teacher_notes}
                    </div>
                  )}
                </div>

                {/* Slides Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-xs font-mono text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <div className="flex items-center gap-1.5">
                    {lessonData.slides.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                          currentSlideIndex === idx ? "bg-violet-500 w-6" : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(lessonData.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === lessonData.slides.length - 1}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIO CLASS DIARY SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "audio_diary" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Gravação / Transcrição de Aula</h3>
                </div>
                <button
                  onClick={() => {
                    const next = !isRecordingAudio;
                    setIsRecordingAudio(next);
                    if (next) toast.info("Simulando gravação de voz...");
                    else toast.success("Áudio capturado com sucesso!");
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRecordingAudio
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                  }`}
                >
                  {isRecordingAudio ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecordingAudio ? "Gravando..." : "Gravar Áudio"}
                </button>
              </div>

              <textarea
                rows={8}
                value={audioTranscript}
                onChange={(e) => setAudioTranscript(e.target.value)}
                placeholder="Fale ou digite as notas da aula..."
                className="w-full bg-[#030712] border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500 resize-none scrollbar-thin"
              />

              <button
                onClick={handleSynthesizeAudio}
                disabled={isSynthesizingAudio}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 font-bold text-xs font-mono text-white shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSynthesizingAudio ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sintetizando Competências e Diário...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sintetizar com IA para o Diário Oficial
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-5">
            {!audioDiaryResult ? (
              <div className="h-full min-h-[360px] rounded-3xl border border-dashed border-slate-800 bg-[#0b0f24]/50 p-8 flex flex-col items-center justify-center text-center">
                <FileText className="w-12 h-12 text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">Aguardando síntese didática</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  A IA transformará suas notas de voz em um registro formal estruturado com competências mapeadas.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-6 flex flex-col gap-4 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Registro Formal de Diário</h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    Pronto para Salvar
                  </span>
                </div>

                <div className="p-3.5 bg-[#030712] rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  {audioDiaryResult.formal_summary}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Competências SENAI Abordadas:</span>
                  <div className="space-y-1">
                    {audioDiaryResult.competencies_covered.map((c: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                  <span className="font-bold block mb-0.5">Sugestão de Tarefa de Reforço:</span>
                  {audioDiaryResult.suggested_homework}
                </div>

                <button
                  onClick={handleSaveToDiary}
                  disabled={isSavingDiary}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSavingDiary ? "Salvando..." : "Salvar no Diário de Classe Oficial"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DYNAMIC ADAPTIVE QUIZ MATRIX SUBTAB */}
      {/* ========================================================================= */}
      {activeTab === "adaptive_quiz" && (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in">
          {!currentQuestion && !quizCompletedResult && (
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-8 flex flex-col items-center text-center gap-5 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <Compass className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">Quizzes Adaptativos em Tempo Real</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  Avaliações formativas interativas onde a próxima pergunta se calibra dinamicamente à proficiência demonstrada pelo discente.
                </p>
              </div>

              <input
                type="text"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                placeholder="Tema do Quiz (ex: Laços de Repetição e Arrays)"
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 text-center"
              />

              <button
                onClick={handleStartAdaptiveQuiz}
                disabled={isLoadingQuizStep}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-xs font-mono text-white shadow-xl shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" /> Iniciar Sessão Adaptativa
              </button>
            </div>
          )}

          {currentQuestion && (
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-8 flex flex-col gap-6 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  {currentQuestion.level || "Nível Adaptativo"}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Acertos: <strong className="text-emerald-400">{quizScoreStats.correct}</strong> / {quizScoreStats.total}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-base font-bold text-white leading-relaxed">
                  {currentQuestion.question_text}
                </h3>
                {currentQuestion.code_snippet && (
                  <pre className="p-4 bg-[#030712] rounded-2xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                    {currentQuestion.code_snippet}
                  </pre>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {currentQuestion.options.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`p-4 rounded-2xl border text-left text-xs font-mono transition-all flex items-center gap-3 cursor-pointer ${
                      selectedOptionId === opt.id
                        ? "bg-indigo-600/20 border-indigo-500 text-white font-bold shadow-md shadow-indigo-500/10"
                        : "bg-[#030712] border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      selectedOptionId === opt.id ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                    }`}>
                      {opt.id}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAnswerQuizQuestion}
                disabled={isLoadingQuizStep || !selectedOptionId}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs font-mono shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isLoadingQuizStep ? "Adaptando Próximo Desafio..." : "Confirmar Resposta & Adaptar"}
              </button>
            </div>
          )}

          {quizCompletedResult && (
            <div className="rounded-3xl border border-slate-800 bg-[#0b0f24] p-8 flex flex-col items-center text-center gap-5 shadow-2xl animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl font-bold text-emerald-400">
                {quizCompletedResult.final_grade}%
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">Quiz Adaptativo Concluído!</h3>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border inline-block mx-auto ${
                  quizCompletedResult.is_approved
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}>
                  {quizCompletedResult.status} ({quizCompletedResult.mastery_level})
                </span>
                <p className="text-xs text-slate-400 max-w-md mt-2">
                  {quizCompletedResult.message}
                </p>
              </div>

              <button
                onClick={() => {
                  setQuizCompletedResult(null);
                  setCurrentQuestion(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Novo Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
