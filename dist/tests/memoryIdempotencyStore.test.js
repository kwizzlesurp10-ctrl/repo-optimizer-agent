import { describe, expect, it } from "vitest";
import { MemoryIdempotencyStore } from "../src/idempotency/memoryIdempotencyStore.js";
describe("MemoryIdempotencyStore", () => {
    it("acquires once and rejects duplicate within ttl", async () => {
        const store = new MemoryIdempotencyStore();
        const first = await store.acquire("job-1", 3600);
        const second = await store.acquire("job-1", 3600);
        expect(first.ok).toBe(true);
        expect(second.ok).toBe(false);
        if (!second.ok) {
            expect(second.error).toBe("duplicate");
        }
    });
    it("allows re-acquire after release", async () => {
        const store = new MemoryIdempotencyStore();
        await store.acquire("job-1", 3600);
        await store.release("job-1");
        const third = await store.acquire("job-1", 3600);
        expect(third.ok).toBe(true);
    });
});
