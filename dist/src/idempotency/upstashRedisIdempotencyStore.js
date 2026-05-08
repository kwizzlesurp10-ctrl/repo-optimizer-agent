import { Redis } from "@upstash/redis";
import { err, ok } from "../types/result.js";
export class UpstashRedisIdempotencyStore {
    redis;
    keyPrefix;
    constructor(config) {
        this.redis = new Redis({
            url: config.url,
            token: config.token
        });
        this.keyPrefix = config.keyPrefix ?? "repo-optimizer:job";
    }
    async acquire(jobId, ttlSeconds) {
        try {
            const key = `${this.keyPrefix}:${jobId}`;
            const setResult = await this.redis.set(key, "1", { ex: ttlSeconds, nx: true });
            return setResult === "OK" ? ok("acquired") : err("duplicate");
        }
        catch {
            return err("fatal");
        }
    }
    async release(jobId) {
        try {
            const key = `${this.keyPrefix}:${jobId}`;
            await this.redis.del(key);
            return ok("released");
        }
        catch {
            return err("fatal");
        }
    }
}
