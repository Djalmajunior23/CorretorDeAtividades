/**
 * ============================================================================
 * TEACHER DAILY HUB SERVICE ("MEU DIA DOCENTE")
 * ============================================================================
 * Implements:
 * 1. Today's and upcoming classes schedule.
 * 2. Classes, activities, and required didactic materials.
 * 3. Pending submissions awaiting grading & student help requests.
 * 4. Critical deadlines & SLA alerts.
 * 5. "Último Ponto de Trabalho" (1-click resume where the teacher left off).
 * ============================================================================
 */

export interface DailyScheduleItem {
  id: string;
  timeSlot: string; // e.g. "07:30 - 09:10"
  className: string;
  classRoom: string;
  topic: string;
  competency: string;
  status: "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA";
  requiredMaterials: {
    id: string;
    title: string;
    type: "SLIDES" | "APOSTILA" | "LAB_CODE" | "SIMULADOR";
    url?: string;
  }[];
  activeActivityTitle?: string;
  activeActivityId?: string;
}

export interface LastWorkPosition {
  module: string;
  tabId: string;
  title: string;
  description: string;
  lastUpdatedIso: string;
  contextParams?: Record<string, string>;
}

export interface DailyHubOverview {
  teacherId: string;
  teacherName: string;
  dateIso: string;
  todayClasses: DailyScheduleItem[];
  pendingGradingCount: number;
  openHelpRequestsCount: number;
  upcomingDeadlines: {
    activityId: string;
    activityTitle: string;
    className: string;
    deadlineIso: string;
    submittedRatio: string;
  }[];
  lastWorkPosition: LastWorkPosition;
  pinnedShortcuts: {
    id: string;
    label: string;
    tabId: string;
    icon: string;
    badgeCount?: number;
  }[];
}

export class TeacherDailyHubService {
  private static overviewData: DailyHubOverview = {
    teacherId: "prof-djalma",
    teacherName: "Professor Djalma Batista",
    dateIso: new Date().toISOString(),
    todayClasses: [
      {
        id: "sch-01",
        timeSlot: "07:30 - 09:10",
        className: "Desenvolvimento de Sistemas - Turma A",
        classRoom: "Laboratório de Software 03",
        topic: "Estruturas de Repetição & Funções Modulares em Python",
        competency: "Construir algoritmos com loops controlados e modularização",
        status: "CONCLUIDA",
        requiredMaterials: [
          { id: "mat-01", title: "Slides: Loops e Funções", type: "SLIDES" },
          { id: "mat-02", title: "Starter Code: Lista de Exercícios 03", type: "LAB_CODE" }
        ],
        activeActivityTitle: "Lista 3: Somatórios e Filtros de Paridade",
        activeActivityId: "act-f12-01"
      },
      {
        id: "sch-02",
        timeSlot: "09:30 - 11:10",
        className: "Engenharia de Software - Turma B",
        classRoom: "Laboratório Ágil 01",
        topic: "Modelagem Relacional e Consultas SQL com JOIN",
        competency: "Consultar bancos de dados relacionais com integridade referencial",
        status: "EM_ANDAMENTO",
        requiredMaterials: [
          { id: "mat-03", title: "Apostila SQL Intermediário", type: "APOSTILA" },
          { id: "mat-04", title: "Dataset SQLite de Pedidos", type: "SIMULADOR" }
        ],
        activeActivityTitle: "Lab SQL: Relatórios com INNER e LEFT JOIN",
        activeActivityId: "act-sql-02"
      },
      {
        id: "sch-03",
        timeSlot: "13:30 - 15:10",
        className: "Cybersecurity & DevSecOps - Turma C",
        classRoom: "Laboratório Red/Blue 02",
        topic: "Defesa em Profundidade e Prevenção de Injeção de Fórmulas",
        competency: "Implementar controles de validação e isolamento no backend",
        status: "AGENDADA",
        requiredMaterials: [
          { id: "mat-05", title: "Guia OWASP ASVS 5.0", type: "APOSTILA" }
        ],
        activeActivityTitle: "Desafio Red/Blue: Sanitização de CSV/Excel",
        activeActivityId: "act-sec-01"
      }
    ],
    pendingGradingCount: 4,
    openHelpRequestsCount: 3,
    upcomingDeadlines: [
      {
        activityId: "act-f12-01",
        activityTitle: "Lista 3: Somatórios e Filtros de Paridade",
        className: "DS - Turma A",
        deadlineIso: new Date(Date.now() + 3600000 * 24).toISOString(),
        submittedRatio: "24/28 alunos entregaram"
      },
      {
        activityId: "act-sql-02",
        activityTitle: "Lab SQL: Relatórios com JOIN",
        className: "Eng Soft - Turma B",
        deadlineIso: new Date(Date.now() + 3600000 * 48).toISOString(),
        submittedRatio: "18/30 alunos entregaram"
      }
    ],
    lastWorkPosition: {
      module: "Central de Revisão Docente",
      tabId: "teacher_review_queue",
      title: "Revisão de Recursos de Alunos (Tentativa #1 - Mariana Alencar)",
      description: "Recurso pendente sobre limite superior da função range() na atividade 'Somatório Par'.",
      lastUpdatedIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      contextParams: {
        studentId: "std-mariana-02",
        attemptId: "att-trace-002"
      }
    },
    pinnedShortcuts: [
      { id: "sc-1", label: "Central de Revisão", tabId: "teacher_review_queue", icon: "ShieldCheck", badgeCount: 4 },
      { id: "sc-2", label: "Fila de Trabalho", tabId: "teacher_action_queue", icon: "CheckSquare", badgeCount: 7 },
      { id: "sc-3", label: "Banco de Feedback", tabId: "reusable_feedback_bank", icon: "MessageSquare" },
      { id: "sc-4", label: "Diário de Classe", tabId: "diary", icon: "BookOpen" }
    ]
  };

  /**
   * Retrieves teacher's daily overview
   */
  public static getDailyOverview(): DailyHubOverview {
    return this.overviewData;
  }

  /**
   * Updates last work position for fast resumption
   */
  public static recordWorkPosition(position: LastWorkPosition): void {
    this.overviewData.lastWorkPosition = position;
  }
}
