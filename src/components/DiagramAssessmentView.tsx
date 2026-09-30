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
  Play,
  ShieldAlert,
  FileDigit,
  History,
  Lock,
  Workflow,
  Binary,
  CheckSquare,
  Mic,
  BrainCircuit,
  Trophy
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
  DatabaseInputFormat,
  MultiSgbdDdlResult,
  MigrationPackageResult,
  LgpdGovernanceAuditResult,
  LgpdPiiFinding
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
  const [activeTab, setActiveTab] = useState<"feedback" | "studentTables" | "rubrics" | "normalization" | "physical" | "ddl" | "diagram" | "benchmark" | "multi_sgbd" | "migrations" | "lgpd_governance" | "query_cost" | "acid_lab" | "voice_defense" | "cognitive_twin" | "arena_duels">("feedback");
  const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);

  // Advanced Benchmark & Vision Recognition States
  const [benchmarkResult, setBenchmarkResult] = useState<DatabaseLoadBenchmarkResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [isExportingBenchmarkPdf, setIsExportingBenchmarkPdf] = useState<boolean>(false);
  const [visionResult, setVisionResult] = useState<DiagramVisionRecognitionResult | null>(null);
  const [isVisionProcessing, setIsVisionProcessing] = useState<boolean>(false);

  // Multi-SGBD Converter States
  const [multiSgbdResult, setMultiSgbdResult] = useState<MultiSgbdDdlResult | null>(null);
  const [selectedMultiSgbdDialect, setSelectedMultiSgbdDialect] = useState<"postgresql" | "mysql" | "oracle" | "sqlserver" | "sqlite">("postgresql");
  const [isConvertingMultiSgbd, setIsConvertingMultiSgbd] = useState<boolean>(false);

  // 3FN Migrations Package States
  const [migrationsResult, setMigrationsResult] = useState<MigrationPackageResult | null>(null);
  const [isGeneratingMigrations, setIsGeneratingMigrations] = useState<boolean>(false);

  // LGPD Governance Audit States
  const [lgpdReport, setLgpdReport] = useState<LgpdGovernanceAuditResult | null>(null);
  const [isAuditingLgpd, setIsAuditingLgpd] = useState<boolean>(false);

  // Next-Gen Ecosystem Evolution States
  const [queryCostResult, setQueryCostResult] = useState<any | null>(null);
  const [selectedCostTable, setSelectedCostTable] = useState<string>("tb_pedido");
  const [selectedCostColumn, setSelectedCostColumn] = useState<string>("cliente_id");
  const [isSimulatingCost, setIsSimulatingCost] = useState<boolean>(false);

  const [acidResult, setAcidResult] = useState<any | null>(null);
  const [selectedAcidIsolation, setSelectedAcidIsolation] = useState<"READ UNCOMMITTED" | "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE">("READ COMMITTED");
  const [isSimulatingAcid, setIsSimulatingAcid] = useState<boolean>(false);

  const [voiceDefenseText, setVoiceDefenseText] = useState<string>("Decidi criar a chave estrangeira cliente_id na tabela tb_pedido para garantir a integridade referencial, e apliquei a 3FN separando dados de clientes e produtos para evitar redundâncias e anomalias de atualização.");
  const [voiceDefenseResult, setVoiceDefenseResult] = useState<any | null>(null);
  const [isEvaluatingVoice, setIsEvaluatingVoice] = useState<boolean>(false);

  const [cognitiveTwinProfile, setCognitiveTwinProfile] = useState<any | null>(null);
  const [isLoadingTwin, setIsLoadingTwin] = useState<boolean>(false);

  const [hackathonStandings, setHackathonStandings] = useState<any[]>([]);
  const [isLoadingArena, setIsLoadingArena] = useState<boolean>(false);

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

  // Multi-SGBD Generation Handler
  const handleConvertMultiSgbd = async () => {
    const code = assessment?.generatedDdlSql || diagramCode;
    if (!code || !code.trim()) {
      toast.error("Nenhum código ou modelo disponível para conversão.");
      return;
    }
    setIsConvertingMultiSgbd(true);
    try {
      const res = await fetch(apiUrl("/api/database/convert-multi-sgbd"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelCode: code,
          extractedTables: assessment?.extractedTables
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMultiSgbdResult(data.multiSgbd);
        setActiveTab("multi_sgbd");
        toast.success("✓ Conversão Multi-SGBD concluída para 5 bancos de dados!");
      } else {
        const fallback = await DatabaseModelAssessmentService.convertModelToMultiSgbd({
          modelCode: code,
          extractedTables: assessment?.extractedTables
        });
        setMultiSgbdResult(fallback);
        setActiveTab("multi_sgbd");
        toast.success("✓ Conversão Multi-SGBD gerada com sucesso!");
      }
    } catch (e) {
      const fallback = await DatabaseModelAssessmentService.convertModelToMultiSgbd({
        modelCode: code,
        extractedTables: assessment?.extractedTables
      });
      setMultiSgbdResult(fallback);
      setActiveTab("multi_sgbd");
      toast.success("✓ Conversão Multi-SGBD gerada com sucesso!");
    } finally {
      setIsConvertingMultiSgbd(false);
    }
  };

  // 3FN Migrations Package Handler
  const handleGenerateMigrations = async () => {
    const code = diagramCode;
    if (!code || !code.trim()) {
      toast.error("Insira o modelo ou DDL para gerar as migrações.");
      return;
    }
    setIsGeneratingMigrations(true);
    try {
      const res = await fetch(apiUrl("/api/database/generate-migrations"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unnormalizedCode: code,
          normalizedCode: assessment?.generatedDdlSql,
          targetSgbd
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMigrationsResult(data.migrations);
        setActiveTab("migrations");
        toast.success("✓ Pacote de migrações Flyway / 3FN gerado com sucesso!");
      } else {
        const fallback = await DatabaseModelAssessmentService.generateRefactored3fnMigrations({
          unnormalizedCode: code,
          normalizedCode: assessment?.generatedDdlSql,
          targetSgbd
        });
        setMigrationsResult(fallback);
        setActiveTab("migrations");
        toast.success("✓ Pacote de migrações gerado com sucesso!");
      }
    } catch (e) {
      const fallback = await DatabaseModelAssessmentService.generateRefactored3fnMigrations({
        unnormalizedCode: code,
        normalizedCode: assessment?.generatedDdlSql,
        targetSgbd
      });
      setMigrationsResult(fallback);
      setActiveTab("migrations");
      toast.success("✓ Pacote de migrações gerado com sucesso!");
    } finally {
      setIsGeneratingMigrations(false);
    }
  };

  // LGPD Privacy Governance Audit Handler
  const handleAuditLgpd = async () => {
    const code = assessment?.generatedDdlSql || diagramCode;
    if (!code || !code.trim()) {
      toast.error("Nenhum modelo ou DDL disponível para auditoria LGPD.");
      return;
    }
    setIsAuditingLgpd(true);
    try {
      const res = await fetch(apiUrl("/api/database/lgpd-audit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ddlOrMermaid: code,
          extractedTables: assessment?.extractedTables
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLgpdReport(data.lgpdReport);
        setActiveTab("lgpd_governance");
        toast.success("✓ Auditoria de Governança & LGPD concluída!");
      } else {
        const fallback = await DatabaseModelAssessmentService.auditDataPrivacyGovernance({
          ddlOrMermaid: code,
          extractedTables: assessment?.extractedTables
        });
        setLgpdReport(fallback);
        setActiveTab("lgpd_governance");
        toast.success("✓ Auditoria LGPD concluída!");
      }
    } catch (e) {
      const fallback = await DatabaseModelAssessmentService.auditDataPrivacyGovernance({
        ddlOrMermaid: code,
        extractedTables: assessment?.extractedTables
      });
      setLgpdReport(fallback);
      setActiveTab("lgpd_governance");
      toast.success("✓ Auditoria LGPD concluída!");
    } finally {
      setIsAuditingLgpd(false);
    }
  };

  const handleSimulateQueryCost = async () => {
    setIsSimulatingCost(true);
    try {
      const res = await fetch(apiUrl("/api/diagrams/interactive/query-plan-cost"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: {
            id: "schema_current",
            title: "Modelo em Avaliação",
            sgbd: targetSgbd,
            tables: assessment?.extractedTables ? assessment.extractedTables.map(t => ({
              id: t.name,
              name: t.name,
              position: { x: 0, y: 0 },
              attributes: t.columns.map(c => ({
                name: c.name,
                type: (c.dataType?.toUpperCase() || "VARCHAR") as any,
                isPrimaryKey: c.isPrimaryKey || false,
                isForeignKey: c.isForeignKey || false,
                isNullable: c.isNullable ?? true,
                hasIndex: c.isPrimaryKey || c.isForeignKey
              }))
            })) : [
              {
                id: "tb_pedido",
                name: "tb_pedido",
                position: { x: 0, y: 0 },
                attributes: [
                  { name: "id", type: "UUID", isPrimaryKey: true, isNullable: false },
                  { name: "cliente_id", type: "UUID", isPrimaryKey: false, isForeignKey: true, isNullable: false, hasIndex: true },
                  { name: "data_pedido", type: "TIMESTAMP", isPrimaryKey: false, isNullable: false }
                ]
              }
            ],
            relationships: []
          },
          tableName: selectedCostTable,
          filterColumn: selectedCostColumn
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQueryCostResult(data.planCost);
        setActiveTab("query_cost");
        toast.success("✓ Simulação de Custo EXPLAIN ANALYZE concluída!");
      }
    } catch (e) {
      toast.error("Falha ao simular plano de execução.");
    } finally {
      setIsSimulatingCost(false);
    }
  };

  const handleSimulateAcid = async () => {
    setIsSimulatingAcid(true);
    try {
      const res = await fetch(apiUrl("/api/diagrams/interactive/acid-simulation"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isolationLevel: selectedAcidIsolation,
          targetTable: selectedCostTable || "pedidos"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAcidResult(data.result);
        setActiveTab("acid_lab");
        toast.success("✓ Simulação de Concorrência ACID executada!");
      }
    } catch (e) {
      toast.error("Falha ao simular concorrência ACID.");
    } finally {
      setIsSimulatingAcid(false);
    }
  };

  const handleEvaluateVoiceDefense = async () => {
    if (!voiceDefenseText.trim()) {
      toast.error("Insira a transcrição da defesa oral.");
      return;
    }
    setIsEvaluatingVoice(true);
    try {
      const res = await fetch(apiUrl("/api/cognitive-twin/voice-defense/evaluate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId || "student_1",
          topicTitle: "Defesa de Modelagem & Arquitetura de Dados",
          transcription: voiceDefenseText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVoiceDefenseResult(data.evaluation);
        setActiveTab("voice_defense");
        toast.success("✓ Laudo de Defesa Oral emitido com sucesso!");
      }
    } catch (e) {
      toast.error("Erro ao avaliar defesa oral.");
    } finally {
      setIsEvaluatingVoice(false);
    }
  };

  const handleLoadCognitiveTwin = async () => {
    setIsLoadingTwin(true);
    try {
      const studentObj = students.find(s => s.id === selectedStudentId);
      const res = await fetch(apiUrl(`/api/cognitive-twin/${selectedStudentId || "student_1"}?studentName=${encodeURIComponent(studentObj?.name || "Aluno SENAI")}`));
      if (res.ok) {
        const data = await res.json();
        setCognitiveTwinProfile(data.profile);
        setActiveTab("cognitive_twin");
        toast.success("✓ Perfil do Gêmeo Cognitivo carregado!");
      }
    } catch (e) {
      toast.error("Erro ao carregar gêmeo cognitivo.");
    } finally {
      setIsLoadingTwin(false);
    }
  };

  const handleLoadArenaLeaderboard = async () => {
    setIsLoadingArena(true);
    try {
      const res = await fetch(apiUrl("/api/arena/hackathon/leaderboard"));
      if (res.ok) {
        const data = await res.json();
        setHackathonStandings(data.leaderboard);
        setActiveTab("arena_duels");
        toast.success("✓ Placar ao vivo da Arena de Duelos carregado!");
      }
    } catch (e) {
      toast.error("Erro ao carregar leaderboard da arena.");
    } finally {
      setIsLoadingArena(false);
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
              {isBenchmarking ? "Simulando..." : "Benchmark 100k"}
            </button>

            <button
              onClick={handleConvertMultiSgbd}
              disabled={isConvertingMultiSgbd}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Converter para PostgreSQL, MySQL, Oracle, SQL Server e SQLite"
            >
              {isConvertingMultiSgbd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Binary className="w-4 h-4" />}
              {isConvertingMultiSgbd ? "Convertendo..." : "Multi-SGBD"}
            </button>

            <button
              onClick={handleGenerateMigrations}
              disabled={isGeneratingMigrations}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Gerar Migrações Flyway e Refatoração 3FN"
            >
              {isGeneratingMigrations ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Workflow className="w-4 h-4" />}
              {isGeneratingMigrations ? "Gerando..." : "Migrações 3FN"}
            </button>

            <button
              onClick={handleAuditLgpd}
              disabled={isAuditingLgpd}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Auditoria de Conformidade LGPD & Detecção de PII"
            >
              {isAuditingLgpd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {isAuditingLgpd ? "Auditando..." : "Auditoria LGPD"}
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
                <button
                  onClick={() => {
                    setActiveTab("multi_sgbd");
                    if (!multiSgbdResult) handleConvertMultiSgbd();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "multi_sgbd" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-indigo-400 hover:text-indigo-300"
                  }`}
                >
                  Multi-SGBD (5)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("migrations");
                    if (!migrationsResult) handleGenerateMigrations();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "migrations" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  Migrações 3FN
                </button>
                <button
                  onClick={() => {
                    setActiveTab("lgpd_governance");
                    if (!lgpdReport) handleAuditLgpd();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "lgpd_governance" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-rose-400 hover:text-rose-300"
                  }`}
                >
                  Auditoria LGPD
                </button>
                <button
                  onClick={() => {
                    setActiveTab("query_cost");
                    if (!queryCostResult) handleSimulateQueryCost();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "query_cost" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  Custo EXPLAIN
                </button>
                <button
                  onClick={() => {
                    setActiveTab("acid_lab");
                    if (!acidResult) handleSimulateAcid();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "acid_lab" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-cyan-400 hover:text-cyan-300"
                  }`}
                >
                  Concorrência ACID
                </button>
                <button
                  onClick={() => {
                    setActiveTab("voice_defense");
                    if (!voiceDefenseResult) handleEvaluateVoiceDefense();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "voice_defense" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-purple-400 hover:text-purple-300"
                  }`}
                >
                  Defesa Oral IA
                </button>
                <button
                  onClick={() => {
                    setActiveTab("cognitive_twin");
                    if (!cognitiveTwinProfile) handleLoadCognitiveTwin();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "cognitive_twin" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-blue-400 hover:text-blue-300"
                  }`}
                >
                  Gêmeo Cognitivo
                </button>
                <button
                  onClick={() => {
                    setActiveTab("arena_duels");
                    if (hackathonStandings.length === 0) handleLoadArenaLeaderboard();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeTab === "arena_duels" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "text-yellow-400 hover:text-yellow-300"
                  }`}
                >
                  Arena Duelos
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

              {/* Tab: Multi-SGBD Converter */}
              {activeTab === "multi_sgbd" && (
                <div className="space-y-4">
                  {multiSgbdResult ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-slate-400 mr-2">SGBD Alvo:</span>
                          {(["postgresql", "mysql", "oracle", "sqlserver", "sqlite"] as const).map((dial) => (
                            <button
                              key={dial}
                              onClick={() => setSelectedMultiSgbdDialect(dial)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition ${
                                selectedMultiSgbdDialect === dial
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                              }`}
                            >
                              {dial}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded border border-indigo-500/30">
                            Collation: {multiSgbdResult.recommendedCollation}
                          </span>
                          <button
                            onClick={() => {
                              const code = multiSgbdResult[selectedMultiSgbdDialect];
                              navigator.clipboard.writeText(code);
                              toast.success(`DDL para ${selectedMultiSgbdDialect.toUpperCase()} copiado!`);
                            }}
                            className="text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar
                          </button>
                        </div>
                      </div>

                      {/* Code Output */}
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[260px] scrollbar-thin">
                        {multiSgbdResult[selectedMultiSgbdDialect]}
                      </pre>

                      {/* FK Indexes & Triggers Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <span className="text-xs font-mono font-bold text-sky-400 uppercase flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" /> Índices Automáticos em Foreign Keys:
                          </span>
                          <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-[140px] overflow-y-auto">
                            {multiSgbdResult.foreignKeyIndexes.map((idx, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                                {idx}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> Triggers de Auditoria (updated_at):
                          </span>
                          <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-[140px] overflow-y-auto">
                            {multiSgbdResult.auditTriggers.map((trg, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                                {trg}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <Binary className="w-8 h-8 text-indigo-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Conversão Multi-SGBD Pronta para Executar</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Gere scripts DDL otimizados para PostgreSQL, MySQL, Oracle, SQL Server e SQLite com índices em chaves estrangeiras.
                      </p>
                      <button
                        onClick={handleConvertMultiSgbd}
                        disabled={isConvertingMultiSgbd}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                      >
                        {isConvertingMultiSgbd ? "Convertendo..." : "Gerar Scripts Multi-SGBD Agora"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Migrations 3FN Package */}
              {activeTab === "migrations" && (
                <div className="space-y-4">
                  {migrationsResult ? (
                    <div className="space-y-4">
                      {/* Breaking Changes Banner */}
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                        <span className="text-xs font-mono font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                          <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                          Plano de Refatoração 3FN & Preservação Histórica (Flyway):
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {migrationsResult.breakingChangesNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>

                      {/* V2 Normalized Migration Code */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            V2__normalize_3fn_refactor.sql (Criação das Entidades Decompostas)
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(migrationsResult.v2Refactor3fnSchema);
                              toast.success("Script V2 copiado!");
                            }}
                            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar V2
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[160px] scrollbar-thin">
                          {migrationsResult.v2Refactor3fnSchema}
                        </pre>
                      </div>

                      {/* Data Migration DML */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            Carga e Migração de Dados Históricos (DML com DISTINCT & JOIN)
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(migrationsResult.dataMigrationSql);
                              toast.success("Script de migração de dados copiado!");
                            }}
                            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar DML
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto max-h-[140px] scrollbar-thin">
                          {migrationsResult.dataMigrationSql}
                        </pre>
                      </div>

                      {/* Rollback Script */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            U2__rollback_3fn_refactor.sql (Rollback Seguro)
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(migrationsResult.downRollbackSql);
                              toast.success("Script de Rollback copiado!");
                            }}
                            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar Rollback
                          </button>
                        </div>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-[120px] scrollbar-thin">
                          {migrationsResult.downRollbackSql}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <Workflow className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Nenhum Pacote de Migração Gerado</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Gere scripts versionados Flyway com migração de dados sem perda de histórico e script de rollback.
                      </p>
                      <button
                        onClick={handleGenerateMigrations}
                        disabled={isGeneratingMigrations}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                      >
                        {isGeneratingMigrations ? "Gerando..." : "Gerar Pacote Flyway 3FN Agora"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: LGPD Privacy & Governance */}
              {activeTab === "lgpd_governance" && (
                <div className="space-y-4">
                  {lgpdReport ? (
                    <div className="space-y-4">
                      {/* Governance Score Banner */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold font-mono text-base">
                            {lgpdReport.complianceScore}%
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{lgpdReport.status}</h3>
                            <p className="text-xs text-slate-400">Score de Governança & Conformidade LGPD (Lei 13.709/2018)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            lgpdReport.retentionPolicyAudit.hasSoftDelete ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                          }`}>
                            Soft Delete: {lgpdReport.retentionPolicyAudit.hasSoftDelete ? "✓ Ativo" : "✗ Ausente"}
                          </span>
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            lgpdReport.retentionPolicyAudit.hasAuditTrail ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                          }`}>
                            Audit Trail: {lgpdReport.retentionPolicyAudit.hasAuditTrail ? "✓ Ativo" : "✗ Ausente"}
                          </span>
                        </div>
                      </div>

                      {/* PII Findings Table */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                          Campos com Dados Pessoais Sensíveis Detectados ({lgpdReport.piiFindings.length}):
                        </span>

                        <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Tabela</th>
                                <th className="p-2.5">Coluna</th>
                                <th className="p-2.5">Categoria PII</th>
                                <th className="p-2.5">Risco</th>
                                <th className="p-2.5">Recomendação de Proteção</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {lgpdReport.piiFindings.map((pii, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50 transition">
                                  <td className="p-2.5 font-bold text-sky-300">{pii.tableName}</td>
                                  <td className="p-2.5 text-white">{pii.columnName}</td>
                                  <td className="p-2.5 text-amber-300">{pii.piiCategory}</td>
                                  <td className="p-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      pii.riskLevel === "Crítico" ? "bg-rose-500/20 text-rose-300" : pii.riskLevel === "Alto" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
                                    }`}>
                                      {pii.riskLevel}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-300 text-[11px] font-sans">{pii.maskingRecommendation}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Actionable Recommendations */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" /> Ações Recomendadas para Conformidade Integral:
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {lgpdReport.retentionPolicyAudit.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-3 bg-slate-950/60 rounded-xl border border-slate-800">
                      <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Auditoria de Dados Pessoais e LGPD</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Identifique colunas com CPFs, emails, dados de saúde e financeiros sem criptografia ou mascaramento.
                      </p>
                      <button
                        onClick={handleAuditLgpd}
                        disabled={isAuditingLgpd}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                      >
                        {isAuditingLgpd ? "Auditando..." : "Executar Auditoria LGPD Agora"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Query Plan & Index Cost Simulator */}
              {activeTab === "query_cost" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                          <Activity className="w-4 h-4" /> Simulador Virtual de Query Plan & Custo de Índices (1M Tuplas)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Estime o impacto de planos de execução (Seq Scan vs Index Scan) sem onerar o banco de produção.
                        </p>
                      </div>
                      <button
                        onClick={handleSimulateQueryCost}
                        disabled={isSimulatingCost}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs transition cursor-pointer"
                      >
                        {isSimulatingCost ? "Simulando..." : "Re-executar EXPLAIN"}
                      </button>
                    </div>

                    {queryCostResult && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Tipo de Varredura</span>
                            <span className="text-xs font-bold text-amber-300">{queryCostResult.scanType}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Custo Estimado (Cost)</span>
                            <span className="text-xs font-bold text-white font-mono">{queryCostResult.costScore.toFixed(1)}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Latência Estimada (1M linhas)</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">{queryCostResult.executionTimeMsEstimated} ms</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                          <strong className="text-white">Diagnóstico: </strong> {queryCostResult.recommendation}
                        </div>

                        {queryCostResult.suggestedIndexSql && (
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-bold text-emerald-400">Índice Recomendado para Mitigação:</span>
                            <pre className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-mono text-emerald-300 overflow-x-auto">
                              {queryCostResult.suggestedIndexSql}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: ACID Concurrency & Isolation Lab */}
              {activeTab === "acid_lab" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                          <Layers className="w-4 h-4" /> Laboratório de Transações & Concorrência ACID
                        </h4>
                        <p className="text-xs text-slate-400">
                          Simule anomalias de concorrência (Dirty Read, Non-Repeatable Read, Phantom Read) por nível de isolamento.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={selectedAcidIsolation}
                          onChange={(e) => setSelectedAcidIsolation(e.target.value as any)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs"
                        >
                          <option value="READ UNCOMMITTED">READ UNCOMMITTED</option>
                          <option value="READ COMMITTED">READ COMMITTED</option>
                          <option value="REPEATABLE READ">REPEATABLE READ</option>
                          <option value="SERIALIZABLE">SERIALIZABLE</option>
                        </select>
                        <button
                          onClick={handleSimulateAcid}
                          disabled={isSimulatingAcid}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer"
                        >
                          {isSimulatingAcid ? "Testando..." : "Simular"}
                        </button>
                      </div>
                    </div>

                    {acidResult && (
                      <div className="space-y-3 pt-2">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-300">Status de Integridade Transacional:</span>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono ${
                            acidResult.isSafe ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}>
                            {acidResult.isSafe ? "✓ CONCORRÊNCIA SEGURA" : "⚠ ANOMALIA DETECTADA"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {acidResult.steps.map((step: any, sIdx: number) => (
                            <div key={sIdx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs font-mono">
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="text-sky-400 font-bold">Passo {step.stepIndex}</span>
                                {step.anomalyDetected && (
                                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                                    {step.anomalyDetected}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-200">Tx A: {step.transactionA}</div>
                              <div className="text-slate-300">Tx B: {step.transactionB}</div>
                              <div className="text-slate-400 font-sans text-[11px] pt-1">{step.explanation}</div>
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                          <strong className="text-white">Parecer Pedagógico: </strong> {acidResult.mitigationAdvice}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Voice-First Oral Defense & Socratic Interview */}
              {activeTab === "voice_defense" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-purple-400 flex items-center gap-1.5 font-mono">
                          <Mic className="w-4 h-4" /> Defesa Oral Socrática por Voz & Autoria
                        </h4>
                        <p className="text-xs text-slate-400">
                          Avaliação de fluência técnica, coerência conceitual e validação de autoria contra respostas de IA externa.
                        </p>
                      </div>
                      <button
                        onClick={handleEvaluateVoiceDefense}
                        disabled={isEvaluatingVoice}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition cursor-pointer"
                      >
                        {isEvaluatingVoice ? "Analisando..." : "Avaliar Defesa"}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-400">Transcrição da Explicação Oral do Aluno:</label>
                      <textarea
                        value={voiceDefenseText}
                        onChange={(e) => setVoiceDefenseText(e.target.value)}
                        rows={3}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-sans"
                        placeholder="Digite ou grave a defesa oral do estudante..."
                      />
                    </div>

                    {voiceDefenseResult && (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Vocabulário Técnico</span>
                            <span className="text-sm font-bold text-purple-300">{voiceDefenseResult.metrics.technicalVocabularyScore}%</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Profundidade</span>
                            <span className="text-sm font-bold text-sky-300">{voiceDefenseResult.metrics.conceptualDepthScore}%</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Coerência</span>
                            <span className="text-sm font-bold text-emerald-300">{voiceDefenseResult.metrics.argumentationCoherenceScore}%</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">Autoria Legítima</span>
                            <span className="text-sm font-bold text-yellow-300">{voiceDefenseResult.metrics.authenticAuthorshipConfidence}%</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-purple-300">Veredito da Defesa:</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300">
                              {voiceDefenseResult.overallVerdict}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-sans">{voiceDefenseResult.formalPedagogicalFeedback}</p>
                          <div className="pt-1 text-xs text-slate-400">
                            <strong className="text-purple-400">Pergunta Socrática de Aprofundamento: </strong>
                            {voiceDefenseResult.socraticFollowUpQuestion}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Cognitive Twin & Self-Healing */}
              {activeTab === "cognitive_twin" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5 font-mono">
                          <BrainCircuit className="w-4 h-4" /> Gêmeo Cognitivo do Aluno (BKT & Retenção Ebbinghaus)
                        </h4>
                        <p className="text-xs text-slate-400">
                          Mapeamento bayesiano de domínio de competências e prevenção de esquecimento.
                        </p>
                      </div>
                      <button
                        onClick={handleLoadCognitiveTwin}
                        disabled={isLoadingTwin}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs transition cursor-pointer"
                      >
                        {isLoadingTwin ? "Carregando..." : "Atualizar Gêmeo"}
                      </button>
                    </div>

                    {cognitiveTwinProfile && (
                      <div className="space-y-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{cognitiveTwinProfile.studentName}</span>
                            <span className="text-[11px] text-slate-400">Velocidade Cognitiva: {cognitiveTwinProfile.cognitiveVelocity}x • {cognitiveTwinProfile.retentionRiskCount} tópicos em risco</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-blue-400 font-mono">{cognitiveTwinProfile.overallMasteryIndex}%</span>
                            <span className="text-[10px] text-slate-500 block uppercase">Índice Global de Domínio</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {cognitiveTwinProfile.competencies.map((comp: any, cIdx: number) => (
                            <div key={cIdx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white">{comp.name}</span>
                                <span className="font-mono text-blue-300 font-bold">{Math.round(comp.pKnown * 100)}% Domínio</span>
                              </div>
                              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: `${comp.pKnown * 100}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Retenção na Memória: {comp.retentionPercent}%</span>
                                <span className="text-amber-400">{comp.recommendedAction}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Arena Duels & Hackathon Leaderboard */}
              {activeTab === "arena_duels" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-1.5 font-mono">
                          <Trophy className="w-4 h-4" /> Placar ao Vivo da Arena de Duelos & Hackathon
                        </h4>
                        <p className="text-xs text-slate-400">
                          Classificação oficial estilo Maratona de Programação ICPC com balões por problema resolvido.
                        </p>
                      </div>
                      <button
                        onClick={handleLoadArenaLeaderboard}
                        disabled={isLoadingArena}
                        className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-black font-mono font-bold text-xs transition cursor-pointer"
                      >
                        {isLoadingArena ? "Atualizando..." : "Atualizar Placar"}
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                      {hackathonStandings.map((team, tIdx) => (
                        <div key={tIdx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-300 font-bold flex items-center justify-center text-xs">
                              {team.rank}
                            </span>
                            <div>
                              <span className="font-bold text-white block">{team.teamName}</span>
                              <span className="text-[11px] text-slate-400">{team.solvedProblems} problemas • {team.totalPenaltyMinutes} min penalidade</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {team.problemSubmissions.map((prob: any, pIdx: number) => (
                              <span
                                key={pIdx}
                                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                                style={{
                                  backgroundColor: prob.isSolved ? prob.balloonColor : "#1e293b",
                                  border: `1px solid ${prob.isSolved ? prob.balloonColor : "#334155"}`
                                }}
                              >
                                {prob.problemCode}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
