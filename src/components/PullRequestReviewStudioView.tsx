import React, { useState } from "react";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Download,
  Code2,
  Shield,
  Zap,
  Play,
  RefreshCw,
  GitBranch,
  GitCommit,
  GitMerge,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import {
  PullRequestReviewService,
  PullRequest
} from "../services/pullRequestReviewService";

export default function PullRequestReviewStudioView() {
  const [prTitle, setPrTitle] = useState("feat(orders): refactor order processing pipeline with async validation");
  const [authorName, setAuthorName] = useState("Lucas Silveira");
  const [branchSource, setBranchSource] = useState("feature/order-pipeline-v2");
  const [branchTarget, setBranchTarget] = useState("main");
  const [language, setLanguage] = useState("typescript");

  const [originalCode, setOriginalCode] = useState(
    `function processOrder(order: any) {
  if (order.total > 0) {
    if (order.items.length > 0) {
      db.query("INSERT INTO orders VALUES ('" + order.id + "', " + order.total + ")");
      return { success: true };
    } else {
      return { error: "No items" };
    }
  }
  return { error: "Invalid total" };
}`
  );

  const [modifiedCode, setModifiedCode] = useState(
    `import { z } from "zod";

const OrderSchema = z.object({
  id: z.string().uuid(),
  total: z.number().positive(),
  items: z.array(z.string()).nonempty()
});

export async function processOrder(rawOrder: unknown, orderRepo: OrderRepository) {
  const order = OrderSchema.parse(rawOrder);
  await orderRepo.save(order);
  return { success: true, orderId: order.id };
}`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activePR, setActivePR] = useState<PullRequest | null>(null);
  const [isMerged, setIsMerged] = useState(false);
  const [viewDiffMode, setViewDiffMode] = useState<"side_by_side" | "refactored">("side_by_side");

  const handleReviewPR = async () => {
    setIsLoading(true);
    setIsMerged(false);
    try {
      const res = await fetch("/api/gitops/pr/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prTitle,
          author: authorName,
          branchSource,
          branchTarget,
          description: "Refatoração para Clean Code, desacoplamento de banco de dados e validação de schema Zod.",
          originalCode,
          modifiedCode,
          language
        })
      });
      const data = await res.json();
      if (data.success && data.pr) {
        setActivePR(data.pr);
        toast.success("Code Review concluído pelo AI Senior Staff Copilot!");
      } else {
        throw new Error(data.error || "Falha no review.");
      }
    } catch {
      const fallbackPR = await PullRequestReviewService.createAndReviewPR({
        title: prTitle,
        author: authorName,
        branchSource,
        branchTarget,
        description: "Refatoração para Clean Code e validações de segurança.",
        originalCode,
        modifiedCode,
        language
      });
      setActivePR(fallbackPR);
      toast.info("Review concluído via motor estático de Clean Code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!activePR) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/gitops/pr/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pr: activePR })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_code_review_${activePR.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Laudo de Code Review baixado em PDF!");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleMergePR = () => {
    setIsMerged(true);
    toast.success(`Pull Request #${activePR?.id} integrado com sucesso na branch main! 🚀`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-indigo-950/70 border border-sky-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <GitPullRequest className="w-3.5 h-3.5" />
              GitOps & Clean Code Studio
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <GitPullRequest className="w-8 h-8 text-sky-400" />
              AI Code Review & Pull Request Simulator
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Simulador corporativo de Pull Requests do GitHub com análise de Git Diff linha a linha, comentários de <span className="text-sky-400 font-semibold">Senior Staff Engineer AI</span> (SOLID, OWASP, Clean Code), matriz de CI/CD e merge interativo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activePR && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Laudo PR em PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PR Submission & Config Panel */}
      <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-400" />
          Dados do Pull Request
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Título do PR</label>
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Desenvolvedor(a)</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Linguagem</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
            </select>
          </div>
        </div>

        {/* Code Diff Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-rose-400 uppercase flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" /> Código Original (Base Branch: {branchTarget})
              </label>
            </div>
            <textarea
              value={originalCode}
              onChange={(e) => setOriginalCode(e.target.value)}
              rows={8}
              className="w-full bg-[#040815] border border-rose-500/30 rounded-xl p-3.5 text-xs font-mono text-rose-300 resize-none focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-emerald-400 uppercase flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" /> Código Proposto (Head Branch: {branchSource})
              </label>
            </div>
            <textarea
              value={modifiedCode}
              onChange={(e) => setModifiedCode(e.target.value)}
              rows={8}
              className="w-full bg-[#040815] border border-emerald-500/30 rounded-xl p-3.5 text-xs font-mono text-emerald-300 resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleReviewPR}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-sky-500/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Submeter PR para Code Review IA
          </button>
        </div>
      </div>

      {/* PR Review Results Workspace */}
      {activePR && (
        <div className="space-y-6">
          {/* PR Header & CI/CD Status Bar */}
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isMerged ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}>
                    {isMerged ? <GitMerge className="w-3.5 h-3.5" /> : <GitPullRequest className="w-3.5 h-3.5" />}
                    {isMerged ? "MERGED (Integrado)" : "OPEN (Em Revisão)"}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">PR #{activePR.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">{activePR.title}</h2>
                <div className="text-xs text-slate-400 mt-1">
                  Por <span className="text-white font-semibold">{activePR.author}</span> quer integrar {activePR.diffSummary.additions} adições em <span className="text-sky-300 font-mono">{activePR.branchTarget}</span> a partir de <span className="text-sky-300 font-mono">{activePR.branchSource}</span>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center min-w-[100px]">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">Clean Code</div>
                  <div className="text-xl font-black text-white">{activePR.cleanCodeScore}%</div>
                </div>
                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-center min-w-[100px]">
                  <div className="text-[10px] text-sky-400 font-semibold uppercase">Security SAST</div>
                  <div className="text-xl font-black text-white">{activePR.securityScore}%</div>
                </div>
              </div>
            </div>

            {/* CI/CD Status Matrix Checks */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matriz de CI/CD Automated Status Checks</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {activePR.cicdChecks.map((chk, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {chk.status === "passed" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {chk.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{chk.executionTimeMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{chk.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Engineer Summary */}
            <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2">
              <div className="text-xs font-bold text-sky-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Parecer do Senior Staff Engineer AI ({activePR.overallReviewVerdict})
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{activePR.staffEngineerSummary}</p>
            </div>

            {/* Inline Code Comments */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Apontamentos e Comentários Inline de Revisão ({activePR.inlineComments.length})
              </div>

              {activePR.inlineComments.map((comment, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#040815] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      Linha {comment.line} • {comment.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      comment.severity === "blocker" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {comment.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{comment.comment}</p>
                  {comment.suggestedPatch && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                      💡 Sugestão: {comment.suggestedPatch}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Merge Action Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {activePR.cicdChecks.every((c) => c.status === "passed") ? "✓ Todos os checks de CI/CD passaram." : "⚠ Existem avisos pendentes."}
              </span>

              {!isMerged && (
                <button
                  onClick={handleMergePR}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-500/20"
                >
                  <GitMerge className="w-4 h-4" />
                  Aprovar e Integrar (Squash and Merge)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
