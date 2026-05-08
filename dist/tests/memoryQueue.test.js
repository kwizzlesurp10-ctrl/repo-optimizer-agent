import { describe, expect, it } from "vitest";
import { MemoryQueue } from "../src/queue/memoryQueue.js";
import { err, ok } from "../src/types/result.js";
describe("MemoryQueue", () => {
    it("completes successful jobs", async () => {
        const queue = new MemoryQueue({ maxAttempts: 3 });
        queue.enqueue({ value: "a" }, "job-1");
        const result = await queue.drain(async () => ok("processed"));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.completedJobIds).toEqual(["job-1"]);
            expect(result.value.deadLetterJobIds).toEqual([]);
        }
    });
    it("retries retryable jobs and dead-letters after max attempts", async () => {
        const queue = new MemoryQueue({ maxAttempts: 2 });
        queue.enqueue({ value: "a" }, "job-1");
        const result = await queue.drain(async () => err("retryable"));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.completedJobIds).toEqual([]);
            expect(result.value.deadLetterJobIds).toEqual(["job-1"]);
        }
        expect(queue.getDeadLetterCount()).toBe(1);
    });
});
