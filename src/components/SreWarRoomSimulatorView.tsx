import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  ShieldAlert,
  Terminal,
  Activity,
  CheckCircle,
  AlertOctagon,
  Clock,
  RotateCcw,
  FileText,
  Server,
  Cpu,
  Layers,
  HelpCircle,
  Play,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { SreWarRoomSimulatorService, WarRoomSession, IncidentScenario } from "../services/sreWarRoomSimulatorService";

export default function SreWarRoomSimulatorView() {
  const [scenarios] = useState<IncidentScenario[]>(SreWarRoomSimulatorService.getScenarios());
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [studentName, setStudentName] = useState("Engenheiro DevOps");
  const [session, setSession] = useState<WarRoomSession | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Start initial war room session
  useEffect(() => {
    handleStartWarRoom(selectedScenarioId);
  }, []);

  // SLA countdown interval
  useEffect(() => {
    if (!session || session.status !== "ACTIVE_OUTAGE") return;

    const interval = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.status !== "ACTIVE_OUTAGE") return prev;
        if (prev.slaRemainingSeconds <= 1) {
          toast.error("SLA Violação Crítica! O tempo limite em produção expirou.");
          return {
            ...prev,
            slaRemainingSeconds: 0,
            status: "SLA_BREACHED"
          };
        }
        return {
          ...prev,
          slaRemainingSeconds: prev.slaRemainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status]);

  // Scroll to terminal bottom on command update
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.terminalHistory]);

  const handleStartWarRoom = (scenarioId: string) => {
    const newSession = SreWarRoomSimulatorService.startWarRoom(scenarioId, studentName);
    setSelectedScenarioId(scenarioId);
    setSession(newSession);
    toast.info("🚨 Sala de Guerra SRE iniciada! Incidentes em produção detectados.");
  };

  const handleExecuteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commandInput.trim()) return;

    const { session: updatedSession, feedback } = SreWarRoomSimulatorService.executeCommand(session, commandInput);
    setSession({ ...updatedSession });
    setCommandInput("");

    if (updatedSession.status === "MITIGATED") {
      toast.success("🎉 Incidente mitigado com sucesso! Produção estabilizada.");
    }
  };

  const handleExportPostmortem = () => {
    if (!session) return;
    SreWarRoomSimulatorService.exportPostmortemPdf(session);
    toast.success("Relatório de Postmortem e RCA baixado com sucesso!");
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#030712] text-slate-100 p-6 md:p-8 space-y-6">
      {/* Header Outage Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-amber-950/40 border border-rose-500/20 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium">
            <Flame className="w-3.5 h-3.5 animate-pulse text-rose-400" />
            <span>DevOps & SRE On-Call Simulator • Incident Response 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            Sala de Guerra de Incidentes SRE
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Simulação de incidentes críticos em produção sob pressão de SLA: diagnostique vazamentos de memória, deadlocks e quedas de microsserviços.
          </p>
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Tempo Restante de SLA</span>
              <div
                className={`text-2xl font-mono font-black ${
                  session.slaRemainingSeconds < 180
                    ? "text-rose-400 animate-pulse"
                    : session.status === "MITIGATED"
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {formatTimer(session.slaRemainingSeconds)}
              </div>
            </div>

            {session.status === "MITIGATED" && (
              <button
                onClick={handleExportPostmortem}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-600/20"
              >
                <FileText className="w-4 h-4" />
                <span>Postmortem PDF</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scenario Picker Carousel / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => handleStartWarRoom(sc.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${
              selectedScenarioId === sc.id
                ? "bg-rose-950/50 border-rose-500/50 text-white shadow-lg shadow-rose-950/50"
                : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-rose-400" />
            <span>{sc.title}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-rose-300">
              {sc.severity}
            </span>
          </button>
        ))}
      </div>

      {session && (
        <>
          {/* Real-Time Outage Telemetry Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Error Rate */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
                <span>ERRO 5xx (HTTP)</span>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-mono font-black text-rose-400">
                {session.scenario.initialMetrics.errorRatePercent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">Meta normal: &lt; 0.1%</div>
            </div>

            {/* Metric 2: Memory */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
                <span>MEMÓRIA HEAP</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-mono font-black text-amber-400">
                {session.scenario.initialMetrics.memoryPercent}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">Limite OOM: 95%</div>
            </div>

            {/* Metric 3: Latency */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
                <span>LATÊNCIA p99</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-black text-purple-400">
                {session.scenario.initialMetrics.latencyP99Ms} ms
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">SLA padrão: &lt; 150ms</div>
            </div>

            {/* Metric 4: Status */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
                <span>STATUS DO INCIDENTE</span>
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-mono font-bold mt-1 text-white">
                {session.status === "ACTIVE_OUTAGE" ? (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    EM COLAPSO ATIVO
                  </span>
                ) : session.status === "MITIGATED" ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    MITIGADO & ESTABILIZADO
                  </span>
                ) : (
                  <span className="text-rose-500">SLA VIOLADO</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Nota Técnica: <span className="text-emerald-400 font-bold">{session.finalScore}/100</span>
              </div>
            </div>
          </div>

          {/* Main Terminal & Diagnostic Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Incident Description & Checkpoints */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Sintomas e Impacto
                </h3>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {session.scenario.description}
                </p>
                <div className="space-y-1.5 pt-2">
                  {session.scenario.symptoms.map((symp, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 font-mono flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{symp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mitigation Checklist */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Critérios de Mitigação (SRE)
                </h3>
                <div className="space-y-2">
                  {session.scenario.mitigationChecks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 transition-all ${
                        chk.resolved
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          chk.resolved ? "bg-emerald-500 text-slate-950" : "border border-slate-700"
                        }`}
                      >
                        {chk.resolved && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{chk.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Troubleshooting Shell */}
            <div className="lg:col-span-2 flex flex-col h-[520px] rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl font-mono">
              {/* Terminal Top Bar */}
              <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-slate-300 font-semibold">
                    root@{session.scenario.serviceName.split(" ")[0]}:~#
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Bash Shell Virtual • Digite 'help'</span>
              </div>

              {/* Terminal History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {/* Initial Outage Logs */}
                <div className="space-y-1 pb-3 border-b border-slate-800/80">
                  <div className="text-[11px] text-rose-400 font-bold uppercase">
                    === STREAM DE LOGS DE PRODUÇÃO (ÚLTIMOS ERROS) ===
                  </div>
                  {session.scenario.sampleLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-slate-500">[{log.timestamp}]</span>
                      <span
                        className={`font-bold px-1 rounded text-[10px] ${
                          log.level === "FATAL"
                            ? "bg-rose-500 text-slate-950"
                            : log.level === "ERROR"
                            ? "bg-rose-950 text-rose-300"
                            : "bg-amber-950 text-amber-300"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-slate-300">{log.message}</span>
                    </div>
                  ))}
                </div>

                {/* User Executed Commands */}
                {session.terminalHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span>#</span>
                      <span className="text-white font-bold">{item.command}</span>
                      <span className="text-[10px] text-slate-500">({item.timestamp})</span>
                    </div>
                    <pre className="text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 whitespace-pre-wrap">
                      {item.output}
                    </pre>
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Terminal Input Form */}
              <form
                onSubmit={handleExecuteCommand}
                className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
              >
                <span className="text-emerald-400 font-bold">#</span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Ex: kubectl scale ..., patch-service ..., systemctl restart ..."
                  className="flex-1 bg-transparent border-none text-xs text-slate-100 focus:outline-none placeholder-slate-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all"
                >
                  Executar
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
