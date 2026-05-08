import { ok, type Result } from "../types/result.js";
import { MemoryQueue } from "./memoryQueue.js";
import type { EnqueueOptions, QueueAdapter } from "./queueAdapter.js";

export class MemoryQueueAdapter<TPayload> implements QueueAdapter<TPayload> {
  public constructor(private readonly queue: MemoryQueue<TPayload>) {}

  public async enqueue(
    jobId: string,
    payload: TPayload,
    _options?: EnqueueOptions
  ): Promise<Result<"enqueued", "fatal">> {
    this.queue.enqueue(payload, jobId);
    return ok("enqueued");
  }
}
