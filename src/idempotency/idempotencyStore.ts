import type { Result } from "../types/result.js";

export interface IdempotencyStore {
  acquire(jobId: string, ttlSeconds: number): Promise<Result<"acquired", "duplicate" | "fatal">>;
  release(jobId: string): Promise<Result<"released", "fatal">>;
}
