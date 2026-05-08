import { Client } from "@upstash/qstash";
import { err, ok, type Result } from "../types/result.js";
import type { EnqueueOptions, QueueAdapter } from "./queueAdapter.js";

export interface QStashQueueAdapterConfig {
  readonly token: string;
  readonly callbackUrl: string;
}

export class QStashQueueAdapter<TPayload> implements QueueAdapter<TPayload> {
  private readonly client: Client;
  private readonly callbackUrl: string;

  public constructor(config: QStashQueueAdapterConfig) {
    this.client = new Client({ token: config.token });
    this.callbackUrl = config.callbackUrl;
  }

  public async enqueue(
    jobId: string,
    payload: TPayload,
    options?: EnqueueOptions
  ): Promise<Result<"enqueued", "fatal">> {
    try {
      const request: {
        url: string;
        body: TPayload;
        retries: number;
        deduplicationId: string;
        headers: Record<string, string>;
        delay?: number;
      } = {
        url: this.callbackUrl,
        body: payload,
        retries: options?.retries ?? 3,
        deduplicationId: options?.deduplicationId ?? jobId,
        headers: {
          "content-type": "application/json",
          "x-repo-optimizer-job-id": jobId
        }
      };

      if (options?.delaySeconds !== undefined) {
        request.delay = options.delaySeconds;
      }

      await this.client.publishJSON(request);
      return ok("enqueued");
    } catch {
      return err("fatal");
    }
  }
}
