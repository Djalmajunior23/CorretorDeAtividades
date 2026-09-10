import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import PDFDocument from "pdfkit";

export type FaultInjectionType =
  | "LATENCY_JITTER" // Latency Spike & High Jitter
  | "PACKET_LOSS" // Network Flakiness & Dropped Packets
  | "DATABASE_TIMEOUT" // DB Connection Pool Exhaustion & 504 Timeout
  | "MEMORY_PRESSURE" // Memory Leak & Thread Starvation
  | "CASCADING_OUTAGE" // Downstream Microservice 500 Failure
  | "BLACK_FRIDAY_BURST"; // Sudden Concurrency Spike (10x normal load)

export interface ChaosScenarioConfig {
  scenarioName: string;
  targetEndpointOrFunction: string;
  faultTypes: FaultInjectionType[];
  intensity: "LOW" | "MODERATE" | "AGGRESSIVE" | "CATASTROPHIC";
  concurrencyRps: number;
  durationSeconds: number;
  simulatedPayload?: string;
}

export interface TelemetryMetric {
  second: number;
  rps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  circuitBreakerState: "CLOSED" | "OPEN" | "HALF_OPEN";
  memoryUsageMb: number;
}

export interface ResiliencePatternEvaluation {
  pattern: "Circuit Breaker" | "Exponential Backoff & Retry" | "Bulkhead Isolation" | "Fallback Cache / Degradation" | "Rate Limiting / Shedding";
  implemented: boolean;
  effectiveness: "ALTA" | "PARCIAL" | "AUSENTE / FALHA";
  diagnostic: string;
}

export interface ChaosSimulationReport {
  simulationId: string;
  timestamp: string;
  serviceName: string;
  architecturalCodeSnippet: string;
  scenario: ChaosScenarioConfig;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  availabilityPercent: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  survivalScore: number; // 0 - 100
  survivalRating: "Resiliente de Nível Espacial (Faixa Preta)" | "Robusto com Alertas" | "Frágil sob Pressão" | "Colapso Imediato (Single Point of Failure)";
  telemetryHistory: TelemetryMetric[];
  resiliencePatterns: ResiliencePatternEvaluation[];
  rootCauseAnalysis: string[];
  hardeningFixCodeSnippet: string;
  architecturalRecommendations: string[];
}

