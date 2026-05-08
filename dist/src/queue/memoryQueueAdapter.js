import { ok } from "../types/result.js";
export class MemoryQueueAdapter {
    queue;
    constructor(queue) {
        this.queue = queue;
    }
    async enqueue(jobId, payload, _options) {
        this.queue.enqueue(payload, jobId);
        return ok("enqueued");
    }
}
