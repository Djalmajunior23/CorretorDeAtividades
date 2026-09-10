import React, { useState } from "react";
import {
  Cpu,
  Zap,
  Play,
  FileDown,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Terminal,
  Activity,
  HardDrive
} from "lucide-react";
import { toast } from "sonner";
import {
  SandboxExecutionResult,
  WasmRuntimeLanguage,
  TestCaseAssertion,
  WasmSandboxService
} from "../services/wasmSandboxService";

const SAMPLE_WASM_CODE = `// QuickSort Otimizado para Compilação WebAssembly Linear Memory
export function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left: number[] = [];
  const middle: number[] = [];
  const right: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (val < pivot) {
      left.push(val);
    } else if (val === pivot) {
      middle.push(val);
    } else {
      right.push(val);
    }
  }

  return [...quickSort(left), ...middle, ...quickSort(right)];
}`;

export const WasmSandboxRuntimeView: React.FC = () => {
  const [language, setLanguage] = useState<WasmRuntimeLanguage>("typescript");
  const [code, setCode] = useState(SAMPLE_WASM_CODE);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SandboxExecutionResult | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [testCases, setTestCases] = useState<TestCaseAssertion[]>([
    { id: "tc_1", name: "Array Desordenado Padrão", input: "[9, 3, 7, 1, 4, 8, 2]", expectedOutput: "[1, 2, 3, 4, 7, 8, 9]" },
    { id: "tc_2", name: "Array com Duplicados", input: "[5, 5, 2, 8, 2, 5]", expectedOutput: "[2, 2, 5, 5, 5, 8]" },
    { id: "tc_3", name: "Array Já Ordenado", input: "[10, 20, 30]", expectedOutput: "[10, 20, 30]" }
  ]);

  const handleExecuteWasm = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/wasm-sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, testCases })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          setResult(data.result);
          toast.success("Execução Wasm concluída em " + data.result.runtimeMs + "ms!");
          return;
        }
      }

      const fallbackResult = await WasmSandboxService.executeCode({ language, code, testCases });
      setResult(fallbackResult);
      toast.success("Execução Wasm concluída via runtime local!");
    } catch (err: any) {
      const fallbackResult = await WasmSandboxService.executeCode({ language, code, testCases });
      setResult(fallbackResult);
      toast.success("Execução Wasm concluída com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!result) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/wasm-sandbox/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await WasmSandboxService.generateWasmReportPdf(result);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_wasm_${result.executionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Laudo Wasm baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-teal-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-400" /> Wasm In-Browser Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Zero-Server Latency & Offline First
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            WebAssembly Micro-VM Sandbox & Real-Time Runtime
          </h1>
          <p className="text-slate-400 text-sm">
            Execução de código instantânea no navegador em micro-VM isolada, telemetria de memória linear e profiling de instruções.
          </p>
        </div>

        {result && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Laudo..." : "Exportar Benchmark (PDF)"}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Editor & Setup */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" /> Código-Fonte do Algoritmo
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++ (Wasm)</option>
                  <option value="rust">Rust (Wasm)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_WASM_CODE)}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500/50 leading-relaxed"
              placeholder="// Escreva o código para compilação e execução Wasm..."
            />

            <button
              onClick={handleExecuteWasm}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Compilando & Executando na Micro-VM Wasm...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Executar Instantaneamente (Zero-Latency Wasm)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Telemetry & Results */}
        <div className="lg:col-span-6 space-y-4">
          {!result && !isLoading && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <Cpu className="w-14 h-14 text-teal-400/40 mb-3" />
              <h3 className="text-base font-semibold text-slate-200 mb-1">Micro-VM em Standby</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Clique em Executar para compilar e rodar os testes unitários diretamente na memória linear do navegador.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Telemetry Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                    <Activity className="w-3 h-3 text-teal-400" /> Latência Wasm
                  </span>
                  <div className="text-2xl font-extrabold text-teal-400 mt-1">{result.runtimeMs} ms</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                    <HardDrive className="w-3 h-3 text-blue-400" /> Memória Linear
                  </span>
                  <div className="text-2xl font-extrabold text-blue-400 mt-1">{result.memoryAllocatedKb} KB</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Wasm Score
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">{result.wasmOptimizatonScore}/100</div>
                </div>
              </div>

              {/* Test Cases Results */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                  <span>Resultados dos Casos de Teste</span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {result.assertionsPassed} / {result.totalAssertions} Aprovados
                  </span>
                </h3>

                <div className="space-y-2">
                  {result.testCases.map((tc) => (
                    <div key={tc.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{tc.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${tc.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                          {tc.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {tc.passed ? "PASSED" : "FAILED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">Input: {tc.input}</div>
                      <div className="text-[11px] text-emerald-300/80 font-mono">Output: {tc.actualOutput}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Otimizações Recomendadas:</h4>
                {result.aiOptimizationAdvice.map((adv, i) => (
                  <p key={i} className="text-xs text-teal-300/90 flex items-start gap-1.5">
                    <span className="text-teal-400 font-bold">✓</span> {adv}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WasmSandboxRuntimeView;
