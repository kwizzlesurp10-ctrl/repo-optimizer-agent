import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleQStashRequest } from "../src/api/qstashHandler.js";
const { verifyMock, executeOptimizationPassMock } = vi.hoisted(() => {
    return {
        verifyMock: vi.fn(),
        executeOptimizationPassMock: vi.fn()
    };
});
vi.mock("../src/queue/qstashWebhook.js", () => ({
    QStashWebhookVerifier: class {
        async verify(input) {
            return verifyMock(input);
        }
    }
}));
vi.mock("../src/worker/optimizerWorker.js", () => ({
    executeOptimizationPass: (payload) => executeOptimizationPassMock(payload)
}));
describe("handleQStashRequest", () => {
    const previousCurrentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const previousNextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    beforeEach(() => {
        process.env.QSTASH_CURRENT_SIGNING_KEY = "current";
        process.env.QSTASH_NEXT_SIGNING_KEY = "next";
        verifyMock.mockReset();
        executeOptimizationPassMock.mockReset();
    });
    const createStore = (acquireResult) => ({
        acquire: vi.fn(async () => acquireResult),
        release: vi.fn(async () => ({ ok: true, value: "released" }))
    });
    afterEach(() => {
        process.env.QSTASH_CURRENT_SIGNING_KEY = previousCurrentKey;
        process.env.QSTASH_NEXT_SIGNING_KEY = previousNextKey;
    });
    it("returns 401 when signature is missing", async () => {
        const result = await handleQStashRequest({
            headers: {},
            body: "{}",
            url: "https://example.com/api/qstash"
        }, createStore({ ok: true, value: "acquired" }));
        expect(result.status).toBe(401);
    });
    it("returns 400 for invalid repository payload", async () => {
        verifyMock.mockResolvedValue({ ok: true, value: "verified" });
        const result = await handleQStashRequest({
            headers: { "upstash-signature": "sig" },
            body: JSON.stringify({ jobId: "missing-required-fields" }),
            url: "https://example.com/api/qstash"
        }, createStore({ ok: true, value: "acquired" }));
        expect(result.status).toBe(400);
    });
    it("executes optimization and returns 200 for valid payload", async () => {
        verifyMock.mockResolvedValue({ ok: true, value: "verified" });
        executeOptimizationPassMock.mockResolvedValue({
            ok: true,
            value: {
                jobId: "job-1",
                repository: "owner/repo",
                rulesetVersion: "1.0.0",
                findingsCount: 3,
                gatesPassed: true
            }
        });
        const result = await handleQStashRequest({
            headers: { "upstash-signature": "sig", "upstash-region": "us-east-1" },
            body: JSON.stringify({
                jobId: "job-1",
                repository: "owner/repo",
                commitSha: "abcdef1",
                rulesetVersion: "1.0.0",
                mode: "report",
                requestedBy: "test"
            }),
            url: "https://example.com/api/qstash"
        }, createStore({ ok: true, value: "acquired" }));
        expect(result.status).toBe(200);
        expect(executeOptimizationPassMock).toHaveBeenCalledOnce();
    });
    it("returns duplicate success when idempotency key already exists", async () => {
        verifyMock.mockResolvedValue({ ok: true, value: "verified" });
        const result = await handleQStashRequest({
            headers: { "upstash-signature": "sig" },
            body: JSON.stringify({
                jobId: "job-1",
                repository: "owner/repo",
                commitSha: "abcdef1",
                rulesetVersion: "1.0.0",
                mode: "report",
                requestedBy: "test"
            }),
            url: "https://example.com/api/qstash"
        }, createStore({ ok: false, error: "duplicate" }));
        expect(result.status).toBe(200);
        expect(executeOptimizationPassMock).not.toHaveBeenCalled();
    });
});
