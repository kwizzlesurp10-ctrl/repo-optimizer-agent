import { err, ok, type Result } from "../types/result.js";
import type { IdempotencyStore } from "./idempotencyStore.js";

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, number>();

  public async acquire(
    jobId: string,
    ttlSeconds: number
  ): Promise<Result<"acquired", "duplicate" | "fatal">> {
    const now = Date.now();
    const expiresAt = this.records.get(jobId);
    if (expiresAt !== undefined && expiresAt > now) {
      return err("duplicate");
    }

    this.records.set(jobId, now + ttlSeconds * 1000);
    return ok("acquired");
  }

  public async release(jobId: string): Promise<Result<"released", "fatal">> {
    this.records.delete(jobId);
    return ok("released");
  }
}
