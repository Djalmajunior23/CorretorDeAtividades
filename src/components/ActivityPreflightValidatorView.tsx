import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Sparkles, 
  Send,
  FileCheck,
  Zap,
  Info
} from "lucide-react";
import { ActivityValidatorService, ActivityValidationReport } from "../services/activityValidatorService";

export default function ActivityPreflightValidatorView() {
  const [title, setTitle] = useState("Soma de Números Pares com Filtro");
  const [statement, setStatement] = useState("Desenvolva uma função em Python chamada 'somar_pares(n)' que receba um número inteiro positivo N e retorne a soma de todos os números pares de 1 até N inclusive. Para n <= 0, retorne 0.");
  const [language, setLanguage] = useState("python");
  const [referenceSolution, setReferenceSolution] = useState("def somar_pares(n):\n    if n <= 0: return 0\n    return sum(i for i in range(2, n + 1, 2))");
  const [testCasesInput, setTestCasesInput] = useState(
    JSON.stringify([
      { id: "tc-1", input: "10", expectedOutput: "30", isPrivate: false },
      { id: "tc-2", input: "5", expectedOutput: "6", isPrivate: false },
      { id: "tc-3", input: "0", expectedOutput: "0", isPrivate: true },
      { id: "tc-4", input: "100", expectedOutput: "2550", isPrivate: true }
    ], null, 2)
  );

  const [rubricInput, setRubricInput] = useState(
    JSON.stringify([
      { id: "r-1", name: "Sintaxe e Estrutura", weight: 30, description: "Indentação e boas práticas" },
      { id: "r-2", name: "Lógica e Algoritmo", weight: 40, description: "Cálculo correto do somatório par" },
      { id: "r-3", name: "Casos Limite", weight: 30, description: "Tratamento de zero e números grandes" }
    ], null, 2)
  );

  const [isValidating, setIsValidating] = useState(false);
  const [report, setReport] = useState<ActivityValidationReport | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Invalidate previous report whenever authoring parameters are modified
  const handleParamChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (report) {
      setReport(null);
      setPublishSuccess(false);
      setPublishError(null);
    }
  };

  // Compute current digest to detect if inputs have changed since last validation
  const currentDigest = useMemo(() => {
    try {
      const tc = JSON.parse(testCasesInput);
      const rb = JSON.parse(rubricInput);
      return ActivityValidatorService.computeDigest({
        title,
        statement,
        language,
        referenceSolution,
        testCases: tc,
        rubric: rb
      });
    } catch {
      return "invalid_json";
    }
  }, [title, statement, language, referenceSolution, testCasesInput, rubricInput]);

  const isReportStale = report && report.paramsDigest !== currentDigest;

  const handleRunValidation = async () => {
    setIsValidating(true);
    setPublishSuccess(false);
    setPublishError(null);

    try {
      const parsedTestCases = JSON.parse(testCasesInput);
      const parsedRubric = JSON.parse(rubricInput);

      const res = await ActivityValidatorService.validateActivity({
        title,
        statement,
        language,
        starterCode: "def somar_pares(n):\n    pass",
        referenceSolution,
        testCases: parsedTestCases,
        rubric: parsedRubric,
        maxAttempts: 3
      });

      setReport(res);
    } catch (e: any) {
      alert(`Erro no formato JSON dos testes ou rubrica: ${e.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePublish = () => {
    setPublishError(null);
    if (!report) {
      setPublishError("Execute a validação automatizada antes de publicar.");
      return;
    }

    if (isReportStale) {
      setPublishError("Os parâmetros da atividade foram modificados após a última verificação. Execute a validação novamente para certificar a versão atual.");
      return;
    }

    if (!report.isValidForPublishing) {
      setPublishError("Não é possível publicar: resolva todos os bloqueios críticos detectados no laudo de validação.");
      return;
    }

    setPublishSuccess(true);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1628] to-[#040817] border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              QA PEDAGÓGICO PRÉ-PUBLICAÇÃO
            </span>
            <span className="text-xs text-slate-400 font-mono">• Test-Drive Automatizado & Validação Rígida</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Validador de Atividades & Provas
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Execute a solução de referência do professor no Sandbox isolado, verifique coerência dos pesos da rubrica e execute a bateria de testes mutantes antes de disponibilizar para a turma.
          </p>
        </div>

        <button
          disabled={isValidating}
          onClick={handleRunValidation}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          {isValidating ? "Executando Bateria QA..." : "Executar Validador"}
        </button>
      </div>

      {publishSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">Atividade homologada e publicada com sucesso! Versão v1.1 registrada no repositório.</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Laudo vinculativo: {report?.executionId} • Digest: {report?.paramsDigest}</div>
          </div>
        </div>
      )}

      {publishError && (
        <div className="p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      {/* Stale report warning banner */}
      {isReportStale && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span><strong>Atenção:</strong> Parâmetros alterados! O laudo anterior foi invalidado. Clique em <strong>"Executar Validador"</strong> para revalidar com os dados atuais.</span>
        </div>
      )}

      {/* Main Grid: Left side Authoring Inputs | Right side QA Diagnostic Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs for Title, Statement, Reference Solution, Tests, Rubric */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Parâmetros da Atividade
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Título da Atividade:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleParamChange(setTitle, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Enunciado e Restrições:</label>
              <textarea
                rows={3}
                value={statement}
                onChange={(e) => handleParamChange(setStatement, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>Gabarito Oficial (Solução de Referência do Docente):</span>
                <span className="text-[10px] text-emerald-400">Deve passar em 100% dos testes</span>
              </label>
              <textarea
                rows={5}
                value={referenceSolution}
                onChange={(e) => handleParamChange(setReferenceSolution, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">Casos de Teste (JSON):</label>
                <textarea
                  rows={6}
                  value={testCasesInput}
                  onChange={(e) => handleParamChange(setTestCasesInput, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">Critérios da Rubrica (JSON):</label>
                <textarea
                  rows={6}
                  value={rubricInput}
                  onChange={(e) => handleParamChange(setRubricInput, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Validation Diagnostic Results */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#090e21] border border-slate-800 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Laudo de Verificação Automatizada
                </h3>
                {report && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ID: {report.executionId} • {new Date(report.validatedAt).toLocaleTimeString("pt-BR")}
                  </span>
                )}
              </div>
              {report && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  report.isValidForPublishing && !isReportStale
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}>
                  {report.isValidForPublishing && !isReportStale ? "APTO PARA PUBLICAÇÃO" : "BLOQUEIOS ENCONTRADOS"}
                </span>
              )}
            </div>

            {report ? (
              <div className="flex flex-col gap-4">
                {/* Provenance badge */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Ambiente do Executor:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {report.environment === "SANDBOX_ISOLATED_VERIFIED"
                      ? `[VERIFICADO: ${report.executionEngine}]`
                      : `[SIMULADO EM CLIENTE: ${report.executionEngine}]`}
                  </span>
                </div>

                {/* Summary counters */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center">
                    <span className="text-lg font-bold text-emerald-400 font-mono">{report.summary.passedCount}</span>
                    <span className="text-[10px] text-emerald-300 font-mono uppercase">Aprovados</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center">
                    <span className="text-lg font-bold text-amber-400 font-mono">{report.summary.warningCount}</span>
                    <span className="text-[10px] text-amber-300 font-mono uppercase">Alertas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center">
                    <span className="text-lg font-bold text-rose-400 font-mono">{report.summary.failedCount}</span>
                    <span className="text-[10px] text-rose-300 font-mono uppercase">Erros Críticos</span>
                  </div>
                </div>

                {/* Detailed Checklist */}
                <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {report.checks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1 ${
                        check.status === "PASSED"
                          ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                          : check.status === "WARNING"
                            ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-2">
                          {check.status === "PASSED" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {check.status === "WARNING" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                          {check.status === "FAILED" && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                          <span>{check.title || check.category}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {check.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 pl-6">{check.message}</p>
                      {check.details && (
                        <p className="text-[10px] text-slate-400 pl-6 whitespace-pre-line font-mono">{check.details}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Granular Mutant Test Variants Breakdown */}
                {report.mutantVariants && report.mutantVariants.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Detalhamento das Variantes Mutantes:
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {report.mutantVariants.filter(m => m.status === "KILLED").length}/{report.mutantVariants.length} Eliminados
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {report.mutantVariants.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-lg border text-[11px] flex flex-col gap-1 ${
                            m.status === "KILLED"
                              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                              : "bg-amber-950/20 border-amber-500/30 text-amber-300"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold font-mono text-[10px]">
                            <span>{m.name}</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              m.status === "KILLED" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                            }`}>
                              {m.status === "KILLED" ? "ELIMINADO" : "SOBREVIVEU"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{m.description}</p>
                          {m.killedByTest && (
                            <span className="text-[9px] text-slate-400 font-mono">Rejeitado por: {m.killedByTest}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publication CTA */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    Versão Atual: {report.currentVersion} ➔ Nova: {report.newVersionProposed}
                  </span>
                  <button
                    disabled={!report.isValidForPublishing || Boolean(isReportStale)}
                    onClick={handlePublish}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
                      report.isValidForPublishing && !isReportStale
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publicar Versão Oficial
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 gap-2">
                <FileCheck className="w-10 h-10 text-slate-600" />
                <span className="text-xs font-bold text-slate-400">Nenhuma verificação executada</span>
                <p className="text-[11px]">Clique em "Executar Validador" para testar o gabarito oficial e a coerência da rubrica.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
