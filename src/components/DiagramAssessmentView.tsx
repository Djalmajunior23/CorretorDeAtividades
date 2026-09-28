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
  Users,
  Server,
  Code2,
  Table,
  UploadCloud,
  Trash2,
  Zap,
  Cpu,
  Key,
  Activity,
  BarChart3,
  Camera,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { apiUrl } from "../config/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  DatabaseModelAssessmentService, 
  DatabaseModelAssessmentResult,
  DatabaseModelCategory,
  DatabaseTargetSgbd,
  DatabaseInputFormat
} from "../services/databaseModelAssessmentService";
import { 
  DatabaseLoadBenchmarkService, 
  DatabaseLoadBenchmarkResult 
} from "../services/databaseLoadBenchmarkService";
import { 
  DiagramVisionRecognitionService, 
  DiagramVisionRecognitionResult 
} from "../services/diagramVisionRecognitionService";
import { StudentProfileModal } from "./StudentProfileModal";

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
  category: "database_logical" | "database_physical" | "uml";
  type: string;
  title: string;
  description: string;
  scenario: string;
  sampleCode: string;
  targetSgbd?: DatabaseTargetSgbd;
}

export default function DiagramAssessmentView() {
  const [modelCategory, setModelCategory] = useState<DatabaseModelCategory>("logical");
  const [targetSgbd, setTargetSgbd] = useState<DatabaseTargetSgbd>("postgresql");
  const [inputMode, setInputMode] = useState<DatabaseInputFormat>("image");
  
  // Content states
  const [aiEngine, setAiEngine] = useState<string>("auto");
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem("codecheck_ai_api_key") || "");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [diagramCode, setDiagramCode] = useState<string>("");
  const [scenarioPrompt, setScenarioPrompt] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
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
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<DatabaseModelAssessmentResult | null>(null);
  const [activeTab, setActiveTab] = useState<"feedback" | "studentTables" | "rubrics" | "normalization" | "physical" | "ddl" | "diagram" | "benchmark">("feedback");
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);

  // Advanced Benchmark & Vision Recognition States
  const [benchmarkResult, setBenchmarkResult] = useState<DatabaseLoadBenchmarkResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [isExportingBenchmarkPdf, setIsExportingBenchmarkPdf] = useState<boolean>(false);
  const [visionResult, setVisionResult] = useState<DiagramVisionRecognitionResult | null>(null);
  const [isVisionProcessing, setIsVisionProcessing] = useState<boolean>(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClasses();
    loadDefaultCode(modelCategory);
  }, []);

  const loadDefaultCode = (cat: DatabaseModelCategory) => {
    if (cat === "physical") {
      setDiagramCode(`CREATE TABLE tb_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE
);

CREATE TABLE tb_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES tb_cliente(id) ON DELETE RESTRICT
);

CREATE TABLE tb_produto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
    estoque INT NOT NULL DEFAULT 0
);

CREATE TABLE tb_item_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL,
    produto_id UUID NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES tb_pedido(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES tb_produto(id) ON DELETE RESTRICT
);`);
    } else {
      setDiagramCode(`erDiagram
    CLIENTE ||--o{ PEDIDO : "realiza"
    PEDIDO ||--|{ ITEM_PEDIDO : "contem"
    PRODUTO ||--o{ ITEM_PEDIDO : "pertence"

    CLIENTE {
        uuid id PK
        string nome
        string email UK
        string cpf UK
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
        int estoque
    }`);
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

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  // Re-render Mermaid SVG when diagramCode changes and is in Mermaid format
  useEffect(() => {
    if (diagramCode.includes("erDiagram") || diagramCode.includes("classDiagram")) {
      const timeoutId = setTimeout(() => {
        renderMermaidDiagram(diagramCode);
      }, 350);
      return () => clearTimeout(timeoutId);
    }
  }, [diagramCode]);

  const renderMermaidDiagram = async (code: string) => {
    if (!code || !code.trim() || (!code.includes("erDiagram") && !code.includes("classDiagram"))) {
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
      setRenderError(err.message || "Erro de renderização gráfica");
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.endsWith(".pdf")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG).");
      return;
    }
    setAssessment(null);
    setRenderedSvg("");
    setRenderError(null);
    setVisionResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Nova imagem do modelo de banco de dados carregada!");
    };
    reader.readAsDataURL(file);
  };

  // Run Vision Recognition specifically for photo of notebook / whiteboard
  const handleRunVisionRecognition = async () => {
    if (!imagePreview) {
      toast.error("Carregue uma imagem ou foto de caderno/quadro antes.");
      return;
    }
    setIsVisionProcessing(true);
    const toastId = toast.loading("Motor de Visão Computacional extraindo entidades e cardinalidades...");
    try {
      const res = await fetch(apiUrl("/api/diagrams/vision-recognize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          diagramType: modelCategory === "physical" ? "relational_schema" : "erd",
          customAI: {
            provider: aiEngine === "auto" ? undefined : (aiEngine as any),
            apiKey: customApiKey?.trim() || undefined
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVisionResult(data.recognitionResult);
        if (data.recognitionResult.detectedMermaidERD) {
          setDiagramCode(data.recognitionResult.detectedMermaidERD);
        }
        toast.success(`Visão IA: Confiança ${data.recognitionResult.visualConfidenceScore}% (${data.recognitionResult.legibilityLevel})`, { id: toastId });
      } else {
        const fallbackRes = await DiagramVisionRecognitionService.recognizeDiagramFromPhoto({
          imageBase64: imagePreview,
          diagramType: "erd"
        });
        setVisionResult(fallbackRes);
        if (fallbackRes.detectedMermaidERD) {
          setDiagramCode(fallbackRes.detectedMermaidERD);
        }
        toast.success(`Visão IA: Confiança ${fallbackRes.visualConfidenceScore}%`, { id: toastId });
      }
    } catch (e: any) {
      const fallbackRes = await DiagramVisionRecognitionService.recognizeDiagramFromPhoto({
        imageBase64: imagePreview,
        diagramType: "erd"
      });
      setVisionResult(fallbackRes);
      if (fallbackRes.detectedMermaidERD) {
        setDiagramCode(fallbackRes.detectedMermaidERD);
      }
      toast.success("Diagrama extraído através do motor de visão local.", { id: toastId });
    } finally {
      setIsVisionProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunAssessment = async () => {
    if (inputMode === "image" && !imagePreview) {
      toast.error("Faça o upload ou arraste a imagem do modelo de banco de dados para avaliação.");
      return;
    }
    if (inputMode === "code" && !diagramCode.trim()) {
      toast.error("Insira o código declarativo ou script DDL do banco de dados.");
      return;
    }

    setAssessment(null);
    setRenderedSvg("");
    setRenderError(null);
    setIsEvaluating(true);
    const toastId = toast.loading(
      inputMode === "image"
        ? "Processando Visão Computacional OCR, Entidades, Tipos e Relações do Banco..."
        : "Analisando arquitetura, chaves, normalização e conformidade..."
    );

    try {
      const studentObj = students.find(s => s.id === selectedStudentId);
      const classObj = classes.find(c => c.id === selectedClassId);

      const payload = {
        modelCategory,
        inputFormat: inputMode,
        diagramType: modelCategory === "physical" ? "physical" : "erDiagram",
        format: inputMode,
        code: inputMode === "code" ? diagramCode : undefined,
        imageBase64: inputMode === "image" ? imagePreview : undefined,
        scenario: scenarioPrompt,
        targetSgbd,
        studentId: selectedStudentId || undefined,
        studentName: studentObj?.name || undefined,
        classId: selectedClassId || undefined,
        className: classObj?.name || undefined,
        providerConfig: {
          provider: aiEngine === "auto" ? undefined : aiEngine,
          apiKey: customApiKey?.trim() || undefined
        }
      };

      const res = await fetch(apiUrl("/api/diagrams/assess"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result: DatabaseModelAssessmentResult = await res.json();
        setAssessment(result);
        if (result.suggestedCorrectedDiagram) {
          renderMermaidDiagram(result.suggestedCorrectedDiagram);
        }
        if (result.isApproved) {
          toast.success(`Modelo APROVADO! Nota: ${result.totalGrade}/100`, { id: toastId });
        } else if (result.status === "Recuperação") {
          toast.warning(`Em Recuperação: Nota: ${result.totalGrade}/100 (Requer ajustes)`, { id: toastId });
        } else {
          toast.error(`Modelo Reprovado: Nota ${result.totalGrade}/100`, { id: toastId });
        }
      } else {
        toast.error("Erro no processamento da avaliação de banco de dados.", { id: toastId });
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao conectar ao motor de IA pedagógica: " + e.message, { id: toastId });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run Simulated 100,000 Rows Database Load Benchmark
  const handleRunBenchmark = async () => {
    const ddlToTest = assessment?.generatedDdlSql || diagramCode;
    if (!ddlToTest || !ddlToTest.trim()) {
      toast.error("Execute a avaliação ou forneça o script DDL SQL antes de rodar o benchmark.");
      return;
    }

    setIsBenchmarking(true);
    setActiveTab("benchmark");
    const toastId = toast.loading("Simulando carga massiva de 100.000 tuplas e auditando EXPLAIN ANALYZE...");
    try {
      const studentObj = students.find(s => s.id === selectedStudentId);
      const classObj = classes.find(c => c.id === selectedClassId);

      const res = await fetch(apiUrl("/api/database/load-benchmark"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ddlSql: ddlToTest,
          activityTitle: scenarioPrompt || "Modelagem Relacional de Alto Volume",
          studentName: studentObj?.name || "Estudante SENAI",
          className: classObj?.name || "Turma 1A",
          targetRows: 100000,
          customAI: {
            provider: aiEngine === "auto" ? undefined : (aiEngine as any),
            apiKey: customApiKey?.trim() || undefined
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data.benchmarkResult);
        toast.success(`Benchmark Concluído: Score ${data.benchmarkResult.performanceScore}/100 (${data.benchmarkResult.scalabilityRating})`, { id: toastId });
      } else {
        const fallbackBench = await DatabaseLoadBenchmarkService.runSchemaLoadBenchmark({
          ddlSql: ddlToTest,
          targetRows: 100000
        });
        setBenchmarkResult(fallbackBench);
        toast.success(`Benchmark Concluído: Score ${fallbackBench.performanceScore}/100`, { id: toastId });
      }
    } catch (e: any) {
      const fallbackBench = await DatabaseLoadBenchmarkService.runSchemaLoadBenchmark({
        ddlSql: ddlToTest,
        targetRows: 100000
      });
      setBenchmarkResult(fallbackBench);
      toast.success("Benchmark calculado através do motor de simulação local.", { id: toastId });
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Export Benchmark PDF
  const handleExportBenchmarkPdf = () => {
    if (!benchmarkResult) return;
    try {
      const filename = `benchmark_db_senai_${benchmarkResult.benchmarkId}.pdf`;
      DatabaseLoadBenchmarkService.exportBenchmarkReportPdf(benchmarkResult, filename);
      toast.success("✓ Download do Laudo de Benchmark SENAI iniciado!");
    } catch (e) {
      toast.error("Erro ao gerar PDF do benchmark.");
    }
  };

  const handleExportPdf = async () => {
    if (!assessment) return;
    setIsExportingPdf(true);
    const toastId = toast.loading("Gerando Laudo Técnico em PDF...");
    try {
      const studentObj = students.find(s => s.id === selectedStudentId);
      const classObj = classes.find(c => c.id === selectedClassId);
      const studentName = studentObj?.name || "Estudante";
      const className = classObj?.name || "Turma de Banco de Dados";

      let pdfBlob: Blob | null = null;
      try {
        const res = await fetch(apiUrl("/api/diagrams/export-pdf"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment,
            studentName,
            className
          })
        });
        if (res.ok) {
          pdfBlob = await res.blob();
        }
      } catch (backendErr) {
        console.warn("Backend PDF export failed, fallback to client-side", backendErr);
      }

      if (!pdfBlob) {
        const pdfBuffer = await DatabaseModelAssessmentService.generateModelAssessmentPdf(
          assessment,
          studentName,
          className
        );
        pdfBlob = new Blob([pdfBuffer as any], { type: "application/pdf" });
      }

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_modelagem_banco_${assessment.assessmentId || Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Laudo Técnico de Modelagem baixado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao exportar PDF: " + err.message, { id: toastId });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-bold tracking-wide uppercase">
              <Database className="w-3.5 h-3.5" />
              Auditoria de Banco de Dados • Visão Computacional, DDL & Benchmark 100k
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Correção por Imagem & Benchmark de Banco de Dados
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Submeta fotos de cadernos, quadros brancos, diagramas digitais ou scripts DDL. A IA multimodal extrai entidades, chaves PK/FK, valida regras de normalização (1FN a 3FN) e simula testes de estresse com 100.000 tuplas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {assessment && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                ) : (
                  <Download className="w-4 h-4 text-sky-400" />
                )}
                {isExportingPdf ? "Gerando PDF..." : "Exportar Laudo PDF"}
              </button>
            )}

            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold font-mono transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Executar Teste de Carga e Benchmark de 100.000 Registros"
            >
              {isBenchmarking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isBenchmarking ? "Simulando Carga..." : "Benchmark 100k"}
            </button>

            <button
              onClick={handleRunAssessment}
              disabled={isEvaluating}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {inputMode === "image" ? "Analisar Imagem com IA" : "Executar Auditoria"}
            </button>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Model Category, SGBD, Input Mode, AI Engine, Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Categoria do Modelo
          </label>
          <select
            value={modelCategory}
            onChange={(e) => {
              const cat = e.target.value as DatabaseModelCategory;
              setModelCategory(cat);
              loadDefaultCode(cat);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs"
          >
            <option value="logical">Modelo Lógico / Relacional (DER & 3FN)</option>
            <option value="physical">Modelo Físico / DDL (Tabelas & Tipos SGBD)</option>
            <option value="classDiagram">Diagrama de Classes UML</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-sky-400" /> SGBD Alvo
          </label>
          <select
            value={targetSgbd}
            onChange={(e) => setTargetSgbd(e.target.value as DatabaseTargetSgbd)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs uppercase"
          >
            <option value="postgresql">PostgreSQL Standard</option>
            <option value="mysql">MySQL / MariaDB</option>
            <option value="sqlserver">Microsoft SQL Server</option>
            <option value="oracle">Oracle Database</option>
            <option value="sqlite">SQLite 3</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" /> Modo de Entrada
          </label>
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setInputMode("image")}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
                inputMode === "image" ? "bg-sky-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Imagem / Foto
            </button>
            <button
              onClick={() => setInputMode("code")}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-mono font-bold transition-all ${
                inputMode === "code" ? "bg-sky-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Código / DDL
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Turma SENAI
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-400" /> Aluno
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs"
          >
            <option value="">Avaliando Exemplo Anônimo</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.enrollment_code || "Matrícula"})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Grid: Left (Input/Image/Code) vs Right (Assessment Results & Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Area (Image or Code) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                {inputMode === "image" ? <ImageIcon className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                {inputMode === "image" ? "Upload da Imagem do Modelo" : "Editor de Modelagem / DDL"}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {modelCategory === "physical" ? `Físico • ${targetSgbd.toUpperCase()}` : "Lógico / Relacional"}
              </span>
            </div>

            {/* Scenario Requirements Prompt */}
            <div>
              <label className="block text-slate-400 font-medium text-xs mb-1">
                Requisitos / Enunciado do Domínio de Negócio:
              </label>
              <textarea
                rows={3}
                value={scenarioPrompt}
                onChange={(e) => setScenarioPrompt(e.target.value)}
                placeholder="Descreva as regras de negócio para a IA avaliar se o modelo atende aos requisitos..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs resize-none"
              />
            </div>

            {/* IMAGE MODE: Drag & Drop + Preview */}
            {inputMode === "image" ? (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden group">
                    <img
                      src={imagePreview}
                      alt="Diagram Preview"
                      className="w-full h-auto max-h-[360px] object-contain mx-auto p-2"
                    />
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRunVisionRecognition}
                          disabled={isVisionProcessing}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                          title="Extrair entidades e relacionamentos com Visão IA"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {isVisionProcessing ? "Extraindo..." : "Visão Computacional IA"}
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Trocar
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setAssessment(null);
                          setRenderedSvg("");
                          setRenderError(null);
                          setVisionResult(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                      dragActive ? "border-sky-500 bg-sky-500/10" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-white">Arraste ou clique para enviar o diagrama</p>
                      <p className="text-[11px] text-slate-500">Suporta fotos de caderno, quadros brancos, PNG, JPG, WEBP e PDF</p>
                    </div>
                  </div>
                )}

                {/* Vision Confidence Indicator */}
                {visionResult && (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Visão Computacional: {visionResult.entities.length} entidades reconhecidas
                      </span>
                      <span className="font-mono">Confiança: {visionResult.visualConfidenceScore}%</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Legibilidade da captura: <strong>{visionResult.legibilityLevel}</strong>. Diagrama transcrito para formato Mermaid e DDL com êxito.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* CODE MODE: Monaco / Text Editor */
              <div className="space-y-2">
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <Editor
                    height="360px"
                    language={modelCategory === "physical" ? "sql" : "markdown"}
                    theme="vs-dark"
                    value={diagramCode}
                    onChange={(val) => setDiagramCode(val || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      fontFamily: "monospace",
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Assessment Results, Diagnostics & Benchmark */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {assessment || benchmarkResult ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-5">
              
              {/* Score & Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                      (assessment?.totalGrade ?? benchmarkResult?.performanceScore ?? 80) >= 60
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      STATUS: {(assessment?.status || (benchmarkResult?.isApprovedForProduction ? "Aprovado" : "Recuperação")).toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {targetSgbd.toUpperCase()} Standard
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Auditoria Técnica & Benchmark de Banco de Dados</h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-white">
                      {assessment?.totalGrade ?? benchmarkResult?.performanceScore ?? 85}<span className="text-sm text-slate-500 font-normal">/100</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Nota Consolidada</span>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Result Inspection */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "feedback" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Parecer & Forças
                </button>
                <button
                  onClick={() => setActiveTab("studentTables")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "studentTables" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tabelas ({assessment?.extractedTables?.length || visionResult?.entities.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("normalization")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "normalization" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Normalização (1FN-3FN)
                </button>
                <button
                  onClick={() => setActiveTab("benchmark")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "benchmark" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  Benchmark 100k
                </button>
                <button
                  onClick={() => setActiveTab("ddl")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "ddl" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Script DDL SQL
                </button>
                <button
                  onClick={() => setActiveTab("diagram")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "diagram" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Diagrama Visual
                </button>
              </div>

              {/* Tab: Feedback & Strengths */}
              {activeTab === "feedback" && assessment && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-sky-400 uppercase">Pontos Fortes da Modelagem:</span>
                    <ul className="text-xs text-slate-300 space-y-1 font-sans">
                      {assessment.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {assessment.modelingIssues.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-2">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase">Oportunidades de Melhoria:</span>
                      <ul className="text-xs text-slate-300 space-y-1 font-sans">
                        {assessment.modelingIssues.map((iss, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{iss}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Student Tables Diagnosis */}
              {activeTab === "studentTables" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {(assessment?.extractedTables || []).map((tbl, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="font-mono font-bold text-sm text-sky-300 flex items-center gap-1.5">
                            <Table className="w-4 h-4 text-sky-400" />
                            {tbl.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                            {tbl.type === "strong_entity" ? "Entidade Forte" : "Tabela"}
                          </span>
                        </div>

                        <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                          {tbl.columns.map((col, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between text-xs font-mono bg-slate-900/70 px-2 py-1 rounded border border-slate-800/60">
                              <span className="text-slate-200 truncate">{col.name}</span>
                              <span className="text-slate-400 text-[10px]">{col.dataType || "string"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Normalization */}
              {activeTab === "normalization" && assessment && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">1ª Forma Normal (1FN) — Atomicidade</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        CONFORME
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{assessment.normalizationAudit.firstNormalForm.explanation}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">2ª Forma Normal (2FN) — Dependência Total</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        CONFORME
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{assessment.normalizationAudit.secondNormalForm.explanation}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">3ª Forma Normal (3FN) — Dependência Transitiva</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        CONFORME
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{assessment.normalizationAudit.thirdNormalForm.explanation}</p>
                  </div>
                </div>
              )}

              {/* Tab: Benchmark & 100k Rows Load Testing */}
              {activeTab === "benchmark" && (
                <div className="space-y-4">
                  {benchmarkResult ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Throughput Simulado</span>
                          <div className="text-xl font-bold font-mono text-emerald-400">
                            {benchmarkResult.overallThroughputTps} TPS
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Latência p95</span>
                          <div className="text-xl font-bold font-mono text-amber-400">
                            {benchmarkResult.p95LatencyMs} ms
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-mono text-slate-500 uppercase">Volume Auditado</span>
                          <div className="text-xl font-bold font-mono text-sky-400">
                            {benchmarkResult.simulatedVolumeTotalRows.toLocaleString()} tuplas
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <Activity className="w-4 h-4" /> Parecer Técnico do DBA SENAI:
                        </span>
                        <p className="text-slate-200 leading-relaxed">{benchmarkResult.executiveDiagnostic}</p>
                      </div>

                      {/* Query Benchmark Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-800">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                              <th className="p-2.5">Consulta</th>
                              <th className="p-2.5">Plano EXPLAIN</th>
                              <th className="p-2.5">Latência</th>
                              <th className="p-2.5">Gargalo?</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 font-mono text-xs">
                            {benchmarkResult.queryBenchmarks.map((q, idx) => (
                              <tr key={idx} className="hover:bg-slate-950/60">
                                <td className="p-2.5 text-slate-200">{q.queryName}</td>
                                <td className="p-2.5 text-sky-300">{q.executionPlan}</td>
                                <td className="p-2.5 text-amber-300">{q.simulatedLatencyMs} ms</td>
                                <td className="p-2.5">
                                  {q.isBottleneck ? (
                                    <span className="text-rose-400 font-bold">🔴 Sim</span>
                                  ) : (
                                    <span className="text-emerald-400 font-bold">🟢 Não</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handleExportBenchmarkPdf}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs font-mono transition shadow-lg"
                        >
                          <Download className="w-4 h-4" /> Baixar Laudo de Benchmark (PDF)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <Activity className="w-8 h-8 text-amber-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Nenhum Benchmark de Carga Executado</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Clique no botão <strong>"Benchmark 100k"</strong> no topo para simular uma injeção de 100.000 tuplas e testar planos de execução SQL.
                      </p>
                      <button
                        onClick={handleRunBenchmark}
                        disabled={isBenchmarking}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition"
                      >
                        {isBenchmarking ? "Executando..." : "Executar Benchmark Agora"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: DDL SQL */}
              {activeTab === "ddl" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Script DDL SQL ({targetSgbd.toUpperCase()})
                    </span>
                    <button
                      onClick={() => {
                        const sql = assessment?.generatedDdlSql || diagramCode;
                        navigator.clipboard.writeText(sql);
                        toast.success("Script DDL SQL copiado!");
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar SQL
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-[300px] scrollbar-thin">
                    {assessment?.generatedDdlSql || diagramCode}
                  </pre>
                </div>
              )}

              {/* Tab: Corrected Diagram */}
              {activeTab === "diagram" && (
                <div className="space-y-2">
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 min-h-[260px] flex items-center justify-center overflow-auto">
                    {renderedSvg ? (
                      <div dangerouslySetInnerHTML={{ __html: renderedSvg }} />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Renderizando diagrama corrigido...</span>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-3">
              <Database className="w-10 h-10 text-sky-400 mx-auto opacity-50" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-300">Nenhuma Avaliação Executada</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Faça o upload da foto do caderno/quadro ou insira o código declarativo ao lado e clique em <strong className="text-sky-400">Analisar Imagem com IA</strong> ou <strong className="text-amber-400">Benchmark 100k</strong>.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Student Profile Modal Linkage */}
      {profileModalStudentId && (
        <StudentProfileModal
          studentId={profileModalStudentId}
          isOpen={!!profileModalStudentId}
          onClose={() => setProfileModalStudentId(null)}
        />
      )}
    </div>
  );
}
