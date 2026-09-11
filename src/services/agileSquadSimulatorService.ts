import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";
import { jsPDF } from "jspdf";

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
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(56, 189, 248);
    doc.setFontSize(9);
    doc.text("SENAI TECNOLOGIA • CODECHECK AI", 14, 10);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text("LAUDO TÉCNICO & RELATÓRIO OFICIAL DE AVALIAÇÃO", 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 14, 35);
    doc.text("Status: Homologado & Concluído", 14, 42);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text("Este documento certifica a auditoria e os laudos gerados pelo sistema.", 14, 52);

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }
}
