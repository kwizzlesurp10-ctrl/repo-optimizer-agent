import { describe, expect, it } from "vitest";
import { MemoryQueue } from "../src/queue/memoryQueue.js";
import { MemoryQueueAdapter } from "../src/queue/memoryQueueAdapter.js";
describe("MemoryQueueAdapter", () => {
    it("enqueues payloads into the memory queue", async () => {
        const queue = new MemoryQueue({ maxAttempts: 2 });
        const adapter = new MemoryQueueAdapter(queue);
        const result = await adapter.enqueue("job-1", { id: "job-1" });
        expect(result.ok).toBe(true);
        expect(queue.getPendingCount()).toBe(1);
    });
});
