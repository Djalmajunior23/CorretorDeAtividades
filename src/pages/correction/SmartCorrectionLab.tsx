import { apiUrl, API_BASE_URL } from "../../config/api";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  TestTube,
  CheckCircle,
  XCircle,
  Code,
  Terminal,
  Image as ImageIcon,
  BookOpen,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  AlertCircle,
  ChevronRight,
  Zap,
  Download,
  Sparkles,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "../../utils/cn";
import Sidebar from "../../components/layout/Sidebar";

import { exportHtmlToPDF } from "../../utils/export";

const LANGUAGES = [
  { id: "python", name: "Python", icon: "🐍" },
  { id: "javascript", name: "JavaScript", icon: "💛" },
  { id: "c", name: "C/C++", icon: "⚙️" },
];

export default function SmartCorrectionLab() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(
    'def hello_world():\n    print("Hello, World!")\n\nhello_world()',
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<any>(null);

  React.useEffect(() => {
    fetch(apiUrl("/api/execution/status"))
      .then((res) => res.json())
      .then((data) => setSandboxStatus(data))
      .catch((e) => console.warn("Failed to fetch sandbox status in Lab:", e));
  }, []);

  const getEngineStatus = () => {
    if (language.id === "c") {
      return "missing_c";
    }
    if (!sandboxStatus || !sandboxStatus.engines) {
      return "available"; // default while loading
    }
    const engines = sandboxStatus.engines;
    if (language.id === "python" && engines.python !== "available") {
      return "missing";
    }
    if (language.id === "javascript" && engines.node !== "available") {
      return "missing";
    }
    return "available";
  };
  const [activeTab, setActiveTab] = useState<
    "result" | "errors" | "analysis" | "feedback" | "compare"
  >("result");
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [executionResult, setExecutionResult] = useState<{
    status: "idle" | "running" | "success" | "error";
    stdout: string;
    stderr: string;
    time: string;
    memory: string;
    score: number;
    analysis?: any;
  }>({
    status: "idle",
    stdout: "",
    stderr: "",
    time: "-",
    memory: "-",
    score: 0,
  });

  const handleExecute = async () => {
    if (getEngineStatus() === "missing") {
      setExecutionResult({
        status: "error",
        stdout: "",
        stderr: `Erro: O ambiente de execução para ${language.name} não está disponível neste servidor.`,
        time: "-",
        memory: "-",
        score: 0,
      });
      setActiveTab("errors");
      return;
    }

    setIsExecuting(true);
    setExecutionResult({
      status: "running",
      stdout: "",
      stderr: "",
      time: "-",
      memory: "-",
      score: 0,
    });

    try {
      
      const url = API_BASE_URL.endsWith("/corrections/run") ? API_BASE_URL : `${API_BASE_URL.replace(/\/+$/, "")}/corrections/run`;

      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(localStorage.getItem("token") ? { "Authorization": `Bearer ${localStorage.getItem("token")}` } : {})
        },
        body: JSON.stringify({
            code: code,
            language: language.id,
            test_cases: [{ input: "", expected_output: "" }], // Mock test case
          }),
        },
      );

      const data = await response.json();

      if (data.syntax_ok === false || data.final_score === 0) {
        setExecutionResult({
          status: "error",
          stdout: data.stdout || "",
          stderr: data.stderr || "Execution failed or syntax error.",
          time: "N/A",
          memory: "N/A",
          score: data.final_score || 0,
          analysis: data.analysis,
        });
        setActiveTab("errors");

        // Trigger AI suggestions on error
        if (data.analysis?.quality_issues || data.analysis?.logic_issues) {
          const suggestions = [
            ...(data.analysis.quality_issues || []),
            ...(data.analysis.logic_issues || []),
          ];
          if (suggestions.length > 0) {
            setAiSuggestions(suggestions);
            setShowAiSuggestion(true);
          }
        }
      } else {
        setExecutionResult({
          status: "success",
          stdout: data.stdout || "Execution successful.",
          stderr: "",
          time: "N/A",
          memory: "N/A",
          score: data.final_score || 100,
          analysis: data.analysis,
        });
        setActiveTab("result");
      }
    } catch (error) {
      setExecutionResult({
        status: "error",
        stdout: "",
        stderr: "Network error or backend is offline. " + String(error),
        time: "-",
        memory: "-",
        score: 0,
      });
      setActiveTab("errors");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-300 font-sans overflow-hidden selection:bg-blue-500/30">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-slate-800/60 bg-[#13151E] flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-4">
            <h1 className="font-medium text-slate-100 flex items-center">
              <span className="text-slate-500 mr-2">Laboratório /</span>{" "}
              Correção Interativa
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative group">
              <select
                className="bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-md pl-8 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                value={language.id}
                onChange={(e) =>
                  setLanguage(
                    LANGUAGES.find((l) => l.id === e.target.value) ||
                      LANGUAGES[0],
                  )
                }
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <span className="absolute left-2.5 top-1.5 pointer-events-none">
                {language.icon}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-2"></div>

            <button
              onClick={handleExecute}
              disabled={isExecuting || getEngineStatus() !== "available"}
              className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/30 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              {isExecuting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                </motion.div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isExecuting ? "Executando..." : "Executar"}</span>
            </button>
            <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-slate-700">
              <TestTube className="w-4 h-4 text-emerald-400" />
              <span>Rodar Testes</span>
            </button>
          </div>
        </header>

        {getEngineStatus() === "missing_c" && (
          <div className="bg-amber-950/60 border-b border-amber-500/20 px-4 py-3 flex items-center space-x-3 text-amber-200 text-xs shrink-0 font-sans">
            <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            <span>
              <strong>Atenção:</strong> Execução de C/C++ ainda não está disponível neste servidor. Use Python ou JavaScript nesta versão inicial.
            </span>
          </div>
        )}

        {getEngineStatus() === "missing" && (
          <div className="bg-amber-950/60 border-b border-amber-500/20 px-4 py-3 flex items-center space-x-3 text-amber-200 text-xs shrink-0 font-sans">
            <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            <span>
              <strong>Atenção:</strong> O ambiente de execução para <strong>{language.name}</strong> não está instalado ou disponível no servidor local do CodeCheck. O botão "Executar" foi desabilitado por segurança.
            </span>
          </div>
        )}

        {/* 3-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel (Left) */}
          <div className="flex-[3] border-r border-slate-800/60 flex flex-col relative bg-[#1E1E1E]">
            <div className="h-9 bg-[#181824] flex items-center px-4 border-b border-slate-800/60 shrink-0">
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
                <Code className="w-3.5 h-3.5" />
                <span>
                  main.
                  {language.id === "python"
                    ? "py"
                    : language.id === "javascript"
                      ? "js"
                      : "c"}
                </span>
              </div>
            </div>
            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language.id}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: '"JetBrains Mono", monospace',
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />

              <AnimatePresence>
                {showAiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-6 left-6 right-6 z-20 bg-[#1e293b]/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Sugestões de Melhoria</h4>
                      </div>
                      <button 
                        onClick={() => setShowAiSuggestion(false)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {aiSuggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
                          <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={() => setShowAiSuggestion(false)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Entendido, vou ajustar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panels */}
          <div className="flex-[2] flex flex-col bg-[#0F111A]">
            {/* Execution Panel (Top Right) */}
            <div className="flex-1 border-b border-slate-800/60 flex flex-col min-h-0">
              <div className="h-9 bg-[#181824] flex items-center px-4 shrink-0 shadow-sm">
                <Terminal className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <span className="text-xs font-medium text-slate-300">
                  Terminal de Execução
                </span>

                {executionResult.status !== "idle" && (
                  <div className="ml-auto flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
                    <span>⏱ {executionResult.time}</span>
                    <span>💾 {executionResult.memory}</span>
                    {executionResult.status === "success" ? (
                      <span className="text-emerald-400 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Sucesso
                      </span>
                    ) : executionResult.status === "error" ? (
                      <span className="text-rose-400 flex items-center">
                        <XCircle className="w-3 h-3 mr-1" /> Falha
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 font-mono text-sm overflow-auto execution-scrollbar bg-[#13151E]">
                {executionResult.status === "idle" ? (
                  <div className="text-slate-600 flex flex-col items-center justify-center h-full space-y-4">
                    <Terminal className="w-12 h-12 opacity-20" />
                    <p>Pressione Executar para ver a saída.</p>
                  </div>
                ) : isExecuting ? (
                  <div className="text-slate-500 animate-pulse flex items-center">
                    <span className="text-indigo-400 mr-2">❯</span> Iniciando
                    container isolado...
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="text-slate-500 mb-4 border-b border-slate-800 pb-2">
                        $ codecheck run main.{language.id} --sandbox
                      </div>
                      {executionResult.stdout && (
                        <pre className="text-slate-300 whitespace-pre-wrap">
                          {executionResult.stdout}
                        </pre>
                      )}
                      {executionResult.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap pt-2">
                          {executionResult.stderr}
                        </pre>
                      )}
                      {!executionResult.stdout && !executionResult.stderr && (
                        <span className="text-slate-500 italic">
                          Program exited with no output.
                        </span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Feedback Panel (Bottom Right) */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#0F111A]">
              <div className="flex border-b border-slate-800/60 bg-[#181824] shrink-0 overflow-x-auto no-scrollbar">
                <Tab
                  id="result"
                  active={activeTab}
                  onClick={setActiveTab}
                  label="📊 Resultado"
                />
                <Tab
                  id="errors"
                  active={activeTab}
                  onClick={setActiveTab}
                  label="🚨 Erros"
                  count={executionResult.status === "error" ? 1 : 0}
                />
                <Tab
                  id="analysis"
                  active={activeTab}
                  onClick={setActiveTab}
                  label="🔍 Análise"
                />
                <Tab
                  id="feedback"
                  active={activeTab}
                  onClick={setActiveTab}
                  label="🤖 Feedback IA"
                />
              </div>

              <div className="flex-1 overflow-auto p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {activeTab === "result" && (
                      <ResultTab
                        status={executionResult.status}
                        score={executionResult.score}
                      />
                    )}
                    {activeTab === "errors" && (
                      <ErrorsTab
                        status={executionResult.status}
                        stderr={executionResult.stderr}
                      />
                    )}
                    {activeTab === "analysis" && (
                      <AnalysisTab
                        analysis={executionResult.analysis}
                        status={executionResult.status}
                      />
                    )}
                    {activeTab === "feedback" && (
                      <FeedbackTab
                        feedback={executionResult.analysis?.analysis_feedback}
                        status={executionResult.status}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponents

function SidebarItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center space-x-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group relative",
        active
          ? "bg-indigo-500/10 text-indigo-400"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
      )}
    >
      {active && (
        <div className="absolute left-0 w-1 h-full rounded-r-full bg-indigo-500" />
      )}
      <Icon
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          active
            ? "text-indigo-400"
            : "text-slate-500 group-hover:text-slate-300",
        )}
      />
      <span className="font-medium text-sm hidden lg:block whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function Tab({ id, active, onClick, label, count }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap flex items-center transition-colors",
        isActive
          ? "border-indigo-500 text-indigo-400"
          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30",
      )}
    >
      {label}
      {count > 0 && (
        <span className="ml-2 bg-rose-500/20 text-rose-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {count}
        </span>
      )}
    </button>
  );
}

function ResultTab({ status, score }: { status: string; score: number }) {
  if (status === "idle" || status === "running")
    return <Placeholder text="Aguardando execução para gerar resultados..." />;

  const isSuccess = status === "success";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
        <div>
          <h3 className="text-slate-200 font-semibold mb-1">Nota Final</h3>
          <p className="text-sm text-slate-400">Classificação Automática</p>
        </div>
        <div
          className={cn(
            "text-4xl font-black",
            score >= 70
              ? "text-emerald-400"
              : score >= 40
                ? "text-amber-400"
                : "text-rose-400",
          )}
        >
          {score}
          <span className="text-lg text-slate-500">/100</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
          Test Cases
        </h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-[#181824] border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors group"
            >
              <div className="flex items-center space-x-3">
                {isSuccess || i === 1 ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span className="text-sm font-medium text-slate-300">
                  Test Case 0{i}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorsTab({ status, stderr }: { status: string; stderr: string }) {
  if (status === "idle" || status === "running")
    return <Placeholder text="Nenhum erro detectado ainda." />;
  if (status === "success" && !stderr)
    return (
      <div className="h-full flex flex-col items-center justify-center text-emerald-400/80 space-y-4">
        <CheckCircle className="w-12 h-12" />
        <p>Excelente! Seu código passou sem erros.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          <div className="w-full">
            <h4 className="text-rose-400 font-medium mb-1">
              Execution / Syntax Error
            </h4>
            <p className="text-sm text-slate-300 font-mono bg-rose-950/30 p-2 rounded mt-2 border border-rose-900/50 w-full whitespace-pre-wrap">
              {stderr || "Unknown error occurred"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ analysis, status }: any) {
  if (status === "idle" || status === "running")
    return <Placeholder text="Aguardando execução para análise..." />;
  if (!analysis) return <Placeholder text="Análise não disponível." />;

  return (
    <div className="space-y-4">
      <AnalysisItem
        label="Complexidade Ciclomática"
        value={analysis.complexity_level || "Desconhecida"}
        good={analysis.complexity_level === "BAIXA"}
        warn={analysis.complexity_level !== "BAIXA"}
      />
      <AnalysisItem
        label="Qualidade da Estrutura"
        value={`${analysis.quality_score || 0}/100`}
        good={analysis.quality_score >= 80}
        warn={analysis.quality_score < 80}
      />
      <AnalysisItem
        label="Sintaxe"
        value={`${analysis.syntax_score || 0}/100`}
        good={analysis.syntax_score === 100}
        warn={analysis.syntax_score < 100}
      />

      {analysis.logic_issues && analysis.logic_issues.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-[#181824] border border-amber-800/50">
          <h4 className="text-sm font-semibold text-amber-300 mb-2">
            Problemas Lógicos
          </h4>
          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
            {analysis.logic_issues.map((issue: string, idx: number) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.quality_issues && analysis.quality_issues.length > 0 && (
        <div className="mt-6 p-4 rounded-lg bg-[#181824] border border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Sugestões de Qualidade
          </h4>
          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
            {analysis.quality_issues.map((issue: string, idx: number) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AnalysisItem({ label, value, good, warn }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#181824] border border-slate-800">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={cn(
          "text-sm font-medium px-2 py-0.5 rounded-full",
          good && "bg-emerald-500/10 text-emerald-400",
          warn && "bg-amber-500/10 text-amber-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FeedbackTab({ feedback, status }: any) {
  if (status === "idle" || status === "running")
    return <Placeholder text="Aguardando execução para gerar feedback..." />;
  if (!feedback) return <Placeholder text="Feedback não disponível." />;

  return (
    <div className="space-y-6" id="pedagogical-feedback-content">
      <div className="flex justify-between items-start">
        <div className="flex space-x-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-slate-200 font-medium mb-1">Resumo</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {feedback.summary || "Sem resumo."}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => exportHtmlToPDF("pedagogical-feedback-content", "Feedback Pedagógico", "feedback_pedagogico")}
          className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors border border-slate-700 flex-shrink-0"
          title="Exportar Feedback em PDF"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </button>
      </div>

      {feedback.strengths && feedback.strengths.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Pontos Fortes
          </h4>
          {feedback.strengths.map((str: string, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-sm text-emerald-200"
            >
              {str}
            </div>
          ))}
        </div>
      )}

      {feedback.improvements && feedback.improvements.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Pontos de Melhoria
          </h4>
          {feedback.improvements.map((imp: string, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-amber-200"
            >
              {imp}
            </div>
          ))}
        </div>
      )}

      {feedback.next_steps && feedback.next_steps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            Próximos Passos Recomendados
          </h4>
          {feedback.next_steps.map((step: string, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 cursor-pointer transition-colors group text-sm text-indigo-200"
            >
              {idx + 1}. {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-500 text-sm p-6 text-center">
      {text}
    </div>
  );
}
