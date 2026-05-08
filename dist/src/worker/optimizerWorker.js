import { parseRepositoryJob } from "../domain/job.js";
import { err, ok } from "../types/result.js";
export const executeOptimizationPass = async (payload) => {
    let job;
    try {
        job = parseRepositoryJob(payload);
    }
    catch {
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
