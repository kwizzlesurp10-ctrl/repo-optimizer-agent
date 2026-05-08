import type { Result } from "../types/result.js";

export interface EnqueueOptions {
  readonly deduplicationId?: string;
  readonly delaySeconds?: number;
  readonly retries?: number;
}

export interface QueueAdapter<TPayload> {
  enqueue(jobId: string, payload: TPayload, options?: EnqueueOptions): Promise<Result<"enqueued", "fatal">>;
}
