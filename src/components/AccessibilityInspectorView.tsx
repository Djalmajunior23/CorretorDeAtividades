import React, { useState } from "react";
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  RefreshCw,
  Sparkles,
  Code2,
  Shield,
  Layers,
  FileCheck,
  Zap,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import {
  AccessibilityAuditService,
  A11yAuditResult
} from "../services/accessibilityAuditService";

type VisionFilter = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "monochromacy";

export default function AccessibilityInspectorView() {
  const [studentName, setStudentName] = useState("Ana Beatriz Rocha");
  const [projectName, setProjectName] = useState("Dashboard de Monitoramento Industrial");
  const [activeVisionFilter, setActiveVisionFilter] = useState<VisionFilter>("normal");

  const [code, setCode] = useState(
    `<main>
  <header>
    <h1>Painel de Controle</h1>
    <button onClick={toggleModal}><img src="/close-icon.png" /></button>
  </header>
  
  <section className="bg-white">
    <p style={{ color: "#94a3b8" }}>Status dos Sensores Operacionais</p>
    <img src="/sensors-diagram.png" />
    <form>
      <input type="text" placeholder="Buscar máquina..." />
      <div onClick={handleSubmit} className="bg-emerald-500 text-white p-2">Filtrar</div>
    </form>
  </section>
</main>`
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [auditResult, setAuditResult] = useState<A11yAuditResult | null>(null);

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/a11y/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          projectName,
          code,
          framework: "react_jsx"
        })
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResult(data.audit);
        toast.success(`Auditoria WCAG 2.2 concluída! Score: ${data.audit.score}/100`);
      } else {
        throw new Error(data.error || "Falha na auditoria.");
      }
    } catch {
      const fallbackAudit = await AccessibilityAuditService.auditFrontendCode({
        studentName,
        projectName,
        code
      });
      setAuditResult(fallbackAudit);
      toast.info("Auditoria concluída via motor de regras WCAG 2.2.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!auditResult) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/a11y/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit: auditResult })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `laudo_a11y_wcag_${auditResult.auditId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Laudo de Acessibilidade baixado em PDF!");
      }
    } catch (e: any) {
      toast.error(`Erro ao exportar PDF: ${e.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getVisionFilterStyle = () => {
    switch (activeVisionFilter) {
      case "protanopia":
        return { filter: "url('#protanopia-filter')", WebkitFilter: "grayscale(50%) sepia(20%)" };
      case "deuteranopia":
        return { filter: "grayscale(40%) hue-rotate(45deg)" };
      case "tritanopia":
        return { filter: "hue-rotate(180deg) saturate(70%)" };
      case "monochromacy":
        return { filter: "grayscale(100%)" };
      default:
        return {};
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#030712] text-slate-100">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-emerald-950/70 border border-teal-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5" />
              Auditoria de Acessibilidade & WCAG 2.2
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Eye className="w-8 h-8 text-teal-400" />
              Accessibility (a11y) & Web Quality Inspector
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Auditor estático e visual de conformidade com as diretrizes internacionais <span className="text-teal-400 font-semibold">WCAG 2.2 (Níveis A, AA e AAA)</span>, simulador de visão para daltonismo e gerador de código semântico inclusivo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {auditResult && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
              >
                {isExportingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar Laudo WCAG PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Code Input and Vision Simulator Sandbox */}
      <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estudante / Autor</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome da Interface / Projeto</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Vision simulator toggle tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Sliders className="w-3.5 h-3.5 text-teal-400" /> Simulador de Daltonismo & Visão Inclusiva
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: "normal" as const, label: "Visão Padrão", desc: "Tricromata" },
              { id: "protanopia" as const, label: "Protanopia", desc: "Ausência vermelho" },
              { id: "deuteranopia" as const, label: "Deuteranopia", desc: "Ausência verde" },
              { id: "tritanopia" as const, label: "Tritanopia", desc: "Ausência azul" },
              { id: "monochromacy" as const, label: "Acromatopsia", desc: "Totalmente monocromático" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveVisionFilter(f.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeVisionFilter === f.id
                    ? "bg-teal-950/40 border-teal-500 text-white shadow-md shadow-teal-500/10"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold">{f.label}</div>
                <div className="text-[10px] text-slate-500">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Input */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-slate-300 uppercase flex items-center gap-1.5 mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-teal-400" /> Código Frontend (HTML / React JSX)
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={8}
            style={getVisionFilterStyle()}
            className="w-full bg-[#040815] border border-slate-700/80 rounded-xl p-3.5 text-xs font-mono text-teal-300 resize-none focus:outline-none focus:border-teal-500 leading-relaxed transition-all"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunAudit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-teal-500/20"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Auditar Código contra WCAG 2.2
          </button>
        </div>
      </div>

      {/* Audit Results Workspace */}
      {auditResult && (
        <div className="space-y-6">
          <div className="bg-[#090d1f] border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            {/* Header Score & Grade */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Resultado da Auditoria de Acessibilidade</span>
                <h2 className="text-2xl font-black text-white mt-1">{auditResult.wcagComplianceGrade}</h2>
                <div className="text-xs text-slate-400 mt-1">Projeto: {auditResult.projectName} • ID: {auditResult.auditId}</div>
              </div>

              <div className="flex items-center gap-4 bg-slate-900 border border-slate-700 p-4 rounded-2xl">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Accessibility Score</div>
                  <div className="text-xs font-bold text-teal-400">{auditResult.totalViolations} apontamentos identificados</div>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-teal-500/30">
                  {auditResult.score}%
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                <div className="text-xs font-semibold text-rose-400">Violações Críticas (Nível A)</div>
                <div className="text-2xl font-black text-white">{auditResult.criticalCount}</div>
                <div className="text-[11px] text-slate-400">Impedem o uso por leitores de tela</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                <div className="text-xs font-semibold text-amber-400">Contraste Mínimo Detectado</div>
                <div className="text-2xl font-black text-white">{auditResult.contrastRatioMetrics.lowestRatioFound}:1</div>
                <div className="text-[11px] text-slate-400">Exigido WCAG AA: mínimo 4.5:1</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="text-xs font-semibold text-emerald-400">Navegação via Teclado</div>
                <div className="text-2xl font-black text-white">
                  {auditResult.keyboardNavigationReport.hasTabindexTraps ? "Armadilha Detectada" : "Livre de Traps"}
                </div>
                <div className="text-[11px] text-slate-400">Focus-visible e ordem de tabulação</div>
              </div>
            </div>

            {/* Violations List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Violações e Recomendações de Correção ({auditResult.violations.length})
              </div>

              {auditResult.violations.map((v) => (
                <div key={v.id} className="p-4 rounded-xl bg-[#040815] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${v.impact === "CRITICAL" ? "text-rose-400" : "text-amber-400"}`} />
                      [WCAG {v.wcagLevel}] {v.wcagCriterion}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.impact === "CRITICAL" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {v.impact}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{v.description}</p>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                    💡 Correção Sugerida: {v.suggestedFixSnippet}
                  </div>
                </div>
              ))}
            </div>

            {/* Remediated Code Block */}
            {auditResult.remediatedAccessibleCode && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Código Acessível 100% Remediado (WCAG 2.2 AAA Ready)
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-teal-300 whitespace-pre-wrap">
                  {auditResult.remediatedAccessibleCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
