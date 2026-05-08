import { Redis } from "@upstash/redis";
import { err, ok, type Result } from "../types/result.js";
import type { IdempotencyStore } from "./idempotencyStore.js";

export interface UpstashRedisIdempotencyStoreConfig {
  readonly url: string;
  readonly token: string;
  readonly keyPrefix?: string;
}

export class UpstashRedisIdempotencyStore implements IdempotencyStore {
  private readonly redis: Redis;
  private readonly keyPrefix: string;

  public constructor(config: UpstashRedisIdempotencyStoreConfig) {
    this.redis = new Redis({
      url: config.url,
      token: config.token
    });
    this.keyPrefix = config.keyPrefix ?? "repo-optimizer:job";
  }

  public async acquire(
    jobId: string,
    ttlSeconds: number
  ): Promise<Result<"acquired", "duplicate" | "fatal">> {
    try {
      const key = `${this.keyPrefix}:${jobId}`;
      const setResult = await this.redis.set(key, "1", { ex: ttlSeconds, nx: true });
      return setResult === "OK" ? ok("acquired") : err("duplicate");
    } catch {
      return err("fatal");
    }
  }

  public async release(jobId: string): Promise<Result<"released", "fatal">> {
    try {
      const key = `${this.keyPrefix}:${jobId}`;
      await this.redis.del(key);
      return ok("released");
    } catch {
      return err("fatal");
    }
  }
}
