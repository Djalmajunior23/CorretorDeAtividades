import React, { useState } from "react";
import {
  FlaskConical,
  Bug,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Code2,
  HelpCircle,
  Target
} from "lucide-react";
import { toast } from "sonner";
import {
  MutationTestingService,
  MutationTestingReport,
  CodeMutant
} from "../services/mutationTestingService";

export default function MutationTestingLabView() {
  const [studentName, setStudentName] = useState("Gabriel Martins");
  const [language, setLanguage] = useState("python");

  const [code, setCode] = useState(
    `def calcular_desconto(preco: float, cupom: str, qtd: int) -> float:
    if preco <= 0 or qtd <= 0:
        return 0.0
    desconto = 0.0
    if cupom == "SENAI10" and qtd >= 5:
        desconto = preco * 0.10
    elif cupom == "VIP20":
        desconto = preco * 0.20
    return preco - desconto`
  );

  const [testSuite, setTestSuite] = useState(
    `import unittest

class TestDesconto(unittest.TestCase):
    def test_cupom_vip(self):
        self.assertEqual(calcular_desconto(100.0, "VIP20", 1), 80.0)

    def test_preco_invalido(self):
        self.assertEqual(calcular_desconto(0.0, "VIP20", 1), 0.0)

    def test_cupom_senai_com_qtd(self):
        self.assertEqual(calcular_desconto(100.0, "SENAI10", 6), 90.0)`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [report, setReport] = useState<MutationTestingReport | null>(null);

  const handleRunMutationTesting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mutation-testing/run-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          code,
          testSuite,
          language
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        toast.success(`Testes de Mutação executados! Score: ${data.report.mutationScore}%`);
      } else {
        throw new Error(data.error || "Falha na execução.");
      }
    } catch {
      const fallbackReport = await MutationTestingService.runMutationTesting({
        studentName,
        code,
        testSuite,
        language
      });
      setReport(fallbackReport);
      toast.info("Testes de mutação sintetizados via motor heurístico.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/mutation-testing/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_mutation_testing_${report.studentName.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Laudo de Testes de Mutação baixado em PDF!");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-cyan-950/70 border border-blue-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <FlaskConical className="w-3.5 h-3.5" />
              TDD & Mutation Testing Lab
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Bug className="w-8 h-8 text-blue-400" />
              Automated Mutation Testing & TDD Lab
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Injeção controlada de mutantes sintáticos para avaliar a eficácia real da sua suíte de testes unitários. Descubra quais casos de borda e regressões seu código deixou passar calculando o <span className="text-blue-400 font-semibold">Mutation Score %</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {report && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-slate-950 font-bold text-xs hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Laudo Mutation PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudante / Autor da Suíte</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linguagem</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="python">Python (unittest/pytest)</option>
              <option value="typescript">TypeScript (vitest/jest)</option>
              <option value="javascript">JavaScript (mocha)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-1.5 mb-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-400" /> Código da Função em Teste
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={9}
              className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-3.5 text-xs font-mono text-emerald-300 resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-1.5 mb-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> Suíte de Testes Unitários
            </label>
            <textarea
              value={testSuite}
              onChange={(e) => setTestSuite(e.target.value)}
              rows={9}
              className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-3.5 text-xs font-mono text-cyan-300 resize-none focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunMutationTesting}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Injetar Mutantes & Executar Suíte TDD
          </button>
        </div>
      </div>

      {/* Mutation Testing Report Output */}
      {report && (
        <div className="space-y-6">
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            {/* Score Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Resultado dos Testes de Mutação</span>
                <h2 className="text-2xl font-black text-white mt-1">{report.tddMaturityLevel}</h2>
                <div className="text-xs text-slate-400 mt-1">Estudante: {report.studentName} • ID: {report.reportId}</div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 p-4 rounded-2xl">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Mutation Score</div>
                  <div className="text-xs font-bold text-emerald-400">{report.killedMutants} de {report.totalMutants} mutantes mortos</div>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-blue-500/30">
                  {report.mutationScore}%
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-semibold text-emerald-400">Mutantes Eliminados (Killed)</div>
                <div className="text-2xl font-black text-white">{report.killedMutants}</div>
                <div className="text-[11px] text-slate-400">Testes detectaram a mutação corretamente</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                <div className="text-xs font-semibold text-rose-400">Mutantes Sobreviventes (Survived)</div>
                <div className="text-2xl font-black text-white">{report.survivedMutants}</div>
                <div className="text-[11px] text-slate-400">Lacuna nos testes unitários</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-slate-400">Total de Mutantes Sintetizados</div>
                <div className="text-2xl font-black text-white">{report.totalMutants}</div>
                <div className="text-[11px] text-slate-400">Operadores relacionais e de retorno</div>
              </div>
            </div>

            {/* Pedagogical Guidance */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Diagnóstico Pedagógico do Instrutor de TDD
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{report.pedagogicalRecommendations}</p>
            </div>

            {/* Mutants Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Detalhamento dos Mutantes Injetados no Código ({report.mutants.length})
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.mutants.map((m) => {
                  const isKilled = m.status === "KILLED";
                  return (
                    <div key={m.id} className="p-4 rounded-xl bg-[#040815] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          {isKilled ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                          Linha {m.line} • {m.description}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isKilled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                        }`}>
                          {m.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          Original: <span className="text-slate-200">{m.originalSnippet}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-950 border border-slate-800 text-rose-300">
                          Mutado: <span className="text-rose-400">{m.mutatedSnippet}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 pt-1">
                        {isKilled ? `✓ Eliminado por: ${m.killedByTest}` : `⚠ Causa da Sobrevivência: ${m.survivedReason}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missing Edge Cases */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Casos de Teste Ausentes Recomendados para Eliminar Mutantes
              </div>
              <ul className="space-y-1">
                {report.missingEdgeCasesIdentified.map((gap, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
