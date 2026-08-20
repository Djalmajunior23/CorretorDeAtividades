import React, { useState } from "react";
import { ShieldAlert, Search, GitCompare, AlertTriangle, CheckCircle2, FileText, User } from "lucide-react";
import { toast } from "sonner";

interface PlagiarismDetectorModalProps {
  onClose: () => void;
}

export function PlagiarismDetectorModal({ onClose }: PlagiarismDetectorModalProps) {
  const [selectedClass, setSelectedClass] = useState("Turma A (Desenvolvimento Web)");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([
    {
      id: "p1",
      studentA: "Carlos Souza",
      studentB: "Lucas Oliveira",
      similarityScore: 92,
      matchedSnippet: "function calculateTotal(items) {\n  return items.reduce((acc, curr) => acc + curr.price * curr.qty, 0);\n}",
      activityName: "Desafio Prático de Arrays & Reducers",
      status: "Requer Investigação"
    },
    {
      id: "p2",
      studentA: "Mariana Costa",
      studentB: "Juliana Lima",
      similarityScore: 78,
      matchedSnippet: "const isPrime = (n) => {\n  if (n <= 1) return false;\n  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;\n  return true;\n};",
      activityName: "Algoritmos em JavaScript",
      status: "Alerta Moderado"
    }
  ]);

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.success("Análise estática de similaridade concluída com sucesso!");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Detector de Similaridade de Código (Anti-Plágio)</h3>
              <p className="text-xs text-slate-400">Identificação heurística de padrões estruturais idênticos entre submissões.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">Turma Alvo para Análise:</span>
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
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Varrendo Submissões...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Executar Varredura de Plágio
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Pares com Alta Similaridade Encontrados ({results.length})
            </h4>

            {results.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black font-mono">
                      {item.similarityScore}% Similaridade
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> {item.studentA} <span className="text-slate-500 font-normal">vs</span> <User className="w-3.5 h-3.5 text-purple-400" /> {item.studentB}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
                    Atividade: {item.activityName}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Trecho de Código Coincidente</span>
                  <pre className="p-3 bg-[#030712] rounded-xl border border-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto">
                    <code>{item.matchedSnippet}</code>
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {item.status}
                  </span>
                  <button
                    onClick={() => toast.success(`Relatório detalhado gerado para o par ${item.studentA} e ${item.studentB}.`)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Ver Comparativo Completo (Diff)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1e295b]/30 bg-[#161f36] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}
