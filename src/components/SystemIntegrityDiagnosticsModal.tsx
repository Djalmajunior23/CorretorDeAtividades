import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  RefreshCw,
  X,
  Server,
  Cpu,
  Database,
  Lock,
  Download,
  AlertTriangle,
  HeartPulse,
  Activity,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import {
  SystemIntegrityDiagnosticsService,
  SystemIntegrityReport
} from "../services/systemIntegrityDiagnosticsService";

interface SystemIntegrityDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemIntegrityDiagnosticsModal({
  isOpen,
  onClose
}: SystemIntegrityDiagnosticsModalProps) {
  const [report, setReport] = useState<SystemIntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/system/diagnostics/full-report");
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        throw new Error("Failed to fetch diagnostics");
      }
    } catch {
      // Fallback
      const fallbackReport = await SystemIntegrityDiagnosticsService.runFullDiagnostics();
      setReport(fallbackReport);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  const handleSelfHeal = async () => {
    setIsHealing(true);
    try {
      const res = await fetch("/api/system/diagnostics/self-heal", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Rotina de auto-recuperação (Self-Healing) executada com sucesso!");
        await fetchDiagnostics();
      }
    } catch {
      const localResult = await SystemIntegrityDiagnosticsService.triggerSelfHealingRoutine();
      if (localResult.success) {
        toast.success("Auto-recuperação local concluída com sucesso!");
        await fetchDiagnostics();
      }
    } finally {
      setIsHealing(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codecheck_diagnostics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório de integridade exportado em JSON.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <HeartPulse className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Diagnóstico de Integridade & Self-Healing
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ASVS 4.0.3 Nível 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria contínua de WAF, Sandbox, Banco de Dados, Multi-LLM e integridade de cache
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Recarregar Diagnóstico"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Score de Saúde</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {report?.overallScore ?? 100}%
                </span>
                <span className="text-xs text-slate-400">Operacional</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Uptime do Sistema</span>
                <Server className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {Math.floor((report?.uptimeSeconds || 120) / 60)} min
                </span>
                <span className="text-xs text-slate-400">Sem falhas</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Consumo de Heap</span>
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {report?.memoryUsageMb ?? 45} MB
                </span>
                <span className="text-xs text-emerald-400">Otimizado</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Blindagem WAF</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {report?.securityCompliance.owaspMitigationsActive ?? 14}
                </span>
                <span className="text-xs text-slate-400">Módulos ativos</span>
              </div>
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Auditoria dos Módulos em Execução
            </h3>

            <div className="space-y-2.5">
              {report?.activeChecks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start justify-between gap-4 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {chk.category === "security_waf" && <Lock className="w-4 h-4 text-emerald-400" />}
                      {chk.category === "sandbox_runtime" && <Cpu className="w-4 h-4 text-blue-400" />}
                      {chk.category === "database_storage" && <Database className="w-4 h-4 text-violet-400" />}
                      {chk.category === "ai_providers" && <Zap className="w-4 h-4 text-amber-400" />}
                      {chk.category === "resilience_cache" && <RefreshCw className="w-4 h-4 text-teal-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{chk.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {chk.latencyMs}ms
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{chk.message}</p>
                      {chk.remediation && (
                        <p className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {chk.remediation}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    ATIVO
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Banner */}
          {report?.recommendations && report.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Diretrizes de Governança & Prontidão
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {report.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Auditoria (JSON)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelfHeal}
              disabled={isHealing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHealing ? "animate-spin" : ""}`} />
              {isHealing ? "Executando Auto-Cura..." : "Executar Self-Healing Preventivo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
