import { ProviderFactory, CustomAIRequestOptions } from "../ai/factory/ProviderFactory";

export interface StudentDesk {
  deskId: string;
  deskNumber: number;
  rowNumber: number;
  colNumber: number;
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  status: "smooth" | "attention" | "stuck" | "completed" | "mentoring";
  activeTaskTitle: string;
  currentCodeSnippet?: string;
  lastActiveMinutesAgo: number;
  compilationErrorsCount: number;
  stuckReason?: string;
  stuckTimestamp?: string;
  assignedMentorDeskId?: string;
  badgesEarnedToday: string[];
  quickNotes: string[];
}

export interface LabLayoutConfig {
  labName: string;
  rows: number;
  cols: number;
  totalDesks: number;
  activeSessionTheme: string;
  pomodoroMinutesRemaining?: number;
  isLabPaused?: boolean;
}

export interface StuckTicket {
  ticketId: string;
  deskNumber: number;
  studentId: string;
  studentName: string;
  doubtSummary: string;
  errorCodeSnippet?: string;
  waitingMinutes: number;
  aiDiagnosticSuggestion: string;
  suggestedAction: "send_micro_hint" | "dispatch_peer_mentor" | "teacher_in_person";
  suggestedPeerMentor?: {
    deskNumber: number;
    studentName: string;
  };
  status: "pending" | "hint_sent" | "mentor_assigned" | "resolved";
}

export interface LabClosingSummary {
  sessionId: string;
  date: string;
  theme: string;
  totalStudentsPresent: number;
  totalTicketsResolved: number;
  averageWaitTimeMinutes: number;
  topRecurringDoubt: string;
  recommendedNextClassRecap: string;
  highlightStudents: Array<{
    name: string;
    reason: string;
  }>;
  generatedAt: string;
}

