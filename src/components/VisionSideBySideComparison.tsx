import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  Zap,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  FileCode,
  Download,
  Eye,
  EyeOff,
  Code2,
  Cpu,
  ShieldCheck,
  Undo2,
  Wand2,
  Split,
  Columns2,
  ArrowRightLeft,
  AlertCircle
} from "lucide-react";

interface VisionSideBySideComparisonProps {
  imageUrl: string | null;
  originalText: string;
  currentText: string;
  onTextChange: (text: string) => void;
  studentName?: string;
  className?: string;
  exerciseType?: string;
  confidence?: string;
  modelName?: string;
  onConfirmAndApply: () => void;
  onFineTune: () => void;
  onExportPdf?: () => void;
  isFineTuning?: boolean;
  fineTunedSuccess?: boolean;
  applied?: boolean;
  onUploadNewImage?: (file: File) => void;
  onLoadSample?: (sampleType: "c_binary" | "python_tree" | "java_oop") => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function VisionSideBySideComparison({
  imageUrl,
  originalText,
  currentText,
  onTextChange,
  studentName = "Lucas Mendonça Silva (20260489)",
  className = "Turma de Algoritmos Avançados",
  exerciseType = "Prova Manuscrita",
  confidence = "99.4%",
  modelName = "LLaVA:7b Vision",
  onConfirmAndApply,
  onFineTune,
  onExportPdf,
  isFineTuning = false,
  fineTunedSuccess = false,
  applied = false,
  onUploadNewImage,
  onLoadSample,
  isFullscreen = false,
  onToggleFullscreen
}: VisionSideBySideComparisonProps) {
  // Image Viewer State
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<"normal" | "contrast" | "invert" | "grayscale" | "sharpen">("normal");
  const [showCodeOverlay, setShowCodeOverlay] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeDiffView, setActiveDiffView] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("c");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset zoom/rotation when image changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [imageUrl]);

  // Handle Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Copy Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick insertion of programming symbols
  const handleInsertSymbol = (symbol: string) => {
    if (!textareaRef.current) {
      onTextChange(currentText + symbol);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const updated = before + symbol + after;
    onTextChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 10);
  };

  // Handle Tab key in Textarea for 4-space indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      onTextChange(before + "    " + after);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Auto-indent helper
  const handleAutoIndent = () => {
    const lines = currentText.split("\n");
    let indentLevel = 0;
    const indented = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("}") || trimmed.startsWith("]")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      const padding = "    ".repeat(indentLevel);
      const result = trimmed.length > 0 ? padding + trimmed : "";
      if (trimmed.endsWith("{") || trimmed.endsWith("[") || trimmed.endsWith(":")) {
        indentLevel++;
      }
      return result;
    });
    onTextChange(indented.join("\n"));
  };

  // Common OCR Handwriting Corrections
  const handleFixCommonOcrErrors = () => {
    let text = currentText;
    // Fix typical handwriting OCR confusion
    text = text.replace(/\bint\s+([a-zA-Z0-9_]+)\s*=\s*O;/g, "int $1 = 0;"); // O -> 0
    text = text.replace(/==\s*O\b/g, "== 0");
    text = text.replace(/!=\s*O\b/g, "!= 0");
    text = text.replace(/([a-zA-Z0-9_]+)\+\+/g, "$1++");
    text = text.replace(/\bfl0at\b/g, "float");
    text = text.replace(/\bd0uble\b/g, "double");
    text = text.replace(/\breturn\s+O;/g, "return 0;");
    text = text.replace(/\breturn\s+-l;/g, "return -1;");
    text = text.replace(/;\s*;/g, ";");
    onTextChange(text);
  };

  // Reset to original OCR
  const handleResetToOriginal = () => {
    if (window.confirm("Deseja restaurar o texto exatamente como foi extraído pelo modelo LLaVA?")) {
      onTextChange(originalText);
    }
  };

  // Export code file
  const handleDownloadCodeFile = () => {
    const extensions: Record<string, string> = {
      c: "c",
      cpp: "cpp",
      python: "py",
      java: "java",
      javascript: "js"
    };
    const ext = extensions[selectedLanguage] || "txt";
    const filename = `Transcricao_Exame_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
    const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get image filter CSS
  const getImageFilterStyle = () => {
    switch (filterMode) {
      case "contrast":
        return "contrast(180%) brightness(110%) grayscale(100%)";
      case "invert":
        return "invert(100%) hue-rotate(180deg) contrast(150%)";
      case "grayscale":
        return "grayscale(100%) contrast(120%)";
      case "sharpen":
        return "contrast(140%) brightness(105%) saturate(80%)";
      default:
        return "none";
    }
  };

  // Calculate stats & differences
  const linesCount = currentText.split("\n").length;
  const charsCount = currentText.length;
  const isModified = currentText !== originalText;
  const diffCharCount = currentText.length - originalText.length;

  return (
    <div
      className={`flex flex-col bg-[#0b1120] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : "w-full"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#0f172a] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Split className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                Side-by-Side Comparison • Visão Computacional vs Transcrição
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {modelName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Turma: <strong className="text-slate-300">{className}</strong></span>
              <span>•</span>
              <span>Aluno: <strong className="text-slate-300">{studentName}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-mono font-semibold">Acurácia: {confidence}</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {onLoadSample && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <span className="text-[10px] text-slate-400 font-mono px-2">Exemplos:</span>
              <button
                onClick={() => onLoadSample("c_binary")}
                className="px-2 py-1 rounded text-[10px] font-mono font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Busca em C
              </button>
              <button
                onClick={() => onLoadSample("python_tree")}
                className="px-2 py-1 rounded text-[10px] font-mono font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Árvore Python
              </button>
              <button
                onClick={() => onLoadSample("java_oop")}
                className="px-2 py-1 rounded text-[10px] font-mono font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Java OOP
              </button>
            </div>
          )}

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Split Body */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 ${isFullscreen ? "flex-1 overflow-hidden" : "min-h-[580px]"}`}>
        
        {/* ================= LEFT PANE: ORIGINAL IMAGE VIEWER ================= */}
        <div className="flex flex-col bg-slate-950/80 relative overflow-hidden">
          {/* Left Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm z-10 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Imagem Original do Manuscrito
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ({zoom * 100}%)
              </span>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 mr-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Resetar Zoom para 100%"
                >
                  100%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleRotate}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Girar Imagem 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Filter Selector */}
              <select
                value={filterMode}
                onChange={(e: any) => setFilterMode(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono rounded-lg px-2 py-1 outline-none cursor-pointer"
                title="Filtro de Leitura e Contraste para Grafite/Caneta"
              >
                <option value="normal">Cor Normal</option>
                <option value="contrast">Alto Contraste P&B</option>
                <option value="invert">Inverter Cores (Dark Paper)</option>
                <option value="grayscale">Escala de Cinza</option>
                <option value="sharpen">Realce de Traços</option>
              </select>

              <button
                onClick={() => setShowCodeOverlay(!showCodeOverlay)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showCodeOverlay
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
                title="Alternar Destaque de Região de Código Reconhecida (Bounding Box)"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Display Canvas / Viewport */}
          <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center min-h-[380px] select-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {imageUrl ? (
              <div
                className="relative transition-transform duration-150 ease-out origin-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: getImageFilterStyle()
                }}
              >
                <img
                  src={imageUrl}
                  alt="Avaliação Manuscrita"
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl border border-slate-800"
                />

                {/* Simulated Visual Bounding Boxes for Recognized Handwriting Regions */}
                {showCodeOverlay && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[18%] left-[8%] right-[8%] bottom-[25%] border-2 border-dashed border-indigo-400/70 bg-indigo-500/10 rounded-lg">
                      <div className="absolute -top-3 left-3 bg-indigo-600 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold shadow">
                        Região OCR Código (Confiança {confidence})
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs">
                {/* Fallback realistic paper sheet preview if no image uploaded */}
                <div className="w-72 h-80 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>CÓDIGO DA PROVA: #ALGO-2026</span>
                    <span className="text-indigo-400">AVALIAÇÃO MANUSCRITA</span>
                  </div>
                  <div className="space-y-2 my-auto font-mono text-[11px] text-slate-400 italic text-left opacity-75">
                    <p className="text-slate-300 font-bold">// Código escrito à mão pelo estudante:</p>
                    <p>int busca_binaria(int arr[], int tam, int val) &#123;</p>
                    <p className="pl-4">int ini = 0, fim = tam - 1;</p>
                    <p className="pl-4">while (ini &lt;= fim) &#123;</p>
                    <p className="pl-8">int meio = ini + (fim - ini) / 2;</p>
                    <p className="pl-8">if (arr[meio] == val) return meio;</p>
                    <p className="pl-8">if (arr[meio] &lt; val) ini = meio + 1;</p>
                    <p className="pl-8">else fim = meio - 1;</p>
                    <p className="pl-4">&#125;</p>
                    <p className="pl-4">return -1;</p>
                    <p>&#125;</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[9px] text-slate-500">
                    <span>Estudante: {studentName}</span>
                    <span>Turma: {className}</span>
                  </div>
                </div>
                <span className="mt-3 text-[11px] text-slate-400">Exibindo representação da prova manuscrita carregada</span>
              </div>
            )}
          </div>

          {/* Left Footer Info */}
          <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Detector Multimodal LLaVA ativo
            </span>
            <span>Tipo: {exerciseType}</span>
          </div>
        </div>

        {/* ================= RIGHT PANE: RAPID CODE/TEXT EDITOR ================= */}
        <div className="flex flex-col bg-slate-950/90 relative">
          {/* Right Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                Texto / Código Transcrito (Edição Rápida)
              </span>
              {isModified ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Editado ({diffCharCount >= 0 ? `+${diffCharCount}` : diffCharCount} carac.)
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Original do Modelo
                </span>
              )}
            </div>

            {/* Language & Action Tools */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                <option value="c">Linguagem C</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="pseudocode">Pseudocódigo / Portugol</option>
              </select>

              <button
                onClick={handleAutoIndent}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Auto-indentar código formatado"
              >
                <Wand2 className="w-3 h-3 text-indigo-400" /> Formatar
              </button>

              <button
                onClick={handleFixCommonOcrErrors}
                className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-slate-800 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Corrigir erros comuns de escrita manual (ex: O em vez de 0, ponto-e-vírgula)"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" /> Auto-Fix OCR
              </button>

              <button
                onClick={handleCopyCode}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Copiar código para a área de transferência"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {isModified && (
                <button
                  onClick={handleResetToOriginal}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Reverter para o texto original transcrito pela IA"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Virtual Symbol Toolbar (Essential for fixing handwriting OCR fast) */}
          <div className="flex items-center gap-1 px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto text-[11px] font-mono scrollbar-thin">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1 select-none font-bold">Inserir:</span>
            {[
              "{ }",
              "( )",
              "[ ]",
              ";",
              "==",
              "!=",
              "<=",
              ">=",
              "&&",
              "||",
              "->",
              "*",
              "&",
              "//",
              "return 0;",
              "printf",
              "scanf",
              "int",
              "float",
              "double"
            ].map((sym) => (
              <button
                key={sym}
                onClick={() => handleInsertSymbol(sym.includes(" ") ? sym : sym + " ")}
                className="px-2 py-0.5 rounded bg-slate-950 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-800/90 text-[10px] transition-colors whitespace-nowrap cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Editor Area with Line Numbers */}
          <div className="flex-1 relative flex min-h-[360px] bg-[#030712] font-mono text-xs">
            {/* Line Numbers Column */}
            <div className="w-10 py-3 bg-[#0a0f1d] border-r border-slate-800/80 text-right pr-2 select-none text-slate-600 font-mono text-[11px]">
              {Array.from({ length: Math.max(linesCount, 12) }, (_, i) => (
                <div key={i + 1} className="leading-5 h-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={currentText}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-emerald-300 outline-none resize-none leading-5 text-[12px] font-mono focus:ring-0 selection:bg-indigo-500/30"
              placeholder="O código transcrito pelo modelo aparecerá aqui. Faça as correções necessárias..."
            />
          </div>

          {/* Right Footer Stats & Diff Indicator */}
          <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>Linhas: <strong className="text-slate-200">{linesCount}</strong></span>
              <span>Caracteres: <strong className="text-slate-200">{charsCount}</strong></span>
              {isModified ? (
                <span className="text-amber-400">Pronto para confirmar</span>
              ) : (
                <span className="text-slate-500">Sem alterações pendentes</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCodeFile}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Exportar como arquivo fonte"
              >
                <Download className="w-3 h-3" /> Exportar .{selectedLanguage}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ACTION BAR: CONFIRMATION & FINE-TUNING ================= */}
      <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            Após revisar o manuscrito e o código transcrito, confirme para enviar ao motor de notas ou realize o fine-tuning da caligrafia.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Fine-Tuning Button */}
          <button
            onClick={onFineTune}
            disabled={isFineTuning || fineTunedSuccess}
            className={`py-2 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              fineTunedSuccess
                ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                : "bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40"
            }`}
            title="Salva as correções para ajustar a acurácia OCR da turma no LLaVA"
          >
            {isFineTuning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : fineTunedSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            )}
            {fineTunedSuccess ? "Caligrafia Aprendida!" : "Salvar para Fine-Tuning"}
          </button>

          {/* Confirm & Apply Final Assessment Button */}
          <button
            onClick={onConfirmAndApply}
            disabled={applied}
            className={`py-2 px-5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              applied
                ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20"
            }`}
          >
            {applied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Transcrição Confirmada & Aplicada!
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirmar & Aplicar Transcrição
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VisionSideBySideComparison;
