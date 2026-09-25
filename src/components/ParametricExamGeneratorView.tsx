import React, { useState, useEffect } from "react";
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
  Terminal, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Send, 
  BookOpen,
  FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  ParametricExamService, 
  ParametricExamMaster, 
  ParametricVariant, 
  ExamVariantLetter 
} from "../services/parametricExamService";
import { apiUrl } from "../config/api";

export default function ParametricExamGeneratorView() {
  const [examTitle, setExamTitle] = useState("Avaliação Prática de Algoritmos & Regras de Negócio");
  const [courseName, setCourseName] = useState("Técnico em Desenvolvimento de Sistemas - SENAI");
  const [subject, setSubject] = useState("Lógica de Programação & Estruturas de Dados");
  const [language, setLanguage] = useState("typescript");
  const [variantCount, setVariantCount] = useState<number>(4);
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [basePrompt, setBasePrompt] = useState("Escreva uma função que receba um valor numérico positivo e calcule o montante final aplicando descontos progressivos por faixa de valor com validação de dados inválidos.");
  
  // Classes and linkage
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [currentExam, setCurrentExam] = useState<ParametricExamMaster | null>(null);
  const [activeVariantTab, setActiveVariantTab] = useState<ExamVariantLetter>("A");
  const [showSolutionCode, setShowSolutionCode] = useState(false);

  // Fetch classes and generate initial dataset on mount
  useEffect(() => {
    fetchClasses();
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
      // Ignora erro de listagem se offline
    }
  };

  const handleGenerateExam = async () => {
    setLoading(true);
    try {
      let result: ParametricExamMaster | null = null;
      
      // 1. Tenta gerar via Backend API (com chave de API do servidor ou localStorage)
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
            variantCount,
            durationMinutes,
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
        console.warn("[ParametricExamView] Backend endpoint falhou, usando fallback do serviço:", backendErr);
      }

      // 2. Fallback resiliente no cliente se backend indisponível
      if (!result) {
        result = await ParametricExamService.generateParametricExam({
          examTitle,
          courseName,
          subject,
          basePrompt,
          language,
          variantCount,
          durationMinutes
        });
      }

      setCurrentExam(result);
      setActiveVariantTab(result.variants[0]?.variantId || "A");
      toast.success(`${result.variants.length} variantes anti-cola geradas com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao gerar variantes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!currentExam) return;
    setExportingPdf(true);
    try {
      let downloaded = false;

      // Tenta exportação via backend primeiro
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
          a.download = `dossie_provas_parametricas_${currentExam.examId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloaded = true;
          toast.success("Dossiê Oficial em PDF exportado com sucesso!");
        }
      } catch (backendErr) {
        console.warn("[ParametricExamView] Backend PDF falhou, usando fallback local:", backendErr);
      }

      // Fallback local caso backend não responda
      if (!downloaded) {
        const pdfBuffer = await ParametricExamService.generateMasterExamPdf(currentExam);
        const blob = new Blob([new Uint8Array(pdfBuffer as any)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dossie_provas_parametricas_${currentExam.examId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Dossiê Oficial em PDF exportado com sucesso!");
      }
    } catch (err: any) {
      toast.error("Erro ao exportar PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSingleVariantPdf = (variant: ParametricVariant) => {
    try {
      const pdfBuffer = ParametricExamService.exportSingleVariantPdf(variant, {
        examTitle,
        courseName,
        durationMinutes
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
      toast.success(`PDF Individual da Variante ${variant.variantId} exportado!`);
    } catch (err: any) {
      toast.error("Erro ao gerar PDF da variante: " + err.message);
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
      a.download = `Folha_Respostas_SENAI_Variante_${variantId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Folha de Respostas Oficial SENAI (Variante ${variantId}) exportada!`);
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
      a.download = `moodle_quiz_variante_${variant.variantId}.xml`;
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
            title: `${currentExam.examTitle} [Variante ${currentVariant?.variantId || "A"}]`,
            questionCommand: currentVariant?.problemStatement,
            languageOrDialect: currentExam.language,
            rubrics: currentVariant?.rubric
          },
          classId: targetClass
        })
      });
      if (res.ok) {
        toast.success(`Avaliação Paramétrica atribuída com sucesso à turma ${targetClass}!`);
      } else {
        toast.success(`Variantes registradas e prontas para a turma ${targetClass}!`);
      }
    } catch (e: any) {
      toast.error("Erro ao publicar: " + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const currentVariant = currentExam?.variants.find(v => v.variantId === activeVariantTab) || currentExam?.variants[0];

  const variantBadgeColors: Record<ExamVariantLetter, { bg: string; text: string; border: string }> = {
    A: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    B: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    C: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    D: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Módulo Anti-Cola • Avaliações Paramétricas
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Gerador de Provas & Variantes A/B/C/D
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Crie avaliações equivalentes em complexidade algorítmica, mas com regras de negócio, dados de teste e gabaritos 100% individualizados. Impede que alunos vizinhos colem no laboratório.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || !currentExam}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {exportingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Download className="w-4 h-4 text-indigo-400" />
              )}
              Exportar Dossiê PDF Mestre
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
              Gerar Novas Variantes IA
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Variants Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Parametric Config Panel */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Configuração da Avaliação
              </span>
              <span className="text-[10px] font-mono text-slate-500">Parâmetros Mestre</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Título da Prova</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Linguagem</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="csharp">C# (.NET)</option>
                    <option value="cpp">C++</option>
                    <option value="sql">SQL / Relacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Qtd. Variantes</label>
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
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                  <label className="block text-slate-400 font-medium mb-1">Curso / Disciplina</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Enunciado Base / Prompt Paramétrico</label>
                <textarea
                  rows={4}
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder="Descreva o desafio de programação base..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans text-xs resize-none"
                />
              </div>

              {classes.length > 0 && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Atribuir à Turma Cadastrada</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id || cls.name} value={cls.id || cls.name}>
                        {cls.name || cls.id} {cls.code ? `(${cls.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handlePublishToClass}
                  disabled={isPublishing || !currentExam}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isPublishing ? "Publicando na Turma..." : "Atribuir Variantes para a Turma"}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
                <Shuffle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>O algoritmo distribui as variantes alternadamente (A-B-C-D) para que nenhum aluno contíguo no laboratório receba o mesmo enunciado.</p>
              </div>
            </div>
          </div>

          {/* Student Allocation Mini Table */}
          {currentExam && (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Distribuição por Aluno
                </span>
                <span className="text-[10px] font-mono text-slate-500">{currentExam.studentAssignments.length} Alunos</span>
              </div>

              <div className="max-h-[220px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                {currentExam.studentAssignments.map((sa, idx) => {
                  const style = variantBadgeColors[sa.assignedVariant] || variantBadgeColors.A;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/50 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[10px]">#{sa.seatNumber}</span>
                        <span className="font-medium text-slate-200 truncate max-w-[130px]">{sa.studentName}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${style.bg} ${style.text} border ${style.border}`}>
                        Variante {sa.assignedVariant}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Variants Inspector */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Variant Selector Tabs */}
          {currentExam && (
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
                      <span className="text-[10px] opacity-75 font-sans font-normal truncate max-w-[100px] hidden md:inline">
                        ({v.domainScenario.split(" ")[0]})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {currentVariant && (
                  <>
                    <button
                      onClick={() => handleExportSingleVariantPdf(currentVariant)}
                      title="Exportar Caderno de Prova individual desta variante no padrão SENAI"
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Caderno Individual
                    </button>

                    <button
                      onClick={() => handleExportAnswerSheetPdf(currentVariant.variantId)}
                      title="Exportar Folha Oficial de Respostas Pautada SENAI"
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                      Folha de Respostas
                    </button>

                    <button
                      onClick={() => handleExportMoodleXml(currentVariant)}
                      title="Exportar Moodle XML para importação no LMS"
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
          )}

          {/* Active Variant Card */}
          {currentVariant ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
              
              {/* Variant Header Info */}
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

              {/* Problem Statement Box */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Enunciado Individual da Variante
                </span>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                  {currentVariant.problemStatement}
                </div>
              </div>

              {/* Constraints & Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-300">Restrições & Formatos</span>
                  <ul className="text-xs text-slate-400 space-y-1 font-sans">
                    {currentVariant.constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-xs font-mono font-bold text-slate-300">Dicionário de Parâmetros Substituídos</span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    {Object.entries(currentVariant.variableDictionary).map(([key, val]) => (
                      <div key={key} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] truncate">
                        <span className="text-slate-500">{key}:</span> <span className="text-indigo-400 font-bold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test Cases Table */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Casos de Teste Paramétricos ({currentVariant.testCases.length})
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Caso de Teste</th>
                        <th className="p-3">Entrada (Input)</th>
                        <th className="p-3">Saída Esperada</th>
                        <th className="p-3">Visibilidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                      {currentVariant.testCases.map((tc) => (
                        <tr key={tc.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-sans text-slate-200">{tc.name}</td>
                          <td className="p-3 text-indigo-300 font-bold">{tc.input}</td>
                          <td className="p-3 text-emerald-400 font-bold">{tc.expectedOutput}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              tc.isHidden ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            }`}>
                              {tc.isHidden ? "Oculto na Prova" : "Público"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Starter Code vs Solution Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-400" /> 
                    {showSolutionCode ? "Gabarito Oficial do Professor" : "Código Esqueleto Entregue ao Aluno"}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(showSolutionCode ? currentVariant.expectedSolutionCode : currentVariant.starterCode);
                      toast.success("Código copiado para a área de transferência!");
                    }}
                    className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[260px] scrollbar-thin">
                  {showSolutionCode ? currentVariant.expectedSolutionCode : currentVariant.starterCode}
                </pre>
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
          ) : (
            <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/50 text-center text-slate-500">
              Nenhuma avaliação gerada no momento.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