export class TeacherLiveLabCompanionService {
  /**
   * Generates default realistic desks for a computer lab
   */
  static getInitialLabState(): { layout: LabLayoutConfig; desks: StudentDesk[]; tickets: StuckTicket[] } {
    const layout: LabLayoutConfig = {
      labName: "Laboratório 04 - Informática & Redes SENAI",
      rows: 4,
      cols: 6,
      totalDesks: 24,
      activeSessionTheme: "Construção de APIs REST com Express e Validações Defensivas",
      pomodoroMinutesRemaining: 25,
      isLabPaused: false
    };

    const studentMocks = [
      { id: "st-01", name: "Ana Beatriz Silva", status: "completed" as const, task: "Boss Challenge: Cache Redis", errors: 0, badges: ["⚡ Resolução Rápida", "🛡️ Clean Code"], notes: ["Excelente autonomia"] },
      { id: "st-02", name: "Carlos Eduardo Santos", status: "smooth" as const, task: "Desafio 2: Rota POST /pedidos", errors: 1, badges: ["💡 Lógica Afiada"], notes: [] },
      { id: "st-03", name: "Mariana Oliveira Costa", status: "stuck" as const, task: "Desafio 1: Desestruturar req.body", errors: 4, stuckReason: "TypeError: Cannot destructure property 'itens' of req.body as it is undefined", badges: [], notes: ["Acompanhar de perto"] },
      { id: "st-04", name: "Lucas Ferreira Lima", status: "smooth" as const, task: "Desafio 2: Rota POST /pedidos", errors: 0, badges: ["🤝 Colaborativo"], notes: [] },
      { id: "st-05", name: "Beatriz Helena Prado", status: "attention" as const, task: "Desafio 1: Criar servidor Express", errors: 3, badges: [], notes: [] },
      { id: "st-06", name: "Gabriel Henrique Ramos", status: "stuck" as const, task: "Desafio 2: Integração com Banco", errors: 5, stuckReason: "Error: connect ECONNREFUSED 127.0.0.1:5432", badges: [], notes: [] },
      { id: "st-07", name: "Rafaela Souza Dias", status: "mentoring" as const, task: "Apoiando Bancada 03", errors: 0, badges: ["🎓 Mentor do Dia"], notes: ["Mentoria exemplar"] },
      { id: "st-08", name: "Felipe Augusto Lima", status: "smooth" as const, task: "Desafio 2: Validações Zod", errors: 1, badges: [], notes: [] },
      { id: "st-09", name: "Juliana Mendes Castro", status: "smooth" as const, task: "Desafio 3: Middleware de Auth", errors: 0, badges: ["⚡ Resolução Rápida"], notes: [] },
      { id: "st-10", name: "Matheus Pereira Borges", status: "attention" as const, task: "Desafio 1: Configuração do Package.json", errors: 2, badges: [], notes: [] },
      { id: "st-11", name: "Larissa Cristine Alves", status: "smooth" as const, task: "Desafio 2: Rota DELETE", errors: 0, badges: [], notes: [] },
      { id: "st-12", name: "Thiago Vasconcelos", status: "smooth" as const, task: "Desafio 2: Status 204", errors: 0, badges: [], notes: [] },
      { id: "st-13", name: "Camila Nogueira Rocha", status: "smooth" as const, task: "Desafio 3: Tratamento de Erros", errors: 1, badges: [], notes: [] },
      { id: "st-14", name: "Enzo Gabriel Martins", status: "stuck" as const, task: "Desafio 1: Instalação de Dependências", errors: 6, stuckReason: "npm ERR! code EACCES / permissão negada no Linux", badges: [], notes: [] },
      { id: "st-15", name: "Isabela Fontana", status: "completed" as const, task: "Boss Challenge: Dockerfile", errors: 0, badges: ["⭐ Mestre do Código"], notes: [] },
      { id: "st-16", name: "Diego Armando Costa", status: "smooth" as const, task: "Desafio 2: Tratamento de CORS", errors: 1, badges: [], notes: [] },
      { id: "st-17", name: "Sofia Albuquerque", status: "smooth" as const, task: "Desafio 2: Router Modular", errors: 0, badges: ["🛡️ Clean Code"], notes: [] },
      { id: "st-18", name: "Leonardo Vinicius", status: "attention" as const, task: "Desafio 1: Express App Listen", errors: 3, badges: [], notes: [] }
    ];

    const desks: StudentDesk[] = [];
    let studentIndex = 0;

    for (let r = 1; r <= layout.rows; r++) {
      for (let c = 1; c <= layout.cols; c++) {
        const deskNum = (r - 1) * layout.cols + c;
        if (studentIndex < studentMocks.length) {
          const st = studentMocks[studentIndex];
          desks.push({
            deskId: `desk-${deskNum}`,
            deskNumber: deskNum,
            rowNumber: r,
            colNumber: c,
            studentId: st.id,
            studentName: st.name,
            status: st.status,
            activeTaskTitle: st.task,
            currentCodeSnippet: `// Bancada ${deskNum} - ${st.name}\nimport express from "express";\nconst app = express();\napp.use(express.json());`,
            lastActiveMinutesAgo: Math.floor(Math.random() * 3),
            compilationErrorsCount: st.errors,
            stuckReason: st.stuckReason,
            stuckTimestamp: st.stuckReason ? "Há 4 min" : undefined,
            badgesEarnedToday: st.badges,
            quickNotes: st.notes
          });
          studentIndex++;
        } else {
          // Empty computer station
          desks.push({
            deskId: `desk-${deskNum}`,
            deskNumber: deskNum,
            rowNumber: r,
            colNumber: c,
            studentId: `empty-${deskNum}`,
            studentName: `Bancada Livre (${deskNum})`,
            status: "smooth",
            activeTaskTitle: "Estação Disponível",
            lastActiveMinutesAgo: 99,
            compilationErrorsCount: 0,
            badgesEarnedToday: [],
            quickNotes: []
          });
        }
      }
    }

    const tickets: StuckTicket[] = [
      {
        ticketId: "tk-01",
        deskNumber: 3,
        studentId: "st-03",
        studentName: "Mariana Oliveira Costa",
        doubtSummary: "Erro ao tentar ler o payload de req.body no endpoint POST.",
        errorCodeSnippet: `app.post("/pedidos", (req, res) => {\n  const { itens } = req.body; // <-- TypeError\n});`,
        waitingMinutes: 4,
        aiDiagnosticSuggestion: "Esqueceu de registrar o middleware `app.use(express.json())` antes de declarar as rotas.",
        suggestedAction: "send_micro_hint",
        suggestedPeerMentor: {
          deskNumber: 1,
          studentName: "Ana Beatriz Silva"
        },
        status: "pending"
      },
      {
        ticketId: "tk-02",
        deskNumber: 6,
        studentId: "st-06",
        studentName: "Gabriel Henrique Ramos",
        doubtSummary: "Banco PostgreSQL local não está aceitando conexão na porta 5432.",
        errorCodeSnippet: `const pool = new Pool({ port: 5432, host: "localhost" });`,
        waitingMinutes: 6,
        aiDiagnosticSuggestion: "O serviço do PostgreSQL ou container Docker pode estar parado. Sugira rodar `docker ps` ou `net start postgresql`.",
        suggestedAction: "dispatch_peer_mentor",
        suggestedPeerMentor: {
          deskNumber: 15,
          studentName: "Isabela Fontana"
        },
        status: "pending"
      },
      {
        ticketId: "tk-03",
        deskNumber: 14,
        studentId: "st-14",
        studentName: "Enzo Gabriel Martins",
        doubtSummary: "Permissão negada ao rodar npm install.",
        errorCodeSnippet: `npm ERR! code EACCES syscall mkdir`,
        waitingMinutes: 2,
        aiDiagnosticSuggestion: "Permissão de pasta restrita. Sugira ajustar permissões do diretório de trabalho com `chmod` ou usar terminal com privilégio.",
        suggestedAction: "teacher_in_person",
        status: "pending"
      }
    ];

    return { layout, desks, tickets };
  }

