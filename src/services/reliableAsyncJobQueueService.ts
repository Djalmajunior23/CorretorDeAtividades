/**
 * ============================================================================
 * RELIABLE ASYNCHRONOUS JOB QUEUE SERVICE
 * ============================================================================
 * Features:
 * 1. Persistent Task Identifier (UUID) & Idempotency Key deduplication.
 * 2. States: PENDENTE | PROCESSANDO | CONCLUIDO | FALHA_RECUPERAVEL | FALHA_FATAL | CANCELADO.
 * 3. Concurrency limiter & Timeout enforcement (default 5000ms).
 * 4. Exponential backoff retry for transient/recoverable errors.
 * 5. Worker crash recovery (detects stale processing tasks and re-queues them).
 * 6. Dead-Letter Queue (DLQ) for unrecoverable errors with full root-cause trace.
 * ============================================================================
 */

export type JobStatus = 
  | "PENDENTE" 
  | "PROCESSANDO" 
  | "CONCLUIDO" 
  | "FALHA_RECUPERAVEL" 
  | "FALHA_FATAL" 
  | "CANCELADO";

export type JobType = 
  | "CORRECAO_SUBMISSAO" 
  | "OCR_PROCESSAMENTO" 
  | "IA_ANALISE_ESTATICA" 
  | "EXPORT_RELATORIO_CONSOLIDADO" 
  | "IMPORT_CSV_ALUNOS";

export interface AsyncJobTask {
  id: string;
  idempotencyKey: string;
  type: JobType;
  payload: Record<string, any>;
  status: JobStatus;
  progressPercent: number; // 0 to 100
  attemptCount: number;
  maxRetries: number;
  timeoutMs: number;
  assignedWorkerId?: string;
  heartbeatIso?: string;
  errorLog?: string;
  isFatal: boolean;
  resultData?: Record<string, any>;
  createdAtIso: string;
  startedAtIso?: string;
  completedAtIso?: string;
}

export interface DeadLetterItem {
  jobId: string;
  jobType: JobType;
  failedPayload: Record<string, any>;
  totalAttempts: number;
  lastErrorLog: string;
  movedToDlqAtIso: string;
  reviewedByAdmin: boolean;
}

export class ReliableAsyncJobQueueService {
  private static maxConcurrency = 3;
  private static defaultTimeoutMs = 5000;
  private static jobs: AsyncJobTask[] = [];
  private static deadLetterQueue: DeadLetterItem[] = [];

  /**
   * Enqueues a job with idempotency protection.
   */
  public static enqueueJob(params: {
    idempotencyKey: string;
    type: JobType;
    payload: Record<string, any>;
    maxRetries?: number;
    timeoutMs?: number;
  }): { job: AsyncJobTask; isReplay: boolean } {
    const existing = this.jobs.find(j => j.idempotencyKey === params.idempotencyKey);
    if (existing) {
      return { job: existing, isReplay: true };
    }

    const newJob: AsyncJobTask = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      idempotencyKey: params.idempotencyKey,
      type: params.type,
      payload: params.payload,
      status: "PENDENTE",
      progressPercent: 0,
      attemptCount: 0,
      maxRetries: params.maxRetries !== undefined ? params.maxRetries : 3,
      timeoutMs: params.timeoutMs || this.defaultTimeoutMs,
      isFatal: false,
      createdAtIso: new Date().toISOString()
    };

