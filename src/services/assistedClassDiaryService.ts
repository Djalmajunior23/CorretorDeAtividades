/**
 * ============================================================================
 * ASSISTED CLASS DIARY SERVICE (REGISTRO DE AULA ASSISTIDO)
 * ============================================================================
 * Features:
 * 1. Draft diary generator based on actual executed activities and teacher input.
 * 2. Institutional fields:
 *    - Conteúdo ministrado confirmado
 *    - Objetivos pedagógicos & competências trabalhadas
 *    - Estratégias metodológicas adotadas
 *    - Recursos didáticos e ferramentas utilizadas
 *    - Evidências observadas de aprendizagem
 *    - Encaminhamentos e pendências para a próxima aula
 * 3. Clear distinction: Planejado vs Confirmado como Ministrado.
 * 4. Zero-Hallucination Policy: Never invents attendance or student results.
 * 5. Full teacher review, validation, official sign-off and historical record.
 * ============================================================================
 */

export interface ClassDiaryDraft {
  id: string;
  classId: string;
  className: string;
  dateIso: string;
  timeSlot: string;
  roomOrLab: string;
  plannedTopic: string;
  confirmedTaughtTopic: string;
  plannedCompetencies: string[];
  confirmedCompetencies: string[];
  methodologicalStrategies: string[];
  resourcesAndToolsUsed: string[];
  observedEvidences: {
    activityTitle?: string;
    completionRatio?: string; // e.g. "24/28 estudantes concluíram o lab"
    frequentDifficulties?: string[];
    highlightNotes: string;
  };
  pendingIssuesAndNextSteps: string[];
  officialAttendance: {
    totalEnrolled: number;
    presentCount: number;
    absentCount: number;
    isAttendanceValidatedByTeacher: boolean;
  };
  status: "RASCUNHO_ASSISTIDO" | "HOMOLOGADO_DOCENTE" | "PUBLICADO_OFICIAL";
  createdAtIso: string;
  homologatedAtIso?: string;
  teacherSignatureId?: string;
  officialNotes?: string;
}

export class AssistedClassDiaryService {
  private static diaryRecords: ClassDiaryDraft[] = [
    {
      id: "diary-rec-01",
      classId: "turma-ds-a",
      className: "Desenvolvimento de Sistemas - Turma A",
      dateIso: new Date().toISOString().split("T")[0],
      timeSlot: "07:30 - 09:10",
      roomOrLab: "Laboratório de Software 03",
      plannedTopic: "Estruturas de Repetição & Funções Modulares em Python",
      confirmedTaughtTopic: "Estruturas de Repetição com for/while e criação de funções com docstrings em Python",
      plannedCompetencies: [
        "Construir algoritmos com loops controlados e modularização",
        "Tratar limites de listas e validações defensivas"
      ],
      confirmedCompetencies: [
        "Construir algoritmos com loops controlados e modularização"
      ],
      methodologicalStrategies: [
        "Aula dialogada com live coding",
        "Prática de bancada em duplas",
        "Resolução de casos de teste automatizados no CodeCheck"
      ],
      resourcesAndToolsUsed: [
        "VS Code",
        "Interpretador Python 3.12 (Sandbox)",
        "Slides: Modularização e Loops",
        "Lista 3 de Exercícios no CodeCheck"
      ],
      observedEvidences: {
        activityTitle: "Lista 3: Somatórios e Filtros de Paridade",
        completionRatio: "24/28 estudantes submeteram com sucesso todos os casos de teste",
        frequentDifficulties: [
          "Confusão no limite superior de range() excluindo o último elemento",
          "IndexError ao tentar acessar primeiro elemento de lista vazia sem guarda"
        ],
        highlightNotes: "Engajamento alto nas duplas de bancada; 4 estudantes solicitaram apoio presencial no exercício de números primos."
      },
      pendingIssuesAndNextSteps: [
        "Realizar abertura da próxima aula com warm-up de fixação sobre fatiamento de listas",
        "Homologar nota do recurso de Mariana Alencar na Central de Revisão"
      ],
      officialAttendance: {
        totalEnrolled: 28,
        presentCount: 26,
        absentCount: 2,
        isAttendanceValidatedByTeacher: true
      },
      status: "HOMOLOGADO_DOCENTE",
      createdAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      homologatedAtIso: new Date().toISOString(),
      teacherSignatureId: "prof-djalma-sha256-sig-99a",
      officialNotes: "Aula concluída com sucesso. Objetivos atingidos conforme o planejamento."
    },
    {
      id: "diary-rec-02",
      classId: "turma-eng-b",
      className: "Engenharia de Software - Turma B",
      dateIso: new Date().toISOString().split("T")[0],
      timeSlot: "09:30 - 11:10",
      roomOrLab: "Laboratório Ágil 01",
      plannedTopic: "Modelagem Relacional e Consultas SQL com JOIN",
      confirmedTaughtTopic: "Consultas Relacionais com INNER JOIN e LEFT JOIN em SQLite",
      plannedCompetencies: [
        "Consultar bancos de dados relacionais com integridade referencial",
        "Modelar chaves primárias e estrangeiras"
      ],
      confirmedCompetencies: [
        "Consultar bancos de dados relacionais com integridade referencial"
      ],
      methodologicalStrategies: [
        "Demonstração em diagrama DER interativo",
        "Desafio de consultas hands-on em banco SQLite de comércio eletrônico"
      ],
      resourcesAndToolsUsed: [
        "DBeaver / SQLite Sandbox",
        "Dataset de Pedidos e Clientes",
        "Apostila de SQL Intermediário"
      ],
      observedEvidences: {
        activityTitle: "Lab SQL: Relatórios com JOIN",
        completionRatio: "18/30 estudantes concluíram o lab no tempo de aula",
        frequentDifficulties: [
          "Dúvida na preservação de clientes sem pedidos ao usar INNER vs LEFT JOIN"
        ],
        highlightNotes: "Necessário reforçar o conceito de produto cartesiano e filtro de chaves nulas."
      },
      pendingIssuesAndNextSteps: [
        "Disponibilizar 1 exercício adicional de fixação de LEFT JOIN",
        "Responder dúvida de bancada de Lucas Ferreira"
      ],
      officialAttendance: {
        totalEnrolled: 30,
        presentCount: 27,
        absentCount: 3,
        isAttendanceValidatedByTeacher: false
      },
      status: "RASCUNHO_ASSISTIDO",
      createdAtIso: new Date().toISOString()
    }
  ];

