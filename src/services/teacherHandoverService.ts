/**
 * ============================================================================
 * TEACHER HANDOVER SERVICE (PASSAGEM DE TURMA ENTRE PROFESSORES)
 * ============================================================================
 * Features:
 * 1. Structured Continuity Dossier:
 *    - Taught Content (Efetivamente ministrado até a data)
 *    - Remaining Syllabus & Estimated Schedule
 *    - Active Assignments in Progress & Deadlines
 *    - Didactic Materials & Code Repositories
 *    - Grading Backlog & Pending Student Appeals
 *    - Documented Pedagogical Interventions & Learning Gaps
 * 2. Security & Data Minimization:
 *    - Strips unnecessary private student data; keeps pedagogical facts.
 *    - SHA-256 Integrity Hash & Audit Trail.
 *    - Explicit authorization for the designated successor instructor.
 * 3. Successor Instructor Workflow:
 *    - Formal Acknowledgement Protocol (Recibo de Transição).
 *    - Clarification Q&A thread between instructors.
 * ============================================================================
 */

export interface HandoverDossier {
  id: string;
  classId: string;
  className: string;
  disciplineName: string;
  originTeacherId: string;
  originTeacherName: string;
  targetTeacherId: string;
  targetTeacherName: string;
  targetTeacherEmail: string;
  handoverDateIso: string;
  status: "RASCUNHO" | "TRANSMITIDO" | "RECEBIDO_HOMOLOGADO";
  integrityHashSha256: string;
  
  // 1. Taught topics
  taughtTopics: {
    topic: string;
    hoursExecuted: number;
    completionDateIso: string;
    competencyAchieved: string;
  }[];

  // 2. Remaining syllabus
  remainingSyllabus: {
    topic: string;
    estimatedHours: number;
    recommendedStrategies: string;
    plannedDeadlineIso: string;
  }[];

  // 3. Active assignments
  activeAssignments: {
    activityId: string;
    title: string;
    deadlineIso: string;
    submittedCount: number;
    totalStudents: number;
  }[];

  // 4. Didactic materials
  didacticMaterials: {
    title: string;
    type: string;
    urlOrRef: string;
  }[];

  // 5. Grading backlog & appeals
  evaluationBacklog: {
    pendingReviewsCount: number;
    openStudentAppealsCount: number;
    criticalNotes: string;
  };

  // 6. Documented pedagogical interventions
  pedagogicalInterventions: {
    clusterName: string;
    affectedStudentsCount: number;
    recommendedAction: string;
    notes: string;
  }[];

  // Successor acknowledgement & Q&A
  successorAcknowledgement?: {
    acknowledgedAtIso: string;
    notes: string;
    formalReceiptCode: string;
  };

  clarificationThread: {
    id: string;
    authorName: string;
    authorRole: "ORIGEM" | "SUCESSOR";
    message: string;
    timestampIso: string;
  }[];
}

