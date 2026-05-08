import { err, ok, type Result } from "../types/result.js";

export interface QueueJob<TPayload> {
  readonly id: string;
  readonly payload: TPayload;
  readonly attempts: number;
}

export interface QueueProcessOutcome {
  readonly completedJobIds: readonly string[];
  readonly deadLetterJobIds: readonly string[];
}

type QueueError = "already_started";

export interface QueueOptions {
  readonly maxAttempts: number;
}

export class MemoryQueue<TPayload> {
  private readonly pending: QueueJob<TPayload>[] = [];
  private readonly deadLetter: QueueJob<TPayload>[] = [];
  private isRunning = false;
  private readonly maxAttempts: number;

  public constructor(options: QueueOptions) {
    this.maxAttempts = options.maxAttempts;
  }

  public enqueue(payload: TPayload, id: string): void {
    this.pending.push({ id, payload, attempts: 0 });
  }

  public getPendingCount(): number {
    return this.pending.length;
  }

  public getDeadLetterCount(): number {
    return this.deadLetter.length;
  }

  public async drain<TResult>(
    worker: (payload: TPayload) => Promise<Result<TResult, "retryable" | "fatal">>
  ): Promise<Result<QueueProcessOutcome, QueueError>> {
    if (this.isRunning) {
      return err("already_started");
    }

    this.isRunning = true;

    const completedJobIds: string[] = [];
    const deadLetterJobIds: string[] = [];

    while (this.pending.length > 0) {
      const job = this.pending.shift();
      if (job === undefined) {
        break;
      }

      const outcome = await worker(job.payload);
      if (outcome.ok) {
        completedJobIds.push(job.id);
        continue;
      }

      const nextAttempt = job.attempts + 1;
      if (outcome.error === "retryable" && nextAttempt < this.maxAttempts) {
        this.pending.push({ ...job, attempts: nextAttempt });
        continue;
      }

      this.deadLetter.push({ ...job, attempts: nextAttempt });
      deadLetterJobIds.push(job.id);
    }

    this.isRunning = false;
    return ok({ completedJobIds, deadLetterJobIds });
  }
}
