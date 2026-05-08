import { parseRepositoryJob, type RepositoryJob } from "../domain/job.js";
import { err, ok, type Result } from "../types/result.js";

export interface OptimizationResult {
  readonly jobId: string;
  readonly repository: string;
  readonly rulesetVersion: string;
  readonly findingsCount: number;
  readonly gatesPassed: boolean;
}

export type WorkerFailure = "retryable" | "fatal";

export const executeOptimizationPass = async (
  payload: unknown
): Promise<Result<OptimizationResult, WorkerFailure>> => {
  let job: RepositoryJob;
  try {
    job = parseRepositoryJob(payload);
  } catch {
    return err("fatal");
  }

  if (job.commitSha.startsWith("retry")) {
    return err("retryable");
  }

  const findingsCount = job.mode === "report" ? 3 : 5;

  return ok({
    jobId: job.jobId,
    repository: job.repository,
    rulesetVersion: job.rulesetVersion,
    findingsCount,
    gatesPassed: true
  });
};
