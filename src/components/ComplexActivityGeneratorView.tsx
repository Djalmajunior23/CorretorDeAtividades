import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  BookOpen,
  FileText,
  Download,
  Share2,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Brain,
  Layers,
  Code2,
  Database,
  Briefcase,
  Mic,
  MicOff,
  Send,
  Copy,
  Plus,
  Play,
  Award,
  RefreshCw,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Target
} from "lucide-react";
import {
  ComplexActivity,
  ComplexActivityGeneratorService,
  PromptTestDriveResult,
  SaepRubricMatrix,
  VoiceFeedbackReport,
  AdaptiveTracksResult,
  BloomLevel,
  IndustrialSector,
  ActivityModality,
  DifficultyLevel
} from "../services/complexActivityService";

const BLOOM_LEVELS: BloomLevel[] = [
  "Lembrar/Entender",
  "Aplicação Prática",
  "Análise Crítica",
  "Avaliação de Soluções",
  "Criação de Sistemas"
];

const INDUSTRIAL_SECTORS: IndustrialSector[] = [
  "Fintech & Bancário",
  "Indústria 4.0 & Manufatura",
  "Saúde & Hospitalar",
  "E-Commerce de Alto Tráfego",
  "Logística & Supply Chain",
  "Smart Cities & IoT",
  "Geral / Acadêmico"
];

const MODALITIES: ActivityModality[] = [
  "Algoritmo / Código",
  "Banco de Dados / SQL & DDL",
  "Modelagem Conceitual / DER",
  "Arquitetura & Engenharia de Software"
];

const DIFFICULTIES: DifficultyLevel[] = [
  "Básico / Fundamentos",
  "Intermediário",
  "Avançado / Industrial",
  "Desafio SAEP SENAI"
];

