import { describe, expect, it } from "vitest";
import { parseRepositoryJob } from "../src/domain/job.js";
describe("parseRepositoryJob", () => {
    it("parses a valid repository job payload", () => {
        const parsed = parseRepositoryJob({
            jobId: "job-1",
            repository: "owner/repo",
            commitSha: "abcdef1",
            rulesetVersion: "1.0.0",
            requestedBy: "qa",
            mode: "patch"
        });
        expect(parsed.repository).toBe("owner/repo");
        expect(parsed.mode).toBe("patch");
    });
    it("throws on invalid repository format", () => {
        expect(() => parseRepositoryJob({
            jobId: "job-1",
            repository: "invalid-format",
            commitSha: "abcdef1",
            rulesetVersion: "1.0.0",
            requestedBy: "qa",
            mode: "patch"
        })).toThrowError();
    });
});
