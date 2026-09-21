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
  Trash2
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
  const [activeTab, setActiveTab] = useState<"feedback" | "rubrics" | "normalization" | "physical" | "ddl" | "diagram">("feedback");
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Clean previous evaluation states on new file upload
    setAssessment(null);
    setRenderedSvg("");
    setRenderError(null);

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

    // Reset previous assessment result during new evaluation
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
        className: classObj?.name || undefined
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

      // Try server endpoint first
      try {
        const res = await fetch("/api/database-models/export-pdf", {
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
      } catch (e) {
        console.warn("Server PDF export endpoint unreachable, generating client-side:", e);
      }

      // Fallback to client-side generation
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
              Auditoria de Banco de Dados • Visão Computacional & DDL
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Correção por Imagem: Modelos Lógico e Físico de BD
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Submeta imagens de diagramas (brModelo, MySQL Workbench, pgAdmin, draw.io ou manuscritos em papel) ou scripts DDL. A IA multimodal extrai entidades, chaves PK/FK, valida regras de normalização (1FN a 3FN) e gera o script DDL executável corrigido.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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

      {/* Control Toolbar: Model Category, SGBD, Input Mode */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
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
            <Server className="w-3.5 h-3.5 text-sky-400" /> SGBD Alvo (Dialeto SQL)
          </label>
          <select
            value={targetSgbd}
            onChange={(e) => {
              const sgbd = e.target.value as DatabaseTargetSgbd;
              setTargetSgbd(sgbd);
              if (assessment && assessment.extractedTables && assessment.extractedTables.length > 0) {
                const newDdl = DatabaseModelAssessmentService.generateSqlDdlFromTables(assessment.extractedTables, sgbd);
                setAssessment({
                  ...assessment,
                  targetSgbd: sgbd,
                  generatedDdlSql: newDdl
                });
              }
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-mono text-xs"
          >
            <option value="postgresql">PostgreSQL (Recomendado SENAI)</option>
            <option value="mysql">MySQL / MariaDB (InnoDB)</option>
            <option value="sqlserver">Microsoft SQL Server (T-SQL)</option>
            <option value="oracle">Oracle Database (PL/SQL)</option>
            <option value="sqlite">SQLite 3 (Embarcado)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-sky-400" /> Modo de Entrada
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setInputMode("image")}
              className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "image"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Imagem / OCR
            </button>
            <button
              onClick={() => setInputMode("code")}
              className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                inputMode === "code"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Código / DDL
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Turma & Estudante
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs truncate"
            >
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 font-sans text-xs truncate"
            >
              <option value="">Sem vínculo</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
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
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Trocar Imagem
                      </button>
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setAssessment(null);
                          setRenderedSvg("");
                          setRenderError(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      dragActive
                        ? "border-sky-500 bg-sky-500/10 scale-[0.99]"
                        : "border-slate-800 bg-slate-950/60 hover:border-sky-500/50 hover:bg-slate-950"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white">Arraste a Imagem do Modelo de BD aqui</h3>
                      <p className="text-xs text-slate-400">
                        Suporta capturas do <strong className="text-sky-400">brModelo</strong>, <strong className="text-sky-400">MySQL Workbench</strong>, <strong className="text-sky-400">pgAdmin</strong>, <strong className="text-sky-400">draw.io</strong> ou fotos de folhas de prova.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      PNG, JPG, WEBP, SVG até 20MB
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* CODE MODE: Monaco Editor for DDL or Mermaid */
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden border border-slate-800">
                  <Editor
                    height="320px"
                    language={modelCategory === "physical" ? "sql" : "markdown"}
                    theme="vs-dark"
                    value={diagramCode}
                    onChange={(val) => setDiagramCode(val || "")}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      padding: { top: 8 }
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Assessment Dossier & Results */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {assessment ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6">
              
              {/* Score Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                      assessment.totalGrade >= 60
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : assessment.totalGrade >= 40
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}>
                      STATUS: {assessment.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {assessment.modelCategory === "physical" ? `Modelo Físico (${assessment.targetSgbd?.toUpperCase()})` : "Modelo Lógico / Relacional"}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">Resultado da Auditoria do Banco de Dados</h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {selectedStudentId && (
                    <button
                      onClick={() => setProfileModalStudentId(selectedStudentId)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-mono font-bold transition-all border border-indigo-500/50 flex items-center gap-1.5 cursor-pointer shadow-md"
                      title="Ver histórico e laudos no perfil completo do estudante"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                      Ver no Perfil
                    </button>
                  )}

                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    {isExportingPdf ? "Baixando..." : "Laudo PDF"}
                  </button>

                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-white">
                      {assessment.totalGrade}<span className="text-sm text-slate-500 font-normal">/100</span>
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
                  onClick={() => setActiveTab("rubrics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "rubrics" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Rubricas ({assessment.rubrics.length})
                </button>
                <button
                  onClick={() => setActiveTab("normalization")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "normalization" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Normalização (1FN-3FN)
                </button>
                {assessment.physicalAudit && (
                  <button
                    onClick={() => setActiveTab("physical")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeTab === "physical" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Auditoria Física & Tipos
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("ddl")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "ddl" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  DDL SQL Gerado
                </button>
                <button
                  onClick={() => setActiveTab("diagram")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "diagram" ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Diagrama Corrigido
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "feedback" && (
                <div className="space-y-4">
                  {/* Strengths */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Pontos Fortes & Conformidades Detectadas
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 font-sans">
                      {assessment.strengths.map((st, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400">✓</span> {st}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Issues */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Inconsistências & Oportunidades de Melhoria
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 font-sans">
                      {assessment.modelingIssues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400">!</span> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-sky-400 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Recomendações Pedagógicas para o Estudante
                    </span>
                    <ul className="text-xs text-slate-400 space-y-1 font-sans">
                      {assessment.pedagogicalRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-sky-400">•</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Rubrics */}
              {activeTab === "rubrics" && (
                <div className="space-y-3">
                  {assessment.rubrics.map((r, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{r.name}</span>
                        <span className="text-xs font-mono font-bold text-sky-400">
                          {r.score} / {r.maxScore} pts ({r.weight}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.feedback}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{r.pedagogicalRationale}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Normalization */}
              {activeTab === "normalization" && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">1ª Forma Normal (1FN) — Atomicidade</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        assessment.normalizationAudit.firstNormalForm.compliant ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}>
                        {assessment.normalizationAudit.firstNormalForm.compliant ? "CONFORME" : "REQUER ATENÇÃO"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{assessment.normalizationAudit.firstNormalForm.explanation}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">2ª Forma Normal (2FN) — Dependência Total da PK</span>
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

              {/* Tab 4: Physical Audit */}
              {activeTab === "physical" && assessment.physicalAudit && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Aderência de Tipos SGBD</span>
                      <div className="text-lg font-bold font-mono text-sky-400">
                        {assessment.physicalAudit.dataTypesScore}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Tabelas Materializadas</span>
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {assessment.physicalAudit.ddlExecutionTest.tablesCreatedCount} Tabelas
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">Recomendações de Indexação & Performance:</span>
                    <ul className="text-xs text-slate-400 space-y-1 font-sans">
                      {assessment.physicalAudit.indexingRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-sky-400">⚡</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 5: DDL SQL */}
              {activeTab === "ddl" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                      Script DDL SQL Gerado ({targetSgbd.toUpperCase()})
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(assessment.generatedDdlSql);
                        toast.success("Script DDL SQL copiado!");
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar SQL
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-[300px] scrollbar-thin">
                    {assessment.generatedDdlSql}
                  </pre>
                </div>
              )}

              {/* Tab 6: Corrected Diagram */}
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
                  Faça o upload da imagem do diagrama (brModelo, Workbench, pgAdmin, draw.io) ou insira o código declarativo ao lado e clique em <strong className="text-sky-400">Analisar Imagem com IA</strong>.
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
