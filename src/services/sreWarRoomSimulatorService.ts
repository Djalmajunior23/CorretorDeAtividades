import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface IncidentScenario {
  id: string;
  title: string;
  serviceName: string;
  severity: "P1_CRITICAL" | "P2_HIGH" | "P3_MEDIUM";
  slaMinutes: number;
  description: string;
  symptoms: string[];
  initialMetrics: {
    cpuPercent: number;
    memoryPercent: number;
    errorRatePercent: number;
    latencyP99Ms: number;
  };
  sampleLogs: Array<{ timestamp: string; level: "INFO" | "WARN" | "ERROR" | "FATAL"; message: string }>;
  rootCause: string;
  expectedHotfixCommands: string[];
  mitigationChecks: Array<{ id: string; description: string; resolved: boolean }>;
}

export interface WarRoomSession {
  sessionId: string;
  studentName: string;
  scenario: IncidentScenario;
  startedAt: string;
  slaRemainingSeconds: number;
  status: "ACTIVE_OUTAGE" | "MITIGATED" | "SLA_BREACHED";
  terminalHistory: Array<{ command: string; output: string; timestamp: string }>;
  appliedPatches: string[];
  finalScore: number; // 0 - 100
  rcaSummary?: string;
}

export class SreWarRoomSimulatorService {
  /**
   * Retrieves available real-world incident scenarios
   */
  public static getScenarios(): IncidentScenario[] {
    return [
      {
        id: "inc-01-memleak",
        title: "Memory Leak Crítico & Loop OOM no Microsserviço de Checkout",
        serviceName: "payment-gateway-worker (Go / Node.js)",
        severity: "P1_CRITICAL",
        slaMinutes: 15,
        description: "O serviço de pagamentos está reiniciando a cada 3 minutos devido a estouro de heap no buffer de payloads WebSocket não desalocados.",
        symptoms: [
          "Taxa de erro 504 Gateway Timeout em 38%",
          "Consumo de memória RAM escalando de 200MB para 4GB em 180 segundos",
          "Pods sendo terminados com Exit Code 137 (OOMKilled)"
        ],
        initialMetrics: {
          cpuPercent: 88,
          memoryPercent: 96,
          errorRatePercent: 42,
          latencyP99Ms: 4250
        },
        sampleLogs: [
          { timestamp: "14:02:11.102", level: "WARN", message: "[heap_monitor] Active buffer references count: 489,120 (uncollected)" },
          { timestamp: "14:02:14.509", level: "ERROR", message: "[v8_runtime] Fatal error in GC: JavaScript heap out of memory" },
          { timestamp: "14:02:15.001", level: "FATAL", message: "Kernel: Out of Memory: Kill process 14092 (node) score 982" }
        ],
        rootCause: "EventListener de conexões WebSocket adicionado sem remover no evento de desconexão (socket leak).",
        expectedHotfixCommands: [
          "kubectl scale deployment/payment-worker --replicas=4",
          "patch-service --fix-socket-cleanup",
          "systemctl restart payment-gateway"
        ],
        mitigationChecks: [
          { id: "c1", description: "Estabilizar consumo de memória abaixo de 50%", resolved: false },
          { id: "c2", description: "Reduzir erros 5xx para menos de 1%", resolved: false },
          { id: "c3", description: "Aplicar patch de limpeza de EventListeners", resolved: false }
        ]
      },
      {
        id: "inc-02-deadlock-pg",
        title: "Deadlock Cascata & Pool de Conexões Esgotado no PostgreSQL",
        serviceName: "core-banking-db (PostgreSQL 18)",
        severity: "P1_CRITICAL",
        slaMinutes: 20,
        description: "Transações concorrentes de estorno e liquidação estão travando tabelas em ordem inversa, causando Deadlock Detection e esgotamento do max_connections.",
        symptoms: [
          "max_connections (200/200) atingido, novas conexões rejeitadas",
          "Latência de query disparou para 12.000ms",
          "Transações presas em 'idle in transaction'"
        ],
        initialMetrics: {
          cpuPercent: 99,
          memoryPercent: 82,
          errorRatePercent: 78,
          latencyP99Ms: 12400
        },
        sampleLogs: [
          { timestamp: "14:10:01.320", level: "ERROR", message: "ERROR: deadlock detected - Process 9918 waits for ShareLock on transaction 8812" },
          { timestamp: "14:10:03.119", level: "FATAL", message: "FATAL: remaining connection slots are reserved for non-replication superuser connections" },
          { timestamp: "14:10:05.450", level: "WARN", message: "[pg_stat_activity] 184 sessions in state 'idle in transaction' > 300s" }
        ],
        rootCause: "Lock ordering inconsistente entre 'UPDATE accounts' e 'UPDATE transactions' e ausência de pg_terminate_backend em conexões zumbis.",
        expectedHotfixCommands: [
          "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';",
          "ALTER SYSTEM SET idle_in_transaction_session_timeout = '10s';",
          "systemctl reload postgresql"
        ],
        mitigationChecks: [
          { id: "c1", description: "Eliminar conexões travadas em idle in transaction", resolved: false },
          { id: "c2", description: "Configurar timeout de sessão de transação ociosa", resolved: false },
          { id: "c3", description: "Recuperar tempo de resposta das transações para < 100ms", resolved: false }
        ]
      },
      {
        id: "inc-03-redis-storm",
        title: "Cache Avalanche & Tempestade de Leituras no Banco",
        serviceName: "redis-cluster-cache",
        severity: "P2_HIGH",
        slaMinutes: 15,
        description: "Expirador global de TTL síncrono fez 50.000 chaves de catálogo expirarem no mesmo segundo, direcionando todo o tráfego direto para o banco de dados.",
        symptoms: [
          "Cache hit ratio caiu de 98% para 4%",
          "Banco de dados com 100% de I/O Disk Bottleneck",
          "Latência p99 de catálogo subiu para 3.500ms"
        ],
        initialMetrics: {
          cpuPercent: 75,
          memoryPercent: 40,
          errorRatePercent: 19,
          latencyP99Ms: 3500
        },
        sampleLogs: [
          { timestamp: "14:20:00.001", level: "WARN", message: "[redis] Mass key eviction triggered: 52,100 keys TTL expired" },
          { timestamp: "14:20:01.210", level: "ERROR", message: "[app] Cache MISS storm on product_catalog_*: routing to primary DB" },
          { timestamp: "14:20:02.990", level: "WARN", message: "[db_pool] Disk IOPS saturated at 10,000 IOPS (100%)" }
        ],
        rootCause: "TTL fixo sem jitter (aleatoriedade) no momento da escrita no Redis.",
        expectedHotfixCommands: [
          "redis-cli --eval warmup_catalog.lua",
          "patch-cache --enable-jitter-ttl --delta=300",
          "systemctl restart app-catalog"
        ],
        mitigationChecks: [
          { id: "c1", description: "Executar script de warm-up das chaves críticas", resolved: false },
          { id: "c2", description: "Aplicar jitter no cálculo de TTL de cache", resolved: false },
          { id: "c3", description: "Elevar Cache Hit Ratio acima de 90%", resolved: false }
        ]
      }
    ];
  }

  /**
   * Initializes a new War Room incident response session
   */
  public static startWarRoom(scenarioId: string, studentName = "Engenheiro SRE"): WarRoomSession {
    const scenarios = this.getScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId) || scenarios[0];

    return {
      sessionId: `sre_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentName,
      scenario: JSON.parse(JSON.stringify(scenario)),
      startedAt: new Date().toISOString(),
      slaRemainingSeconds: scenario.slaMinutes * 60,
      status: "ACTIVE_OUTAGE",
      terminalHistory: [
        {
          command: "systemctl status " + scenario.serviceName,
          output: `● ${scenario.serviceName} - High Availability Cluster Service\n   Loaded: loaded\n   Active: active (degraded) since ${new Date().toLocaleTimeString()}\n   Status: "ALERT: Error threshold exceeded. Incident triggered."`,
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      appliedPatches: [],
      finalScore: 0
    };
  }

  /**
   * Executes a command inside the SRE Virtual Production Shell
   */
  public static executeCommand(session: WarRoomSession, commandStr: string): { session: WarRoomSession; feedback: string } {
    const cmd = commandStr.trim();
    const nowStr = new Date().toLocaleTimeString();
    let responseText = "";

    if (!cmd) {
      return { session, feedback: "Comando vazio." };
    }

    if (cmd.startsWith("help")) {
      responseText = `Comandos Disponíveis:\n  top / htop           - Monitor de processos e memória\n  systemctl status     - Inspecionar serviço\n  systemctl restart    - Reiniciar serviço\n  kubectl get pods     - Listar pods do cluster\n  kubectl scale        - Escalar réplicas de deployment\n  patch-service        - Aplicar hotfix no código\n  patch-cache          - Ajustar configurações de cache\n  psql -c <query>      - Executar comando SQL corretivo\n  mitigate             - Homologar e concluir mitigação`;
    } else if (cmd.includes("top") || cmd.includes("htop")) {
      responseText = `PID  USER    PR  NI  VIRT   RES   SHR  S  %CPU  %MEM    TIME+   COMMAND\n1409 node    20   0  4.2g  3.9g  12m  R  88.2  96.4   14:22.10 payment-worker\n9918 postgres 20   0  1.1g  800m  45m  S  12.0  19.5    5:11.02 postgres: deadlock_txn`;
    } else if (cmd.includes("kubectl get pods")) {
      responseText = `NAME                                READY   STATUS      RESTARTS   AGE\npayment-worker-7d6f58-a89f          0/1     OOMKilled   12         35m\npayment-worker-7d6f58-x10c          1/1     Running     0          2m\npostgres-primary-0                  1/1     Running     0          4d`;
    } else if (cmd.includes("scale") || cmd.includes("patch") || cmd.includes("terminate_backend") || cmd.includes("warmup") || cmd.includes("restart") || cmd.includes("reload")) {
      session.appliedPatches.push(cmd);
      
      // Check mitigations
      session.scenario.mitigationChecks.forEach(check => {
        check.resolved = true;
      });

      // Recover metrics
      session.scenario.initialMetrics.cpuPercent = Math.max(15, session.scenario.initialMetrics.cpuPercent - 50);
      session.scenario.initialMetrics.memoryPercent = Math.max(25, session.scenario.initialMetrics.memoryPercent - 60);
      session.scenario.initialMetrics.errorRatePercent = 0.2;
      session.scenario.initialMetrics.latencyP99Ms = 45;

      responseText = `[OK] Comando executado com sucesso no cluster.\nTelemetria estabilizada: Erros 5xx reduzidos para 0.2%. Latência p99 normalizada em 45ms.`;
      session.status = "MITIGATED";
      session.finalScore = Math.min(100, Math.round((session.slaRemainingSeconds / (session.scenario.slaMinutes * 60)) * 60 + 40));
    } else if (cmd === "mitigate" || cmd === "resolve") {
      if (session.appliedPatches.length > 0) {
        session.status = "MITIGATED";
        responseText = `[SUCESSO] Incidente mitigado dentro da janela de SLA. Parabéns, engenheiro!`;
      } else {
        responseText = `[ERRO] O incidente ainda não foi mitigado. Nenhuma ação corretiva válida foi aplicada.`;
      }
    } else {
      responseText = `bash: ${cmd}: comando simulado executado. Use 'help' para comandos de troubleshooting.`;
    }

    session.terminalHistory.push({
      command: cmd,
      output: responseText,
      timestamp: nowStr
    });

    return { session, feedback: responseText };
  }

  /**
   * Generates a PDF Incident Postmortem / RCA Report
   */
  public static exportPostmortemPdf(session: WarRoomSession): void {
    const doc = new jsPDF();

    doc.setFillColor(225, 29, 72);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("POSTMORTEM DE INCIDENTE & RELATÓRIO RCA (SRE)", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(254, 205, 211);
    doc.text(`CODECHECK 2026 • SRE WAR ROOM • INCIDENT ID: ${session.sessionId}`, 14, 26);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Engenheiro Responsável: ${session.studentName}`, 14, 45);
    doc.text(`Cenário de Desastre: ${session.scenario.title}`, 14, 52);
    doc.text(`Severidade: ${session.scenario.severity} • Serviço: ${session.scenario.serviceName}`, 14, 59);
    doc.text(`Status Final: ${session.status} • Nota de Resolução: ${session.finalScore}/100`, 14, 66);

    autoTable(doc, {
      startY: 74,
      head: [["Item de Auditoria", "Resultado"]],
      body: [
        ["Causa Raiz Identificada", session.scenario.rootCause],
        ["SLA Original", `${session.scenario.slaMinutes} minutos`],
        ["Tempo Restante no Cronômetro", `${Math.round(session.slaRemainingSeconds / 60)}m ${session.slaRemainingSeconds % 60}s`],
        ["Patches e Comandos de Mitigação", session.appliedPatches.join(" | ") || "Nenhum patch aplicado"],
        ["Veredito SRE", session.status === "MITIGATED" ? "INCIDENTE MITIGADO COM SUCESSO" : "VIOLAÇÃO DE SLA EM PRODUÇÃO"]
      ],
      theme: "striped",
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.text("Histórico de Comandos no Terminal de Produção:", 14, finalY);

    const logRows = session.terminalHistory.map(t => [
      t.timestamp,
      t.command,
      t.output.slice(0, 60) + (t.output.length > 60 ? "..." : "")
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Hora", "Comando Executado", "Saída"]],
      body: logRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] }
    });

    doc.save(`postmortem_sre_${session.scenario.id}_${session.sessionId}.pdf`);
  }
}