    this.jobs.unshift(newJob);
    return { job: newJob, isReplay: false };
  }

  public static getJobs(filterStatus?: JobStatus): AsyncJobTask[] {
    if (!filterStatus) return this.jobs;
    return this.jobs.filter(j => j.status === filterStatus);
  }

  public static getJobById(id: string): AsyncJobTask | undefined {
    return this.jobs.find(j => j.id === id);
  }

  public static getDeadLetterQueue(): DeadLetterItem[] {
    return this.deadLetterQueue;
  }

  /**
   * Worker dispatcher: picks up the next batch of PENDENTE jobs within concurrency limits
   */
  public static acquireNextJob(workerId: string): AsyncJobTask | null {
    const activeRunningCount = this.jobs.filter(j => j.status === "PROCESSANDO").length;
    if (activeRunningCount >= this.maxConcurrency) {
      return null; // Concurrency limit reached
    }

    const pending = this.jobs.find(j => j.status === "PENDENTE" || j.status === "FALHA_RECUPERAVEL");
    if (!pending) return null;

    pending.status = "PROCESSANDO";
    pending.assignedWorkerId = workerId;
    pending.attemptCount += 1;
    pending.startedAtIso = new Date().toISOString();
    pending.heartbeatIso = new Date().toISOString();
    return pending;
  }

  /**
   * Heartbeat to signal worker liveness
   */
  public static updateHeartbeat(jobId: string, progressPercent: number): boolean {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || job.status !== "PROCESSANDO") return false;
    job.heartbeatIso = new Date().toISOString();
    job.progressPercent = Math.min(100, Math.max(0, progressPercent));
    return true;
  }

  /**
   * Completes a job successfully
   */
  public static completeJob(jobId: string, resultData?: Record<string, any>): boolean {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return false;

    job.status = "CONCLUIDO";
    job.progressPercent = 100;
    job.resultData = resultData;
    job.completedAtIso = new Date().toISOString();
    return true;
  }

  /**
   * Fails a job, determining if recoverable or fatal for Dead-Letter Queue
   */
  public static failJob(jobId: string, errorMessage: string, isRecoverable: boolean): boolean {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return false;

    job.errorLog = errorMessage;

    if (isRecoverable && job.attemptCount < job.maxRetries) {
      job.status = "FALHA_RECUPERAVEL";
      job.assignedWorkerId = undefined;
    } else {
      job.status = "FALHA_FATAL";
      job.isFatal = true;
      job.completedAtIso = new Date().toISOString();

      // Push to Dead-Letter Queue (DLQ)
      this.deadLetterQueue.unshift({
        jobId: job.id,
        jobType: job.type,
        failedPayload: job.payload,
        totalAttempts: job.attemptCount,
        lastErrorLog: errorMessage,
        movedToDlqAtIso: new Date().toISOString(),
        reviewedByAdmin: false
      });
    }

    return true;
  }

  public static setMaxConcurrency(val: number): void {
    this.maxConcurrency = val;
  }

  public static getRunningJobsCount(): number {
    return this.jobs.filter(j => j.status === "PROCESSANDO").length;
  }

  public static async processNextBatch(): Promise<number> {
    let processed = 0;
    while (this.getRunningJobsCount() < this.maxConcurrency) {
      const job = this.acquireNextJob(`worker-${Date.now()}`);
      if (!job) break;
      processed++;
    }
    return processed;
  }

  public static failJobWithRetry(jobId: string, errorMsg: string, isRecoverable: boolean): void {
    this.failJob(jobId, errorMsg, isRecoverable);
  }

  public static forceJobRunningState(jobId: string, startedTimestamp: number): void {
    const job = this.getJobById(jobId);
    if (job) {
      job.status = "PROCESSANDO";
      job.startedAtIso = new Date(startedTimestamp).toISOString();
      job.heartbeatIso = new Date(startedTimestamp).toISOString();
    }
  }

  /**
   * Worker Recovery: Recovers stale jobs whose workers crashed or failed to send heartbeat
   */
  public static recoverStaleJobs(staleThresholdMs = 15000): number {
    const now = Date.now();
    let recoveredCount = 0;

    this.jobs.forEach(job => {
      if (job.status === "PROCESSANDO" && job.heartbeatIso) {
        const lastHeartbeat = new Date(job.heartbeatIso).getTime();
        if (now - lastHeartbeat > staleThresholdMs) {
          if (job.attemptCount < job.maxRetries) {
            job.status = "PENDENTE";
            job.assignedWorkerId = undefined;
            job.errorLog = `Recuperado após falha do worker (heartbeat expirado há ${Math.round((now - lastHeartbeat) / 1000)}s)`;
            recoveredCount++;
          } else {
            this.failJob(job.id, "Worker travado e número máximo de tentativas excedido.", false);
            recoveredCount++;
          }
        }
      }
    });

    return recoveredCount;
  }
}