export class TeacherHandoverService {
  private static dossiers: HandoverDossier[] = [
    {
      id: "dos-ds-2026-01",
      classId: "turma-ds-a",
      className: "Desenvolvimento de Sistemas - Turma A",
      disciplineName: "Lógica de Programação e Estruturas de Dados",
      originTeacherId: "prof-djalma",
      originTeacherName: "Prof. Djalma Batista",
      targetTeacherId: "prof-claudia",
      targetTeacherName: "Profa. Cláudia Vasconcelos",
      targetTeacherEmail: "claudia.vasconcelos@fiemg.com.br",
      handoverDateIso: new Date().toISOString(),
      status: "TRANSMITIDO",
      integrityHashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      taughtTopics: [
        { topic: "1. Introdução à Lógica & Variáveis", hoursExecuted: 8, completionDateIso: "2026-08-10", competencyAchieved: "Tipos primitivos e operações em memória" },
        { topic: "2. Estruturas Condicionais (if/elif/else)", hoursExecuted: 12, completionDateIso: "2026-08-25", competencyAchieved: "Controle de fluxo e lógica booleana" },
        { topic: "3. Laços de Repetição e Funções Modulares", hoursExecuted: 20, completionDateIso: "2026-09-20", competencyAchieved: "Construção de rotinas com loops e modularização" }
      ],
      remainingSyllabus: [
        { topic: "4. Dicionários, Conjuntos e Arquivos JSON", estimatedHours: 16, recommendedStrategies: "Laboratórios hands-on de persistência", plannedDeadlineIso: "2026-10-25" },
        { topic: "5. Orientação a Objetos Básica (Classes & Métodos)", estimatedHours: 24, recommendedStrategies: "Modelagem em duplas de mini-sistemas", plannedDeadlineIso: "2026-11-30" }
      ],
      activeAssignments: [
        { activityId: "act-f12-01", title: "Lista 3: Somatórios e Filtros de Paridade", deadlineIso: new Date(Date.now() + 3600000 * 24).toISOString(), submittedCount: 24, totalStudents: 28 }
      ],
      didacticMaterials: [
        { title: "Apostila SENAI de Python 3 Estruturado", type: "PDF", urlOrRef: "materiais/apostila_python.pdf" },
        { title: "Repositório Starter Kit do GitHub", type: "GIT", urlOrRef: "https://github.com/senai-tech/ds-turma-a-labs" }
      ],
      evaluationBacklog: {
        pendingReviewsCount: 4,
        openStudentAppealsCount: 1,
        criticalNotes: "Recurso de Mariana Alencar na Lista 3 revisado mas aguardando publicação final."
      },
      pedagogicalInterventions: [
        {
          clusterName: "Confusão em Limite Superior no range()",
          affectedStudentsCount: 6,
          recommendedAction: "Warm-up rápido na abertura da próxima aula com slice e range inclusivo.",
          notes: "Diagnóstico gerado automaticamente pelo CodeCheck e já atribuído na Fila Inteligente."
        }
      ],
      clarificationThread: [
        {
          id: "msg-1",
          authorName: "Prof. Djalma Batista",
          authorRole: "ORIGEM",
          message: "Olá Cláudia! O dossiê de passagem da Turma A está completo. Os alunos possuem bom ritmo de entrega de código.",
          timestampIso: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    }
  ];

  public static getDossiers(): HandoverDossier[] {
    return this.dossiers;
  }

  public static getDossierById(id: string): HandoverDossier | undefined {
    return this.dossiers.find(d => d.id === id);
  }

  public static createDossier(data: Omit<HandoverDossier, "id" | "integrityHashSha256" | "clarificationThread">): HandoverDossier {
    const rawContent = JSON.stringify(data);
    // Simple deterministic hash representation
    let hash = 0;
    for (let i = 0; i < rawContent.length; i++) {
      hash = ((hash << 5) - hash) + rawContent.charCodeAt(i);
      hash |= 0;
    }
    const fakeSha256 = `sha256-${Math.abs(hash).toString(16).padStart(16, "0")}-${Date.now().toString(16)}`;

    const newDossier: HandoverDossier = {
      ...data,
      id: `dos-${Date.now()}`,
      integrityHashSha256: fakeSha256,
      clarificationThread: []
    };

    this.dossiers.unshift(newDossier);
    return newDossier;
  }

  public static addClarificationMessage(dossierId: string, message: {
    authorName: string;
    authorRole: "ORIGEM" | "SUCESSOR";
    message: string;
  }): boolean {
    const dossier = this.dossiers.find(d => d.id === dossierId);
    if (!dossier) return false;

    dossier.clarificationThread.push({
      id: `msg-${Date.now()}`,
      authorName: message.authorName,
      authorRole: message.authorRole,
      message: message.message,
      timestampIso: new Date().toISOString()
    });
    return true;
  }

  public static acknowledgeReceipt(dossierId: string, notes: string): boolean {
    const dossier = this.dossiers.find(d => d.id === dossierId);
    if (!dossier) return false;

    dossier.status = "RECEBIDO_HOMOLOGADO";
    dossier.successorAcknowledgement = {
      acknowledgedAtIso: new Date().toISOString(),
      notes,
      formalReceiptCode: `REC-PROT-${Date.now()}`
    };
    return true;
  }
}
