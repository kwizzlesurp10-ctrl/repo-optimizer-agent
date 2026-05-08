import { err, ok } from "../types/result.js";
export class MemoryQueue {
    pending = [];
    deadLetter = [];
    isRunning = false;
    maxAttempts;
    constructor(options) {
        this.maxAttempts = options.maxAttempts;
    }
    enqueue(payload, id) {
        this.pending.push({ id, payload, attempts: 0 });
    }
    getPendingCount() {
        return this.pending.length;
    }
    getDeadLetterCount() {
        return this.deadLetter.length;
    }
    async drain(worker) {
        if (this.isRunning) {
            return err("already_started");
        }
        this.isRunning = true;
        const completedJobIds = [];
        const deadLetterJobIds = [];
        while (this.pending.length > 0) {
            const job = this.pending.shift();
            if (job === undefined) {
                break;
            }
            const outcome = await worker(job.payload);
            if (outcome.ok) {
                completedJobIds.push(job.id);
                continue;
            }
            const nextAttempt = job.attempts + 1;
            if (outcome.error === "retryable" && nextAttempt < this.maxAttempts) {
                this.pending.push({ ...job, attempts: nextAttempt });
                continue;
            }
            this.deadLetter.push({ ...job, attempts: nextAttempt });
            deadLetterJobIds.push(job.id);
        }
        this.isRunning = false;
        return ok({ completedJobIds, deadLetterJobIds });
    }
}
