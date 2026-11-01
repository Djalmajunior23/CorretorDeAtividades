/**
 * ============================================================================
 * CLASS OPERATIONS CENTRAL SERVICE (CENTRAL DE OPERAÇÕES DA TURMA)
 * ============================================================================
 * Features:
 * 1. Unified cockpit gathering all mission-critical operational metrics:
 *    - Atividades em Andamento
 *    - Entregas Recebidas
 *    - Alunos sem Entrega (Abstenção)
 *    - Processamentos Pendentes / Na Fila
 *    - Falhas Técnicas de Sandbox / IA
 *    - Correções Aguardando Revisão Docente
 *    - Feedbacks Prontos Não Publicados
 *    - Refações Solicitadas
 * 2. Origin metadata: data source, query timestamp, filter states.
 * 3. Explicit status: ZERO_REGISTROS | CARREGANDO | DISPONIVEL | INDISPONIVEL.
 * ============================================================================
 */

import { UnifiedLifecycleEngineService, ManagedActivity, ManagedSubmission } from "./unifiedLifecycleEngineService";
import { ReliableAsyncJobQueueService } from "./reliableAsyncJobQueueService";

export interface ClassOperationsSummary {
  classId: string;
  className: string;
  institutionId: string;
  queryTimestampIso: string;
  dataSource: "LOCAL_MEMORY";
  status: "DISPONIVEL" | "ZERO_REGISTROS" | "INDISPONIVEL";
  metrics: {
    ongoingActivitiesCount: number;
    receivedSubmissionsCount: number;
    unsubmittedStudentsCount: number | null;
    pendingAsyncJobsCount: number;
    technicalFailuresCount: number;
    awaitingTeacherReviewCount: number;
    unpublishedFeedbackCount: number;
    refactoringRequestedCount: number;
  };
  ongoingActivities: ManagedActivity[];
  submissionsByState: {
    received: ManagedSubmission[];
    awaitingReview: ManagedSubmission[];
    technicalFailures: ManagedSubmission[];
    refactorings: ManagedSubmission[];
    published: ManagedSubmission[];
    processing: ManagedSubmission[];
  };
}

export class ClassOperationsCentralService {
  public static getOperationsSummary(classId = "turma-ds-a", enrolledStudentIds?: string[]): ClassOperationsSummary {
    const activities = UnifiedLifecycleEngineService.getActivities(classId);
    const submissions = UnifiedLifecycleEngineService.getSubmissions({ classId });
    const submissionIds = new Set(submissions.map(s => s.id));
    const pendingJobs = ReliableAsyncJobQueueService.getJobs("PENDENTE").filter(job =>
      job.payload.classId === classId || submissionIds.has(job.payload.submissionId)
    );

    const ongoingActivities = activities.filter(a => a.currentState === "PUBLICADA");
    const receivedSubmissions = submissions.filter(s => s.currentState === "RECEBIDA" || s.currentState === "NA_FILA");
    const awaitingReview = submissions.filter(s => s.currentState === "AGUARDANDO_REVISAO" || s.currentState === "AVALIADA_AUTO");
    const technicalFailures = submissions.filter(s => s.currentState === "FALHA_TECNICA");
    const refactorings = submissions.filter(s => s.currentState === "REFACAO_SOLICITADA");
    const published = submissions.filter(s => s.currentState === "RESULTADO_PUBLICADO");

    const submittedStudentIds = new Set(submissions.filter(s => s.currentState !== "RASCUNHO").map(s => s.studentId));
    const unsubmittedCount = enrolledStudentIds
      ? [...new Set(enrolledStudentIds)].filter(id => !submittedStudentIds.has(id)).length
      : null;

    return {
      classId,
      className: activities[0]?.className || "Turma sem atividades",
      institutionId: activities[0]?.institutionId || "",
      queryTimestampIso: new Date().toISOString(),
      dataSource: "LOCAL_MEMORY",
      status: activities.length || submissions.length ? "DISPONIVEL" : "ZERO_REGISTROS",
      metrics: {
        ongoingActivitiesCount: ongoingActivities.length,
        receivedSubmissionsCount: submissions.filter(s => s.currentState !== "RASCUNHO").length,
        unsubmittedStudentsCount: unsubmittedCount,
        pendingAsyncJobsCount: pendingJobs.length,
        technicalFailuresCount: technicalFailures.length,
        awaitingTeacherReviewCount: awaitingReview.length,
        unpublishedFeedbackCount: awaitingReview.length,
        refactoringRequestedCount: refactorings.length
      },
      ongoingActivities,
      submissionsByState: {
        received: receivedSubmissions,
        awaitingReview,
        technicalFailures,
        refactorings,
        published,
        processing: submissions.filter(s => s.currentState === "PROCESSANDO"),
      }
    };
  }

  public static getTurmaOperationsCockpit(classId = "turma-ds-a"): {
    atividadesEmAndamento: number;
    entregasRecebidas: number;
    alunosSemEntrega: number | null;
    processamentosPendentes: number;
    falhasTecnicas: number;
    correcoesAguardandoRevisao: number;
    feedbackNaoPublicado: number;
    refacoesSolicitadas: number;
    dataUltimaAtualizacao: string;
  } {
    const summary = this.getOperationsSummary(classId);
    return {
      atividadesEmAndamento: summary.metrics.ongoingActivitiesCount,
      entregasRecebidas: summary.metrics.receivedSubmissionsCount,
      alunosSemEntrega: summary.metrics.unsubmittedStudentsCount,
      processamentosPendentes: summary.metrics.pendingAsyncJobsCount,
      falhasTecnicas: summary.metrics.technicalFailuresCount,
      correcoesAguardandoRevisao: summary.metrics.awaitingTeacherReviewCount,
      feedbackNaoPublicado: summary.metrics.unpublishedFeedbackCount,
      refacoesSolicitadas: summary.metrics.refactoringRequestedCount,
      dataUltimaAtualizacao: summary.queryTimestampIso
    };
  }

  public static reprocessTechnicalFailures(classId = "turma-ds-a"): { requeuedCount: number } {
    const failures = UnifiedLifecycleEngineService.getSubmissions({ classId, state: "FALHA_TECNICA" });
    failures.forEach(f => {
      UnifiedLifecycleEngineService.transitionSubmissionState(f.id, "NA_FILA", "SYSTEM_RECOVERY", "auto-healer", "Reprocessamento de falha técnica sem perda de dados");
      ReliableAsyncJobQueueService.enqueueJob({
        idempotencyKey: `retry-${f.id}-${Date.now()}`,
        type: "CORRECAO_SUBMISSAO",
        payload: { submissionId: f.id, code: f.codeContent, language: f.language }
      });
    });
    return { requeuedCount: failures.length };
  }
}
