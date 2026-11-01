import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassOperationsCentralService } from "../services/classOperationsCentralService";
import { UnifiedLifecycleEngineService, ManagedSubmission } from "../services/unifiedLifecycleEngineService";
import { ReliableAsyncJobQueueService } from "../services/reliableAsyncJobQueueService";

afterEach(() => vi.restoreAllMocks());

describe("Class operations metrics", () => {
  it("reports local data and unknown enrollment instead of fabricated absences", () => {
    vi.spyOn(UnifiedLifecycleEngineService, "getActivities").mockReturnValue([]);
    vi.spyOn(UnifiedLifecycleEngineService, "getSubmissions").mockReturnValue([]);
    vi.spyOn(ReliableAsyncJobQueueService, "getJobs").mockReturnValue([]);
    const summary = ClassOperationsCentralService.getOperationsSummary("empty-class");
    expect(summary.status).toBe("ZERO_REGISTROS");
    expect(summary.dataSource).toBe("LOCAL_MEMORY");
    expect(summary.metrics.unsubmittedStudentsCount).toBeNull();
  });

  it("isolates queued work by class and includes processing submissions", () => {
    vi.spyOn(UnifiedLifecycleEngineService, "getActivities").mockReturnValue([]);
    vi.spyOn(UnifiedLifecycleEngineService, "getSubmissions").mockReturnValue([
      { id: "s1", studentId: "a", currentState: "PROCESSANDO" },
      { id: "s2", studentId: "b", currentState: "RASCUNHO" },
    ] as ManagedSubmission[]);
    const jobs = ["s1", "other-class-submission"].map((submissionId, index) => ({
      id: `job-${index}`, idempotencyKey: `job-${index}`, type: "CORRECAO_SUBMISSAO" as const,
      payload: { submissionId }, status: "PENDENTE" as const, progressPercent: 0,
      attemptCount: 0, maxRetries: 3, timeoutMs: 5000, isFatal: false,
      createdAtIso: new Date().toISOString(),
    }));
    vi.spyOn(ReliableAsyncJobQueueService, "getJobs").mockReturnValue(jobs);
    const summary = ClassOperationsCentralService.getOperationsSummary("class-a", ["a", "b", "b", "c"]);
    expect(summary.metrics.pendingAsyncJobsCount).toBe(1);
    expect(summary.metrics.receivedSubmissionsCount).toBe(1);
    expect(summary.metrics.unsubmittedStudentsCount).toBe(2);
    expect(summary.submissionsByState.processing.map(s => s.id)).toEqual(["s1"]);
  });
});
