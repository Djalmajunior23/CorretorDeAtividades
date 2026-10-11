import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Mic,
  MicOff,
  RotateCcw,
  Download,
  FileText,
  Award,
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileSpreadsheet,
  GraduationCap,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Code2,
  BookOpen,
  MessageSquareCode
} from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import { TeacherCopilotService, TeacherCopilotResponse } from "../services/teacherCopilotService";
import { ParallelRecoveryService, ParallelRecoveryPlan } from "../services/parallelRecoveryService";
import { AcademicExportService, AcademicExportRow, AcademicExportFormat } from "../services/academicExportService";
import { ClassCouncilDossierService, CouncilStudentData } from "../services/classCouncilDossierService";
import { TeacherVivaVoceScriptService, VivaVoceDefenseScript } from "../services/teacherVivaVoceScriptService";

interface TeacherCopilotAndEmpowermentViewProps {
  onNavigateTab?: (tab: string) => void;
}

export default function TeacherCopilotAndEmpowermentView({ onNavigateTab }: TeacherCopilotAndEmpowermentViewProps) {
  const [activeTool, setActiveTool] = useState<
    "copilot" | "parallel_recovery" | "voice_feedback" | "class_council" | "academic_export" | "viva_voce"
  >("copilot");

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // --- 1. Copiloto State ---
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: "user" | "copilot"; content: string; responseObj?: TeacherCopilotResponse }>>([
    {
      role: "copilot",
      content: "Olá, Professor! Sou o seu **Copiloto Pedagógico SENAI**. Posso analisar dados das suas turmas, diagnosticar estudantes com dificuldade, criar roteiros de aula ou planejar intervenções de reforço. Como posso te auxiliar hoje?"
    }
  ]);

  // --- 2. Parallel Recovery State ---
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryThreshold, setRecoveryThreshold] = useState(60);
  const [recoverySubject, setRecoverySubject] = useState("Lógica de Programação, Estruturas de Dados e Tratamento de Erros");
  const [generatedPlan, setGeneratedPlan] = useState<ParallelRecoveryPlan | null>(null);

  // --- 3. Voice-to-Feedback State ---
  const [voiceStudentName, setVoiceStudentName] = useState("Ana Clara Mendes");
  const [voiceActivityTitle, setVoiceActivityTitle] = useState("Construção de API RESTful com Validações");
  const [voiceSpeechText, setVoiceSpeechText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceStructuredResult, setVoiceStructuredResult] = useState<any | null>(null);

  // --- 4. Class Council Dossier State ---
  const [councilStudentId, setCouncilStudentId] = useState<string>("");
  const [councilDossier, setCouncilDossier] = useState<CouncilStudentData | null>(null);
  const [councilLoading, setCouncilLoading] = useState(false);

  // --- 5. Academic Export State ---
  const [exportFormat, setExportFormat] = useState<AcademicExportFormat>("totvs");
  const [exportRows, setExportRows] = useState<AcademicExportRow[]>([]);
  const [copiedCsv, setCopiedCsv] = useState(false);

  // --- 6. Viva-Voce Script State ---
  const [vivaProjectTitle, setVivaProjectTitle] = useState("Sistema de Gestão de Inventário com Banco PostgreSQL");
  const [vivaStudentName, setVivaStudentName] = useState("Rafael Souza Dias");
  const [vivaCodeSnippet, setVivaCodeSnippet] = useState(`async function transferirSaldo(origemId, destinoId, valor) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resOrigem = await client.query("SELECT saldo FROM contas WHERE id = $1 FOR UPDATE", [origemId]);
    if (resOrigem.rows[0].saldo < valor) throw new Error("Saldo insuficiente");
    await client.query("UPDATE contas SET saldo = saldo - $1 WHERE id = $2", [valor, origemId]);
    await client.query("UPDATE contas SET saldo = saldo + $1 WHERE id = $2", [valor, destinoId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}`);
  const [vivaLoading, setVivaLoading] = useState(false);
  const [vivaScript, setVivaScript] = useState<VivaVoceDefenseScript | null>(null);

  // Load initial classes and students
  useEffect(() => {
    async function loadData() {
      setLoadingInitial(true);
      try {
        const clsRes = await fetch(apiUrl("/api/classes"));
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          const list = Array.isArray(clsData) ? clsData : [];
          setClasses(list);
          if (list.length > 0) {
            setSelectedClassId(list[0].id);
          }
        }
      } catch (e) {
        console.warn("Could not fetch classes for copilot:", e);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Fetch students when selectedClassId changes
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClassId) return;
      try {
        const res = await fetch(apiUrl(`/api/students?class_id=${encodeURIComponent(selectedClassId)}`));
        if (res.ok) {
          const sData = await res.json();
          const list = Array.isArray(sData) ? sData : [];
          setStudents(list);
          if (list.length > 0) {
            setCouncilStudentId(list[0].id);
            setVoiceStudentName(list[0].name);
          }
          // Pre-populate export rows
          const rows = AcademicExportService.generateRows(list, {});
          setExportRows(rows);
        }
      } catch (e) {
        console.warn("Could not fetch students for copilot class:", e);
      }
    }
    loadStudents();
  }, [selectedClassId]);

  // Load Council Dossier when student changes
  useEffect(() => {
    if (!councilStudentId) return;
    async function loadDossier() {
      setCouncilLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/teacher/class-council-dossier/${councilStudentId}`));
        if (res.ok) {
          const data = await res.json();
          if (data.dossier) setCouncilDossier(data.dossier);
        }
      } catch (e) {
        console.warn("Error loading council dossier:", e);
      } finally {
        setCouncilLoading(false);
      }
    }
    loadDossier();
  }, [councilStudentId]);

  // --- Handlers ---

  // 1. Send Copilot Query
  const handleSendCopilotQuery = async (customQuery?: string) => {
    const q = customQuery || copilotQuery;
    if (!q.trim()) return;

    setCopilotLoading(true);
    setCopilotQuery("");
    setCopilotHistory(prev => [...prev, { role: "user", content: q }]);

    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const res = await fetch(apiUrl("/api/teacher/copilot/ask"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          classId: selectedClassId,
          className: selectedClass?.name || "Turma Geral"
        })
      });

      if (res.ok) {
        const data: TeacherCopilotResponse = await res.json();
        setCopilotHistory(prev => [
          ...prev,
          { role: "copilot", content: data.answerMarkdown, responseObj: data }
        ]);
      } else {
        throw new Error("Erro na resposta da API.");
      }
    } catch {
      // Local fallback
      const fallback = await TeacherCopilotService.askCopilot({
        query: q,
        classId: selectedClassId,
        className: classes.find(c => c.id === selectedClassId)?.name
      });
      setCopilotHistory(prev => [
        ...prev,
        { role: "copilot", content: fallback.answerMarkdown, responseObj: fallback }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // 2. Generate Parallel Recovery
  const handleGenerateParallelRecovery = async () => {
    setRecoveryLoading(true);
    const selectedClass = classes.find(c => c.id === selectedClassId);
    try {
      const res = await fetch(apiUrl("/api/teacher/parallel-recovery/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          className: selectedClass?.name || "Turma SENAI",
          scoreThreshold: recoveryThreshold,
          subjectFocus: recoverySubject
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPlan(data.plan);
        toast.success("Plano de Recuperação Paralela gerado com sucesso!");
      } else {
        throw new Error("Falha na API");
      }
    } catch {
      const plan = await ParallelRecoveryService.generateRecoveryPlan({
        classId: selectedClassId,
        className: selectedClass?.name || "Turma SENAI",
        students: students,
        scoreThreshold: recoveryThreshold,
        subjectFocus: recoverySubject
      });
      setGeneratedPlan(plan);
      toast.success("Plano de Recuperação gerado em modo offline!");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // 3. Web Speech Recognition for Voice-to-Feedback
  const handleToggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Navegador não possui suporte nativo ao reconhecimento de voz. Você pode digitar diretamente no campo abaixo.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Microfone ativado! Fale naturalmente o parecer do estudante...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceSpeechText(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast.error("Falha no reconhecimento de voz do microfone.");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
      toast.error("Não foi possível iniciar o microfone.");
    }
  };

  // Process Voice Dictation
  const handleProcessVoiceDictation = async () => {
    if (!voiceSpeechText.trim()) {
      toast.error("Insira ou dite o parecer do estudante primeiro.");
      return;
    }

    setVoiceProcessing(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/voice-feedback/structure"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: voiceStudentName,
          activityTitle: voiceActivityTitle,
          rawSpeechText: voiceSpeechText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVoiceStructuredResult(data.feedback);
        toast.success("Parecer estruturado pela IA com sucesso!");
      } else {
        throw new Error("Erro na API");
      }
    } catch (e: any) {
      toast.error("Falha ao estruturar feedback: " + e.message);
    } finally {
      setVoiceProcessing(false);
    }
  };

  // 4. Download Class Council PDF
  const handleDownloadCouncilPdf = () => {
    if (!councilDossier) {
      toast.error("Selecione um estudante primeiro.");
      return;
    }
    try {
      const doc = ClassCouncilDossierService.generateDossierPdf(councilDossier);
      doc.save(`dossie_conselho_${councilDossier.enrollmentCode || councilDossier.name.toLowerCase().replace(/\s+/g, "_")}.pdf`);
      toast.success("Dossiê Oficial em PDF (A4) gerado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + e.message);
    }
  };

  // 5. Download Academic Export File
  const handleDownloadAcademicExport = () => {
    const selectedClass = classes.find(c => c.id === selectedClassId);
    let csv = "";
    let filename = "";

    if (exportFormat === "moodle") {
      csv = AcademicExportService.toMoodleCsv(exportRows);
      filename = `moodle_gradebook_${selectedClass?.name || "turma"}.csv`;
    } else if (exportFormat === "sge") {
      csv = AcademicExportService.toSgeCsv(exportRows);
      filename = `sge_senai_notas_${selectedClass?.name || "turma"}.csv`;
    } else {
      csv = AcademicExportService.toTotvsCsv(exportRows);
      filename = `totvs_rm_educacional_${selectedClass?.name || "turma"}.csv`;
    }

    AcademicExportService.downloadFile(csv, filename);
    toast.success(`Arquivo oficial para ${exportFormat.toUpperCase()} baixado com sucesso!`);
  };

  // 6. Generate Viva-Voce Script
  const handleGenerateVivaVoce = async () => {
    setVivaLoading(true);
    try {
      const res = await fetch(apiUrl("/api/teacher/viva-voce/generate-script"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: vivaProjectTitle,
          studentName: vivaStudentName,
          codeSnippet: vivaCodeSnippet
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVivaScript(data.script);
        toast.success("Roteiro de Arguição Técnica gerado com sucesso!");
      } else {
        throw new Error("Erro na API");
      }
    } catch {
      const script = await TeacherVivaVoceScriptService.generateDefenseScript({
        projectTitle: vivaProjectTitle,
        studentName: vivaStudentName,
        codeSnippet: vivaCodeSnippet
      });
      setVivaScript(script);
      toast.success("Roteiro gerado em modo offline!");
    } finally {
      setVivaLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-slate-100 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-500/30 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-display">
                  Copiloto & Superpoderes Docentes
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Padrão SENAI 2026
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Inteligência pedagógica em 1-clique: tire dúvidas da turma, gere recuperação personalizada, dite feedbacks por voz e exporte diários oficiais.
              </p>
            </div>
          </div>

          {/* Class Selector */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-2 px-3 self-stretch md:self-auto">
            <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">Turma em Foco</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Superpower Tool Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: "copilot", label: "💬 Pergunte à Turma", icon: Bot, desc: "Chat com IA Contextual" },
          { id: "parallel_recovery", label: "🔁 Recuperação Paralela", icon: RotateCcw, desc: "Nivelamento 1-Clique" },
          { id: "voice_feedback", label: "🎙️ Voice-to-Feedback", icon: Mic, desc: "Ditado do Professor" },
          { id: "class_council", label: "📄 Dossiê do Conselho", icon: FileText, desc: "Laudo A4 Oficial" },
          { id: "academic_export", label: "📊 Diários Totvs/Moodle", icon: FileSpreadsheet, desc: "Exportação Oficial" },
          { id: "viva_voce", label: "🎯 Roteiro de Arguição", icon: ShieldCheck, desc: "Defesa Técnica / Banca" }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTool === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTool(tab.id as any)}
              className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/30"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                {tab.label}
              </span>
              <span className="text-[10px] text-slate-500 line-clamp-1">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: COPILOTO "PERGUNTE À SUA TURMA" --- */}
      {activeTool === "copilot" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                Copiloto Pedagógico Integrado à Turma
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Faça perguntas em linguagem natural. A IA analisa as submissões, notas e frequências reais desta turma para fornecer respostas acionáveis.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Base de Dados Conectada ({students.length} alunos)
            </span>
          </div>

          {/* Prompt Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              "Quem são os alunos com nota abaixo de 60?",
              "Quais são os erros mais frequentes nesta turma?",
              "Gere uma proposta de roteiro de 90 min para a próxima aula",
              "Como planejar uma intervenção em duplas nesta semana?",
              "Resumo executivo do progresso da turma para a coordenação"
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendCopilotQuery(chip)}
                className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {copilotHistory.map((msg, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl flex flex-col gap-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-900 border border-slate-800 text-slate-200 self-end max-w-[85%]"
                    : "bg-slate-950/80 border border-emerald-500/20 text-slate-100 self-start w-full shadow-md"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
                  {msg.role === "user" ? (
                    <span className="text-cyan-400">Você (Professor)</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-emerald-400" /> CodeCheck Copilot SENAI
                    </span>
                  )}
                </div>

                {/* Content formatted with markdown */}
                <div className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-200 space-y-2">
                  {msg.content}
                </div>

                {/* Optional suggested action button */}
                {msg.responseObj?.suggestedAction && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Encaminhamento recomendado:</span>
                    <button
                      onClick={() => {
                        const target = msg.responseObj?.suggestedAction?.targetTab;
                        if (target && onNavigateTab) onNavigateTab(target);
                        else if (msg.responseObj?.suggestedAction?.type === "create_recovery") setActiveTool("parallel_recovery");
                        else if (msg.responseObj?.suggestedAction?.type === "export_dossier") setActiveTool("class_council");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {msg.responseObj.suggestedAction.label}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {copilotLoading && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center gap-3 text-xs text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span>O Copiloto está consultando os dados da turma e elaborando o parecer...</span>
              </div>
            )}
          </div>

          {/* Query Input */}
          <div className="flex gap-2 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              value={copilotQuery}
              onChange={e => setCopilotQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendCopilotQuery()}
              placeholder="Pergunte qualquer coisa sobre a turma, alunos, notas ou planejamento..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSendCopilotQuery()}
              disabled={copilotLoading || !copilotQuery.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Send className="w-4 h-4" />
              Perguntar
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 2: RECUPERAÇÃO PARALELA AUTOMATIZADA --- */}
      {activeTool === "parallel_recovery" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                Gerador de Recuperação Paralela Contínua (1-Clique)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifica estudantes com nota abaixo da média estipulada e gera desafios de nivelamento sob medida para resgatar o aprendizado.
              </p>
            </div>
            <button
              onClick={handleGenerateParallelRecovery}
              disabled={recoveryLoading}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer text-xs"
            >
              <Sparkles className="w-4 h-4" />
              {recoveryLoading ? "Gerando Desafios..." : "Gerar Plano de Recuperação Automático"}
            </button>
          </div>

          {/* Filter / Threshold Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Nota de Corte para Reforço</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={recoveryThreshold}
                  onChange={e => setRecoveryThreshold(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white w-24 font-mono font-bold text-center"
                />
                <span className="text-xs text-slate-500">Alunos com nota &lt; {recoveryThreshold} serão incluídos</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Foco Temático da Intervenção</label>
              <input
                type="text"
                value={recoverySubject}
                onChange={e => setRecoverySubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                placeholder="Ex: Lógica de Programação, Estruturas de Dados, SQL..."
              />
            </div>
          </div>

          {/* Generated Plan Display */}
          {generatedPlan ? (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Directive Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <span className="font-bold text-amber-300 block mb-1">Diretriz Pedagógica SENAI para esta Turma:</span>
                  {generatedPlan.pedagogicalDirective}
                  <div className="mt-2 text-slate-400">
                    Prazo sugerido de entrega: <strong>{generatedPlan.recommendedDeadlineDays} dias úteis</strong>
                  </div>
                </div>
              </div>

              {/* Target Students */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400 mb-2">
                  Estudantes Abrangidos pelo Nivelamento ({generatedPlan.targetedStudents.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {generatedPlan.targetedStudents.map((st, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-white text-xs">{st.studentName}</span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {st.currentScore} pts
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-2">
                        {st.identifiedGaps[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Challenges */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3">
                  Desafios Práticos de Nivelamento Gerados
                </h3>
                <div className="space-y-4">
                  {generatedPlan.challenges.map((chal, idx) => (
                    <div key={chal.id} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          {chal.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {chal.competencyArea} • Nível {chal.difficulty}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 whitespace-pre-wrap">
                        {chal.instructionMarkdown}
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
                        <div className="text-[10px] text-slate-500 uppercase mb-1 font-bold">Código Inicial Proposto:</div>
                        <pre className="overflow-x-auto">{chal.starterCode}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
              Clique em &quot;Gerar Plano de Recuperação Automático&quot; para analisar os alunos com nota abaixo de {recoveryThreshold} e formular os desafios.
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: VOICE-TO-FEEDBACK --- */}
      {activeTool === "voice_feedback" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-rose-400" />
                Voice-to-Feedback (Correção por Voz / Ditado)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fale naturalmente seus apontamentos sobre a entrega do estudante. A IA estrutura em rubricas técnicas e prepara mensagem oficial.
              </p>
            </div>
            <button
              onClick={handleToggleVoiceRecording}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? "Gravando... Clique para Parar" : "Gravar com Microfone"}
            </button>
          </div>

          {/* Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Estudante Avaliado</label>
              <input
                type="text"
                value={voiceStudentName}
                onChange={e => setVoiceStudentName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Título da Atividade</label>
              <input
                type="text"
                value={voiceActivityTitle}
                onChange={e => setVoiceActivityTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
          </div>

          {/* Raw Speech / Notes Area */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-400 block mb-1">
              Ditado / Apontamentos do Professor
            </label>
            <textarea
              rows={4}
              value={voiceSpeechText}
              onChange={e => setVoiceSpeechText(e.target.value)}
              placeholder="Ex: O aluno construiu o endpoint certinho mas esqueceu de validar se o payload está vazio, além de faltar os status codes adequados. Parabéns pelo esforço com a documentação..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleProcessVoiceDictation}
                disabled={voiceProcessing || !voiceSpeechText.trim()}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <Sparkles className="w-4 h-4" />
                {voiceProcessing ? "Estruturando com IA..." : "Estruturar em Parecer Pedagógico"}
              </button>
            </div>
          </div>

          {/* Structured Output */}
          {voiceStructuredResult && (
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4 animate-fade-in">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Parecer Estruturado (Padrão SENAI)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(voiceStructuredResult.polishedPedagogicalFeedback);
                    toast.success("Parecer copiado para a área de transferência!");
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Parecer
                </button>
              </div>

              <div className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                {voiceStructuredResult.polishedPedagogicalFeedback}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono block mb-1">
                    Pontos Fortes Demonstrados
                  </span>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                    {voiceStructuredResult.highlightedStrengths.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-400 uppercase font-mono block mb-1">
                    Encaminhamentos / Refatoração
                  </span>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                    {voiceStructuredResult.suggestedActionItems.map((a: string, idx: number) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: DOSSIÊ DO CONSELHO DE CLASSE --- */}
      {activeTool === "class_council" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Dossiê Individual do Conselho de Classe (1-Página PDF)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gere laudos executivos padrão A4 formatados para coordenação pedagógica, reuniões de conselho e acompanhamento de responsáveis.
              </p>
            </div>
            <button
              onClick={handleDownloadCouncilPdf}
              disabled={councilLoading || !councilDossier}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer text-xs"
            >
              <Download className="w-4 h-4" />
              Baixar Dossiê Oficial em PDF (A4)
            </button>
          </div>

          {/* Student Selector */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-mono font-bold text-slate-400">Selecionar Aluno:</label>
            <select
              value={councilStudentId}
              onChange={e => setCouncilStudentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white w-72 cursor-pointer"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.enrollment_code || "Matrícula"})
                </option>
              ))}
            </select>
          </div>

          {/* Dossier Preview Card */}
          {councilDossier && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-6 shadow-inner">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base font-bold text-white">{councilDossier.name}</h3>
                  <p className="text-xs text-slate-400">
                    {councilDossier.courseName} • {councilDossier.className} • Matrícula: {councilDossier.enrollmentCode}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                  councilDossier.recommendation === "APROVAR"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                }`}>
                  Parecer: {councilDossier.recommendation === "APROVAR" ? "Apto / Aprovado" : "Recuperação Paralela"}
                </span>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Média Geral</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {councilDossier.averageScore.toFixed(1)} / 100
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Frequência</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {councilDossier.attendanceRate}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Entregas no Prazo</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                    {councilDossier.timelinessRate}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Atividades Feitas</span>
                  <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
                    {councilDossier.completedActivitiesCount} / {councilDossier.totalActivitiesCount}
                  </span>
                </div>
              </div>

              {/* CHA Competencies */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-3">
                  Competências do Perfil Técnico
                </h4>
                <div className="space-y-2">
                  {councilDossier.competencies.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <span className="text-xs text-slate-300 font-medium">{comp.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${comp.score >= 70 ? "bg-emerald-400" : "bg-amber-400"}`}
                            style={{ width: `${comp.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-white w-10 text-right">{comp.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Synthesis */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 block mb-1">Síntese Diagnóstica:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{councilDossier.aiSynthesis}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: EXPORTADOR DE DIÁRIOS OFICIAIS --- */}
      {activeTool === "academic_export" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Exportador Oficial de Diários (Totvs Educacional / Moodle / SGE)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evite a digitação manual de notas no fim do semestre. Exporte nas colunas e formatos exatos aceitos pelos sistemas acadêmicos.
              </p>
            </div>
            <button
              onClick={handleDownloadAcademicExport}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer text-xs"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo Formatado (.csv)
            </button>
          </div>

          {/* Format Selector */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-mono font-bold text-slate-400">Layout do Sistema:</span>
            {[
              { id: "totvs", label: "Totvs RM Educacional" },
              { id: "moodle", label: "Moodle Gradebook (CSV)" },
              { id: "sge", label: "SGE SENAI Corporativo" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setExportFormat(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  exportFormat === f.id
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Estudante</th>
                  <th className="p-3 text-center">N1 (Avaliação)</th>
                  <th className="p-3 text-center">N2 (Prática)</th>
                  <th className="p-3 text-center">Média Final</th>
                  <th className="p-3 text-center">Faltas</th>
                  <th className="p-3 text-center">Conceito</th>
                  <th className="p-3 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {exportRows.map(r => (
                  <tr key={r.studentId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400">{r.enrollmentCode}</td>
                    <td className="p-3 font-medium text-white">{r.name}</td>
                    <td className="p-3 text-center font-mono">{r.n1.toFixed(1)}</td>
                    <td className="p-3 text-center font-mono">{r.n2.toFixed(1)}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">{r.finalAverage.toFixed(1)}</td>
                    <td className="p-3 text-center font-mono text-slate-400">{r.totalAbsences} h</td>
                    <td className="p-3 text-center font-bold text-indigo-300">{r.academicConcept}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === "APROVADO"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: ROTEIRO DE ARGUIÇÃO TÉCNICA (VIVA-VOCE) --- */}
      {activeTool === "viva_voce" && (
        <div className="bg-[#0b1329] rounded-2xl border border-slate-800 p-6 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Roteiro de Arguição Técnica (Viva-Voce / Bancas)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gere 5 perguntas estratégicas com pegadinhas de autoria para checar se o estudante realmente codificou e compreende o projeto entregue.
              </p>
            </div>
            <button
              onClick={handleGenerateVivaVoce}
              disabled={vivaLoading}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 cursor-pointer text-xs"
            >
              <Sparkles className="w-4 h-4" />
              {vivaLoading ? "Gerando Perguntas..." : "Gerar Roteiro de Arguição"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Título do Projeto / Desafio</label>
              <input
                type="text"
                value={vivaProjectTitle}
                onChange={e => setVivaProjectTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Nome do Estudante</label>
              <input
                type="text"
                value={vivaStudentName}
                onChange={e => setVivaStudentName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-slate-400 block mb-1">Código Entregue pelo Aluno (Trecho Crítico)</label>
            <textarea
              rows={5}
              value={vivaCodeSnippet}
              onChange={e => setVivaCodeSnippet(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none"
            />
          </div>

          {vivaScript && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200">
                  <span className="font-bold text-purple-300 block mb-1">Dica de Verificação de Autoria Real:</span>
                  {vivaScript.authorshipTrapTip}
                </div>
              </div>

              <div className="space-y-3">
                {vivaScript.questions.map(q => (
                  <div key={q.questionNumber} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-purple-400 uppercase font-mono">
                        Questão {q.questionNumber} • {q.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{q.purposeDescription}</span>
                    </div>

                    <div className="font-semibold text-sm text-white">
                      &quot;{q.questionText}&quot;
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-emerald-300">
                      <strong className="text-slate-400 block mb-0.5">Resposta Esperada de Nível Técnico:</strong>
                      {q.expectedIdealAnswer}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-slate-400">
                      <div><strong className="text-rose-400">0-3 pts:</strong> {q.scoringGuide.poor}</div>
                      <div><strong className="text-amber-400">4-7 pts:</strong> {q.scoringGuide.acceptable}</div>
                      <div><strong className="text-emerald-400">8-10 pts:</strong> {q.scoringGuide.excellent}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
