import { beforeEach, describe, expect, it, vi } from "vitest";
import { QStashWebhookVerifier } from "../src/queue/qstashWebhook.js";
const { verify } = vi.hoisted(() => {
    const verifyFn = vi.fn();
    return { verify: verifyFn };
});
vi.mock("@upstash/qstash", () => ({
    Receiver: class {
        verify = verify;
    }
}));
describe("QStashWebhookVerifier", () => {
    beforeEach(() => {
        verify.mockReset();
    });
    it("returns verified when receiver validates signature", async () => {
        verify.mockResolvedValue(true);
        const verifier = new QStashWebhookVerifier({
            currentSigningKey: "current",
            nextSigningKey: "next"
        });
        const result = await verifier.verify({
            signature: "sig",
            body: "{\"ok\":true}",
            url: "https://example.com/api/qstash"
        });
        expect(result.ok).toBe(true);
    });
    it("returns invalid signature when receiver fails", async () => {
        verify.mockRejectedValue(new Error("invalid"));
        const verifier = new QStashWebhookVerifier({
            currentSigningKey: "current",
            nextSigningKey: "next"
        });
        const result = await verifier.verify({
            signature: "sig",
            body: "{\"ok\":true}"
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe("invalid_signature");
        }
    });
});
