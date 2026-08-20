import React, { useState } from "react";
import { Sparkles, Terminal, Copy, CheckCircle2, Code, FileCode, Play } from "lucide-react";
import { toast } from "sonner";

interface UnitTestGeneratorModalProps {
  onClose: () => void;
}

export function UnitTestGeneratorModal({ onClose }: UnitTestGeneratorModalProps) {
  const [problemDescription, setProblemDescription] = useState("Crie uma função que receba uma lista de números e retorne apenas os números primos ordenados de forma crescente.");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("jest");
  const [generating, setGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<string>(`describe('Testes Unitários - Números Primos', () => {
  test('deve retornar números primos corretamente', () => {
    const input = [1, 2, 3, 4, 5, 10, 11, 13];
    expect(getPrimes(input)).toEqual([2, 3, 5, 11, 13]);
  });

  test('deve retornar array vazio se não houver primos', () => {
    expect(getPrimes([4, 6, 8, 9])).toEqual([]);
  });
});`);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedTests(`// Gerado automaticamente via Gateway de IA (${framework.toUpperCase()})\ndescribe('Testes Unitários - Validação de Algoritmo', () => {\n  test('caso base com dados normais', () => {\n    const result = executeSolution([10, 20, 30]);\n    expect(result).toBeDefined();\n  });\n\n  test('tratamento de entradas vazias ou inválidas', () => {\n    expect(() => executeSolution(null)).toThrow();\n  });\n});`);
      toast.success("Suíte de testes unitários gerada com sucesso!");
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedTests);
    toast.success("Código de testes copiado para a área de transferência!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-[#1e295b]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-[#1e295b]/30 bg-[#161f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">Gerador Automático de Testes Unitários (IA)</h3>
              <p className="text-xs text-slate-400">Gere suítes robustas de testes em Jest ou PyTest a partir do enunciado.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1 rounded-lg bg-slate-800">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200">Linguagem</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="javascript">JavaScript / TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-200">Framework de Testes</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="bg-[#030712] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="jest">Jest (JS/TS)</option>
                <option value="pytest">PyTest (Python)</option>
                <option value="junit">JUnit (Java)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-200">Enunciado / Descrição do Problema</label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              className="bg-[#030712] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sintetizando Testes com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Suíte de Testes Unitários
              </>
            )}
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                Código Gerado ({framework.toUpperCase()})
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </button>
            </div>

            <pre className="p-4 bg-[#030712] rounded-2xl border border-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[220px] leading-relaxed">
              <code>{generatedTests}</code>
            </pre>
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
