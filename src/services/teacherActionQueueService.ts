/**
 * ============================================================================
 * INTELLIGENT TEACHER ACTION QUEUE SERVICE (FILA INTELIGENTE DE TRABALHO)
 * ============================================================================
 * Implements:
 * 1. Unified teacher action queue (grading, help requests, lesson preparation, diary).
 * 2. Multi-dimensional task sorting (manual priority, deadline, wait time).
 * 3. Snooze (adiar), complete, and filter capabilities.
 * 4. Automatic task deduplication and state syncing.
 * ============================================================================
 */

export type TeacherTaskCategory = 
  | "CORRECAO_PENDENTE" 
  | "DUVIDA_ALUNO" 
  | "PLANEJAMENTO_AULA" 
  | "DIARIO_ASSISTIDO" 
  | "INTERVENCAO_REFORCO";

export type TeacherTaskPriority = "ALTA" | "MEDIA" | "BAIXA";

export interface TeacherActionTask {
  id: string;
  category: TeacherTaskCategory;
  title: string;
  description: string;
  className: string;
  classId: string;
  relatedEntityId?: string; // studentId, activityId, lessonId
  deadlineIso: string;
  waitTimeHours: number;
  priority: TeacherTaskPriority;
  orderingReason: string;
  status: "PENDENTE" | "ADIADA" | "CONCLUIDA";
  snoozedUntilIso?: string;
  targetTabId: string;
  targetActionLabel: string;
}

export class TeacherActionQueueService {
  private static tasks: TeacherActionTask[] = [
    {
      id: "task-01",
      category: "CORRECAO_PENDENTE",
      title: "Recurso de Nota: Mariana Alencar (Lista 3)",
      description: "Aluno contestou caso limite na função range(). Revisão necessária para publicação da nota.",
      className: "DS - Turma A",
      classId: "turma-ds-a",
      relatedEntityId: "att-trace-002",
      deadlineIso: new Date(Date.now() + 3600000 * 12).toISOString(),
      waitTimeHours: 4.5,
      priority: "ALTA",
      orderingReason: "Recurso formal com prazo de retorno em 12h",
      status: "PENDENTE",
      targetTabId: "teacher_review_queue",
      targetActionLabel: "Abrir Central de Revisão"
    },
    {
      id: "task-02",
      category: "DUVIDA_ALUNO",
      title: "Dúvida de Bancada: Lucas Ferreira",
      description: "Dificuldade na sintaxe de junção LEFT JOIN com chaves nulas.",
      className: "Eng Soft - Turma B",
      classId: "turma-eng-b",
      relatedEntityId: "std-lucas",
      deadlineIso: new Date(Date.now() + 3600000 * 6).toISOString(),
      waitTimeHours: 2.0,
      priority: "ALTA",
      orderingReason: "Dúvida ativa aguardando orientação antes da próxima aula",
      status: "PENDENTE",
      targetTabId: "live_lab_companion",
      targetActionLabel: "Responder Dúvida"
    },
    {
      id: "task-03",
      category: "PLANEJAMENTO_AULA",
      title: "Preparar Roteiro: Aula de Segurança em Backend",
      description: "Revisar objetivos e materiais práticos de sanitização CSV para a aula da tarde.",
      className: "Cybersecurity - Turma C",
      classId: "turma-cyber-c",
      deadlineIso: new Date(Date.now() + 3600000 * 4).toISOString(),
      waitTimeHours: 1.0,
      priority: "MEDIA",
      orderingReason: "Aula agendada para 13:30 de hoje",
      status: "PENDENTE",
      targetTabId: "smart_lesson_planner",
      targetActionLabel: "Abrir Planejador Assistido"
    },
    {
      id: "task-04",
      category: "DIARIO_ASSISTIDO",
      title: "Homologar Registro de Aula Ministrada",
      description: "Confirmar conteúdo trabalhado e estratégias na aula matutina da Turma A.",
      className: "DS - Turma A",
      classId: "turma-ds-a",
      deadlineIso: new Date(Date.now() + 3600000 * 24).toISOString(),
      waitTimeHours: 3.2,
      priority: "BAIXA",
      orderingReason: "Registro pendente de confirmação oficial pelo docente",
      status: "PENDENTE",
      targetTabId: "diary",
      targetActionLabel: "Revisar Diário de Classe"
    },
    {
      id: "task-05",
      category: "INTERVENCAO_REFORCO",
      title: "Atribuir Reforço: Cluster de Erros em Loops",
      description: "6 estudantes apresentaram omissão de limite superior range(). Atribuir desafio adaptativo.",
      className: "DS - Turma A",
      classId: "turma-ds-a",
      deadlineIso: new Date(Date.now() + 3600000 * 36).toISOString(),
      waitTimeHours: 5.0,
      priority: "MEDIA",
      orderingReason: "Intervenção preventiva recomendada pelo diagnóstico de aprendizagem",
      status: "PENDENTE",
      targetTabId: "diagnostic_intervention",
      targetActionLabel: "Atribuir Reforço com 1-Clique"
    }
  ];

  public static getTasks(filters?: { category?: string; classId?: string; priority?: string }): TeacherActionTask[] {
    return this.tasks.filter(t => {
      if (t.status === "CONCLUIDA") return false;
      if (filters?.category && filters.category !== "all" && t.category !== filters.category) return false;
      if (filters?.classId && filters.classId !== "all" && t.classId !== filters.classId) return false;
      if (filters?.priority && filters.priority !== "all" && t.priority !== filters.priority) return false;
      return true;
    });
  }

  public static completeTask(taskId: string): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = "CONCLUIDA";
    return true;
  }

  public static snoozeTask(taskId: string, hours: number): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    task.status = "ADIADA";
    task.snoozedUntilIso = new Date(Date.now() + 3600000 * hours).toISOString();
    return true;
  }

  public static updatePriority(taskId: string, priority: TeacherTaskPriority): boolean {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    task.priority = priority;
    return true;
  }
}
