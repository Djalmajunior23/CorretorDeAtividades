import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitPullRequest, 
  GitCommit, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Copy, 
  Play, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  RefreshCw,
  ExternalLink,
  Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  GitAutoGradingService, 
  AutoGradingExecutionResult, 
  GitWebhookPayload 
} from "../services/gitAutoGradingService";

export default function GitAutoGradingStudioView() {
  const [pipelineHistory, setPipelineHistory] = useState<AutoGradingExecutionResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AutoGradingExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "simulator" | "webhook_setup">("simulator");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Simulator Form State
  const [simProvider, setSimProvider] = useState<"github" | "gitlab">("github");
  const [simEventType, setSimEventType] = useState<"push" | "pull_request">("pull_request");
  const [simRepoName, setSimRepoName] = useState("senai-sistema-bancario-api");
  const [simBranch, setSimBranch] = useState("feature/transacoes-pix");
  const [simAuthorName, setSimAuthorName] = useState("Gabriel Monteiro Cruz");
  const [simAuthorUsername, setSimAuthorUsername] = useState("gabriel-cruz");
  const [simCommitMessage, setSimCommitMessage] = useState("feat: adiciona validacao de saldo e persistencia de transacoes");
  const [simPrNumber, setSimPrNumber] = useState(14);
  const [simCode, setSimCode] = useState(`/**
 * Módulo de Processamento de Transações PIX
 */
export function processarTransacaoPix(saldoAtual: number, valorTransferencia: number, chavePix: string): { status: string; novoSaldo: number } {
  if (valorTransferencia <= 0) {
    throw new Error("ValorInválido: O valor deve ser maior que zero.");
  }
  if (!chavePix || chavePix.trim().length === 0) {
    throw new Error("ChavePixInvalida");
  }
  if (saldoAtual < valorTransferencia) {
    throw new Error("SaldoInsuficiente: Operação não autorizada.");
  }

  const taxaOperacao = valorTransferencia > 5000 ? 2.50 : 0.00;
  const novoSaldo = Number((saldoAtual - valorTransferencia - taxaOperacao).toFixed(2));

  return {
    status: "TRANSACAO_CONCLUIDA",
    novoSaldo
  };
}`);

  useEffect(() => {
    const history = GitAutoGradingService.getMockPipelinesHistory();
    setPipelineHistory(history);
    if (history.length > 0) {
      setSelectedResult(history[0]);
    }
  }, []);

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const payload: GitWebhookPayload = {
        provider: simProvider,
        eventType: simEventType,
        repository: {
          name: simRepoName,
          url: `https://github.com/senai-turma-2026/${simRepoName}`,
          owner: "senai-tech"
        },
        branch: simBranch,
        commitHash: Math.random().toString(36).substring(2, 10),
        commitMessage: simCommitMessage,
        author: {
          name: simAuthorName,
          username: simAuthorUsername,
          email: `${simAuthorUsername}@aluno.senai.br`
        },
        pullRequestNumber: simEventType === "pull_request" ? simPrNumber : undefined,
        submissionCode: simCode,
        language: "typescript"
      };

      const result = await GitAutoGradingService.processWebhook(payload);
      setSelectedResult(result);
      setPipelineHistory(prev => [result, ...prev]);
      toast.success(`Pipeline executado! Nota: ${result.totalScore}/100`);
    } catch (err: any) {
      toast.error("Erro na execução do Auto-Grading: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedResult) return;
    setExportingPdf(true);
    try {
      const pdfBuffer = await GitAutoGradingService.generatePipelineReportPdf(selectedResult);
      const blob = new Blob([pdfBuffer as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_pipeline_${selectedResult.executionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Certificado de CI/CD em PDF exportado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar PDF: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const webhookEndpoint = "https://codecheck.senai.br/api/webhooks/github/grade";
  const webhookSecret = "sec_senai_auto_grading_2026_x89f";

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide uppercase">
              <GitBranch className="w-3.5 h-3.5" />
              GitOps & CI/CD Auto-Grading Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Integração GitHub & GitLab CI/CD
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Auditoria contínua de código para squads e projetos práticos. Conecte webhooks aos repositórios dos estudantes: a cada <code className="text-emerald-400 font-mono">git push</code> ou <code className="text-emerald-400 font-mono">Pull Request</code>, os testes rodam e o parecer da IA é publicado automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedResult && (
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {exportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-400" />
                )}
                Exportar Laudo CI/CD PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "simulator"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Simulador de Push & Pull Request
        </button>

        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "feed"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" /> Feed de Commits da Turma ({pipelineHistory.length})
        </button>

        <button
          onClick={() => setActiveTab("webhook_setup")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "webhook_setup"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> Configuração do Webhook & Secret
        </button>
      </div>

      {/* Tab 1: Webhook Simulator */}
      {activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simulator Form */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Play className="w-4 h-4" /> Parâmetros do Evento Git
                </span>
                <span className="text-[10px] font-mono text-slate-500">Simulador de Entrega</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Provedor Git</label>
                    <select
                      value={simProvider}
                      onChange={(e: any) => setSimProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    >
                      <option value="github">GitHub</option>
                      <option value="gitlab">GitLab</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Tipo de Evento</label>
                    <select
                      value={simEventType}
                      onChange={(e: any) => setSimEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    >
                      <option value="pull_request">Pull Request (PR)</option>
                      <option value="push">Direct Git Push</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nome do Repositório</label>
                    <input
                      type="text"
                      value={simRepoName}
                      onChange={(e) => setSimRepoName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Branch de Destino</label>
                    <input
                      type="text"
                      value={simBranch}
                      onChange={(e) => setSimBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nome do Aluno</label>
                    <input
                      type="text"
                      value={simAuthorName}
                      onChange={(e) => setSimAuthorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Username GitHub</label>
                    <input
                      type="text"
                      value={simAuthorUsername}
                      onChange={(e) => setSimAuthorUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Mensagem de Commit</label>
                  <input
                    type="text"
                    value={simCommitMessage}
                    onChange={(e) => setSimCommitMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Código Modificado no Commit (TypeScript / JS)</label>
                  <textarea
                    rows={8}
                    value={simCode}
                    onChange={(e) => setSimCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs resize-none scrollbar-thin"
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-slate-950" />
                  )}
                  Disparar Webhook & Executar CI/CD Auto-Grading
                </button>
              </div>
            </div>
          </div>

          {/* Result Inspector */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {selectedResult ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-5">
                
                {/* Score & Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
                        selectedResult.totalScore >= 70
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}>
                        STATUS: {selectedResult.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{selectedResult.buildDurationMs}ms</span>
                    </div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Github className="w-4 h-4 text-slate-400" /> {selectedResult.repoName} ({selectedResult.branch})
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black text-white font-mono">{selectedResult.totalScore}<span className="text-sm text-slate-500 font-normal">/100</span></div>
                    <span className="text-[10px] font-mono text-slate-400">Score Consolidado</span>
                  </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Testes Unitários</span>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {selectedResult.testResults.passed} / {selectedResult.testResults.total} OK
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Clean Code</span>
                    <div className="text-sm font-bold font-mono text-indigo-400">
                      {selectedResult.linterResults.cleanCodeScore} / 100
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Complexidade</span>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      Grau {selectedResult.linterResults.cyclomaticComplexity}
                    </div>
                  </div>
                </div>

                {/* Test Cases Table */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Resultados da Suíte de Testes
                  </span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
                    {selectedResult.testResults.cases.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className={t.passed ? "text-slate-200" : "text-red-300"}>{t.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{t.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated PR Comment Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <GitPullRequest className="w-4 h-4 text-emerald-400" /> Parecer Publicado na Pull Request
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedResult.simulatedPrCommentMarkdown);
                        toast.success("Markdown do PR copiado!");
                      }}
                      className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar Markdown
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[180px] scrollbar-thin whitespace-pre-wrap">
                    {selectedResult.simulatedPrCommentMarkdown}
                  </pre>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900/50 text-center text-slate-500">
                Execute uma simulação ao lado para ver o relatório de CI/CD.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Commit Feed */}
      {activeTab === "feed" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Histórico Recente de Commits & Pull Requests Recebidos
            </span>
            <span className="text-[10px] font-mono text-slate-500">{pipelineHistory.length} Execuções Registradas</span>
          </div>

          <div className="space-y-2">
            {pipelineHistory.map((item) => (
              <div
                key={item.executionId}
                onClick={() => {
                  setSelectedResult(item);
                  setActiveTab("simulator");
                }}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    item.totalScore >= 70 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {item.totalScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.authorName}</span>
                      <span className="text-[10px] font-mono text-slate-500">@{item.authorUsername}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.branch}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.commitMessage}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>{item.testResults.passed}/{item.testResults.total} Testes OK</span>
                  <span>{new Date(item.executedAt).toLocaleTimeString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Webhook Setup */}
      {activeTab === "webhook_setup" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-6 max-w-4xl">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">Como Configurar o Webhook no Repositório do Estudante</h2>
            <p className="text-xs text-slate-400 mt-1">Siga o passo a passo abaixo no GitHub ou GitLab para ativar a autocorreção em tempo real.</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-2">
              <span className="font-bold text-slate-300 font-mono">1. Payload URL do Webhook</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookEndpoint}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookEndpoint);
                    toast.success("URL copiada!");
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 font-mono">2. Secret Token de Assinatura HMAC</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookSecret}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookSecret);
                    toast.success("Secret copiado!");
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300 font-mono">3. Eventos Recomendados</span>
              <ul className="space-y-1">
                <li>• Marque <strong className="text-slate-200 font-mono">Pushes</strong> (dispara a cada envio de código).</li>
                <li>• Marque <strong className="text-slate-200 font-mono">Pull requests</strong> (avalia PRs antes do merge).</li>
                <li>• Selecione Content type como <strong className="text-slate-200 font-mono">application/json</strong>.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
