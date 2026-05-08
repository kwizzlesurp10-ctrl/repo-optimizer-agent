import { describe, expect, it } from "vitest";
import { executeOptimizationPass } from "../src/worker/optimizerWorker.js";

describe("executeOptimizationPass", () => {
  it("returns fatal error for invalid payload", async () => {
    const result = await executeOptimizationPass({ nope: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("fatal");
    }
  });

  it("returns retryable error for retry sentinel commit", async () => {
    const result = await executeOptimizationPass({
      jobId: "job-1",
      repository: "owner/repo",
      commitSha: "retry01",
      rulesetVersion: "1.0.0",
      requestedBy: "qa",
      mode: "report"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("retryable");
    }
  });

  it("returns optimization payload for valid job", async () => {
    const result = await executeOptimizationPass({
      jobId: "job-1",
      repository: "owner/repo",
      commitSha: "abcdef1",
      rulesetVersion: "1.0.0",
      requestedBy: "qa",
      mode: "patch"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.findingsCount).toBe(5);
      expect(result.value.gatesPassed).toBe(true);
    }
  });
});
