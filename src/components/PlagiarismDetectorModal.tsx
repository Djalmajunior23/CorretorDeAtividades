import React, { useState } from "react";
import { ShieldAlert, Search, GitCompare, AlertTriangle, CheckCircle2, FileText, User, Cpu, Code, Layers, Sparkles, Terminal } from "lucide-react";
import { toast } from "sonner";

interface PlagiarismDetectorModalProps {
  onClose: () => void;
}

export function PlagiarismDetectorModal({ onClose }: PlagiarismDetectorModalProps) {
  const [selectedClass, setSelectedClass] = useState("Turma A (Desenvolvimento Web)");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pairs" | "ast_inspector">("pairs");
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [results, setResults] = useState<any[]>([
    {
      id: "p1",
      studentA: "Carlos Souza",
      studentB: "Lucas Oliveira",
      similarityScore: 96,
      astMatchType: "Estrutura Sintática Idêntica (Renomeação de Variáveis Detectada)",
      codeA: "function calculateTotal(items) {\n  let total = 0;\n  for(let i=0; i<items.length; i++) {\n    total += items[i].price * items[i].qty;\n  }\n  return total;\n}",
      codeB: "function calcSum(produtos) {\n  let acc = 0;\n  for(let j=0; j<produtos.length; j++) {\n    acc += produtos[j].price * produtos[j].qty;\n  }\n  return acc;\n}",
      activityName: "Desafio Prático de Arrays & Reducers",
      status: "Plágio Estrutural Confirmado (AST Match)",
      astTreeA: [
        { type: "Program", children: 1 },
        { type: "FunctionDeclaration", name: "calculateTotal", params: ["items"] },
        { type: "VariableDeclaration", name: "total", init: "0" },
        { type: "ForStatement", init: "let i=0", test: "i<items.length", update: "i++" },
        { type: "AssignmentExpression", operator: "+=", left: "total", right: "items[i].price * items[i].qty" },
        { type: "ReturnStatement", argument: "total" }
      ],
      astTreeB: [
        { type: "Program", children: 1 },
        { type: "FunctionDeclaration", name: "calcSum", params: ["produtos"] },
        { type: "VariableDeclaration", name: "acc", init: "0" },
        { type: "ForStatement", init: "let j=0", test: "j<produtos.length", update: "j++" },
        { type: "AssignmentExpression", operator: "+=", left: "acc", right: "produtos[j].price * produtos[j].qty" },
        { type: "ReturnStatement", argument: "acc" }
      ]
    },
    {
      id: "p2",
      studentA: "Mariana Costa",
      studentB: "Juliana Lima",
      similarityScore: 89,
      astMatchType: "Árvore de Sintaxe Abstrata Equivalente (Troca de Ordem de Condicionais)",
      codeA: "const isPrime = (n) => {\n  if (n <= 1) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) {\n    if (n % i === 0) return false;\n  }\n  return true;\n};",
      codeB: "const checkPrimo = (val) => {\n  for (let k = 2; k <= Math.sqrt(val); k++) {\n    if (val % k === 0) return false;\n  }\n  if (val <= 1) return false;\n  return true;\n};",
      activityName: "Algoritmos em JavaScript",
      status: "Alta Similaridade Lógica (AST)",
      astTreeA: [
        { type: "ArrowFunctionExpression", params: ["n"] },
        { type: "IfStatement", test: "n <= 1", consequent: "return false" },
        { type: "ForStatement", init: "i=2", test: "i<=Math.sqrt(n)", update: "i++" },
        { type: "IfStatement", test: "n%i===0", consequent: "return false" },
        { type: "ReturnStatement", argument: "true" }
      ],
      astTreeB: [
        { type: "ArrowFunctionExpression", params: ["val"] },
        { type: "ForStatement", init: "k=2", test: "k<=Math.sqrt(val)", update: "k++" },
        { type: "IfStatement", test: "val%k===0", consequent: "return false" },
        { type: "IfStatement", test: "val <= 1", consequent: "return false" },
        { type: "ReturnStatement", argument: "true" }
      ]
    }
  ]);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.success("Análise de similaridade baseada em AST (Abstract Syntax Trees) concluída!");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Detector de Plágio Avançado por AST (Abstract Syntax Trees)</h3>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                  Resistente a Refatoração Superficial & Renomeação
                </span>
              </div>
              <p className="text-xs text-slate-400">Compara a árvore lógica de nós sintáticos do código em vez de apenas texto bruto.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-3 py-1.5 rounded-lg bg-slate-800 transition-all cursor-pointer">✕</button>
        </div>

        {/* Toolbar & Filter */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">Turma Alvo:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="Turma A (Desenvolvimento Web)">Turma A (Desenvolvimento Web)</option>
              <option value="Turma B (Estrutura de Dados)">Turma B (Estrutura de Dados)</option>
              <option value="Turma C (Banco de Dados SQL)">Turma C (Banco de Dados SQL)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setActiveTab("pairs")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "pairs" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                Pares Suspeitos ({results.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("ast_inspector");
                  if (!selectedPair) setSelectedPair(results[0]);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === "ast_inspector" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                Inspetor AST & Árvores Lógicas
              </button>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando Árvores AST...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Executar Varredura AST
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "pairs" ? (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Resultados da Análise Estrutural por Árvore de Sintaxe Abstrata (AST)
              </h4>

              {results.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black font-mono">
                        {item.similarityScore}% AST Match
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" /> {item.studentA} <span className="text-slate-500 font-normal">vs</span> <User className="w-3.5 h-3.5 text-purple-400" /> {item.studentB}
                      </span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-mono">
                      {item.astMatchType}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Código de {item.studentA}</span>
                      <pre className="p-3 bg-[#030712] rounded-xl border border-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto h-28">
                        <code>{item.codeA}</code>
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Código de {item.studentB} (Variáveis Renomeadas)</span>
                      <pre className="p-3 bg-[#030712] rounded-xl border border-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto h-28">
                        <code>{item.codeB}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {item.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedPair(item);
                        setActiveTab("ast_inspector");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Inspecionar Nós AST & Equivalência
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white uppercase block">Visualizador de Nós AST Comparativos</span>
                    <span className="text-[11px] text-slate-400">Analisando a equivalência dos nós sintáticos entre os estudantes selecionados.</span>
                  </div>
                </div>
                <select
                  value={selectedPair?.id || results[0].id}
                  onChange={(e) => {
                    const found = results.find(r => r.id === e.target.value);
                    if (found) setSelectedPair(found);
                  }}
                  className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {results.map(r => (
                    <option key={r.id} value={r.id}>{r.studentA} vs {r.studentB} ({r.similarityScore}%)</option>
                  ))}
                </select>
              </div>

              {selectedPair && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Student A AST */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        Árvore AST: {selectedPair.studentA}
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                        {selectedPair.astTreeA.length} Nós Lógicos
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedPair.astTreeA.map((node: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs flex items-center justify-between">
                          <span className="text-emerald-400 font-bold">{node.type}</span>
                          <span className="text-slate-400 text-[11px]">
                            {node.name ? `name: ${node.name}` : node.test ? `test: ${node.test}` : node.operator ? `op: ${node.operator}` : "root"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Student B AST */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-mono font-bold text-purple-300">
                        Árvore AST: {selectedPair.studentB}
                      </span>
                      <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
                        {selectedPair.astTreeB.length} Nós Lógicos (Equivalentes)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedPair.astTreeB.map((node: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-xs flex items-center justify-between">
                          <span className="text-purple-400 font-bold">{node.type}</span>
                          <span className="text-slate-400 text-[11px]">
                            {node.name ? `name: ${node.name}` : node.test ? `test: ${node.test}` : node.operator ? `op: ${node.operator}` : "root"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlagiarismDetectorModal;
