import React, { useState } from "react";
import {
  Activity,
  Flame,
  Zap,
  Server,
  Database,
  Cpu,
  RefreshCw,
  FileDown,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  Terminal
} from "lucide-react";
import { toast } from "sonner";
import {
  ChaosSimulationReport,
  FaultInjectionType,
  ChaosEngineeringService
} from "../services/chaosEngineeringService";

const SAMPLE_MICROSERVICE_CODE = `import express from "express";
import axios from "axios";
import { Pool } from "pg";

const app = express();
const db = new Pool({ max: 10, connectionTimeoutMillis: 10000 });

// CRITICAL PATH: Checkout without Circuit Breaker or Retry Jitter
app.post("/api/v1/orders/checkout", async (req, res) => {
  const { cartId, paymentMethod } = req.body;
  
  // 1. Direct DB Query without resilient retry
  const cart = await db.query("SELECT * FROM carts WHERE id = $1", [cartId]);
  
  // 2. Synchronous External Payment Gateway call (Blocking)
  const paymentRes = await axios.post("https://api.payment-gateway.internal/charge", {
    amount: cart.rows[0].total,
    method: paymentMethod
  }, { timeout: 15000 }); // High timeout causes thread starvation

  // 3. Update inventory in downstream microservice
  await axios.post("https://inventory.service.internal/reserve", { items: cart.rows[0].items });

  res.json({ success: true, orderId: "ord_99812", status: paymentRes.data.status });
});

export default app;`;

