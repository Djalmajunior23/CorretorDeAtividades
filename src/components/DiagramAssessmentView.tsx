import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import mermaid from "mermaid";
import {
  Database,
  Network,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Layers,
  Award,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Send,
  Eye,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
  GitBranch,
  Sliders,
  FileText,
  User,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl, safeJsonResponse } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    darkMode: true,
    background: "#020617",
    primaryColor: "#0284c7",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#38bdf8",
    lineColor: "#64748b",
    secondaryColor: "#0f172a",
    tertiaryColor: "#1e293b",
  },
  securityLevel: "loose",
});

interface TemplateItem {
  id: string;
  category: "database" | "uml";
  type: string;
  title: string;
  description: string;
  scenario: string;
  sampleCode: string;
}

interface AssessmentRubric {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface AssessmentResponse {
  success: boolean;
  diagramType: string;
  totalGrade: number;
  status: "Aprovado" | "Recuperação" | "Reprovado";
  passingGrade: number;
  isApproved: boolean;
  rubrics: AssessmentRubric[];
  strengths: string[];
  modelingIssues: string[];
  normalizationNotes: string[];
  pedagogicalRecommendations: string[];
  suggestedCorrectedDiagram: string;
  evaluatedAt: string;
}

export default function DiagramAssessmentView() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [diagramCategory, setDiagramCategory] = useState<"database" | "uml">("database");
  const [diagramType, setDiagramType] = useState<string>("erDiagram");
  const [inputMode, setInputMode] = useState<"code" | "image">("code");
  
  // Content states
  const [diagramCode, setDiagramCode] = useState<string>("");
  const [scenarioPrompt, setScenarioPrompt] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Class and student linkage
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Visual Canvas States
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Assessment & AI Processing
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGeneratingRef, setIsGeneratingRef] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"feedback" | "rubrics" | "normalization" | "corrected">("feedback");

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTemplates();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(apiUrl("/api/diagrams/templates"));
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0) {
          applyTemplate(data[0]);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch diagram templates, using fallback", e);
      const fallbackCode = `erDiagram
    CLIENTE ||--o{ PEDIDO : "realiza"
    PEDIDO ||--|{ ITEM_PEDIDO : "contem"
    PRODUTO ||--o{ ITEM_PEDIDO : "pertence"

    CLIENTE {
        uuid id PK
        string nome
        string email UK
    }
    PEDIDO {
        uuid id PK
        uuid cliente_id FK
        datetime data_pedido
        decimal total
    }
    ITEM_PEDIDO {
        uuid id PK
        uuid pedido_id FK
        uuid produto_id FK
        int quantidade
        decimal preco_unitario
    }
    PRODUTO {
        uuid id PK
        string nome
        decimal preco
    }`;
      setDiagramCode(fallbackCode);
      setScenarioPrompt("Desenvolva o DER para um sistema de e-commerce com clientes, pedidos, itens e produtos.");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(apiUrl("/api/classes"));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          setSelectedClassId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/students?class_id=${encodeURIComponent(classId)}`));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0) setSelectedStudentId(data[0].id);
          else setSelectedStudentId("");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyTemplate = (tpl: TemplateItem) => {
    setSelectedTemplate(tpl.id);
    setDiagramCategory(tpl.category);
    setDiagramType(tpl.type);
    setScenarioPrompt(tpl.scenario);
    setDiagramCode(tpl.sampleCode);
    setAssessment(null);
    renderMermaidDiagram(tpl.sampleCode);
  };

  // Re-render Mermaid SVG when diagramCode changes
  useEffect(() => {
    if (inputMode === "code" && diagramCode.trim()) {
      const timeoutId = setTimeout(() => {
        renderMermaidDiagram(diagramCode);
      }, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [diagramCode, inputMode]);

  const renderMermaidDiagram = async (code: string) => {
    if (!code || !code.trim()) {
      setRenderedSvg("");
      setRenderError(null);
      return;
    }
    try {
      const id = `mermaid-svg-${Date.now()}`;
      const { svg } = await mermaid.render(id, code.trim());
      setRenderedSvg(svg);
      setRenderError(null);
    } catch (err: any) {
      setRenderError(err.message || "Erro de sintaxe no código Mermaid/Diagrama");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      toast.success("Imagem do diagrama carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAiReference = async () => {
    if (!scenarioPrompt.trim()) {
      toast.error("Preencha o enunciado ou requisitos do sistema antes de gerar o gabarito.");
      return;
    }

    setIsGeneratingRef(true);
    try {
      const res = await fetch(apiUrl("/api/diagrams/generate-reference"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioPrompt,
          diagramType: diagramType
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.referenceMermaid) {
          setDiagramCode(data.referenceMermaid);
          renderMermaidDiagram(data.referenceMermaid);
          toast.success("Gabarito de referência deduzido com sucesso pela IA!");
        }
      } else {
        toast.error("Falha ao gerar diagrama de referência.");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsGeneratingRef(false);
    }
  };

  const handleRunAssessment = async () => {
    if (inputMode === "code" && !diagramCode.trim()) {
      toast.error("Insira o código do diagrama para avaliação.");
      return;
    }
    if (inputMode === "image" && !imagePreview) {
      toast.error("Faça o upload da imagem do diagrama para avaliação.");
      return;
    }

    setIsEvaluating(true);
    const toastId = toast.loading("Analisando arquitetura, relações e normalização...");

    try {
      const payload = {
        diagramType,
        format: inputMode,
        code: inputMode === "code" ? diagramCode : undefined,
        imageBase64: inputMode === "image" ? imagePreview : undefined,
        scenario: scenarioPrompt,
        studentId: selectedStudentId || undefined,
        classId: selectedClassId || undefined
      };

      const res = await fetch(apiUrl("/api/diagrams/assess"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result: AssessmentResponse = await res.json();
        setAssessment(result);
        if (result.isApproved) {
          toast.success(`Diagrama APROVADO! Nota: ${result.totalGrade}/100`, { id: toastId });
        } else if (result.status === "Recuperação") {
          toast.warning(`Em Recuperação: Nota: ${result.totalGrade}/100 (Requer ajustes)`, { id: toastId });
        } else {
          toast.error(`Diagrama Reprovado: Nota ${result.totalGrade}/100`, { id: toastId });
        }
      } else {
        toast.error("Erro no processamento da avaliação.", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao conectar ao motor de IA pedagógica.", { id: toastId });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(diagramCode);
    setIsCopied(true);
    toast.success("Código do diagrama copiado para a área de transferência!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!assessment) {
      toast.error("Execute a avaliação antes de exportar o parecer.");
      return;
    }

    try {
      const currentClass = classes.find(c => c.id === selectedClassId);
      const currentStudent = students.find(s => s.id === selectedStudentId);

      const res = await fetch(apiUrl("/api/diagrams/export-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: templates.find(t => t.id === selectedTemplate)?.title || "Avaliação de Modelagem",
          studentName: currentStudent?.name || "Estudante Regular",
          className: currentClass?.name || "Turma Geral",
          assessment
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Laudo_Modelagem_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Parecer pedagógico em PDF exportado com sucesso!");
      } else {
        // Client fallback export using jsPDF
        generateLocalPdf(currentClass, currentStudent);
      }
    } catch (e) {
      // Local fallback
      generateLocalPdf();
    }
  };

  const generateLocalPdf = (currentClass?: any, currentStudent?: any) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(2, 132, 199);
    doc.text("CODECHECK AI • LAUDO DE AVALIAÇÃO DE MODELAGEM", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Estudante: ${currentStudent?.name || "Não especificado"} | Turma: ${currentClass?.name || "Geral"}`, 14, 28);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")} | Nota: ${assessment?.totalGrade || 0}/100 (${assessment?.status})`, 14, 34);

    const rows = (assessment?.rubrics || []).map(r => [r.name, `${r.score}/${r.maxScore} pts`, r.feedback]);

    autoTable(doc, {
      startY: 42,
      head: [["Critério / Rubrica", "Pontuação", "Parecer Qualitativo"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [2, 132, 199] }
    });

    doc.save(`Parecer_Modelagem_${Date.now()}.pdf`);
    toast.success("PDF gerado localmente com sucesso!");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> AI_DATABASE_MODELING • DER & UML
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> APROVAÇÃO: ≥ 60 PTS
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                1FN / 2FN / 3FN AUDIT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3 font-display">
              <Network className="w-8 h-8 text-sky-400" />
              Correção de Diagramas & Modelagem de Sistemas
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Auditoria visual e estrutural de Diagramas Entidade-Relacionamento (DER/MER), DDL SQL, Diagramas de Classes UML, Casos de Uso e Sequência com motor multimodal de IA pedagógica.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunAssessment}
              disabled={isEvaluating}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />
              {isEvaluating ? "Analisando Modelagem..." : "Avaliar Diagrama com IA"}
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Class/Student Link & Templates */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
        {/* Template Selector */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Carregar Desafio / Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => {
              const tpl = templates.find(t => t.id === e.target.value);
              if (tpl) applyTemplate(tpl);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-medium"
          >
            {templates.map(tpl => (
              <option key={tpl.id} value={tpl.id}>
                [{tpl.category === "database" ? "BANCO DE DADOS" : "UML / ENGENHARIA"}] {tpl.title}
              </option>
            ))}
          </select>
        </div>

        {/* Class Link */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> Vincular Turma
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="">(Opcional) Nenhuma turma selecionada</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.course ? `(${c.course})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Student Link */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Estudante Avaliado
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={!selectedClassId || students.length === 0}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-50"
          >
            <option value="">(Opcional) Selecione um estudante</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.enrollment_code || "Sem RA"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Code Editor, Requirements & Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Mode Selector & Diagram Type */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputMode("code")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  inputMode === "code"
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" /> Código Declarativo (Mermaid / DDL)
              </button>
              <button
                onClick={() => setInputMode("image")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  inputMode === "image"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Upload de Imagem / Scan
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Tipo:</span>
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="erDiagram">DER (erDiagram)</option>
                <option value="classDiagram">UML Classes (classDiagram)</option>
                <option value="sequenceDiagram">UML Sequência (sequenceDiagram)</option>
                <option value="useCaseDiagram">Casos de Uso (flowchart)</option>
              </select>
            </div>
          </div>

          {/* Scenario & System Requirements Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" /> Enunciado / Requisitos de Negócio
              </label>
              <button
                onClick={handleGenerateAiReference}
                disabled={isGeneratingRef}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingRef ? "animate-spin" : ""}`} />
                {isGeneratingRef ? "Deduzindo..." : "Deduzir Gabarito IA"}
              </button>
            </div>
            <textarea
              rows={3}
              value={scenarioPrompt}
              onChange={(e) => setScenarioPrompt(e.target.value)}
              placeholder="Ex: Modele um banco de dados para um e-commerce com clientes, pedidos, itens de pedidos e produtos com estoque..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Code Editor or Image Upload */}
          {inputMode === "code" ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-xs font-mono text-slate-400 ml-2">editor_diagrama.mermaid</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Copiar código"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <Editor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={diagramCode}
                  onChange={(val) => setDiagramCode(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    fontFamily: "JetBrains Mono, Fira Code, monospace",
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 transition-colors">
                <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Carregar Imagem do Diagrama / Fotografia</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Tire uma foto do quadro, envie um print do Draw.io, Astah, Lucidchart ou scan de exercício em papel.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block mx-auto text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
                />
              </div>

              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-[300px] flex items-center justify-center bg-slate-950 p-2">
                  <img src={imagePreview} alt="Diagram Preview" className="max-h-[280px] object-contain rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* Interactive Visual Canvas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-2">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">Canvas de Visualização ao Vivo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.15))}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Resetar Zoom"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              ref={canvasContainerRef}
              className="p-6 min-h-[320px] max-h-[460px] overflow-auto flex items-center justify-center bg-[#020617] rounded-b-2xl"
            >
              {renderError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start gap-3 max-w-md">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Inconsistência de Sintaxe do Diagrama:</strong>
                    <span className="font-mono text-[11px]">{renderError}</span>
                  </div>
                </div>
              ) : renderedSvg ? (
                <div
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
                  className="w-full flex justify-center items-center select-none"
                  dangerouslySetInnerHTML={{ __html: renderedSvg }}
                />
              ) : (
                <div className="text-center text-slate-500 text-xs italic">
                  Digite ou selecione um código Mermaid para visualizar a renderização gráfica do diagrama.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Pedagogical Assessment & Rubrics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {assessment ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
              {/* Score & Verdict Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Nota Final Consolidada</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-4xl font-black font-mono ${
                      assessment.isApproved ? "text-emerald-400" : assessment.status === "Recuperação" ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {assessment.totalGrade}
                    </span>
                    <span className="text-slate-500 text-sm font-bold font-mono">/ 100</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full mt-2 inline-block border ${
                    assessment.isApproved
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : assessment.status === "Recuperação"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  }`}>
                    {assessment.status === "Aprovado" ? "✓ APROVADO (≥ 60 PTS)" : assessment.status === "Recuperação" ? "⚠ EM RECUPERAÇÃO (40-59)" : "✗ REPROVADO (< 40)"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Exportar Laudo PDF
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {[
                  { id: "feedback", label: "Parecer IA" },
                  { id: "rubrics", label: "Rubricas" },
                  { id: "normalization", label: "Normalização" },
                  { id: "corrected", label: "Gabarito" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === t.id
                        ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Feedback & Points */}
              {activeTab === "feedback" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pontos Fortes Identificados
                    </h4>
                    <div className="space-y-1.5">
                      {assessment.strengths.map((st, idx) => (
                        <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-xs text-emerald-300 leading-relaxed">
                          • {st}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modeling Issues */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" /> Inconsistências & Oportunidades de Melhoria
                    </h4>
                    <div className="space-y-1.5">
                      {assessment.modelingIssues.map((iss, idx) => (
                        <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-xs text-rose-300 leading-relaxed">
                          ⚠ {iss}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pedagogical Recommendations */}
                  {assessment.pedagogicalRecommendations?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-sky-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-sky-400" /> Diretrizes Pedagógicas Recomendadas
                      </h4>
                      <div className="space-y-1.5">
                        {assessment.pedagogicalRecommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 bg-sky-500/5 border border-sky-500/15 rounded-xl text-xs text-sky-300 leading-relaxed">
                            → {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Detailed Rubrics Breakdown */}
              {activeTab === "rubrics" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {assessment.rubrics.map((rubric, idx) => {
                    const percentage = Math.round((rubric.score / rubric.maxScore) * 100);
                    return (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{rubric.name}</span>
                          <span className="font-mono font-bold text-sky-400">{rubric.score} / {rubric.maxScore} pts</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-sky-500" : percentage >= 40 ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{rubric.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Normalization 1FN, 2FN, 3FN */}
              {activeTab === "normalization" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-1">
                    <span className="text-xs font-bold text-indigo-400 block flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" /> Auditoria Formal de Normalização
                    </span>
                    <p className="text-[11px] text-indigo-200">
                      Verificação de anomalias de inserção, deleção e atualização na modelagem relacional.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {assessment.normalizationNotes?.map((note, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Corrected / Suggested Diagram Code */}
              {activeTab === "corrected" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-slate-300">Diagrama Sugerido Corrigido (Mermaid)</span>
                    <button
                      onClick={() => {
                        setDiagramCode(assessment.suggestedCorrectedDiagram);
                        renderMermaidDiagram(assessment.suggestedCorrectedDiagram);
                        toast.success("Código sugerido aplicado ao editor principal!");
                      }}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Aplicar ao Editor
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-sky-300 overflow-x-auto max-h-[300px] leading-relaxed">
                    {assessment.suggestedCorrectedDiagram}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                <Network className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">Aguardando Avaliação Pedagógica</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Carregue um template ou escreva o código do seu diagrama (DER/MER, UML de Classes ou Sequência) e clique em <strong>"Avaliar Diagrama com IA"</strong> para obter a nota discriminada, análise de 1FN/2FN/3FN e recomendações técnicas.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRunAssessment}
                  disabled={isEvaluating}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-600/20 cursor-pointer"
                >
                  Executar Avaliação Agora
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