  /**
   * AI-Assisted Micro-Hint Generator for a stuck student
   */
  static async generateSocraticMicroHint(params: {
    studentName: string;
    doubtSummary: string;
    codeSnippet?: string;
    customAI?: CustomAIRequestOptions;
  }): Promise<{ hintText: string; promptReflection: string }> {
    const prompt = `Você é o Copiloto da Bancada do Laboratório SENAI.
Um aluno está travado durante a aula prática.
ALUNO: "${params.studentName}"
DÚVIDA/ERRO: "${params.doubtSummary}"
CÓDIGO: "${params.codeSnippet || "Sem snippet"}"

Gere uma micro-dica socrática de no máximo 2 frases, que estimule o aluno a encontrar o erro sem entregar a resposta pronta mastigada.
Formato JSON estrito:
{
  "hintText": "Dica socrática clara e motivadora...",
  "promptReflection": "Pergunta de reflexão para o aluno..."
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 1000 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        hintText: parsed.hintText || "Verifique se você registrou todos os middlewares necessários no topo do seu arquivo antes de usar o `req.body`.",
        promptReflection: parsed.promptReflection || "Qual função do Express é responsável por interpretar o corpo das requisições como JSON?"
      };
    } catch {
      return {
        hintText: "💡 Dica da Bancada: Lembre-se de que o Express por padrão não sabe ler corpos JSON sem o middleware `app.use(express.json())` configurado no início.",
        promptReflection: "Onde no seu arquivo principal você configurou os middlewares da aplicação?"
      };
    }
  }

  /**
   * AI Closing Debrief Generator at the end of the lab session
   */
  static async generateLabClosingDebrief(params: {
    theme: string;
    desks: StudentDesk[];
    ticketsResolvedCount: number;
    customAI?: CustomAIRequestOptions;
  }): Promise<LabClosingSummary> {
    const presentCount = params.desks.filter(d => !d.studentId.startsWith("empty-")).length;
    const completedCount = params.desks.filter(d => d.status === "completed").length;

    const prompt = `Você é o Coordenador Pedagógico do SENAI.
A aula prática de laboratório acabou de encerrar.
TEMA: "${params.theme}"
ESTUDANTES PRESENTES: ${presentCount}
DESAFIOS CONCLUÍDOS: ${completedCount}
TICKETS ATENDIDOS: ${params.ticketsResolvedCount}

Gere o Dossiê Rápido de Fechamento da Aula em JSON estrito:
{
  "topRecurringDoubt": "Principal ponto de dúvida que travou os alunos na bancada...",
  "recommendedNextClassRecap": "O que o professor deve revisar nos primeiros 10 minutos da próxima aula...",
  "highlightStudents": [
    { "name": "Ana Beatriz Silva", "reason": "Excelente desempenho como mentora de bancada" },
    { "name": "Mariana Oliveira Costa", "reason": "Superou o bloqueio inicial em middlewares com persistência" }
  ]
}`;

    try {
      const provider = ProviderFactory.createCustomProvider(params.customAI);
      const aiResponse = await provider.generateContent(prompt, { temperature: 0.2, max_tokens: 1500 });
      const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return {
        sessionId: "session-" + Date.now(),
        date: new Date().toLocaleDateString("pt-BR"),
        theme: params.theme,
        totalStudentsPresent: presentCount,
        totalTicketsResolved: params.ticketsResolvedCount,
        averageWaitTimeMinutes: 3.2,
        topRecurringDoubt: parsed.topRecurringDoubt || "Configuração e ordem de execução dos Middlewares no Express.",
        recommendedNextClassRecap: parsed.recommendedNextClassRecap || "Revisar o ciclo de vida da requisição (Request -> Middleware -> Controller -> Response).",
        highlightStudents: parsed.highlightStudents || [
          { name: "Ana Beatriz Silva", reason: "Atuou como mentora exemplar de bancada." },
          { name: "Mariana Oliveira Costa", reason: "Demonstrou resiliência e concluiu o laboratório." }
        ],
        generatedAt: new Date().toISOString()
      };
    } catch {
      return {
        sessionId: "session-" + Date.now(),
        date: new Date().toLocaleDateString("pt-BR"),
        theme: params.theme,
        totalStudentsPresent: presentCount,
        totalTicketsResolved: params.ticketsResolvedCount,
        averageWaitTimeMinutes: 3.2,
        topRecurringDoubt: "Configuração de middlewares e tratamento de erros assíncronos no Express.",
        recommendedNextClassRecap: "Dedicar 10 minutos para Live Coding demonstrando a ordem correta de middlewares e tratamento global de erros.",
        highlightStudents: [
          { name: "Ana Beatriz Silva", reason: "Destacou-se finalizando o Boss Challenge e apoiando colegas." },
          { name: "Mariana Oliveira Costa", reason: "Evolução expressiva após intervenção na bancada." }
        ],
        generatedAt: new Date().toISOString()
      };
    }
  }
}