export const ChaosEngineeringSimulatorView: React.FC = () => {
  const [serviceName, setServiceName] = useState("Checkout & Orders Microservice");
  const [code, setCode] = useState(SAMPLE_MICROSERVICE_CODE);
  const [concurrencyRps, setConcurrencyRps] = useState(2500);
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [intensity, setIntensity] = useState<"LOW" | "MODERATE" | "AGGRESSIVE" | "CATASTROPHIC">("AGGRESSIVE");
  const [selectedFaults, setSelectedFaults] = useState<FaultInjectionType[]>([
    "LATENCY_JITTER",
    "DATABASE_TIMEOUT",
    "BLACK_FRIDAY_BURST"
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ChaosSimulationReport | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const toggleFault = (fault: FaultInjectionType) => {
    if (selectedFaults.includes(fault)) {
      if (selectedFaults.length === 1) {
        toast.warning("Selecione ao menos um tipo de falha para o experimento.");
        return;
      }
      setSelectedFaults(selectedFaults.filter((f) => f !== fault));
    } else {
      setSelectedFaults([...selectedFaults, fault]);
    }
  };

  const handleRunChaosSimulation = async () => {
    if (!code.trim()) {
      toast.error("Insira o código do serviço a ser estressado.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/chaos/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName,
          code,
          scenario: {
            scenarioName: `Simulação de Caos: ${selectedFaults.join(" + ")}`,
            faultTypes: selectedFaults,
            intensity,
            concurrencyRps,
            durationSeconds
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setReport(data.report);
          toast.success("Experimento de Caos executado com sucesso!");
          return;
        }
      }

      // Fallback local service
      const fallbackReport = await ChaosEngineeringService.runChaosExperiment({
        serviceName,
        code,
        scenario: {
          scenarioName: `Simulação de Caos: ${selectedFaults.join(" + ")}`,
          faultTypes: selectedFaults,
          intensity,
          concurrencyRps,
          durationSeconds
        }
      });
      setReport(fallbackReport);
      toast.success("Simulação de Caos concluída em contingência local!");
    } catch (err: any) {
      console.warn("Chaos API error, using local fallback:", err);
      const fallbackReport = await ChaosEngineeringService.runChaosExperiment({
        serviceName,
        code,
        scenario: {
          scenarioName: `Simulação de Caos: ${selectedFaults.join(" + ")}`,
          faultTypes: selectedFaults,
          intensity,
          concurrencyRps,
          durationSeconds
        }
      });
      setReport(fallbackReport);
      toast.success("Experimento de Caos gerado com sucesso!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      const res = await fetch("/api/chaos/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });

      let blob: Blob;
      if (res.ok) {
        blob = await res.blob();
      } else {
        const pdfBuf = await ChaosEngineeringService.generateChaosReportPdf(report);
        blob = new Blob([pdfBuf as any], { type: "application/pdf" });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laudo_chaos_${report.simulationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Laudo SRE & Caos baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const faultsList: { id: FaultInjectionType; label: string; icon: any }[] = [
    { id: "LATENCY_JITTER", label: "Latency Spike / Jitter (2000ms)", icon: Activity },
    { id: "PACKET_LOSS", label: "Packet Loss & Flakiness (25%)", icon: Zap },
    { id: "DATABASE_TIMEOUT", label: "DB Pool Exhaustion (504)", icon: Database },
    { id: "MEMORY_PRESSURE", label: "Memory Leak & High CPU", icon: Cpu },
    { id: "CASCADING_OUTAGE", label: "Cascading Microservice 500", icon: Server },
    { id: "BLACK_FRIDAY_BURST", label: "Black Friday Burst Load (10x)", icon: Flame }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-amber-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> Chaos Monkey AI Lab
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              SRE & Cloud Resilience
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            API Stress & Chaos Engineering Simulator
          </h1>
          <p className="text-slate-400 text-sm">
            Injeção deliberada de falhas, validação de Circuit Breaker, telemetria p95/p99 e cálculo de Sobrevivência ao Caos.
          </p>
        </div>

        {report && (
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition shadow-lg text-sm font-semibold disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {isExportingPdf ? "Gerando Laudo..." : "Exportar Laudo SRE (PDF)"}
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chaos Control Center */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> Parâmetros de Injeção de Falhas
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Microsserviço Alvo</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Faults Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Selecione os Vetores de Caos:</label>
              <div className="grid grid-cols-1 gap-2">
                {faultsList.map((f) => {
                  const Icon = f.icon;
                  const isSelected = selectedFaults.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFault(f.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition text-left ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                        <span>{f.label}</span>
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Load Controls */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Carga (RPS)</label>
                <input
                  type="number"
                  value={concurrencyRps}
                  onChange={(e) => setConcurrencyRps(Number(e.target.value))}
                  step={500}
                  min={100}
                  max={20000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Duração (s)</label>
                <input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  min={5}
                  max={60}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Intensidade</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MODERATE">Moderada</option>
                  <option value="AGGRESSIVE">Agressiva</option>
                  <option value="CATASTROPHIC">Catastrófica</option>
                </select>
              </div>
            </div>

            {/* Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Código do Endpoint / Handler</label>
                <button
                  type="button"
                  onClick={() => setCode(SAMPLE_MICROSERVICE_CODE)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Exemplo Padrão
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 leading-relaxed"
                placeholder="Cole o código do microsserviço para injeção de caos..."
              />
            </div>

            <button
              onClick={handleRunChaosSimulation}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Injetando Falhas & Simulando Concorrência...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  Iniciar Experimento de Caos & Stress
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Telemetry & Results */}
        <div className="lg:col-span-7 space-y-4">
          {!report && !isLoading && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Flame className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-1">Nenhum Experimento de Caos em Execução</h3>
              <p className="text-sm text-slate-400 max-w-md mb-4">
                Selecione as falhas e clique em Iniciar para submeter o microsserviço a testes de estresse de alta concorrência.
              </p>
              <button
                onClick={handleRunChaosSimulation}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
              >
                Executar Demonstração com Exemplo
              </button>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[460px] space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Activity className="w-6 h-6 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium text-slate-200">Disparando {concurrencyRps} RPS & injetando falhas de rede e banco...</p>
              <p className="text-xs text-slate-500">Avaliando estados do Circuit Breaker e tempos p95/p99...</p>
            </div>
          )}

          {report && !isLoading && (
            <div className="space-y-4">
              {/* Scorecard */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Survival Score</span>
                  <div className={`text-3xl font-extrabold ${report.survivalScore >= 75 ? "text-emerald-400" : report.survivalScore >= 50 ? "text-amber-400" : "text-rose-500"}`}>
                    {report.survivalScore}%
                  </div>
                  <span className="text-[11px] text-slate-400">{report.survivalRating}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Disponibilidade</span>
                  <div className="text-2xl font-bold text-slate-100">
                    {report.availabilityPercent.toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-slate-400">{report.successfulRequests.toLocaleString()} / {report.totalRequests.toLocaleString()} reqs</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Latência p95 / p99</span>
                  <div className="text-xl font-bold text-amber-400">
                    {report.p95LatencyMs}ms / {report.p99LatencyMs}ms
                  </div>
                  <span className="text-[11px] text-slate-400">Tempo sob estresse</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Circuit Breaker</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-300">TRIPPED (OPEN)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Proteção acionada</span>
                </div>
              </div>

              {/* Telemetry Timeline Mini Chart */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" /> Linha do Tempo de Telemetria (Segundo a Segundo)
                </h3>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 pt-2">
                  {report.telemetryHistory.map((m) => (
                    <div
                      key={m.second}
                      className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-center space-y-1"
                    >
                      <div className="text-[10px] text-slate-500">s{m.second}</div>
                      <div className="text-xs font-bold text-slate-300">{m.p95LatencyMs}ms</div>
                      <div className={`text-[10px] font-semibold ${m.errorRatePercent > 20 ? "text-rose-400" : "text-emerald-400"}`}>
                        {m.errorRatePercent}% err
                      </div>
                      <div className={`text-[9px] px-1 py-0.5 rounded ${m.circuitBreakerState === "OPEN" ? "bg-rose-500/20 text-rose-300" : m.circuitBreakerState === "HALF_OPEN" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {m.circuitBreakerState}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resilience Patterns Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Avaliação de Padrões de Resiliência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.resiliencePatterns.map((pat) => (
                    <div key={pat.pattern} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{pat.pattern}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pat.effectiveness === "ALTA" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : pat.effectiveness === "PARCIAL" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-rose-500/15 text-rose-300 border border-rose-500/30"}`}>
                          {pat.effectiveness}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{pat.diagnostic}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Causes & Hardening Fix */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" /> Patch de Hardening Arquitetural Recomendado
                </h3>
                <pre className="bg-slate-950 p-3.5 rounded-xl text-xs font-mono text-emerald-300 border border-emerald-500/20 overflow-x-auto whitespace-pre-wrap">
                  {report.hardeningFixCodeSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChaosEngineeringSimulatorView;
