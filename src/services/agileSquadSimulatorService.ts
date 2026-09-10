import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import PDFDocument from "pdfkit";

export type KanbanColumn = "BACKLOG" | "TODO" | "IN_PROGRESS" | "CODE_REVIEW" | "DONE";

export interface UserStory {
  id: string;
  title: string;
  storyPoints: number;
  status: KanbanColumn;
  assignee: string; // "Student", "Ana (Dev Front)", "Carlos (Dev Back)", "AI Lead"
  acceptanceCriteria: string[];
  gitBranchName: string;
  hasMergeConflict?: boolean;
}

export interface DailyStandupEntry {
  participantName: string;
  role: "Scrum Master AI" | "Product Owner AI" | "Peer Dev" | "Student";
  yesterday: string;
  today: string;
  blockers: string;
}

export interface SprintState {
  sprintId: string;
  sprintNumber: number;
  goal: string;
  durationDays: number;
  currentDay: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  stories: UserStory[];
  dailyStandupHistory: DailyStandupEntry[];
  burndownData: { day: number; idealPoints: number; actualPoints: number }[];
  emergencyEventsTriggered: string[];
  sprintHealth: "NO_PRAZO" | "ATENCAO_GARGALO" | "ESCOPO_ESTOURADO";
  retrospectiveHighlights: {
    whatWentWell: string[];
    whatNeedsImprovement: string[];
    actionItems: string[];
  };
}

export class AgileSquadSimulatorService {
  /**
   * Starts a new Virtual Agile Scrum Sprint.
   */
  static async startSprint(params: {
    studentName: string;
    sprintGoal?: string;
    storyCount?: number;
    providerConfig?: CustomAIRequestOptions;
  }): Promise<SprintState> {
    const sprintId = `sprint_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const studentName = params.studentName || "Lucas Gabriel";
    const goal = params.sprintGoal || "Desenvolver Módulo de Checkout Resiliente e Autenticação JWT";

    const prompt = `Você é um Agile Coach e Scrum Master Especialista em Metodologias Ágeis SENAI.
Crie um Sprint Backlog industrial para a meta: "${goal}". Aluno principal: ${studentName}.
Gere 4 User Stories estruturadas com pontuação Fibonacci (2, 3, 5, 8), critérios de aceite e branches git.

Responda em JSON:
{
  "stories": [
    {
      "id": "US-101",
      "title": "...",
      "storyPoints": 5,
      "status": "TODO",
      "assignee": "${studentName}",
      "acceptanceCriteria": ["critério 1", "critério 2"],
      "gitBranchName": "feature/us-101-auth"
    }
  ],
  "dailyStandup": [
    {
      "participantName": "Mariana (Scrum Master AI)",
      "role": "Scrum Master AI",
      "yesterday": "Facilitei o planejamento da sprint.",
      "today": "Acompanhando o fluxo no Kanban.",
      "blockers": "Nenhum."
    },
    {
      "participantName": "Roberto (Product Owner AI)",
      "role": "Product Owner AI",
      "yesterday": "Validei as regras de negócio com o cliente.",
      "today": "Refinando histórias futuras.",
      "blockers": "Nenhum."
    }
  ]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.providerConfig);
      const raw = await provider.generateContent(prompt, { temperature: 0.3, max_tokens: 2500 });
      const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);

      const stories: UserStory[] = Array.isArray(parsed.stories) && parsed.stories.length > 0 ? parsed.stories : this.getDefaultStories(studentName);
      const totalPoints = stories.reduce((acc, s) => acc + s.storyPoints, 0);

      return {
        sprintId,
        sprintNumber: 1,
        goal,
        durationDays: 10,
        currentDay: 3,
        totalStoryPoints: totalPoints,
        completedStoryPoints: 5,
        stories,
        dailyStandupHistory: parsed.dailyStandup || this.getDefaultStandups(),
        burndownData: [
          { day: 1, idealPoints: totalPoints, actualPoints: totalPoints },
          { day: 2, idealPoints: Math.round(totalPoints * 0.8), actualPoints: totalPoints },
          { day: 3, idealPoints: Math.round(totalPoints * 0.6), actualPoints: totalPoints - 5 }
        ],
        emergencyEventsTriggered: [],
        sprintHealth: "NO_PRAZO",
        retrospectiveHighlights: {
          whatWentWell: ["Excelente comunicação entre membros do squad", "Testes unitários cobrindo critérios de aceitação"],
          whatNeedsImprovement: ["Diminuir tempo gasto em revisão de PRs", "Planejar melhor dependências de banco"],
          actionItems: ["Adicionar CI/CD automatizado no repositório", "Realizar refinamento prévio das histórias"]
        }
      };
    } catch (err) {
      console.warn("[AgileSquadSimulatorService] Fallback applied:", err);
      const stories = this.getDefaultStories(studentName);
      const totalPoints = stories.reduce((acc, s) => acc + s.storyPoints, 0);

      return {
        sprintId,
        sprintNumber: 1,
        goal,
        durationDays: 10,
        currentDay: 3,
        totalStoryPoints: totalPoints,
        completedStoryPoints: 5,
        stories,
        dailyStandupHistory: this.getDefaultStandups(),
        burndownData: [
          { day: 1, idealPoints: totalPoints, actualPoints: totalPoints },
          { day: 2, idealPoints: Math.round(totalPoints * 0.8), actualPoints: totalPoints },
          { day: 3, idealPoints: Math.round(totalPoints * 0.6), actualPoints: totalPoints - 5 }
        ],
        emergencyEventsTriggered: [],
        sprintHealth: "NO_PRAZO",
        retrospectiveHighlights: {
          whatWentWell: ["Clara divisão de responsabilidades"],
          whatNeedsImprovement: ["Monitorar gargalos na coluna de Code Review"],
          actionItems: ["Pair programming em histórias complexas"]
        }
      };
    }
  }

  /**
   * Triggers an autonomous mid-sprint scope event (Product Owner AI sudden requirement or Git merge conflict).
   */
  static async triggerSprintEvent(params: {
    sprint: SprintState;
    eventType: "SCOPE_CHANGE_PO" | "GIT_MERGE_CONFLICT" | "CRITICAL_BUG_INTRUSION";
  }): Promise<{ updatedSprint: SprintState; announcementMessage: string }> {
    let announcement = "";
    const updatedStories = [...params.sprint.stories];

    if (params.eventType === "SCOPE_CHANGE_PO") {
      announcement = "🚨 [Product Owner AI]: O cliente mudou a política de cálculo de impostos! Uma nova User Story de 3 pontos foi adicionada à sprint.";
      updatedStories.push({
        id: `US-${100 + updatedStories.length + 1}`,
        title: "Adaptação de Cálculo Tributário Dinâmico (ICMS/ISS)",
        storyPoints: 3,
        status: "TODO",
        assignee: "Student",
        acceptanceCriteria: ["Calcular alíquota por UF de destino", "Garantir tolerância a falhas na API da SEFAZ"],
        gitBranchName: "feature/tax-recalculation"
      });
    } else if (params.eventType === "GIT_MERGE_CONFLICT") {
      announcement = "⚠️ [GitOps Simulator]: Conflito de Merge detectado na branch 'feature/us-101-auth'! O dev Carlos alterou o middleware de autenticação simultaneamente.";
      if (updatedStories.length > 0) {
        updatedStories[0] = { ...updatedStories[0], hasMergeConflict: true, status: "CODE_REVIEW" };
      }
    } else {
      announcement = "🔥 [Bug Crítico em Produção]: Vazamento de memória detectado no container de pagamentos! É necessário interromper o fluxo para aplicar hotfix.";
    }

    const totalPoints = updatedStories.reduce((acc, s) => acc + s.storyPoints, 0);

    const updatedSprint: SprintState = {
      ...params.sprint,
      stories: updatedStories,
      totalStoryPoints: totalPoints,
      emergencyEventsTriggered: [...params.sprint.emergencyEventsTriggered, announcement],
      sprintHealth: params.eventType === "SCOPE_CHANGE_PO" ? "ATENCAO_GARGALO" : params.sprint.sprintHealth
    };

    return { updatedSprint, announcementMessage: announcement };
  }

  private static getDefaultStories(studentName: string): UserStory[] {
    return [
      {
        id: "US-101",
        title: "Implementação de Autenticação Segura com Refresh Token e Rotação",
        storyPoints: 5,
        status: "IN_PROGRESS",
        assignee: studentName,
        acceptanceCriteria: [
          "Token JWT emitido com validade máxima de 15 minutos",
          "Refresh token persistido em tabela com expiração e revogação ativa"
        ],
        gitBranchName: "feature/us-101-auth-jwt"
      },
      {
        id: "US-102",
        title: "Endpoint de Processamento de Pagamento com Idempotência",
        storyPoints: 8,
        status: "TODO",
        assignee: studentName,
        acceptanceCriteria: [
          "Cabeçalho Idempotency-Key obrigatório para evitar cobranças duplicadas",
          "Tratamento de timeout de 3 segundos com Circuit Breaker"
        ],
        gitBranchName: "feature/us-102-checkout-idempotency"
      },
      {
        id: "US-103",
        title: "Interface de Usuário do Carrinho com Cálculo de Frete",
        storyPoints: 3,
        status: "DONE",
        assignee: "Ana (Dev Front)",
        acceptanceCriteria: [
          "Design responsivo acessível WCAG 2.2",
          "Feedback visual de carregamento durante chamada de API"
        ],
        gitBranchName: "feature/us-103-cart-ui"
      }
    ];
  }

  private static getDefaultStandups(): DailyStandupEntry[] {
    return [
      {
        participantName: "Mariana (Scrum Master AI)",
        role: "Scrum Master AI",
        yesterday: "Conduzi a sessão de Refinamento de Backlog.",
        today: "Acompanhando os impedimentos no pipeline de CI/CD.",
        blockers: "Nenhum."
      },
      {
        participantName: "Roberto (Product Owner AI)",
        role: "Product Owner AI",
        yesterday: "Aprovei as entregas de UI do carrinho.",
        today: "Validando contratos de API de pagamento com o time financeiro.",
        blockers: "Nenhum."
      }
    ];
  }

  /**
   * Generates official Agile Squad Performance & Sprint Retrospective PDF Dossier.
   */
  static async generateAgileReportPdf(sprint: SprintState): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Header Brand
      doc.rect(40, 40, doc.page.width - 80, 50).fill("#0c4a6e");
      doc.fillColor("#38bdf8").font("Helvetica-Bold").fontSize(18).text("AGILE SCRUM SQUAD & GITOPS PERFORMANCE DOSSIER", 55, 52);
      doc.fillColor("#bae6fd").font("Helvetica").fontSize(9).text("SENAI Metodologias Ágeis, Gestão de Squads & Simulação GitOps", 55, 73);

      doc.moveDown(3);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(14).text("1. Sumário Executivo da Sprint");
      doc.moveDown(0.5);

      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      doc.text(`Identificador da Sprint: ${sprint.sprintId} (Sprint ${sprint.sprintNumber})`);
      doc.text(`Objetivo da Sprint: ${sprint.goal}`);
      doc.text(`Progresso: Dia ${sprint.currentDay} de ${sprint.durationDays} | Saúde: ${sprint.sprintHealth}`);
      doc.text(`Story Points: ${sprint.completedStoryPoints} entregues de ${sprint.totalStoryPoints} planejados`);

      doc.moveDown(1);

      // Scorecard
      doc.rect(40, doc.y, doc.page.width - 80, 55).fill("#f0f9ff");
      const cardY = doc.y + 8;
      doc.fillColor("#0369a1").font("Helvetica-Bold").fontSize(11).text("VELOCIDADE & TAXA DE ENTREGA (BURNDOWN)", 55, cardY);
      
      const completionRate = Math.round((sprint.completedStoryPoints / Math.max(1, sprint.totalStoryPoints)) * 100);
      doc.fillColor("#0284c7").font("Helvetica-Bold").fontSize(20).text(`${completionRate}%`, 55, cardY + 18);
      doc.fillColor("#475569").font("Helvetica").fontSize(9).text(
        `Total de Histórias: ${sprint.stories.length} | Eventos de Escopo Injetados: ${sprint.emergencyEventsTriggered.length}`,
        140,
        cardY + 22
      );

      doc.moveDown(3.5);

      // User Stories
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("2. Quadro de User Stories & Status GitOps");
      doc.moveDown(0.5);

      sprint.stories.forEach((s) => {
        const color = s.status === "DONE" ? "#16a34a" : s.status === "IN_PROGRESS" ? "#0284c7" : "#d97706";
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text(`• [${s.id}] ${s.title}: `, { continued: true });
        doc.fillColor(color).text(`[${s.status}] (${s.storyPoints} pts - ${s.assignee})`);
        doc.font("Helvetica").fontSize(8.5).fillColor("#475569").text(`   Branch: ${s.gitBranchName} ${s.hasMergeConflict ? "| ⚠️ CONFLITO DE MERGE" : ""}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);

      // Retrospective
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(13).text("3. Retrospectiva da Sprint & Ações de Melhoria Contínua");
      doc.moveDown(0.5);

      sprint.retrospectiveHighlights.whatWentWell.forEach(w => {
        doc.font("Helvetica").fontSize(9).fillColor("#15803d").text(`✓ Ponto Positivo: ${w}`);
      });
      sprint.retrospectiveHighlights.actionItems.forEach(a => {
        doc.font("Helvetica").fontSize(9).fillColor("#0369a1").text(`→ Plano de Ação: ${a}`);
      });

      // Footer
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8").text("CodeCheck AI • Plataforma Educacional de Excelência Tecnológica SENAI", 40, doc.page.height - 30, {
        align: "center"
      });

      doc.end();
    });
  }
}
