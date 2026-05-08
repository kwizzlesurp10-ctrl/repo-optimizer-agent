import { err, ok } from "../types/result.js";
export class MemoryIdempotencyStore {
    records = new Map();
    async acquire(jobId, ttlSeconds) {
        const now = Date.now();
        const expiresAt = this.records.get(jobId);
        if (expiresAt !== undefined && expiresAt > now) {
            return err("duplicate");
        }
        this.records.set(jobId, now + ttlSeconds * 1000);
        return ok("acquired");
    }
    async release(jobId) {
        this.records.delete(jobId);
        return ok("released");
    }
}