  public static getDiaryRecords(classId?: string): ClassDiaryDraft[] {
    if (!classId || classId === "all") return this.diaryRecords;
    return this.diaryRecords.filter(d => d.classId === classId);
  }

  public static getRecordById(id: string): ClassDiaryDraft | undefined {
    return this.diaryRecords.find(d => d.id === id);
  }

  public static createDraftFromSession(params: {
    classId: string;
    className: string;
    timeSlot: string;
    roomOrLab: string;
    plannedTopic: string;
    confirmedTopic?: string;
    plannedCompetencies: string[];
    strategies?: string[];
    resources?: string[];
    evidenceSummary?: string;
    totalEnrolled: number;
    presentCount: number;
  }): ClassDiaryDraft {
    const draft: ClassDiaryDraft = {
      id: `diary-rec-${Date.now()}`,
      classId: params.classId,
      className: params.className,
      dateIso: new Date().toISOString().split("T")[0],
      timeSlot: params.timeSlot,
      roomOrLab: params.roomOrLab,
      plannedTopic: params.plannedTopic,
      confirmedTaughtTopic: params.confirmedTopic || params.plannedTopic,
      plannedCompetencies: params.plannedCompetencies,
      confirmedCompetencies: [...params.plannedCompetencies],
      methodologicalStrategies: params.strategies || [
        "Aula expositiva dialogada com demonstração prática",
        "Laboratório de desenvolvimento com feedback automatizado"
      ],
      resourcesAndToolsUsed: params.resources || [
        "Ambiente CodeCheck",
        "IDE / Editor de Código",
        "Projetor Multimídia"
      ],
      observedEvidences: {
        highlightNotes: params.evidenceSummary || "Atividade de bancada executada no laboratório."
      },
      pendingIssuesAndNextSteps: [],
      officialAttendance: {
        totalEnrolled: params.totalEnrolled,
        presentCount: params.presentCount,
        absentCount: Math.max(0, params.totalEnrolled - params.presentCount),
        isAttendanceValidatedByTeacher: false
      },
      status: "RASCUNHO_ASSISTIDO",
      createdAtIso: new Date().toISOString()
    };

    this.diaryRecords.unshift(draft);
    return draft;
  }

  public static updateDiaryDraft(updated: ClassDiaryDraft): boolean {
    const index = this.diaryRecords.findIndex(d => d.id === updated.id);
    if (index === -1) return false;
    this.diaryRecords[index] = updated;
    return true;
  }

  public static homologateRecord(id: string, teacherNotes?: string): boolean {
    const record = this.diaryRecords.find(d => d.id === id);
    if (!record) return false;
    record.status = "HOMOLOGADO_DOCENTE";
    record.homologatedAtIso = new Date().toISOString();
    record.teacherSignatureId = `prof-signature-${Date.now()}`;
    if (teacherNotes) record.officialNotes = teacherNotes;
    record.officialAttendance.isAttendanceValidatedByTeacher = true;
    return true;
  }
}
