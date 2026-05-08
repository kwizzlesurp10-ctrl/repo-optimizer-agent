import { readAppEnv } from "./config/env.js";
import { parseRepositoryJob } from "./domain/job.js";
import { MemoryQueue } from "./queue/memoryQueue.js";
import { MemoryQueueAdapter } from "./queue/memoryQueueAdapter.js";
import type { QueueAdapter } from "./queue/queueAdapter.js";
import { QStashQueueAdapter } from "./queue/qstashQueueAdapter.js";
import { executeOptimizationPass } from "./worker/optimizerWorker.js";

const bootstrap = async (): Promise<void> => {
  const env = readAppEnv(process.env);
  const queue = new MemoryQueue<unknown>({ maxAttempts: 3 });
  const queueAdapter: QueueAdapter<unknown> =
    env.QUEUE_BACKEND === "qstash" && env.QSTASH_TOKEN !== undefined && env.QSTASH_CALLBACK_URL !== undefined
      ? new QStashQueueAdapter<unknown>({
          token: env.QSTASH_TOKEN,
          callbackUrl: env.QSTASH_CALLBACK_URL
        })
      : new MemoryQueueAdapter(queue);

  const sampleJob = parseRepositoryJob({
    jobId: "job-demo-001",
    repository: "acme/repo-optimizer-target",
    commitSha: "abc1234",
    rulesetVersion: "1.0.0",
    requestedBy: "system",
    mode: "report"
  });

  const enqueueResult = await queueAdapter.enqueue(sampleJob.jobId, sampleJob, {
    deduplicationId: sampleJob.jobId,
    retries: 3
  });

  if (!enqueueResult.ok) {
    throw new Error(`queue failed to enqueue: ${enqueueResult.error}`);
  }

  if (env.QUEUE_BACKEND === "qstash") {
    process.stdout.write(
      `${JSON.stringify({ backend: "qstash", queued: sampleJob.jobId }, null, 2)}\n`
    );
    return;
  }

  const drainResult = await queue.drain(executeOptimizationPass);
  if (!drainResult.ok) {
    throw new Error(`queue failed to start: ${drainResult.error}`);
  }

  const output = {
    backend: "memory",
    completed: drainResult.value.completedJobIds,
    deadLetter: drainResult.value.deadLetterJobIds
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
};

void bootstrap();
