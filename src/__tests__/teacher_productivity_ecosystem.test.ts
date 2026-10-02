import { describe, it, expect } from "vitest";
import { TeacherDailyHubService } from "../services/teacherDailyHubService";
import { TeacherActionQueueService } from "../services/teacherActionQueueService";
import { ReusableFeedbackBankService } from "../services/reusableFeedbackBankService";
import { SmartLessonPlannerService } from "../services/smartLessonPlannerService";
import { QuickUnderstandingCheckService } from "../services/quickUnderstandingCheckService";
import { AssistedClassDiaryService } from "../services/assistedClassDiaryService";
import { BlindGradingService } from "../services/blindGradingService";
import { GradeRuleSimulatorService } from "../services/gradeRuleSimulatorService";
import { CohortComparisonService } from "../services/cohortComparisonService";
import { TeacherHandoverService } from "../services/teacherHandoverService";

describe("Ecosistema de Produtividade Docente (CodeCheck 2026)", () => {

  // ==========================================================================
  // 1. MEU DIA DOCENTE
  // ==========================================================================
  describe("1. Meu Dia Docente (TeacherDailyHubService)", () => {
    it("deve retornar visão diária estruturada com aulas, prazos e atalhos", () => {
      const overview = TeacherDailyHubService.getDailyOverview();
      expect(overview).toBeDefined();
      expect(overview.teacherName).toBe("Professor Djalma Batista");
      expect(overview.todayClasses.length).toBeGreaterThan(0);
      expect(overview.todayClasses[0].requiredMaterials.length).toBeGreaterThan(0);
      expect(overview.upcomingDeadlines.length).toBeGreaterThan(0);
      expect(overview.pinnedShortcuts.length).toBeGreaterThan(0);
    });

    it("deve permitir registrar e recuperar o último ponto de trabalho", () => {
      TeacherDailyHubService.recordWorkPosition({
        module: "Central de Revisão Docente",
        tabId: "teacher_review_queue",
        title: "Revisão de Mariana Alencar",
        description: "Contestação de limite superior no range()",
        lastUpdatedIso: new Date().toISOString()
      });

      const overview = TeacherDailyHubService.getDailyOverview();
      expect(overview.lastWorkPosition.title).toContain("Mariana Alencar");
      expect(overview.lastWorkPosition.tabId).toBe("teacher_review_queue");
    });
  });

  // ==========================================================================
  // 2. FILA INTELIGENTE DE TRABALHO
  // ==========================================================================
  describe("2. Fila Inteligente de Trabalho (TeacherActionQueueService)", () => {
    it("deve listar tarefas pendentes com categoria, motivo de ordenação e tempo de espera", () => {
      const tasks = TeacherActionQueueService.getTasks();
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].orderingReason).toBeDefined();
      expect(tasks[0].waitTimeHours).toBeGreaterThan(0);
    });

    it("deve permitir adiar (snooze) e concluir tarefas", () => {
      const tasks = TeacherActionQueueService.getTasks();
      const firstTask = tasks[0];

      const snoozed = TeacherActionQueueService.snoozeTask(firstTask.id, 4);
      expect(snoozed).toBe(true);

      const completed = TeacherActionQueueService.completeTask(firstTask.id);
      expect(completed).toBe(true);
    });

    it("deve filtrar tarefas por categoria e prioridade", () => {
      const highPriorityTasks = TeacherActionQueueService.getTasks({ priority: "ALTA" });
      highPriorityTasks.forEach(t => {
        expect(t.priority).toBe("ALTA");
      });
    });
  });

  // ==========================================================================
  // 3. FEEDBACK REUTILIZÁVEL E CONTEXTUALIZADO
  // ==========================================================================
  describe("3. Feedback Reutilizável e Contextualizado (ReusableFeedbackBankService)", () => {
    it("deve buscar snippet estruturado por atalho (@tag)", () => {
      const snippet = ReusableFeedbackBankService.getByShortcut("@offbyone");
      expect(snippet).toBeDefined();
      expect(snippet?.category).toBe("LOGICA");
      expect(snippet?.observationTemplate).toContain("valor final");
      expect(snippet?.guidanceNextAction).toContain("range");
    });

    it("deve compor feedback no padrão tripartite (Observação, Evidência, Próxima Ação)", () => {
      const snippet = ReusableFeedbackBankService.getByShortcut("@offbyone")!;
      const fullText = ReusableFeedbackBankService.composeFullFeedback(
        snippet,
        "O laço range(1, n) parou em n-1 no arquivo soma.py."
      );
      expect(fullText).toContain("[Observação]:");
      expect(fullText).toContain("[Evidência]:");
      expect(fullText).toContain("[Próxima Ação]:");
      expect(fullText).toContain("soma.py");
    });

    it("deve permitir cadastrar novo snippet no banco", () => {
      const created = ReusableFeedbackBankService.addSnippet({
        shortcutTag: "@sqlindex",
        title: "Falta de Índice em Chave Estrangeira",
        competency: "Modelar e otimizar bancos de dados",
        criterion: "Performance SQL",
        category: "BANCO_DADOS",
        observationTemplate: "Consulta com scan de tabela completa.",
        evidencePrompt: "EXPLAIN QUERY PLAN indicou SCAN TABLE sem indexação.",
        guidanceNextAction: "Crie um índice na coluna 'cliente_id'.",
        isSharedWithPeers: true
      });

      expect(created.id).toBeDefined();
      const retrieved = ReusableFeedbackBankService.getByShortcut("@sqlindex");
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe("Falta de Índice em Chave Estrangeira");
    });
  });

  // ==========================================================================
  // 4. PREPARAÇÃO DA PRÓXIMA AULA (SMART LESSON PLANNER)
  // ==========================================================================
  describe("4. Preparação da Próxima Aula (SmartLessonPlannerService)", () => {
    it("deve gerar roteiro estruturado em 5 blocos pedagógicos", () => {
      const proposals = SmartLessonPlannerService.getProposals();
      expect(proposals.length).toBeGreaterThan(0);
      const prop = proposals[0];

      expect(prop.blocks.length).toBe(5);
      expect(prop.blocks.map(b => b.type)).toEqual([
        "ABERTURA",
        "EXPLICACAO",
        "PRATICA",
        "VERIFICACAO",
        "ENCERRAMENTO"
      ]);
    });

    it("deve apresentar fundamentação com base em evidências das submissões anteriores", () => {
      const prop = SmartLessonPlannerService.getProposals()[0];
      expect(prop.evidenceFound).toBeDefined();
      expect(prop.evidenceFound.summary).toContain("Off-by-One");
      expect(prop.evidenceFound.hasSufficientData).toBe(true);
    });

    it("deve sinalizar limitação quando não houver evidências suficientes", () => {
      const prop = SmartLessonPlannerService.getProposals()[1];
      expect(prop.evidenceFound.hasSufficientData).toBe(false);
      expect(prop.evidenceFound.dataLimitationWarning).toBeDefined();
    });

    it("deve permitir gerar roteiro customizado e homologar pelo docente", () => {
      const custom = SmartLessonPlannerService.generateCustomProposal({
        classId: "turma-test",
        className: "DS - Turma Teste",
        topic: "Dicionários e JSON",
        competencyTarget: "Manipular estruturas chave-valor em Python",
        totalDurationMinutes: 100,
        previouslyTaughtContent: ["Listas", "Tuplas"]
      });

      expect(custom.blocks.length).toBe(5);
      const totalDur = custom.blocks.reduce((s, b) => s + b.durationMinutes, 0);
      expect(totalDur).toBe(100);

      const approved = SmartLessonPlannerService.approveProposal(custom.id, "Aprovado sem ressalvas.");
      expect(approved).toBe(true);

      const fetched = SmartLessonPlannerService.getProposalById(custom.id);
      expect(fetched?.status).toBe("APROVADO_OFICIAL");
      expect(fetched?.teacherNotes).toBe("Aprovado sem ressalvas.");
    });
  });

  // ==========================================================================
  // 5. VERIFICAÇÃO RÁPIDA DO ENTENDIMENTO
  // ==========================================================================
  describe("5. Verificação Rápida do Entendimento (QuickUnderstandingCheckService)", () => {
    it("deve disponibilizar questões de múltiplos formatos (Predição de Saída, Bug Spot, Autoavaliação)", () => {
      const sessions = QuickUnderstandingCheckService.getSessions();
      expect(sessions.length).toBeGreaterThan(0);
      const s1 = sessions[0];

      const types = s1.questions.map(q => q.type);
      expect(types).toContain("PREVISAO_SAIDA");
      expect(types).toContain("IDENTIFICACAO_ERRO");
      expect(types).toContain("AUTOAVALIACAO_CONFIANCA");
    });

    it("deve computar estatísticas de adesão e taxa de acerto sem gerar notas punitivas", () => {
      const s1 = QuickUnderstandingCheckService.getSessions()[0];
      const stats = QuickUnderstandingCheckService.getSessionStats(s1.id);
      expect(stats).toBeDefined();
      expect(stats?.totalParticipants).toBeGreaterThan(0);
      expect(stats?.participationRate).toBeGreaterThan(0);
      expect(stats?.questionStats.length).toBe(s1.questions.length);
    });

    it("deve permitir vincular ação de revisão para a próxima aula", () => {
      const s1 = QuickUnderstandingCheckService.getSessions()[0];
      const linked = QuickUnderstandingCheckService.linkReviewActionToNextClass(s1.id);
      expect(linked).toBe(true);

      const refreshed = QuickUnderstandingCheckService.getSessionById(s1.id);
      expect(refreshed?.linkedReviewActionCreated).toBe(true);
    });
  });

  // ==========================================================================
  // 6. REGISTRO DE AULA ASSISTIDO
  // ==========================================================================
  describe("6. Registro de Aula Assistido (AssistedClassDiaryService)", () => {
    it("deve diferenciar conteúdo planejado de conteúdo confirmado como ministrado", () => {
      const records = AssistedClassDiaryService.getDiaryRecords();
      expect(records.length).toBeGreaterThan(0);
      const rec = records[0];

      expect(rec.plannedTopic).toBeDefined();
      expect(rec.confirmedTaughtTopic).toBeDefined();
      expect(rec.methodologicalStrategies.length).toBeGreaterThan(0);
      expect(rec.resourcesAndToolsUsed.length).toBeGreaterThan(0);
    });

    it("deve permitir ao docente editar e homologar o registro oficial com assinatura", () => {
      const rec = AssistedClassDiaryService.getDiaryRecords()[1]; // Rascunho assistido
      const homologated = AssistedClassDiaryService.homologateRecord(rec.id, "Homologado pelo docente titular.");
      expect(homologated).toBe(true);

      const updated = AssistedClassDiaryService.getRecordById(rec.id);
      expect(updated?.status).toBe("HOMOLOGADO_DOCENTE");
      expect(updated?.teacherSignatureId).toBeDefined();
      expect(updated?.officialAttendance.isAttendanceValidatedByTeacher).toBe(true);
    });
  });

  // ==========================================================================
  // 7. CORREÇÃO SEM IDENTIFICAÇÃO (BLIND GRADING)
  // ==========================================================================
  describe("7. Correção sem Identificação (BlindGradingService)", () => {
    it("deve mascarar identidade do estudante através de pseudônimos determinísticos", () => {
      const subs = BlindGradingService.getSubmissions();
      expect(subs.length).toBeGreaterThan(0);
      subs.forEach(s => {
        expect(s.pseudonym).toMatch(/Candidato #[A-Z]-\d+/);
        expect(s.codeContent).toBeDefined();
        expect(s.rubricCriteria.length).toBeGreaterThan(0);
      });
    });

    it("deve permitir pontuar critérios da rubrica no modo cego", () => {
      const sub = BlindGradingService.getSubmissions()[1];
      const graded = BlindGradingService.gradeSubmission(sub.submissionId, [
        { criterionId: "crit-1", points: 40, feedbackComment: "Erro em teste 3." },
        { criterionId: "crit-2", points: 25, feedbackComment: "Tratamento parcial." },
        { criterionId: "crit-3", points: 20, feedbackComment: "PEP 8 seguido." }
      ]);
      expect(graded).toBe(true);

      const refreshed = BlindGradingService.getSubmissionById(sub.submissionId);
      expect(refreshed?.finalScore).toBe(85);
      expect(refreshed?.gradingStatus).toBe("CORRIGIDO");
    });

    it("deve permitir revelar identidade sob demanda e registrar auditoria", () => {
      const sub = BlindGradingService.getSubmissions()[1];
      expect(sub.isIdentityRevealed).toBe(false);

      const revealed = BlindGradingService.revealIdentity(sub.submissionId, "Prof. Djalma Batista");
      expect(revealed).toBe(true);

      const refreshed = BlindGradingService.getSubmissionById(sub.submissionId);
      expect(refreshed?.isIdentityRevealed).toBe(true);
      expect(refreshed?.revealedByTeacher).toBe("Prof. Djalma Batista");
      expect(refreshed?.realIdentity.studentName).toBe("Lucas Ferreira");
    });
  });

  // ==========================================================================
  // 8. SIMULADOR DE REGRAS DE NOTAS
  // ==========================================================================
  describe("8. Simulador de Regras de Notas (GradeRuleSimulatorService)", () => {
    it("deve simular impacto de diferentes pesos e descarte sem alterar banco oficial", () => {
      const baseConfig = GradeRuleSimulatorService.getActiveConfig();
      const sim = GradeRuleSimulatorService.simulate({
        ...baseConfig,
        weightHomework: 50,
        weightProject: 30,
        weightExam: 20,
        compositionRule: "DESCARTAR_MENOR_LISTA",
        recoveryPolicy: "SUBSTITUTIVA_TOTAL"
      });

      expect(sim.totalStudents).toBeGreaterThan(0);
      expect(sim.simulatedClassAverage).toBeDefined();
      expect(sim.studentResults.length).toBe(sim.totalStudents);
    });

    it("deve permitir homologação oficial da regra com snapshot de reversão", () => {
      const newConfig = {
        ...GradeRuleSimulatorService.getActiveConfig(),
        weightHomework: 40,
        weightProject: 40,
        weightExam: 20
      };

      const snapshot = GradeRuleSimulatorService.applyConfigOfficially({
        classId: "turma-ds-a",
        newConfig,
        teacherName: "Prof. Djalma Batista",
        justificationReason: "Revisão curricular aprovada no colegiado de curso."
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.isRolledBack).toBe(false);

      const rollbackOk = GradeRuleSimulatorService.rollbackSnapshot(snapshot.id);
      expect(rollbackOk).toBe(true);
    });
  });

  // ==========================================================================
  // 9. COMPARAÇÃO ENTRE OFERTAS DA DISCIPLINA
  // ==========================================================================
  describe("9. Comparação entre Ofertas da Disciplina (CohortComparisonService)", () => {
    it("deve carregar dados de múltiplas ofertas semestrais", () => {
      const offers = CohortComparisonService.getOffers();
      expect(offers.length).toBeGreaterThanOrEqual(3);
      expect(offers.map(o => o.semesterPeriod)).toContain("2025/1");
      expect(offers.map(o => o.semesterPeriod)).toContain("2025/2");
    });

    it("deve detectar e alertar discrepâncias de rubricas entre ofertas comparadas", () => {
      const report = CohortComparisonService.compareOffers("coh-2025-1", "coh-2025-2");
      expect(report).toBeDefined();
      expect(report?.hasRubricDiscrepancy).toBe(true);
      expect(report?.rubricDiscrepancyNote).toContain("Rubrica v1.0");
      expect(report?.performanceDelta.averageGradeDelta).toBeDefined();
    });
  });

  // ==========================================================================
  // 10. PASSAGEM DE TURMA ENTRE PROFESSORES
  // ==========================================================================
  describe("10. Passagem de Turma entre Professores (TeacherHandoverService)", () => {
    it("deve estruturar dossiê de continuidade com hash SHA-256 de integridade", () => {
      const dossiers = TeacherHandoverService.getDossiers();
      expect(dossiers.length).toBeGreaterThan(0);
      const d1 = dossiers[0];

      expect(d1.integrityHashSha256).toBeDefined();
      expect(d1.taughtTopics.length).toBeGreaterThan(0);
      expect(d1.remainingSyllabus.length).toBeGreaterThan(0);
      expect(d1.evaluationBacklog).toBeDefined();
      expect(d1.pedagogicalInterventions.length).toBeGreaterThan(0);
    });

    it("deve permitir adicionar mensagens na thread de esclarecimentos entre docentes", () => {
      const d1 = TeacherHandoverService.getDossiers()[0];
      const added = TeacherHandoverService.addClarificationMessage(d1.id, {
        authorName: "Profa. Cláudia Vasconcelos",
        authorRole: "SUCESSOR",
        message: "Recebido! Como está o ritmo dos alunos na atividade de laços?"
      });
      expect(added).toBe(true);

      const refreshed = TeacherHandoverService.getDossierById(d1.id);
      expect(refreshed?.clarificationThread.some(m => m.authorRole === "SUCESSOR")).toBe(true);
    });

    it("deve permitir homologar o protocolo de recebimento pelo professor sucessor", () => {
      const d1 = TeacherHandoverService.getDossiers()[0];
      const acknowledged = TeacherHandoverService.acknowledgeReceipt(
        d1.id,
        "Dossiê conferido. Assumindo a titularidade das aulas."
      );
      expect(acknowledged).toBe(true);

      const refreshed = TeacherHandoverService.getDossierById(d1.id);
      expect(refreshed?.status).toBe("RECEBIDO_HOMOLOGADO");
      expect(refreshed?.successorAcknowledgement?.formalReceiptCode).toBeDefined();
    });
  });

});