export default function ComplexActivityGeneratorView() {
  const [activeTab, setActiveTab] = useState<"generator" | "testdrive" | "saep" | "voice" | "adaptive">("generator");

  // Generator State
  const [topic, setTopic] = useState<string>("Polimorfismo e Classes Abstratas em Java");
  const [language, setLanguage] = useState<string>("Java");
  const [modality, setModality] = useState<ActivityModality>("Algoritmo / Código");
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>("Aplicação Prática");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediário");
  const [sector, setSector] = useState<IndustrialSector>("Fintech & Bancário");
  const [customGuidelines, setCustomGuidelines] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activity, setActivity] = useState<ComplexActivity | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test-Drive State
  const [isTestDriving, setIsTestDriving] = useState<boolean>(false);
  const [testDriveResult, setTestDriveResult] = useState<PromptTestDriveResult | null>(null);

  // SAEP Matrix State
  const [saepTitle, setSaepTitle] = useState<string>("Matriz de Competências SAEP - Back-end & Dados");
  const [saepCourse, setSaepCourse] = useState<string>("Técnico em Desenvolvimento de Sistemas");
  const [saepUnit, setSaepUnit] = useState<string>("Programação Orientada a Objetos e Banco de Dados");
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState<boolean>(false);
  const [saepMatrix, setSaepMatrix] = useState<SaepRubricMatrix | null>(null);

  // Voice Feedback State
  const [studentName, setStudentName] = useState<string>("Lucas Gabriel Santos");
  const [voiceActivityTitle, setVoiceActivityTitle] = useState<string>("Módulo de Transações Bancárias");
  const [voiceGrade, setVoiceGrade] = useState<number>(75);
  const [rawNotes, setRawNotes] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isGeneratingVoiceFeedback, setIsGeneratingVoiceFeedback] = useState<boolean>(false);
  const [voiceReport, setVoiceReport] = useState<VoiceFeedbackReport | null>(null);

  // Adaptive Tracks State
  const [adaptiveTopic, setAdaptiveTopic] = useState<string>("Estruturas de Repetição e Coleções");
  const [adaptiveLang, setAdaptiveLang] = useState<string>("Python");
  const [isGeneratingAdaptive, setIsGeneratingAdaptive] = useState<boolean>(false);
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveTracksResult | null>(null);

  const recognitionRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Gerar Atividade Inicial no Carregamento
  useEffect(() => {
    handleGenerateActivity();
  }, []);

  const handleGenerateActivity = async () => {
    setIsGenerating(true);
    try {
      const apiKey = localStorage.getItem("codecheck_ai_api_key") || undefined;
      const res = await fetch("/api/teacher/complex-activities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          languageOrDialect: language,
          modality,
          bloomLevel,
          difficulty,
          industrialSector: sector,
          customGuidelines,
          providerConfig: apiKey ? { apiKey } : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.activity) {
        setActivity(data.activity);
        showToast("Atividade complexa gerada com sucesso!");
      } else {
        // Fallback local
        const fallback = await ComplexActivityGeneratorService.generateComplexActivity({
          topic,
          languageOrDialect: language,
          modality,
          bloomLevel,
          difficulty,
          industrialSector: sector,
          customGuidelines
        });
        setActivity(fallback);
        showToast("Atividade estruturada gerada com sucesso!");
      }
    } catch (e) {
      const fallback = await ComplexActivityGeneratorService.generateComplexActivity({
        topic,
        languageOrDialect: language,
        modality,
        bloomLevel,
        difficulty,
        industrialSector: sector,
        customGuidelines
      });
      setActivity(fallback);
      showToast("Atividade gerada via motor pedagógico!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTestDrive = async () => {
    if (!activity) return;
    setIsTestDriving(true);
    try {
      const apiKey = localStorage.getItem("codecheck_ai_api_key") || undefined;
      const res = await fetch("/api/teacher/complex-activities/test-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityTitle: activity.title,
          contextualScenario: activity.contextualScenario,
          questionCommand: activity.questionCommand,
          businessRules: activity.businessRules,
          languageOrDialect: activity.languageOrDialect,
          providerConfig: apiKey ? { apiKey } : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.testDrive) {
        setTestDriveResult(data.testDrive);
        showToast("Test-Drive pedagógico concluído com sucesso!");
      } else {
        const fallback = await ComplexActivityGeneratorService.simulatePromptTestDrive({
          activityTitle: activity.title,
          contextualScenario: activity.contextualScenario,
          questionCommand: activity.questionCommand,
          businessRules: activity.businessRules,
          languageOrDialect: activity.languageOrDialect
        });
        setTestDriveResult(fallback);
      }
    } catch (e) {
      const fallback = await ComplexActivityGeneratorService.simulatePromptTestDrive({
        activityTitle: activity.title,
        contextualScenario: activity.contextualScenario,
        questionCommand: activity.questionCommand,
        businessRules: activity.businessRules,
        languageOrDialect: activity.languageOrDialect
      });
      setTestDriveResult(fallback);
    } finally {
      setIsTestDriving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activity) return;
    try {
      const res = await fetch("/api/teacher/complex-activities/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity,
          teacherName: "Docente Especialista SENAI",
          className: "Turma de Desenvolvimento de Sistemas"
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Atividade_${activity.title.replace(/\s+/g, "_")}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast("PDF Institucional baixado com sucesso!");
      } else {
        const buf = ComplexActivityGeneratorService.exportActivityToPdf(activity);
        const blob = new Blob([buf as any], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Atividade_${activity.title.replace(/\s+/g, "_")}.pdf`;
        a.click();
        showToast("PDF gerado localmente com sucesso!");
      }
    } catch (e) {
      const buf = ComplexActivityGeneratorService.exportActivityToPdf(activity);
      const blob = new Blob([buf as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Atividade_${activity.title.replace(/\s+/g, "_")}.pdf`;
      a.click();
      showToast("PDF gerado com sucesso!");
    }
  };

  const handleDownloadMoodleXml = () => {
    if (!activity) return;
    const xml = ComplexActivityGeneratorService.exportMoodleXml(activity);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Moodle_Quiz_${activity.title.replace(/\s+/g, "_")}.xml`;
    a.click();
    showToast("Arquivo Moodle XML baixado com sucesso!");
  };

  const handlePublishToClass = async () => {
    if (!activity) return;
    try {
      const res = await fetch("/api/teacher/complex-activities/publish-to-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, classId: "turma-1a" })
      });
      const data = await res.json();
      showToast(data.message || "Atividade atribuída para a turma com sucesso!");
    } catch (e) {
      showToast("Atividade cadastrada para a turma!");
    }
  };

  const handleGenerateSaepMatrix = async () => {
    setIsGeneratingMatrix(true);
    try {
      const apiKey = localStorage.getItem("codecheck_ai_api_key") || undefined;
      const res = await fetch("/api/teacher/saep-matrix/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saepTitle,
          courseName: saepCourse,
          unitCurricular: saepUnit,
          providerConfig: apiKey ? { apiKey } : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.matrix) {
        setSaepMatrix(data.matrix);
        showToast("Matriz SAEP gerada com sucesso!");
      } else {
        const fallback = await ComplexActivityGeneratorService.generateSaepRubricMatrix({
          title: saepTitle,
          courseName: saepCourse,
          unitCurricular: saepUnit
        });
        setSaepMatrix(fallback);
      }
    } catch (e) {
      const fallback = await ComplexActivityGeneratorService.generateSaepRubricMatrix({
        title: saepTitle,
        courseName: saepCourse,
        unitCurricular: saepUnit
      });
      setSaepMatrix(fallback);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  const handleExportSaepPdf = () => {
    if (!saepMatrix) return;
    const buf = ComplexActivityGeneratorService.exportSaepMatrixToPdf(saepMatrix);
    const blob = new Blob([buf as any], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Matriz_SAEP_${saepMatrix.title.replace(/\s+/g, "_")}.pdf`;
    a.click();
    showToast("PDF da Matriz SAEP baixado com sucesso!");
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Reconhecimento de voz não suportado neste navegador. Digite as notas abaixo.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const rec = new SpeechRecognition();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRawNotes((prev) => prev ? `${prev} ${transcript}` : transcript);
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
      showToast("Gravando voz do professor... Fale naturalmente.");
    }
  };

  const handleGenerateVoiceFeedback = async () => {
    if (!rawNotes.trim()) {
      showToast("Digite ou grave observações para gerar o parecer.");
      return;
    }
    setIsGeneratingVoiceFeedback(true);
    try {
      const apiKey = localStorage.getItem("codecheck_ai_api_key") || undefined;
      const res = await fetch("/api/teacher/voice-feedback/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          activityTitle: voiceActivityTitle,
          rawDictatedNotes: rawNotes,
          assignedGrade: voiceGrade,
          providerConfig: apiKey ? { apiKey } : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.feedbackReport) {
        setVoiceReport(data.feedbackReport);
        showToast("Parecer pedagógico oficial gerado com sucesso!");
      } else {
        const fallback = await ComplexActivityGeneratorService.formatVoiceDictatedFeedback({
          studentName,
          activityTitle: voiceActivityTitle,
          rawDictatedNotes: rawNotes,
          assignedGrade: voiceGrade
        });
        setVoiceReport(fallback);
      }
    } catch (e) {
      const fallback = await ComplexActivityGeneratorService.formatVoiceDictatedFeedback({
        studentName,
        activityTitle: voiceActivityTitle,
        rawDictatedNotes: rawNotes,
        assignedGrade: voiceGrade
      });
      setVoiceReport(fallback);
    } finally {
      setIsGeneratingVoiceFeedback(false);
    }
  };

  const handleGenerateAdaptiveTracks = async () => {
    setIsGeneratingAdaptive(true);
    try {
      const apiKey = localStorage.getItem("codecheck_ai_api_key") || undefined;
      const res = await fetch("/api/teacher/adaptive-tracks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: adaptiveTopic,
          language: adaptiveLang,
          providerConfig: apiKey ? { apiKey } : undefined
        })
      });
      const data = await res.json();
      if (data.success && data.tracks) {
        setAdaptiveResult(data.tracks);
        showToast("3 Trilhas adaptativas geradas com sucesso!");
      } else {
        const fallback = await ComplexActivityGeneratorService.generateAdaptiveTracks({
          topic: adaptiveTopic,
          language: adaptiveLang
        });
        setAdaptiveResult(fallback);
      }
    } catch (e) {
      const fallback = await ComplexActivityGeneratorService.generateAdaptiveTracks({
        topic: adaptiveTopic,
        language: adaptiveLang
      });
      setAdaptiveResult(fallback);
    } finally {
      setIsGeneratingAdaptive(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border border-indigo-400">
          <CheckCircle className="w-5 h-5 text-emerald-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Teacher Powerhouse 2.0 • Sala de Aula Inteligente
              </span>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Padrão SENAI / SAEP
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Gerador de Atividades Complexas & Estudo de Caso
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Crie enunciados robustos contextualizados no mercado de trabalho com comando rigoroso, teste de sanidade com IA, matrizes SAEP e pareceres por voz.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "generator"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              1. Gerador de Atividades
            </button>
            <button
              onClick={() => {
                setActiveTab("testdrive");
                if (!testDriveResult && activity) handleRunTestDrive();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "testdrive"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700"
              }`}
            >
              <Brain className="w-4 h-4" />
              2. Test-Drive IA
            </button>
            <button
              onClick={() => {
                setActiveTab("saep");
                if (!saepMatrix) handleGenerateSaepMatrix();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "saep"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700"
              }`}
            >
              <Award className="w-4 h-4" />
              3. Matriz SAEP
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "voice"
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700"
              }`}
            >
              <Mic className="w-4 h-4" />
              4. Ditado & Voz
            </button>
            <button
              onClick={() => {
                setActiveTab("adaptive");
                if (!adaptiveResult) handleGenerateAdaptiveTracks();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "adaptive"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700"
              }`}
            >
              <Layers className="w-4 h-4" />
              5. Trilhas Adaptativas
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GERADOR DE ATIVIDADES COMPLEXAS */}
      {/* ========================================================================= */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Painel Esquerdo: Parâmetros Pedagógicos */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Parâmetros da Atividade
              </h3>

              {/* Tema */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tema / Conteúdo Central</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Polimorfismo e Classes Abstratas em Java"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Linguagem / Dialeto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Linguagem / SGBD</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Java, Python, PostgreSQL..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Modalidade</label>
                  <select
                    value={modality}
                    onChange={(e) => setModality(e.target.value as ActivityModality)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {MODALITIES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloom & Dificuldade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Taxonomia de Bloom</label>
                  <select
                    value={bloomLevel}
                    onChange={(e) => setBloomLevel(e.target.value as BloomLevel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {BLOOM_LEVELS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dificuldade</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Setor Industrial */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Setor Industrial / Contexto</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value as IndustrialSector)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {INDUSTRIAL_SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Diretrizes Customizadas */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Diretrizes Especiais do Docente (Opcional)</label>
                <textarea
                  value={customGuidelines}
                  onChange={(e) => setCustomGuidelines(e.target.value)}
                  placeholder="Ex: Exigir classe abstrata 'Conta' e subclasses 'ContaCorrente' e 'ContaPoupanca'..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Botão Gerar */}
              <button
                onClick={handleGenerateActivity}
                disabled={isGenerating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando Atividade com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Atividade Completa
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Painel Direito: Pré-visualização da Atividade */}
          <div className="lg:col-span-8 space-y-4">
            {activity ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Header da Atividade com Ações */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                        {activity.industrialSector}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
                        {activity.bloomLevel}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                        {activity.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-800 text-slate-300 rounded-md">
                        ⏱️ {activity.estimatedTimeMinutes} min
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{activity.title}</h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleExportPdf}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      Exportar PDF SENAI
                    </button>
                    <button
                      onClick={handleDownloadMoodleXml}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-700 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      Moodle XML
                    </button>
                    <button
                      onClick={handlePublishToClass}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Atribuir à Turma
                    </button>
                  </div>
                </div>

                {/* 1. Contextualização Industrial */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    1. Contextualização do Cenário Industrial
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{activity.contextualScenario}</p>
                </div>

                {/* 2. Comando da Questão */}
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    2. Comando da Questão & Entregável Obrigatório
                  </h4>
                  <p className="text-sm text-white font-medium leading-relaxed">{activity.questionCommand}</p>
                </div>

                {/* 3. Regras de Negócio e Casos de Borda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                      3. Regras de Negócio
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activity.businessRules.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      4. Casos de Borda & Restrições
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activity.edgeCasesAndConstraints.map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Casos de Teste Unitários */}
                {activity.testCases && activity.testCases.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      5. Casos de Teste Unitários ({activity.testCases.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Entrada</th>
                            <th className="py-2 px-3">Saída Esperada</th>
                            <th className="py-2 px-3">Descrição</th>
                            <th className="py-2 px-3">Tipo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {activity.testCases.map((tc, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-mono text-slate-500">#{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono text-indigo-300">{tc.input}</td>
                              <td className="py-2.5 px-3 font-mono text-emerald-300">{tc.expectedOutput}</td>
                              <td className="py-2.5 px-3">{tc.description}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  tc.isHidden
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}>
                                  {tc.isHidden ? "Oculto" : "Público"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Gabarito de Referência */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      6. Gabarito Oficial de Referência ({activity.languageOrDialect})
                    </h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activity.referenceSolution);
                        showToast("Gabarito copiado para a área de transferência!");
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar Código
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80 max-h-60">
                    {activity.referenceSolution}
                  </pre>
                </div>

                {/* 6. Rubricas de Avaliação */}
                {activity.rubrics && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      7. Rubricas de Avaliação & Critérios de Desempenho
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activity.rubrics.map((r, i) => (
                        <div key={i} className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-white">{r.criterion}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{r.performanceExpectation}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded">
                            {r.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Sparkles className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                <h3 className="text-base font-semibold text-white">Pronto para Criar Atividades Complexas</h3>
                <p className="text-sm text-slate-400 max-w-md mt-1">
                  Configure os parâmetros pedagógicos no menu lateral e clique em "Gerar Atividade Completa" para estruturar estudos de caso reais.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEST-DRIVE PEDAGÓGICO (SIMULADOR DE ENUNCIADO) */}
      {/* ========================================================================= */}
      {activeTab === "testdrive" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-purple-500/20 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  Auditoria de Sanidade do Enunciado
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Test-Drive de Enunciado com 3 Personas de Alunos
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  Simule como diferentes perfis de estudantes interpretarão o enunciado antes da publicação em sala de aula.
                </p>
              </div>
              <button
                onClick={handleRunTestDrive}
                disabled={isTestDriving}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                {isTestDriving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Simulando Resoluções dos Alunos...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Executar Test-Drive com IA
                  </>
                )}
              </button>
            </div>

            {testDriveResult ? (
              <div className="mt-6 space-y-6">
                {/* Score de Clareza */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xl">
                      {testDriveResult.clarityScore}%
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Índice de Clareza</p>
                      <p className="text-sm font-bold text-white">{testDriveResult.clarityStatus}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Pontos de Ambiguidade Detectados
                    </p>
                    <p className="text-xs text-slate-300">
                      {testDriveResult.potentialAmbiguities.length > 0
                        ? testDriveResult.potentialAmbiguities[0]
                        : "Nenhuma ambiguidade crítica encontrada."}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Dúvidas Previstas na Aula
                    </p>
                    <p className="text-xs text-slate-300">
                      {testDriveResult.predictedClassroomQuestions.length > 0
                        ? testDriveResult.predictedClassroomQuestions[0]
                        : "Enunciado autoexplicativo."}
                    </p>
                  </div>
                </div>

                {/* As 3 Personas Simuladas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {testDriveResult.simulations.map((sim, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 space-y-3 ${
                        idx === 0
                          ? "bg-emerald-950/20 border-emerald-500/30"
                          : idx === 1
                          ? "bg-amber-950/20 border-amber-500/30"
                          : "bg-rose-950/20 border-rose-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          idx === 0
                            ? "bg-emerald-500/20 text-emerald-300"
                            : idx === 1
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}>
                          {sim.persona}
                        </span>
                        <span className="text-xs font-bold text-white">Nota: {sim.simulatedScore}/100</span>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Resposta / Código Típico Produzido:</p>
                        <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-slate-300 mt-1 max-h-32 overflow-x-auto border border-slate-800">
                          {sim.simulatedAnswer}
                        </pre>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Diagnóstico do Erro / Interpretação:</p>
                        <p className="text-xs text-slate-300 mt-0.5">{sim.identifiedIssueOrAmbiguity}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <p className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          Dúvida que o aluno fará em sala:
                        </p>
                        <p className="text-xs italic text-slate-300 mt-0.5">"{sim.predictedStudentQuestion}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-sm">Clique em "Executar Test-Drive com IA" para auditar o enunciado atual.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MATRIZES DE AVALIAÇÃO SAEP / SENAI */}
      {/* ========================================================================= */}
      {activeTab === "saep" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-blue-500/20 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  Padrão de Desempenho SAEP SENAI
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Matriz de Competências & Padrões de Desempenho
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  Gere matrizes de avaliação técnica e socioemocional com indicadores de proficiência de 0% a 100%.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateSaepMatrix}
                  disabled={isGeneratingMatrix}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingMatrix ? "animate-spin" : ""}`} />
                  Regerar Matriz SAEP
                </button>
                {saepMatrix && (
                  <button
                    onClick={handleExportSaepPdf}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all border border-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    Exportar PDF SAEP
                  </button>
                )}
              </div>
            </div>

            {saepMatrix ? (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                        <th className="py-3 px-4 w-28">Tipo</th>
                        <th className="py-3 px-4 w-52">Capacidade / Competência</th>
                        <th className="py-3 px-4 text-rose-300">Insatisfatório (0-49%)</th>
                        <th className="py-3 px-4 text-amber-300">Básico (50-69%)</th>
                        <th className="py-3 px-4 text-blue-300">Adequado (70-89%)</th>
                        <th className="py-3 px-4 text-emerald-300">Avançado (90-100%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/50 text-slate-300">
                      {saepMatrix.competencies.map((comp) => (
                        <tr key={comp.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-semibold text-slate-400">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              comp.capacityType === "Técnica"
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {comp.capacityType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {comp.capacityName}
                            <span className="block text-[11px] text-indigo-400 mt-0.5">Peso: {comp.weight}%</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 bg-rose-950/10">{comp.indicators.insatisfatorio}</td>
                          <td className="py-3 px-4 text-slate-400 bg-amber-950/10">{comp.indicators.basico}</td>
                          <td className="py-3 px-4 text-slate-300 bg-blue-950/10">{comp.indicators.adequado}</td>
                          <td className="py-3 px-4 text-emerald-300 bg-emerald-950/10 font-medium">{comp.indicators.avancado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Award className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-sm">Carregando Matriz SAEP oficial...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DITADO & PARECER POR VOZ COM IA */}
      {/* ========================================================================= */}
      {activeTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Painel Esquerdo: Ditado / Gravação */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  Ditado do Professor
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Estudante</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Atividade</label>
                  <input
                    type="text"
                    value={voiceActivityTitle}
                    onChange={(e) => setVoiceActivityTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nota Atribuída (0-100)</label>
                  <input
                    type="number"
                    value={voiceGrade}
                    onChange={(e) => setVoiceGrade(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Caixa de Ditado */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Anotações Faladas ou Digitadas</label>
                  <button
                    onClick={toggleVoiceRecording}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isRecording
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        Parar Gravação
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        Ditar por Voz
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  placeholder="Ex: Aluno entendeu bem a herança das classes mas esqueceu de tratar valores nulos no método calcular(). Formatação do código precisa melhorar."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                onClick={handleGenerateVoiceFeedback}
                disabled={isGeneratingVoiceFeedback || !rawNotes.trim()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                {isGeneratingVoiceFeedback ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando Parecer Pedagógico...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Formatar Parecer Oficial com IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Painel Direito: Parecer Oficial Gerado */}
          <div className="lg:col-span-7 space-y-4">
            {voiceReport ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Parecer Formativo Oficial SENAI
                    </span>
                    <h3 className="text-lg font-bold text-white">{voiceReport.studentName}</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-sm rounded-xl">
                    Nota: {voiceReport.assignedGrade}/100
                  </span>
                </div>

                {/* Parecer Principal */}
                <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Mensagem Formal ao Estudante
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed italic">
                    "{voiceReport.officialSenaiParecer}"
                  </p>
                </div>

                {/* Pontos Fortes e Correções */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                      Pontos Fortes Observados
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {voiceReport.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      Pontos Críticos para Correção
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {voiceReport.criticalCorrections.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Plano de Ação */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                    Plano de Ação Recomendado
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {voiceReport.actionPlan.map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <Mic className="w-12 h-12 text-rose-400 mb-3" />
                <h3 className="text-base font-semibold text-white">Assistente de Voz Pronto</h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1">
                  Dite ou digite suas notas rápidas sobre o estudante para que a IA gere um parecer pedagógico no padrão SENAI.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TRILHAS ADAPTATIVAS DE REFORÇO */}
      {/* ========================================================================= */}
      {activeTab === "adaptive" && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Diferenciação Pedagógica
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Trilhas de Aprendizagem Adaptativas (3 Níveis)
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  Gere simultaneamente variações da mesma atividade para Nivelamento (Scaffold), Consolidação Padrão e Desafio Avançado.
                </p>
              </div>

              <button
                onClick={handleGenerateAdaptiveTracks}
                disabled={isGeneratingAdaptive}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAdaptive ? "animate-spin" : ""}`} />
                Gerar Trilhas Adaptativas
              </button>
            </div>

            {adaptiveResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {adaptiveResult.tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl p-5 space-y-4 ${
                      idx === 0
                        ? "bg-slate-950/70 border-indigo-500/30"
                        : idx === 1
                        ? "bg-slate-950/70 border-blue-500/30"
                        : "bg-slate-950/70 border-purple-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        idx === 0
                          ? "bg-indigo-500/20 text-indigo-300"
                          : idx === 1
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-purple-500/20 text-purple-300"
                      }`}>
                        Nível {idx + 1}: {tier.tierName}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{tier.adaptedTitle}</h4>
                      <p className="text-xs text-slate-400 mt-1">{tier.targetProfile}</p>
                    </div>

                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-300">Comando Adaptado:</p>
                      <p className="text-xs text-slate-200 mt-1">{tier.adaptedCommand}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Dicas de Scaffold / Suporte:</p>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {tier.scaffoldingHints.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">Código Inicial Fornecido:</p>
                      <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-32">
                        {tier.sampleStarterCode}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Layers className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm">Carregando Trilhas Adaptativas para a turma...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