export class ChaosEngineeringService {
  /**
   * Runs Chaos Monkey simulation against code or architecture description.
   */
  static async runChaosExperiment(params: {
    serviceName: string;
    code: string;
    scenario: Partial<ChaosScenarioConfig>;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<ChaosSimulationReport> {
    const simulationId = `chaos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const serviceName = params.serviceName || "Order & Checkout Microservice";
    const faults: FaultInjectionType[] = params.scenario.faultTypes && params.scenario.faultTypes.length > 0
      ? params.scenario.faultTypes
      : ["LATENCY_JITTER", "DATABASE_TIMEOUT", "BLACK_FRIDAY_BURST"];
    const intensity = params.scenario.intensity || "AGGRESSIVE";
    const rps = params.scenario.concurrencyRps || 2500;
    const duration = params.scenario.durationSeconds || 10;

    const fullScenario: ChaosScenarioConfig = {
      scenarioName: params.scenario.scenarioName || "Simulação de Black Friday com Queda de Banco",
      targetEndpointOrFunction: params.scenario.targetEndpointOrFunction || "POST /api/v1/orders/checkout",
      faultTypes: faults,
      intensity,
      concurrencyRps: rps,
      durationSeconds: duration,
      simulatedPayload: params.code.substring(0, 300)
    };

    const prompt = `Você é um Engenheiro de Caos & Confiabilidade (SRE / Chaos Monkey AI Architect) especializado em sistemas distribuídos de altíssima escala e pedagogia SENAI.
Analise o código ou arquitetura fornecido e simule um experimento de Caos (Chaos Engineering Experiment) injetando as seguintes falhas:
- Falhas Injetadas: ${faults.join(", ")}
- Intensidade: ${intensity}
- RPS Concorrente: ${rps}
- Duração: ${duration}s

CÓDIGO/ARQUITETURA SUBMETIDO:
\`\`\`
${params.code.slice(0, 4000)}
\`\`\`

Responda EXCLUSIVAMENTE em formato JSON estruturado com a seguinte interface:
{
  "survivalScore": number, // 0 a 100
  "survivalRating": "Resiliente de Nível Espacial (Faixa Preta)" | "Robusto com Alertas" | "Frágil sob Pressão" | "Colapso Imediato (Single Point of Failure)",
  "p95LatencyMs": number,
  "p99LatencyMs": number,
  "availabilityPercent": number,
  "resiliencePatterns": [
    {
      "pattern": "Circuit Breaker" | "Exponential Backoff & Retry" | "Bulkhead Isolation" | "Fallback Cache / Degradation" | "Rate Limiting / Shedding",
      "implemented": boolean,
      "effectiveness": "ALTA" | "PARCIAL" | "AUSENTE / FALHA",
      "diagnostic": "explicação técnica"
    }
  ],
  "rootCauseAnalysis": ["motivo 1 de gargalo/falha", "motivo 2"],
  "hardeningFixCodeSnippet": "código corrigido com Circuit Breaker / Retries / Fallbacks",
  "architecturalRecommendations": ["recomendação 1", "recomendação 2"]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const rawText = await provider.generateContent(prompt, {
        temperature: 0.2,
        max_tokens: 3000
      });

      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const totalRequests = rps * duration;
      const availability = typeof parsed.availabilityPercent === "number" ? parsed.availabilityPercent : 74.5;
      const successfulRequests = Math.round((totalRequests * availability) / 100);
      const failedRequests = totalRequests - successfulRequests;

      const telemetryHistory = this.generateSyntheticTelemetry(duration, rps, faults, intensity);

      return {
        simulationId,
        timestamp: new Date().toISOString(),
        serviceName,
        architecturalCodeSnippet: params.code,
        scenario: fullScenario,
        totalRequests,
        successfulRequests,
        failedRequests,
        availabilityPercent: availability,
        p95LatencyMs: parsed.p95LatencyMs || 1850,
        p99LatencyMs: parsed.p99LatencyMs || 3420,
        survivalScore: parsed.survivalScore || 62,
        survivalRating: parsed.survivalRating || "Frágil sob Pressão",
        telemetryHistory,
        resiliencePatterns: parsed.resiliencePatterns || this.getDefaultResiliencePatterns(),
        rootCauseAnalysis: parsed.rootCauseAnalysis || [
          "Ausência de timeout explícito no pool de conexões com banco relacional.",
          "Falta de Circuit Breaker para chamadas síncronas HTTP a serviços terceirizados."
        ],
        hardeningFixCodeSnippet: parsed.hardeningFixCodeSnippet || this.getDefaultHardeningSnippet(),
        architecturalRecommendations: parsed.architecturalRecommendations || [
          "Implementar padrão Circuit Breaker com Resilience4j / Opossum.",
          "Adicionar rate limiting por token bucket no API Gateway."
        ]
      };
    } catch (error) {
      console.warn("[ChaosEngineeringService] LLM fallback triggered:", error);
      return this.generateFallbackReport(simulationId, serviceName, params.code, fullScenario);
    }
  }

  private static generateSyntheticTelemetry(
    duration: number,
    baseRps: number,
    faults: FaultInjectionType[],
    intensity: string
  ): TelemetryMetric[] {
    const metrics: TelemetryMetric[] = [];
    const multiplier = intensity === "CATASTROPHIC" ? 4 : intensity === "AGGRESSIVE" ? 2.5 : 1.2;

    for (let sec = 1; sec <= duration; sec++) {
      const isChaosActive = sec >= 3 && sec <= duration - 2;
      const rps = isChaosActive ? Math.round(baseRps * (1 + Math.sin(sec) * 0.2)) : Math.round(baseRps * 0.4);
      const p50 = isChaosActive ? Math.round(180 * multiplier + Math.random() * 80) : 45;
      const p95 = isChaosActive ? Math.round(950 * multiplier + Math.random() * 300) : 110;
      const p99 = isChaosActive ? Math.round(1800 * multiplier + Math.random() * 800) : 220;
      const errorRate = isChaosActive ? Math.min(95, Math.round(18 * multiplier + Math.random() * 15)) : 0.8;
      
      let cbState: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
      if (isChaosActive && errorRate > 35) {
        cbState = "OPEN";
      } else if (isChaosActive && errorRate > 15) {
        cbState = "HALF_OPEN";
      }

      metrics.push({
        second: sec,
        rps,
        p50LatencyMs: p50,
        p95LatencyMs: p95,
        p99LatencyMs: p99,
        errorRatePercent: errorRate,
        circuitBreakerState: cbState,
        memoryUsageMb: Math.round(256 + sec * 35 * (faults.includes("MEMORY_PRESSURE") ? 2.5 : 1))
      });
    }

    return metrics;
  }

  private static getDefaultResiliencePatterns(): ResiliencePatternEvaluation[] {
    return [
      {
        pattern: "Circuit Breaker",
        implemented: false,
        effectiveness: "AUSENTE / FALHA",
        diagnostic: "Não há proteção contra chamadas em cascata; requisições continuam sendo enviadas ao serviço em colapso."
      },
      {
        pattern: "Exponential Backoff & Retry",
        implemented: true,
        effectiveness: "PARCIAL",
        diagnostic: "Retentativas implementadas sem Jitter aleatório, causando tempestade de reconexão (thundering herd problem)."
      },
      {
        pattern: "Fallback Cache / Degradation",
        implemented: false,
        effectiveness: "AUSENTE / FALHA",
        diagnostic: "Nenhum valor padrão ou cache distribuído Redis utilizado quando o endpoint principal fica indisponível."
      },
      {
        pattern: "Rate Limiting / Shedding",
        implemented: true,
        effectiveness: "ALTA",
        diagnostic: "Algoritmo Leaky Bucket descarta excesso de requisições preservando a integridade da CPU."
      }
    ];
  }

  private static getDefaultHardeningSnippet(): string {
    return `// Hardening com Resilience4j / Circuit Breaker + Fallback
import { CircuitBreaker } from 'opossum';

const options = {
  timeout: 3000, // 3s timeout
  errorThresholdPercentage: 50, // abre o circuito se > 50% falhar
  resetTimeout: 10000 // tenta reconectar após 10s
};

const breaker = new CircuitBreaker(callExternalDatabaseOrService, options);
breaker.fallback(() => ({ status: 'DEGRADED', data: getCachedData() }));

breaker.on('open', () => console.warn('[CHAOS GUARD] Circuit Breaker OPEN! Shedding traffic.'));
breaker.on('halfOpen', () => console.info('[CHAOS GUARD] Circuit Breaker HALF-OPEN! Testing health.'));
breaker.on('close', () => console.info('[CHAOS GUARD] Circuit Breaker CLOSED! System stabilized.'));

export async function resilientExecute(payload: any) {
  return await breaker.fire(payload);
}`;
  }

  private static generateFallbackReport(
    simulationId: string,
    serviceName: string,
    code: string,
    scenario: ChaosScenarioConfig
  ): ChaosSimulationReport {
    const totalRequests = scenario.concurrencyRps * scenario.durationSeconds;
    const availabilityPercent = 68.4;
    const successfulRequests = Math.round((totalRequests * availabilityPercent) / 100);
    const failedRequests = totalRequests - successfulRequests;

    return {
      simulationId,
      timestamp: new Date().toISOString(),
      serviceName,
      architecturalCodeSnippet: code,
      scenario,
      totalRequests,
      successfulRequests,
      failedRequests,
      availabilityPercent,
      p95LatencyMs: 2150,
      p99LatencyMs: 4300,
      survivalScore: 58,
      survivalRating: "Frágil sob Pressão",
      telemetryHistory: this.generateSyntheticTelemetry(scenario.durationSeconds, scenario.concurrencyRps, scenario.faultTypes, scenario.intensity),
      resiliencePatterns: this.getDefaultResiliencePatterns(),
      rootCauseAnalysis: [
        "Injeção de Latência revelou que chamadas síncronas bloqueiam a thread event loop do Node.js.",
        "Sobrecarga de banco causa esgotamento de conexões sem mecanismo de backpressure."
      ],
      hardeningFixCodeSnippet: this.getDefaultHardeningSnippet(),
      architecturalRecommendations: [
        "Isolar serviços de alta volatilidade usando filas assíncronas (RabbitMQ / Kafka).",
        "Adicionar healthchecks ativos com auto-scaling acionado por p95 latency."
      ]
    };
  }

  /**
   * Generates official Chaos Engineering & Site Reliability Engineering (SRE) PDF Dossier.
   */
  static async generateChaosReportPdf(report: ChaosSimulationReport): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Header Brand
      doc.rect(40, 40, doc.page.width - 80, 50).fill("#0f172a");
      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(18).text("CHAOS MONKEY AI & SRE RESILIENCE LAB", 55, 52);
      doc.fillColor("#94a3b8").font("Helvetica").fontSize(9).text("SENAI DevSecOps & Cloud Reliability Engineering Certification", 55, 73);

      doc.moveDown(3);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("1. Sumário Executivo do Experimento de Caos");
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      doc.text(`ID da Simulação: ${report.simulationId}`);
      doc.text(`Serviço / Componente: ${report.serviceName}`);
      doc.text(`Cenário: ${report.scenario.scenarioName}`);
      doc.text(`Falhas Injetadas: ${report.scenario.faultTypes.join(", ")}`);
      doc.text(`Intensidade: ${report.scenario.intensity} | Carga: ${report.scenario.concurrencyRps} RPS | Duração: ${report.scenario.durationSeconds}s`);
      doc.text(`Data de Execução: ${new Date(report.timestamp).toLocaleString("pt-BR")}`);

      doc.moveDown(1);

      // Scorecard Card
      doc.rect(40, doc.y, doc.page.width - 80, 60).fill("#f8fafc");
      const cardY = doc.y + 10;
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text("ÍNDICE DE SOBREVIVÊNCIA AO CAOS (CHAOS SURVIVAL SCORE)", 55, cardY);
      
      const scoreColor = report.survivalScore >= 80 ? "#16a34a" : report.survivalScore >= 60 ? "#d97706" : "#dc2626";
      doc.fillColor(scoreColor).font("Helvetica-Bold").fontSize(22).text(`${report.survivalScore}/100`, 55, cardY + 18);
      doc.fillColor("#475569").font("Helvetica").fontSize(9).text(`Classificação: ${report.survivalRating} | Disponibilidade: ${report.availabilityPercent.toFixed(1)}% | p95: ${report.p95LatencyMs}ms | p99: ${report.p99LatencyMs}ms`, 140, cardY + 22);

      doc.moveDown(4);

      // Resilience Patterns Table
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("2. Avaliação de Padrões de Resiliência Arquitetural");
      doc.moveDown(0.5);

      report.resiliencePatterns.forEach((pat) => {
        const effColor = pat.effectiveness === "ALTA" ? "#16a34a" : pat.effectiveness === "PARCIAL" ? "#d97706" : "#dc2626";
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`• ${pat.pattern}: `, { continued: true });
        doc.fillColor(effColor).text(`[${pat.effectiveness}]`);
        doc.font("Helvetica").fontSize(9).fillColor("#475569").text(`   Diagnóstico: ${pat.diagnostic}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // Root Cause Analysis
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("3. Análise de Causa Raiz de Gargalos e Colapsos");
      doc.moveDown(0.5);
      report.rootCauseAnalysis.forEach((rc, i) => {
        doc.font("Helvetica").fontSize(9).fillColor("#b91c1c").text(`${i + 1}. ${rc}`);
      });

      doc.moveDown(1);

      // Recommendations
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("4. Recomendações de Hardening & Blindagem SRE");
      doc.moveDown(0.5);
      report.architecturalRecommendations.forEach((rec, i) => {
        doc.font("Helvetica").fontSize(9).fillColor("#15803d").text(`✓ ${rec}`);
      });

      doc.moveDown(1);

      // Hardening Snippet
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("5. Patch Arquitetural Sugerido (Circuit Breaker & Fallback)");
      doc.moveDown(0.5);
      doc.rect(40, doc.y, doc.page.width - 80, 100).fill("#1e293b");
      doc.fillColor("#38bdf8").font("Courier").fontSize(8).text(report.hardeningFixCodeSnippet.slice(0, 500), 50, doc.y + 8, {
        width: doc.page.width - 100
      });

      // Footer
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("CodeCheck AI • Plataforma Educacional de Excelência Tecnológica SENAI", 40, doc.page.height - 30, {
        align: "center"
      });

      doc.end();
    });
  }
}
