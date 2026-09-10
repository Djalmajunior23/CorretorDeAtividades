import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Plus,
  Sparkles,
  Award,
  FileText,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  BookOpen,
  HelpCircle,
  Download,
  Database,
  Shield,
  AlertTriangle,
  Users,
  Upload,
  Trash2,
  Library,
  Eye,
  LineChart,
  FileSpreadsheet,
  RefreshCw,
  Zap,
  Clock,
  Play,
  AlertCircle,
  Server,
  Cpu,
  Layers,
  Settings2,
  Code2,
  Check,
  Copy,
  FileCode,
  ExternalLink,
  FileCheck
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiUrl, safeJsonResponse } from "../config/api";

export default function AvaliacoesView() {
  const [subTab, setSubTab] = useState<
    "exam_arena" | "assessments" | "generator" | "evidence" | "analytics" | "simulations" | "ocr_accuracy"
  >("exam_arena");

  // ==========================================
  // SMART EXAM ARENA & ANTI-CHEAT STATE
  // ==========================================
  const [examArenaList, setExamArenaList] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examViewMode, setExamViewMode] = useState<"list" | "create" | "runner">("list");
  const [selectedExamToRun, setSelectedExamToRun] = useState<any | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [examRunnerCode, setExamRunnerCode] = useState("");
  const [examStudentName, setExamStudentName] = useState("Carlos Henrique Souza");
  const [examTimeRemaining, setExamTimeRemaining] = useState(5400); // 90 min
  const [examBlurCount, setExamBlurCount] = useState(0);
  const [examPasteCount, setExamPasteCount] = useState(0);
  const [examSubmissionResult, setExamSubmissionResult] = useState<any | null>(null);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // New Exam Form
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamTopic, setNewExamTopic] = useState("Estruturas de Dados e Algoritmos");
  const [newExamDuration, setNewExamDuration] = useState(90);
  const [newExamLanguage, setNewExamLanguage] = useState("python");
  const [newExamAccessCode, setNewExamAccessCode] = useState("SENAI-2026");
  const [isGeneratingExamVariants, setIsGeneratingExamVariants] = useState(false);
  const [generatedExamVariants, setGeneratedExamVariants] = useState<any[]>([]);

  useEffect(() => {
    fetchExamsList();
  }, []);

  // Anti-Cheat: Blur and Visibility Change Detection
  useEffect(() => {
    if (examViewMode !== "runner" || examSubmissionResult) return;

    const handleWindowBlur = () => {
      setExamBlurCount(prev => prev + 1);
      toast.warning("⚠️ Alerta Anti-Cheat: Perda de foco / Troca de aba detectada e registrada na auditoria!");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setExamBlurCount(prev => prev + 1);
        toast.error("🚨 Alerta de Integridade: Saída da tela da prova registrada!");
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examViewMode, examSubmissionResult]);

  // Exam Countdown Timer
  useEffect(() => {
    if (examViewMode !== "runner" || examSubmissionResult || examTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setExamTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examViewMode, examSubmissionResult, examTimeRemaining]);

  const fetchExamsList = async () => {
    setLoadingExams(true);
    try {
      const res = await fetch(apiUrl("/api/exams"));
      if (res.ok) {
        const data = await res.json();
        setExamArenaList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Exams fetch error:", e);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleGenerateExamVariants = async () => {
    setIsGeneratingExamVariants(true);
    try {
      const res = await fetch(apiUrl("/api/exams/generate-variants"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newExamTopic,
          language: newExamLanguage,
          basePrompt: `Avaliação prática de ${newExamTopic}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedExamVariants(data.variants || []);
        toast.success("Variantes A, B e C geradas com sucesso pela IA!");
      }
    } catch (e) {
      toast.error("Erro ao gerar variantes de prova com IA.");
    } finally {
      setIsGeneratingExamVariants(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExamTitle.trim()) {
      toast.error("Informe o título da avaliação.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/exams"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExamTitle,
          description: `Avaliação com ${generatedExamVariants.length || 3} variantes anti-cola em laboratório.`,
          language: newExamLanguage,
          duration_minutes: newExamDuration,
          access_code: newExamAccessCode,
          anti_cheat_enabled: true,
          variants: generatedExamVariants
        })
      });

      if (res.ok) {
        toast.success("Exame prático agendado com sucesso!");
        setExamViewMode("list");
        fetchExamsList();
      }
    } catch (e) {
      toast.error("Erro ao criar exame.");
    }
  };

  const handleStartExamRunner = (exam: any) => {
    setSelectedExamToRun(exam);
    setActiveVariantIndex(0);
    const firstVar = exam.variants?.[0];
    setExamRunnerCode(firstVar?.starter_code || "");
    setExamTimeRemaining((exam.duration_minutes || 90) * 60);
    setExamBlurCount(0);
    setExamPasteCount(0);
    setExamSubmissionResult(null);
    setExamViewMode("runner");
  };

  const handleSubmitExam = async () => {
    if (!selectedExamToRun || isSubmittingExam) return;
    setIsSubmittingExam(true);

    try {
      const res = await fetch(apiUrl("/api/exams/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: selectedExamToRun.id,
          student_name: examStudentName,
          variant: selectedExamToRun.variants?.[activeVariantIndex]?.variant || "A",
          code: examRunnerCode,
          integrity_log: {
            blur_count: examBlurCount,
            paste_count: examPasteCount,
            time_spent_seconds: (selectedExamToRun.duration_minutes * 60) - examTimeRemaining
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExamSubmissionResult(data);
        toast.success(`Exame submetido com sucesso! Nota: ${data.score}/100 (${data.status})`);
      }
    } catch (e) {
      toast.error("Erro ao enviar exame.");
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleExportRosterPdf = async (exam: any) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(67, 56, 202);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text("CODECHECK AI • ATA OFICIAL DE AVALIAÇÃO PRÁTICA", 14, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(224, 231, 255);
      doc.text(`Avaliação: ${exam.title} • Duração: ${exam.duration_minutes} min • Monitor Anti-Cheat Ativo`, 14, 19);

      const rows = [
        ["Carlos Henrique Souza", "Variante A", "85/100", "Aprovado", "100%", "0 saídas"],
        ["Beatriz Oliveira Costa", "Variante B", "92/100", "Aprovado", "95%", "1 saída"],
        ["Vinícius Souza", "Variante C", "55/100", "Recuperação", "80%", "2 saídas"],
        ["Daniel Santos Ramos", "Variante A", "45/100", "Recuperação", "70%", "3 saídas"]
      ];

      autoTable(doc, {
        startY: 35,
        head: [["Estudante", "Variante", "Nota Final", "Status (>= 60)", "Integridade", "Auditoria"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [67, 56, 202] },
        styles: { fontSize: 8 }
      });

      doc.save(`Ata_Avaliacao_${exam.title.replace(/\s+/g, "_")}.pdf`);
      toast.success("Ata oficial de avaliação exportada em PDF!");
    } catch (e) {
      toast.error("Erro ao exportar ata de exame.");
    }
  };

  // OCR Accuracy & Handwriting Tuning State
  const [ocrSelectedClass, setOcrSelectedClass] = useState("Desenvolvimento Web 1A");
  const [ocrContrastThreshold, setOcrContrastThreshold] = useState(85);
  const [ocrBinarizationKernel, setOcrBinarizationKernel] = useState(3);
  const [ocrConfidenceBoost, setOcrConfidenceBoost] = useState(true);
  const [ocrCursiveHeuristic, setOcrCursiveHeuristic] = useState(true);
  const [ocrTuningApplied, setOcrTuningApplied] = useState(false);

  const [ocrRecords, setOcrRecords] = useState([
    { id: 1, student: "Ana Rodrigues Silva", class: "Desenvolvimento Web 1A", handwritingStyle: "Letra de forma regular", aiTranscribed: "def calcula_media(n1, n2):\n    return (n1 + n2) / 2", teacherCorrected: "def calcula_media(n1, n2):\n    return (n1 + n2) / 2", accuracy: "100%" },
    { id: 2, student: "Carlos Henrique Souza", class: "Desenvolvimento Web 1A", handwritingStyle: "Cursiva inclinada", aiTranscribed: "for i in range(0, 10):\n    prnt(i)", teacherCorrected: "for i in range(0, 10):\n    print(i)", accuracy: "92%" },
    { id: 3, student: "Beatriz Oliveira Costa", class: "Desenvolvimento Web 1A", handwritingStyle: "Mista / Rascunho", aiTranscribed: "while x < 100:\n    x += 1", teacherCorrected: "while x < 100:\n    x += 1", accuracy: "100%" },
    { id: 4, student: "Daniel Santos Ramos", class: "Sistemas Embarcados 1C", handwritingStyle: "Cursiva densa", aiTranscribed: "int val = analogRead(A0);\nif(val > 500) { digitalWrit(13, HIGH); }", teacherCorrected: "int val = analogRead(A0);\nif(val > 500) { digitalWrite(13, HIGH); }", accuracy: "88%" },
    { id: 5, student: "Eduardo Lima", class: "Sistemas Embarcados 1C", handwritingStyle: "Letra de forma rápida", aiTranscribed: "void setup() {\n  pinMode(8, OUTPUT);\n}", teacherCorrected: "void setup() {\n  pinMode(8, OUTPUT);\n}", accuracy: "100%" }
  ]);

  const handleApplyOcrTuning = () => {
    setOcrTuningApplied(true);
    setTimeout(() => setOcrTuningApplied(false), 4000);
  };

  const handleExportOcrPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK AI - RELATÓRIO DE ACURÁCIA DE OCR", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Turma Selecionada: ${ocrSelectedClass}`, 14, 28);
    doc.text(`Acurácia Média da Turma: 94.5%`, 14, 34);
    doc.text(`Parâmetros Atuais: Limiar ${ocrContrastThreshold}%, Kernel ${ocrBinarizationKernel}`, 14, 40);

    const rows = ocrRecords
      .filter(r => r.class === ocrSelectedClass)
      .map(r => [r.student, r.handwritingStyle, r.aiTranscribed.replace(/\n/g, " "), r.teacherCorrected.replace(/\n/g, " "), r.accuracy]);

    autoTable(doc, {
      startY: 48,
      head: [["Estudante", "Caligrafia", "Transcrição IA", "Correção Professor", "Acurácia"]],
      body: rows.length > 0 ? rows : [["Nenhum registro", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Relatorio_Acuracia_OCR_${ocrSelectedClass.replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportOcrCsv = () => {
    const filtered = ocrRecords.filter(r => r.class === ocrSelectedClass);
    const headers = ["ID", "Estudante", "Turma", "Caligrafia", "Transcricao_IA", "Correcao_Professor", "Acuracia"];
    const rows = filtered.map(r => [
      r.id,
      `"${r.student}"`,
      `"${r.class}"`,
      `"${r.handwritingStyle}"`,
      `"${r.aiTranscribed.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${r.teacherCorrected.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      r.accuracy
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `acuracia_ocr_${ocrSelectedClass.replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State for Construtor of assessments (Módulo 2)
  const [assessments, setAssessments] = useState([
    {
      id: 1,
      title: "Prova Prática: Estruturas de Loops Iterativos",
      type: "Híbrida",
      uc: "Lógica de Programação",
      status: "Publicado",
      questionsCount: 5,
      competency: "COMP-02",
    },
    {
      id: 2,
      title: "Simulado Geral SAEP Técnica 2026",
      type: "Simulado",
      uc: "Desenvolvimento Web",
      status: "Publicado",
      questionsCount: 40,
      competency: "COMP-01",
    },
    {
      id: 3,
      title: "Diagnóstico Inicial: Algoritmos Fundamentais",
      type: "Diagnóstica",
      uc: "Lógica de Programação",
      status: "Publicado",
      questionsCount: 10,
      competency: "COMP-01",
    },
    {
      id: 4,
      title: "Exame Corretor de Recuperação Paralela",
      type: "Recuperação",
      uc: "Sistemas de Computação",
      status: "Rascunho",
      questionsCount: 4,
      competency: "COMP-03",
    },
  ]);

  // Form states for manual assessment creation (Módulo 2)
  const [showManualForm, setShowManualForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Prática");
  const [formUc, setFormUc] = useState("Lógica de Programação");
  const [formComp, setFormComp] = useState("COMP-02");

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setAssessments([
      ...assessments,
      {
        id: Date.now(),
        title: formTitle,
        type: formType,
        uc: formUc,
        status: "Rascunho",
        questionsCount: 5,
        competency: formComp,
      },
    ]);
    setFormTitle("");
    setShowManualForm(false);
  };

  // State for Evidence storage (Módulo 6 & 7)
  const [evidences, setEvidences] = useState([
    {
      id: 1,
      student: "Ana Rodrigues Silva",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-01",
      grade: "9.5",
      file: "trabalho_logica.pdf",
      date: "2026-06-01",
    },
    {
      id: 2,
      student: "Carlos Henrique Souza",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-02",
      grade: "5.0",
      file: "atividade_loops.py",
      date: "2026-06-08",
    },
    {
      id: 3,
      student: "Beatriz Oliveira Costa",
      class: "Desenvolvimento Web 1A",
      competency: "COMP-01",
      grade: "8.5",
      file: "apresentacao_slides.pptx",
      date: "2026-06-11",
    },
  ]);
  const [newEvidenceStudent, setNewEvidenceStudent] = useState("");
  const [newEvidenceClass, setNewEvidenceClass] = useState("Desenvolvimento Web 1A");
  const [newEvidenceComp, setNewEvidenceComp] = useState("COMP-01");
  const [newEvidenceGrade, setNewEvidenceGrade] = useState("8.5");
  const [newEvidenceFile, setNewEvidenceFile] = useState("");

  // Result Analytics (Módulo 8)
  const [classAverage, setClassAverage] = useState(7.4);
  const [criticalCompCode, setCriticalCompCode] = useState("COMP-03");
  const [recoveryAdvisedNum, setRecoveryAdvisedNum] = useState(4);

  // Simulation Generator State
  const [weaknesses, setWeaknesses] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false);
  const [generatedSimulation, setGeneratedSimulation] = useState<any | null>(null);
  const [selectedWeaknesses, setSelectedWeaknesses] = useState<string[]>([]);

  // State for AI Exam Builder (Módulo 3 - Contextual Multi-LLM Engine)
  const [aiTheme, setAiTheme] = useState(
    "Estruturas de Repetição, Vetores e Otimização Assintótica"
  );
  const [aiUnitCurricular, setAiUnitCurricular] = useState("Lógica de Programação e Algoritmos");
  const [aiContextScenario, setAiContextScenario] = useState("Sistema de Gestão Hospitalar & Triagem de Emergência");
  const [aiSelectedCompetencies, setAiSelectedCompetencies] = useState<string[]>(["COMP-01", "COMP-02", "COMP-03"]);
  const [aiDifficulty, setAiDifficulty] = useState("Média");
  const [aiLanguage, setAiLanguage] = useState("python");
  const [aiQuestionsCount, setAiQuestionsCount] = useState(5);
  const [aiQuestionTypes, setAiQuestionTypes] = useState<string[]>([
    "multiple_choice",
    "code_tracing",
    "hands_on_coding",
    "architectural_case"
  ]);
  const [aiGenerateVariants, setAiGenerateVariants] = useState(true);
  const [aiActiveVariant, setAiActiveVariant] = useState<"A" | "B" | "C">("A");

  // Multi-LLM & VPS State
  const [aiProvider, setAiProvider] = useState<"ollama" | "gemini" | "openai" | "groq" | "deepseek" | "auto">("ollama");
  const [aiModel, setAiModel] = useState("qwen2.5-coder:3b");
  const [aiVpsUrl, setAiVpsUrl] = useState("http://host.docker.internal:11434");
  const [aiApiKey, setAiApiKey] = useState("");
  const [isTestingAiConnection, setIsTestingAiConnection] = useState(false);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<any | null>(null);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestedExam, setAiSuggestedExam] = useState<any | null>(null);

  const scenarioPresets = [
    { title: "🏥 Sistema Hospitalar", desc: "Triagem de emergência Manchester e leitos UTI" },
    { title: "🏭 Indústria 4.0 & IoT", desc: "Telemetria de sensores e esteiras inteligentes" },
    { title: "💳 Fintech & Antifraude", desc: "Processamento de pagamentos Pix e score de risco" },
    { title: "📦 E-commerce & Logística", desc: "Rastreamento de entregas e microsserviços" },
    { title: "🚗 Cidades Inteligentes", desc: "Semáforos adaptativos e controle de tráfego" },
    { title: "🎮 Game Development", desc: "Mecânicas de inventário e colisões em tempo real" }
  ];

  const handleTestAiConnection = async () => {
    setIsTestingAiConnection(true);
    try {
      const res = await fetch(apiUrl("/api/assessments/test-ai-connection"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          baseUrl: aiVpsUrl,
          apiKey: aiApiKey,
          model: aiModel
        })
      });
      const data = await res.json();
      setAiConnectionStatus(data);
      if (data.online) {
        toast.success(`✅ ${data.message}`);
        if (data.models && data.models.length > 0 && !data.models.includes(aiModel)) {
          setAiModel(data.models[0]);
        }
      } else {
        toast.warning(`⚠️ ${data.message}`);
      }
    } catch (e: any) {
      toast.error(`Erro ao testar conexão com IA: ${e.message}`);
      setAiConnectionStatus({ online: false, message: "Servidor inalcançável." });
    } finally {
      setIsTestingAiConnection(false);
    }
  };

  const handleGenerateAIExam = async () => {
    if (!aiTheme.trim()) {
      toast.error("Informe o tema/ementa da avaliação.");
      return;
    }
    setAiGenerating(true);

    try {
      const resp = await fetch(apiUrl("/api/assessments/generate-contextual"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: aiTheme,
          unitCurricular: aiUnitCurricular,
          contextScenario: aiContextScenario,
          competencies: aiSelectedCompetencies,
          difficulty: aiDifficulty,
          language: aiLanguage,
          questionsCount: aiQuestionsCount,
          questionTypes: aiQuestionTypes,
          generateVariants: aiGenerateVariants,
          providerConfig: {
            provider: aiProvider,
            model: aiModel,
            baseUrl: aiVpsUrl,
            apiKey: aiApiKey
          }
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.assessment) {
          setAiSuggestedExam(data.assessment);
          setAiActiveVariant("A");
          toast.success(`🎉 Avaliação com ${data.assessment.questions_count} questões gerada com sucesso via IA!`);
        }
      } else {
        toast.error("Falha ao gerar avaliação via IA.");
      }
    } catch (e: any) {
      toast.error(`Erro na requisição: ${e.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleExportStudentExamPdf = async (variant: "A" | "B" | "C" = "A") => {
    if (!aiSuggestedExam) return;
    try {
      const res = await fetch(apiUrl("/api/assessments/export-student-exam-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: aiSuggestedExam,
          variant
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Caderno_Prova_Aluno_Variante_${variant}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`📄 Caderno de Prova do Aluno (Variante ${variant}) exportado em PDF!`);
      }
    } catch (e) {
      toast.error("Erro ao exportar PDF do caderno de prova.");
    }
  };

  const handleExportTeacherGuidePdf = async () => {
    if (!aiSuggestedExam) return;
    try {
      const res = await fetch(apiUrl("/api/assessments/export-teacher-guide-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: aiSuggestedExam
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Guia_Docente_Gabarito_Comentado_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("📘 Guia do Docente com Gabarito Comentado e Rubricas exportado em PDF!");
      }
    } catch (e) {
      toast.error("Erro ao exportar guia do docente.");
    }
  };

  const handleSendToExamArena = async () => {
    if (!aiSuggestedExam) return;
    try {
      const variantsData = aiSuggestedExam.variants && aiSuggestedExam.variants.length > 0
        ? aiSuggestedExam.variants.map((v: any) => ({
            variant: v.variant,
            title: v.variant_title,
            prompt: v.questions[0]?.enunciado || aiSuggestedExam.theme,
            starter_code: v.questions[0]?.starter_code || (aiLanguage === "python" ? "def solucao(dados):\n    pass" : "function solucao(dados) {}"),
            test_cases: v.questions[0]?.test_cases || [{ input: "[10, 20]", expected: "30" }]
          }))
        : [
            {
              variant: "A",
              title: `Variante A • ${aiSuggestedExam.theme}`,
              prompt: aiSuggestedExam.questions[0]?.enunciado,
              starter_code: aiSuggestedExam.questions[0]?.starter_code || "def solucao(dados):\n    pass",
              test_cases: aiSuggestedExam.questions[0]?.test_cases || []
            }
          ];

      const res = await fetch(apiUrl("/api/exams"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiSuggestedExam.title,
          description: `Avaliação com ${aiSuggestedExam.questions_count} questões fundamentadas no cenário: ${aiSuggestedExam.context_scenario}.`,
          language: aiLanguage,
          duration_minutes: aiSuggestedExam.estimated_duration_minutes || 90,
          access_code: `SENAI-${Math.floor(1000 + Math.random() * 9000)}`,
          anti_cheat_enabled: true,
          variants: variantsData
        })
      });

      if (res.ok) {
        toast.success("🛡️ Avaliação enviada diretamente para o Smart Exam Arena (Lockdown Anti-Cola)!");
        setSubTab("exam_arena");
        fetchExamsList();
      }
    } catch (e) {
      toast.error("Erro ao enviar avaliação para a Arena.");
    }
  };

  const handleApproveAIExam = () => {
    if (!aiSuggestedExam) return;
    setAssessments([
      ...assessments,
      {
        id: Date.now(),
        title: aiSuggestedExam.title,
        type: "Objetiva/Prática",
        uc: "Lógica de Programação",
        status: "Publicado",
        questionsCount: aiSuggestedExam.questions.length,
        competency: aiSuggestedExam.competency,
      },
    ]);
    setAiSuggestedExam(null);
  };

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvidenceStudent.trim()) return;
    setEvidences([
      ...evidences,
      {
        id: Date.now(),
        student: newEvidenceStudent,
        class: newEvidenceClass,
        competency: newEvidenceComp,
        grade: newEvidenceGrade,
        file: newEvidenceFile || "documento_anexo.pdf",
        date: new Date().toISOString().split("T")[0],
      },
    ]);
    setNewEvidenceStudent("");
    setNewEvidenceFile("");
  };

  const handleAnalyzeWeaknesses = async () => {
    setIsAnalyzing(true);
    try {
      // Mocking the analytics fetch for now, but in a real scenario we'd call analyticsApi.getCommonErrors
      setTimeout(() => {
        setWeaknesses([
          {
            id: "W1",
            topic: "Laços Aninhados",
            error_rate: 45,
            description: "Dificuldade em gerenciar variáveis de controle em loops duplos.",
            comp: "COMP-02",
          },
          {
            id: "W2",
            topic: "Escopo de Variável",
            error_rate: 38,
            description: "Confusão entre variáveis locais e globais dentro de funções.",
            comp: "COMP-04",
          },
          {
            id: "W3",
            topic: "Manipulação de Matrizes",
            error_rate: 52,
            description: "Erros de indexação 'off-by-one' em arrays multidimensionais.",
            comp: "COMP-03",
          },
        ]);
        setIsAnalyzing(false);
      }, 1500);
    } catch (error) {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateSimulation = async () => {
    if (selectedWeaknesses.length === 0) return;
    setIsGeneratingSimulation(true);
    try {
      // API call to generate adaptive simulation
      const selectedData = weaknesses.filter((w) =>
        selectedWeaknesses.includes(w.id),
      );
      
      const resp = await fetch(apiUrl("/api/ai/simulations/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaknesses: selectedData,
          classId: "default_class",
        }),
      });
      
      // Fallback/Mock for preview
      setTimeout(() => {
        setGeneratedSimulation({
          id: Date.now(),
          title: `Simulado de Reforço: ${selectedData.map((w) => w.topic).join(", ")}`,
          description: "Esta bateria foi gerada para atacar pontos de falha recorrentes detectados no seu Analytics.",
          questions: [
            {
              id: 1,
              title: "Otimização de Matriz",
              type: "Code",
              difficulty: "Hard",
              statement: "Dada uma matriz 3x3, escreva um algoritmo que zere a diagonal secundária garantindo que não haja erros de índice.",
            },
            {
              id: 2,
              title: "Escopo e Funções",
              type: "Logic",
              difficulty: "Medium",
              statement: "Explique a saída do código abaixo considerando o escopo léxico da variável 'contador'.",
            }
          ]
        });
        setIsGeneratingSimulation(false);
      }, 2000);
    } catch (error) {
      setIsGeneratingSimulation(false);
    }
  };

  const handleExportExamPDF = (title: string, competency: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text("CODECHECK EXAM - CADERNO DE PROVA", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Avaliação de Competência: ${title}`, 14, 28);
    doc.text(`Matriz Requerida: ${competency}`, 14, 34);
    doc.text(`Parâmetros: Documento de aplicação docente em sala`, 14, 40);

    const questionsData = [
      [
        "Questao 1",
        "Implementar estrutura em Python resolvendo Fibonacci usando loops",
        "COMP-02",
      ],
      [
        "Questao 2",
        "Explique a diferenca de passagem por valor e referencia",
        "COMP-03",
      ],
      ["Questao 3", "Analise de logs assintoticos no simulador", "COMP-01"],
    ];

    autoTable(doc, {
      startY: 48,
      head: [["Questão", "Enunciado Lógico Proposto", "Competência Vinculada"]],
      body: questionsData,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Prova_Docente_${competency.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 text-slate-100 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-[#10b981] uppercase">
            Fase 13: Central de Avaliações, Simulados e Evidências
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display mt-0.5">
            Central de Avaliações e Evidências
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere, gerencie e documente todo o processo avaliativo curricular de
            forma integrada aos seus planos de ensino.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("generator")}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-[#030712] font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Criador de Provas IA
          </button>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setSubTab("exam_arena")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer flex items-center gap-1.5 ${subTab === "exam_arena" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          <Shield className="w-3.5 h-3.5" />
          Smart Exam Arena (Anti-Cheat)
          {subTab === "exam_arena" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("assessments")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "assessments" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Central de Provas
          {subTab === "assessments" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("generator")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "generator" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Gerador Inteligente IA
          {subTab === "generator" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
        
        <button
          onClick={() => setSubTab("simulations")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "simulations" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Simulações Adaptativas
          {subTab === "simulations" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("evidence")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "evidence" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Repositório de Evidências (Módulo 6 & 7)
          {subTab === "evidence" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("analytics")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "analytics" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Dashboard Analítico
          {subTab === "analytics" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setSubTab("ocr_accuracy")}
          className={`pb-3 text-xs font-bold font-mono uppercase tracking-wider relative transition-all cursor-pointer ${subTab === "ocr_accuracy" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
        >
          Acurácia de OCR & Caligrafia
          {subTab === "ocr_accuracy" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>

      {/* RENDER PAGES BASED ON SUB-TABS */}
      <AnimatePresence mode="wait">
        {/* TAB: SMART EXAM ARENA */}
        {subTab === "exam_arena" && (
          <motion.div
            key="exam_arena"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {examViewMode === "runner" && selectedExamToRun ? (
              /* LIVE SECURE EXAM RUNNER */
              <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
                {/* Top Lockdown Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase border border-indigo-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        Ambiente de Prova Seguro (Lockdown Ativo)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold border border-rose-500/20">
                        {examBlurCount} Desvios de Foco
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedExamToRun.title}</h2>
                    <p className="text-xs text-slate-400 font-mono">Discente: {examStudentName} • Código de Acesso: {selectedExamToRun.access_code}</p>
                  </div>

                  {/* Live Timer */}
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-slate-950 rounded-2xl border border-indigo-500/30 flex flex-col items-end">
                      <span className="text-[9px] font-mono text-slate-400 uppercase">Tempo Restante</span>
                      <span className="text-lg font-black font-mono text-amber-400">
                        {Math.floor(examTimeRemaining / 60)}:{(examTimeRemaining % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <button
                      onClick={() => setExamViewMode("list")}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-xl transition-all cursor-pointer"
                    >
                      Sair do Exame
                    </button>
                  </div>
                </div>

                {/* Variant Selector Tabs */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Variante de Prova:</span>
                  {(selectedExamToRun.variants || []).map((v: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveVariantIndex(idx);
                        setExamRunnerCode(v.starter_code || "");
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeVariantIndex === idx
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      Variante {v.variant || String.fromCharCode(65 + idx)}
                    </button>
                  ))}
                </div>

                {/* Question Prompt */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase">
                    {selectedExamToRun.variants?.[activeVariantIndex]?.title || "Enunciado do Problema"}
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedExamToRun.variants?.[activeVariantIndex]?.prompt || selectedExamToRun.description}
                  </p>
                </div>

                {/* Code Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Editor de Resolução ({selectedExamToRun.language})</span>
                    <span className="text-amber-400">Anti-Cola: Colagem interceptada para auditoria</span>
                  </div>
                  <textarea
                    rows={12}
                    value={examRunnerCode}
                    onChange={(e) => setExamRunnerCode(e.target.value)}
                    onPaste={() => {
                      setExamPasteCount(prev => prev + 1);
                      toast.warning("Registro de colagem anotado na auditoria do exame.");
                    }}
                    placeholder="# Digite a resolução aqui..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none shadow-inner"
                  />
                </div>

                {/* Submission & Integrity Result */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div className="text-xs font-mono text-slate-400">
                    <span>Integridade Atual: </span>
                    <span className={`font-bold ${examBlurCount === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {Math.max(0, 100 - examBlurCount * 15)}% ({examBlurCount} saídas da aba)
                    </span>
                  </div>

                  <button
                    onClick={handleSubmitExam}
                    disabled={isSubmittingExam}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingExam ? "Submetendo & Corrigindo..." : "Entregar Exame & Finalizar"}
                  </button>
                </div>

                {/* Exam Result Dialog */}
                {examSubmissionResult && (
                  <div className="p-6 bg-slate-950 border border-emerald-500/40 rounded-3xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">Comprovante de Entrega de Avaliação</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        examSubmissionResult.is_approved 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {examSubmissionResult.status} ({examSubmissionResult.score}/100 pts)
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{examSubmissionResult.feedback}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                      <div className="p-3 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 text-[10px] block">Índice de Integridade:</span>
                        <span className="font-bold text-indigo-400">{examSubmissionResult.integrity?.score}%</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 text-[10px] block">Desvios de Foco:</span>
                        <span className="font-bold text-slate-200">{examSubmissionResult.integrity?.blur_count} ocorrências</span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 text-[10px] block">Veredito Anti-Fraude:</span>
                        <span className="font-bold text-emerald-400">{examSubmissionResult.integrity?.verdict}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : examViewMode === "create" ? (
              /* CREATE EXAM WITH AI VARIANTS FORM */
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Agendar Nova Avaliação Prática</h3>
                    <p className="text-xs text-slate-400">Configure parâmetros e gere variantes A, B e C para evitar cola no laboratório.</p>
                  </div>
                  <button onClick={() => setExamViewMode("list")} className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer">
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase font-bold">Título da Prova</label>
                    <input
                      type="text"
                      placeholder="Ex: Prova Prática: Algoritmos de Ordenação"
                      value={newExamTitle}
                      onChange={(e) => setNewExamTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase font-bold">Tópico Pedagógico</label>
                    <input
                      type="text"
                      value={newExamTopic}
                      onChange={(e) => setNewExamTopic(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase font-bold">Duração (Minutos)</label>
                    <input
                      type="number"
                      value={newExamDuration}
                      onChange={(e) => setNewExamDuration(parseInt(e.target.value) || 60)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-slate-300 uppercase font-bold">Código de Acesso (Senha)</label>
                    <input
                      type="text"
                      value={newExamAccessCode}
                      onChange={(e) => setNewExamAccessCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* AI Variants Generator */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Gerador de Variantes A/B/C com IA
                      </h4>
                      <p className="text-[11px] text-slate-400">Gera variações equivalentes do problema com casos de teste distintos.</p>
                    </div>

                    <button
                      onClick={handleGenerateExamVariants}
                      disabled={isGeneratingExamVariants}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingExamVariants ? "Gerando..." : "Gerar 3 Variantes"}</span>
                    </button>
                  </div>

                  {generatedExamVariants.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {generatedExamVariants.map((v: any, idx: number) => (
                        <div key={idx} className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">{v.title}</span>
                          <p className="text-xs text-slate-300 leading-tight">{v.prompt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button onClick={() => setExamViewMode("list")} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={handleCreateExam} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20">
                    Publicar Exame Agendado
                  </button>
                </div>
              </div>
            ) : (
              /* EXAMS LIST OVERVIEW */
              <div className="space-y-6">
                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Painel de Exames & Avaliações Práticas</h3>
                    <p className="text-xs text-slate-400">Monitore avaliações em andamento com restrição de foco e variações A/B/C.</p>
                  </div>

                  <button
                    onClick={() => {
                      setGeneratedExamVariants([]);
                      setExamViewMode("create");
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agendar Nova Avaliação</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {examArenaList.map((exam) => (
                    <div key={exam.id} className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase border border-emerald-500/20">
                            {exam.status} • {exam.duration_minutes} min
                          </span>
                          <span className="text-xs font-mono text-slate-400">Senha: <code className="text-indigo-300 font-bold">{exam.access_code}</code></span>
                        </div>

                        <h4 className="text-base font-bold text-white">{exam.title}</h4>
                        <p className="text-xs text-slate-400">{exam.description}</p>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Anti-Cheat Ativo • {exam.variants?.length || 3} Variantes Geradas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleStartExamRunner(exam)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Iniciar Modo Exame</span>
                        </button>

                        <button
                          onClick={() => handleExportRosterPdf(exam)}
                          className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Exportar Ata de Notas em PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Ata PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 1: Central de Provas */}
        {subTab === "assessments" && (
          <motion.div
            key="assessments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="flex justify-between items-center bg-[#0f172a] p-5 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">
                  Banco de Provas e Diagnósticos
                </h3>
                <p className="text-xs text-slate-400">
                  Modelos construídos para aplicação pedagógica local ou
                  sandbox.
                </p>
              </div>

              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold hover:bg-slate-805 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Criar Avaliação
              </button>
            </div>

            {/* Manual builder Form */}
            {showManualForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-4 overflow-hidden"
                onSubmit={handleCreateManual}
              >
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  Construtor de Provas Curriculares (Módulo 2)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400">
                      Título do Instrumento
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Prova de Lógica 2B"
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="flex grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold">
                        Tipo
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                      >
                        <option value="Prática">Prova Prática</option>
                        <option value="Objetiva">Prova Objetiva</option>
                        <option value="Híbrida">Exame Híbrido</option>
                        <option value="Diagnóstica">
                          Avaliação Diagnóstica
                        </option>
                        <option value="Recuperação">
                          Recuperação Paralela
                        </option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold">
                        Competência-Alvo
                      </label>
                      <select
                        value={formComp}
                        onChange={(e) => setFormComp(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                      >
                        <option value="COMP-01">COMP-01 (Dados)</option>
                        <option value="COMP-02">COMP-02 (Loops)</option>
                        <option value="COMP-03">COMP-03 (Arranjos)</option>
                        <option value="COMP-04">COMP-04 (Módulos)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="px-3 py-1 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 text-slate-955 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Salvar Projeto
                  </button>
                </div>
              </motion.form>
            )}

            {/* Assessment Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assessments.map((ass) => (
                <div
                  key={ass.id}
                  className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-emerald-500/20 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {ass.type}
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        {ass.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
                        <span>UC: {ass.uc}</span>
                        <span>●</span>
                        <span>COMP: {ass.competency}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        ass.status === "Publicado"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {ass.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[11px] text-slate-500 font-mono">
                    <span>{ass.questionsCount} Questões Vinculadas</span>
                    <button
                      onClick={() =>
                        handleExportExamPDF(ass.title, ass.competency)
                      }
                      className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 2: Intelligent Generator with IA (Contextual Multi-LLM Engine) */}
        {subTab === "generator" && (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Multi-LLM Provider & VPS Connection Header */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Motor de Inteligência Artificial & Servidor VPS
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                        Multi-LLM Ativo
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure o Ollama na sua VPS ou selecione provedores em nuvem (Gemini, OpenAI, Groq, DeepSeek) com fallback resiliente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestAiConnection}
                    disabled={isTestingAiConnection}
                    className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isTestingAiConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    Testar Conexão VPS / IA
                  </button>
                </div>
              </div>

              {/* Provider Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Provedor Principal
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ollama">🖥️ Ollama (Local / VPS)</option>
                    <option value="gemini">✨ Google Gemini (Cloud Flash/Pro)</option>
                    <option value="openai">⚡ OpenAI GPT (4o / 4o-mini / o3-mini)</option>
                    <option value="groq">🚀 Groq (Llama 3.3 70B / Mixtral)</option>
                    <option value="deepseek">🧠 DeepSeek (Reasoner / Chat)</option>
                    <option value="auto">🔄 Modo Híbrido (Auto Fallback)</option>
                  </select>
                </div>

                {aiProvider === "ollama" && (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Endpoint URL do Ollama (VPS)
                      </label>
                      <input
                        type="text"
                        value={aiVpsUrl}
                        onChange={(e) => setAiVpsUrl(e.target.value)}
                        placeholder="http://seu-ip-vps:11434"
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Modelo no Ollama
                      </label>
                      <input
                        type="text"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder="qwen2.5-coder:3b"
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {aiProvider !== "ollama" && (
                  <>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Chave de API ({aiProvider.toUpperCase()})
                      </label>
                      <input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="Deixe em branco para usar a chave do arquivo .env"
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Modelo de IA
                      </label>
                      <input
                        type="text"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder={aiProvider === "gemini" ? "gemini-2.5-flash" : aiProvider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Ping Connection Result Badge */}
              {aiConnectionStatus && (
                <div className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-2 border ${
                  aiConnectionStatus.online ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${aiConnectionStatus.online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    <span>{aiConnectionStatus.message}</span>
                  </div>
                  {aiConnectionStatus.models && aiConnectionStatus.models.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-md">
                      <span className="text-[10px] text-slate-400 uppercase">Tags:</span>
                      {aiConnectionStatus.models.slice(0, 4).map((m: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAiModel(m)}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] hover:border-emerald-400 transition-all cursor-pointer"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Pedagogical Assessment Builder Form */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-6 shadow-2xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Construtor de Avaliações Contextualizadas com IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina o cenário do mundo real, a ementa técnica e a matriz SENAI para gerar cadernos de prova, rubricas e baterias de testes sem limites.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* UC & Theme */}
                <div className="flex flex-col gap-1.5 md:col-span-5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    Unidade Curricular (UC)
                  </label>
                  <input
                    type="text"
                    value={aiUnitCurricular}
                    onChange={(e) => setAiUnitCurricular(e.target.value)}
                    placeholder="Ex: Desenvolvimento de Sistemas, Lógica de Programação..."
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs hover:border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-7">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Tema / Ementa Pedagógica Detalhada
                  </label>
                  <input
                    type="text"
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    placeholder="Ex: POO em Java (Polimorfismo e Exceções), Algoritmos de Ordenação, APIs REST..."
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs hover:border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Real-World Context Scenario & Presets */}
                <div className="flex flex-col gap-2 md:col-span-12 bg-slate-950/80 p-4 rounded-xl border border-slate-850">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Estudo de Caso / Cenário Empresarial do Mundo Real
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Injeta imersão e contexto prático de mercado em todas as questões
                    </span>
                  </div>

                  <input
                    type="text"
                    value={aiContextScenario}
                    onChange={(e) => setAiContextScenario(e.target.value)}
                    placeholder="Descreva o caso real (ex: Sistema de telemetria IoT em linha de montagem industrial 4.0)"
                    className="w-full bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-slate-100 hover:border-slate-700 focus:outline-none focus:border-amber-500 font-medium"
                  />

                  {/* Preset Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Presets Rápidos:</span>
                    {scenarioPresets.map((sc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiContextScenario(`${sc.title}: ${sc.desc}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 hover:border-amber-500/40 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        {sc.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competencies */}
                <div className="flex flex-col gap-2 md:col-span-6 bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    Matriz de Competências SENAI
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "COMP-01", label: "COMP-01: Dados primitivos & Variáveis" },
                      { id: "COMP-02", label: "COMP-02: Condicionais & Repetições" },
                      { id: "COMP-03", label: "COMP-03: Vetores, Matrizes & Coleções" },
                      { id: "COMP-04", label: "COMP-04: Funções & Modularização" },
                      { id: "COMP-05", label: "COMP-05: Classes & Paradigma POO" },
                      { id: "COMP-06", label: "COMP-06: Banco de Dados & APIs" }
                    ].map((comp) => {
                      const isSelected = aiSelectedCompetencies.includes(comp.id);
                      return (
                        <label
                          key={comp.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                            isSelected ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setAiSelectedCompetencies(aiSelectedCompetencies.filter(c => c !== comp.id));
                              } else {
                                setAiSelectedCompetencies([...aiSelectedCompetencies, comp.id]);
                              }
                            }}
                            className="rounded text-emerald-500 focus:ring-0"
                          />
                          {comp.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Execution parameters */}
                <div className="flex flex-col gap-3 md:col-span-6 bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Linguagem de Código
                      </label>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node.js)</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java 21</option>
                        <option value="csharp">C# (.NET)</option>
                        <option value="cpp">C / C++</option>
                        <option value="sql">SQL (PostgreSQL/MySQL)</option>
                        <option value="php">PHP</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Dificuldade Estimada
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Fácil">Nível 1 - Fundamentos (Fácil)</option>
                        <option value="Média">Nível 2 - Aplicação Prática (Média)</option>
                        <option value="Difícil">Nível 3 - Otimização & Casos de Borda (Difícil)</option>
                        <option value="Progressiva">Mista (Progressiva 1 → 3)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Quantidade de Questões
                      </label>
                      <select
                        value={aiQuestionsCount}
                        onChange={(e) => setAiQuestionsCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value={3}>3 Questões (Curta)</option>
                        <option value={5}>5 Questões (Padrão Recomendado)</option>
                        <option value={8}>8 Questões (Completa)</option>
                        <option value={10}>10 Questões (Aprofundada)</option>
                        <option value={15}>15 Questões (Simulado SAEP)</option>
                        <option value={20}>20 Questões (Banco de Exame)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 justify-center">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        Variantes Anti-Cola
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiGenerateVariants}
                          onChange={(e) => setAiGenerateVariants(e.target.checked)}
                          className="rounded text-indigo-500 focus:ring-0"
                        />
                        <span className="text-[11px] text-slate-300">Gerar Variantes A, B e C</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Provedor Selecionado: <strong>{aiProvider.toUpperCase()}</strong> ({aiModel})</span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAIExam}
                  disabled={aiGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-[#030712] font-extrabold text-xs rounded-xl flex items-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {aiGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Processando Avaliação na IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Gerar Avaliação Contextualizada ({aiQuestionsCount} Questões)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Suggestion Preview Layout (Generated Assessment Deck) */}
            <AnimatePresence>
              {aiSuggestedExam && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-6 rounded-3xl bg-slate-950 border border-emerald-500/30 flex flex-col gap-6 shadow-2xl"
                >
                  {/* Top Deck Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Avaliação Pronta ({aiSuggestedExam.questions_count} Questões • {aiSuggestedExam.total_points} Pts)
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {aiSuggestedExam.language?.toUpperCase()} • {aiSuggestedExam.target_difficulty}
                        </span>
                        {aiSuggestedExam.ai_metadata && (
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            IA: {aiSuggestedExam.ai_metadata.provider_used} ({aiSuggestedExam.ai_metadata.model_used})
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white mt-1.5 font-display">
                        {aiSuggestedExam.title}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Cenário Real: <strong className="text-amber-300">{aiSuggestedExam.context_scenario}</strong> • Unidade Curricular: <strong>{aiSuggestedExam.unit_curricular}</strong>
                      </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportStudentExamPdf(aiActiveVariant)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-750 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Caderno do Aluno (PDF)
                      </button>

                      <button
                        type="button"
                        onClick={handleExportTeacherGuidePdf}
                        className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                        Guia do Professor (PDF)
                      </button>

                      <button
                        type="button"
                        onClick={handleSendToExamArena}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Enviar para Smart Exam Arena
                      </button>

                      <button
                        type="button"
                        onClick={handleApproveAIExam}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
                      >
                        Publicar Prova
                      </button>
                    </div>
                  </div>

                  {/* Anti-Cheat Variant Switcher */}
                  {aiSuggestedExam.variants && aiSuggestedExam.variants.length > 0 && (
                    <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                      <span className="text-xs font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        Variantes Anti-Cola para Laboratório:
                      </span>
                      <div className="flex items-center gap-2">
                        {(["A", "B", "C"] as const).map((vCode) => (
                          <button
                            key={vCode}
                            type="button"
                            onClick={() => setAiActiveVariant(vCode)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              aiActiveVariant === vCode
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                                : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <span>Variante {vCode}</span>
                            {aiActiveVariant === vCode && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="flex flex-col gap-6">
                    {(() => {
                      const questionsToDisplay = aiActiveVariant === "B" && aiSuggestedExam.variants?.[1]?.questions
                        ? aiSuggestedExam.variants[1].questions
                        : aiActiveVariant === "C" && aiSuggestedExam.variants?.[2]?.questions
                        ? aiSuggestedExam.variants[2].questions
                        : aiSuggestedExam.questions;

                      return (questionsToDisplay || []).map((q: any, qIdx: number) => {
                        const isCodeTracing = q.type === "code_tracing";
                        const isHandsOn = q.type === "hands_on_coding";
                        const isMultipleChoice = q.type === "multiple_choice" || (!isCodeTracing && !isHandsOn);

                        return (
                          <div
                            key={q.id || qIdx}
                            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col gap-4 shadow-lg hover:border-slate-700 transition-all"
                          >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 pb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                  Q{q.num || qIdx + 1}
                                </span>
                                <div>
                                  <span className="text-sm font-bold text-slate-100 block">
                                    {q.title || `Questão ${qIdx + 1}`}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Competência: <strong className="text-indigo-300">{q.competency}</strong> • Dificuldade: <strong>{q.difficulty}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                                  {q.points || 20} Pts
                                </span>
                                <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-bold uppercase">
                                  {isCodeTracing ? "Code Tracing" : isHandsOn ? "Hands-on Prático" : "Múltipla Escolha"}
                                </span>
                              </div>
                            </div>

                            {/* Context & Statement */}
                            {q.context_intro && (
                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-200/90 leading-relaxed italic">
                                <strong>Contexto do Problema:</strong> {q.context_intro}
                              </div>
                            )}

                            <p className="text-xs font-medium leading-relaxed text-slate-200">
                              {q.enunciado}
                            </p>

                            {/* Code Snippet */}
                            {q.code_snippet && (
                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                                <div className="text-[9px] text-slate-500 pb-1.5 border-b border-slate-850 mb-2 uppercase flex items-center justify-between">
                                  <span>Trecho de Código ({aiSuggestedExam.language})</span>
                                  <span>Tracing de Execução</span>
                                </div>
                                <pre>{q.code_snippet}</pre>
                              </div>
                            )}

                            {/* Starter Code for Hands-on */}
                            {q.starter_code && (
                              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
                                <div className="text-[9px] text-slate-500 pb-1.5 border-b border-slate-850 mb-2 uppercase flex items-center justify-between">
                                  <span>Starter Code Fornecido ao Aluno</span>
                                  <span>Template de Resolução</span>
                                </div>
                                <pre>{q.starter_code}</pre>
                              </div>
                            )}

                            {/* Multiple Choice Alternatives */}
                            {q.alternatives && q.alternatives.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                                {q.alternatives.map((alt: string, aIdx: number) => {
                                  const letter = alt.trim().charAt(0);
                                  const isCorrect = letter === q.gabarito || alt.startsWith(`${q.gabarito})`);
                                  return (
                                    <div
                                      key={aIdx}
                                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                                        isCorrect
                                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-semibold"
                                          : "bg-slate-950/70 border-slate-850 text-slate-300"
                                      }`}
                                    >
                                      {alt}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Test Cases for Hands-on */}
                            {q.test_cases && q.test_cases.length > 0 && (
                              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-850 flex flex-col gap-2">
                                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                                  Bateria de Casos de Teste Automatizados
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  {q.test_cases.map((tc: any, tcIdx: number) => (
                                    <div key={tcIdx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
                                      <div className="text-slate-400">Entrada: <span className="text-amber-300">{tc.input}</span></div>
                                      <div className="text-slate-400">Esperado: <span className="text-emerald-400 font-bold">{tc.expected}</span></div>
                                      {tc.explanation && <div className="text-[10px] text-slate-500 italic mt-1">{tc.explanation}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Teacher Correction Guide & SENAI Rubric */}
                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-300 flex flex-col gap-3">
                              {q.gabarito && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block pb-1 border-b border-emerald-500/20 mb-1.5">
                                    Gabarito e Justificativa Pedagógica
                                  </span>
                                  <span>
                                    Opção Correta: <strong className="text-emerald-300">{q.gabarito}</strong> — {q.justification}
                                  </span>
                                </div>
                              )}

                              {q.rubric && (
                                <div>
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block pb-1 border-b border-amber-500/20 mb-1.5">
                                    Matriz de Correção & Rubricas Técnicas SENAI
                                  </span>
                                  <span className="font-mono text-[11px] text-amber-200/90 leading-relaxed">
                                    {q.rubric}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* TAB 3: Student Portfolio Evidence Storage */}
        {subTab === "evidence" && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6 animate-fade-in"
          >
            {/* Registers and library details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: List of items */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Repositório de Evidências Pedagógicas
                  </h3>
                  <p className="text-xs text-slate-300">
                    Portfólios de atividades, relatórios analíticos anexados sob
                    competência.
                  </p>

                  <div className="flex flex-col gap-3 mt-4">
                    {evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-white">
                            {ev.student}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Turma: {ev.class} | Competência:{" "}
                            <span className="text-[#10b981] font-bold">
                              {ev.competency}
                            </span>
                          </span>
                          <span className="text-[11px] text-[#a5f3fc] font-mono flex items-center gap-1 mt-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {ev.file}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-mono text-slate-500">
                              {ev.date}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              Nota: {ev.grade}/10
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setEvidences(
                                evidences.filter((e) => e.id !== ev.id),
                              )
                            }
                            className="p-1.5 text-rose-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Register new Evidence offline */}
              <div className="lg:col-span-4 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 h-fit">
                <h3 className="text-base font-bold text-white mb-0.5">
                  Registrar Evidência
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
                  Associe uma entrega mesmo sem acesso do aluno.
                </p>

                <form
                  onSubmit={handleAddEvidence}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                      Nome do Estudante
                    </label>
                    <input
                      type="text"
                      required
                      value={newEvidenceStudent}
                      onChange={(e) => setNewEvidenceStudent(e.target.value)}
                      placeholder="Ex: Ana Silva"
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                      Competência Relacionada
                    </label>
                    <select
                      value={newEvidenceComp}
                      onChange={(e) => setNewEvidenceComp(e.target.value)}
                      className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                    >
                      <option value="COMP-01">
                        COMP-01 (Dados primitivos, Tipos)
                      </option>
                      <option value="COMP-02">
                        COMP-02 (Seleção, Loops, Laços)
                      </option>
                      <option value="COMP-03">
                        COMP-03 (Arranjos, Matrizes)
                      </option>
                      <option value="COMP-04">
                        COMP-04 (Funções, Parâmetros)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                        Nota dita
                      </label>
                      <input
                        type="text"
                        value={newEvidenceGrade}
                        onChange={(e) => setNewEvidenceGrade(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-mono text-slate-400 font-bold uppercase">
                        Nome do Arquivo
                      </label>
                      <input
                        type="text"
                        value={newEvidenceFile}
                        onChange={(e) => setNewEvidenceFile(e.target.value)}
                        className="bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        placeholder="projeto.pdf"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center mt-1 flex flex-col items-center cursor-pointer hover:bg-slate-900/30">
                    <Upload className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[10px] text-slate-400">
                      Anexar documento físico da entrega
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-955 font-bold font-mono text-xs py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-500/5 uppercase"
                  >
                    Salvar Evidência
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: AI Simulation Generator (Adaptive) */}
        {subTab === "simulations" && (
          <motion.div
            key="simulations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Gerador de Simulações Adaptativas IA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Crie exercícios focados nas dificuldades reais da sua turma extraídas do Analytics.
                    </p>
                  </div>
                </div>

                {weaknesses.length === 0 && !isAnalyzing && (
                  <button
                    onClick={handleAnalyzeWeaknesses}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analisar Fragilidades da Turma
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Cruzando dados do Analytics...</p>
                    <p className="text-xs text-slate-500 mt-1">Identificando padrões de erro e lacunas de competência.</p>
                  </div>
                </div>
              )}

              {weaknesses.length > 0 && !generatedSimulation && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">
                      Diagnóstico de Performance
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Detectamos que a turma possui 3 tópicos críticos com taxa de erro acima de 35%. 
                      Selecione abaixo quais deseja priorizar no simulado adaptativo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {weaknesses.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          if (selectedWeaknesses.includes(w.id)) {
                            setSelectedWeaknesses(selectedWeaknesses.filter(id => id !== w.id));
                          } else {
                            setSelectedWeaknesses([...selectedWeaknesses, w.id]);
                          }
                        }}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                          selectedWeaknesses.includes(w.id)
                            ? "bg-indigo-500/10 border-indigo-500/50"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white">{w.topic}</span>
                          <span className={`text-[10px] font-mono font-bold ${w.error_rate > 50 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {w.error_rate}% erro
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {w.description}
                        </p>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                            {w.comp}
                          </span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedWeaknesses.includes(w.id) 
                              ? "bg-indigo-500 border-indigo-500" 
                              : "border-slate-700"
                          }`}>
                            {selectedWeaknesses.includes(w.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-900">
                    <button
                      onClick={handleGenerateSimulation}
                      disabled={selectedWeaknesses.length === 0 || isGeneratingSimulation}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
                    >
                      {isGeneratingSimulation ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Construindo Itens de Reforço...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Simulado de Reforço IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {generatedSimulation && (
                <div className="flex flex-col gap-6 animate-scale-up">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                        Simulado Adaptativo Pronto
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1.5">
                        {generatedSimulation.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {generatedSimulation.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGeneratedSimulation(null)}
                        className="px-3 py-2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Refazer Análise
                      </button>
                      <button
                        onClick={() => {
                          setAssessments([
                            ...assessments,
                            {
                              id: Date.now(),
                              title: generatedSimulation.title,
                              type: "Simulado Adaptativo",
                              uc: "Recuperação de Performance",
                              status: "Publicado",
                              questionsCount: generatedSimulation.questions.length,
                              competency: "Múltiplas",
                            },
                          ]);
                          setSubTab("assessments");
                          setGeneratedSimulation(null);
                          setWeaknesses([]);
                          setSelectedWeaknesses([]);
                        }}
                        className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        Publicar para Turma
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {generatedSimulation.questions.map((q: any) => (
                      <div key={q.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold">{q.type === 'Code' ? 'Desafio de Código' : 'Análise Lógica'}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{q.difficulty}</span>
                        </div>
                        <h5 className="text-sm font-bold text-white mb-2">{q.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed">{q.statement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: Result Analytics & Diagnostic */}
        {subTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Média da Turma
                </span>
                <span className="text-4xl font-extrabold text-white block mt-1">
                  {classAverage}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Média ponderada baseada nos critérios de todas as avaliações
                  publicadas.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Competência Pedagógica Crítica
                </span>
                <span className="text-2xl font-extrabold text-rose-400 block mt-1.5">
                  {criticalCompCode}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Unidade curricular apresentando menor índice de fluência de
                  código.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Alunos Sob Alerta de Baixo Rendimento
                </span>
                <span className="text-4xl font-extrabold text-amber-500 block mt-1">
                  {recoveryAdvisedNum}
                </span>
                <p className="text-[10px] text-slate-400 mt-2">
                  Recomendação automática do Copiloto IA para iniciar Trilha de
                  Recuperação.
                </p>
              </div>
            </div>

            {/* Módulo 9: Automatic Diagnosis text with suggestion using local state */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-400" />
                Diagnóstico de Aprovação IA - Relatório de Intervenção Auto
              </h3>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed font-semibold">
                <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1 uppercase">
                  Avaliação de Forças e Vulnerabilidades da Turma
                </span>
                Seu cronograma apresenta <strong>68% de conclusão</strong> do
                planejado acadêmico do SENAI para esta UC. A análise
                automatizada de logs indica que <strong>78% dos alunos</strong>{" "}
                conseguiram fluência em laços iterativos indexados, mas{" "}
                <strong>35% apresentaram problemas graves</strong> com escopo de
                variáveis dentro de laços aninhados (competência{" "}
                {criticalCompCode}).
                <div className="mt-3 text-slate-400">
                  <strong className="text-amber-400 block mb-1">
                    Recomendação de Intervenção Pedagógica:
                  </strong>
                  Recomendamos disparar uma lista de fixação complementar sobre
                  referências antes de avançar para 'Funções Modulares' de forma
                  a restabelecer a média geral de aproveitamentos de notas.
                </div>
              </div>

              {/* Recovery trigger */}
              <div className="flex justify-end mt-1">
                <button
                  disabled
                  className="px-4 py-2 bg-slate-800 text-slate-500 text-xs font-mono font-bold rounded-xl border border-slate-700/50 opacity-60 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500/50" />
                  Plano de Recuperação Paralela Sugerido
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 6: OCR Accuracy & Tuning */}
        {subTab === "ocr_accuracy" && (
          <motion.div
            key="ocr_accuracy"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                    Módulo de Calibração & Visão Computacional
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Relatório de Acurácia de OCR & Caligrafia por Turma
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare o código transcrito pela IA com as correções manuais do professor e ajuste parâmetros para turmas com caligrafias distintas.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportOcrCsv}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Relatório (CSV)
                  </button>
                  <button
                    onClick={handleExportOcrPdf}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Exportar Relatório (PDF)
                  </button>
                </div>
              </div>

              {/* Class Selector & Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Turma Selecionada</span>
                  <select
                    value={ocrSelectedClass}
                    onChange={(e) => setOcrSelectedClass(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 outline-none font-mono mt-1"
                  >
                    <option value="Desenvolvimento Web 1A">Desenvolvimento Web 1A</option>
                    <option value="Sistemas Embarcados 1C">Sistemas Embarcados 1C</option>
                    <option value="Automação Industrial 2B">Automação Industrial 2B</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Acurácia Média OCR</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 mt-1">94.5%</div>
                  <span className="text-[10px] text-slate-500">+2.3% após último ajuste fino</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Provas Digitalizadas</span>
                  <div className="text-2xl font-black font-mono text-white mt-1">142</div>
                  <span className="text-[10px] text-slate-500">Avaliações processadas no trimestre</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Variância Caligráfica</span>
                  <div className="text-2xl font-black font-mono text-amber-400 mt-1">Moderada</div>
                  <span className="text-[10px] text-slate-500">Requer heurística cursiva ativa</span>
                </div>
              </div>

              {/* Automatic Extraction Parameter Tuning Panel */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Ajuste Fino Automático de Parâmetros de Extração
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Personalize os limiares de binarização e pesos da IA Vision para esta turma com base nas divergências detectadas.
                    </p>
                  </div>
                  {ocrTuningApplied && (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg animate-pulse">
                      ✓ Parâmetros Aplicados e Sincronizados com o Motor OCR!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Limiar de Contraste (Threshold)</span>
                      <span className="text-emerald-400 font-bold">{ocrContrastThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={ocrContrastThreshold}
                      onChange={(e) => setOcrContrastThreshold(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Ideal para destacar traços de caneta azul/preta em papel reciclado.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">Kernel de Binarização Morfologica</span>
                      <span className="text-emerald-400 font-bold">{ocrBinarizationKernel}x{ocrBinarizationKernel}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      step="2"
                      value={ocrBinarizationKernel}
                      onChange={(e) => setOcrBinarizationKernel(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500">Reduz ruídos de rasura e manchas de folhas escaneadas.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                      <input
                        type="checkbox"
                        checked={ocrConfidenceBoost}
                        onChange={(e) => setOcrConfidenceBoost(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                      />
                      Boost de Confiança IA Vision
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-300">
                      <input
                        type="checkbox"
                        checked={ocrCursiveHeuristic}
                        onChange={(e) => setOcrCursiveHeuristic(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                      />
                      Heurística de Caligrafia Cursiva
                    </label>
                  </div>

                  <button
                    onClick={handleApplyOcrTuning}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Aplicar Ajuste Fino para {ocrSelectedClass}
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white text-sm font-mono uppercase tracking-wider">
                  Comparativo: Transcrição IA vs Correção Manual do Professor
                </h4>
                <div className="overflow-x-auto max-h-[350px] scrollbar-thin">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-3">Estudante</th>
                        <th className="p-3">Caligrafia Detectada</th>
                        <th className="p-3">Código Transcrito (IA OCR)</th>
                        <th className="p-3">Correção Manual (Professor)</th>
                        <th className="p-3 text-right">Acurácia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {ocrRecords
                        .filter(r => r.class === ocrSelectedClass)
                        .map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-bold text-white">{rec.student}</td>
                            <td className="p-3 text-slate-300">{rec.handwritingStyle}</td>
                            <td className="p-3 text-amber-300 whitespace-pre-line font-mono text-[11px] bg-slate-950/40 p-2 rounded">
                              {rec.aiTranscribed}
                            </td>
                            <td className="p-3 text-emerald-300 whitespace-pre-line font-mono text-[11px] bg-slate-950/40 p-2 rounded">
                              {rec.teacherCorrected}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400">
                              {rec.accuracy}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
