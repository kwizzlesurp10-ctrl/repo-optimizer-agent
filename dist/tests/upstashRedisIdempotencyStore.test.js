import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpstashRedisIdempotencyStore } from "../src/idempotency/upstashRedisIdempotencyStore.js";
const { setMock, delMock } = vi.hoisted(() => ({
    setMock: vi.fn(),
    delMock: vi.fn()
}));
vi.mock("@upstash/redis", () => ({
    Redis: class {
        set = setMock;
        del = delMock;
    }
}));
describe("UpstashRedisIdempotencyStore", () => {
    beforeEach(() => {
        setMock.mockReset();
        delMock.mockReset();
    });
    it("returns acquired when redis nx set succeeds", async () => {
        setMock.mockResolvedValue("OK");
        const store = new UpstashRedisIdempotencyStore({
            url: "https://example.com",
            token: "token"
        });
        const result = await store.acquire("job-1", 3600);
        expect(result.ok).toBe(true);
    });
    it("returns duplicate when redis nx set does not return OK", async () => {
        setMock.mockResolvedValue(null);
        const store = new UpstashRedisIdempotencyStore({
            url: "https://example.com",
            token: "token"
        });
        const result = await store.acquire("job-1", 3600);
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBe("duplicate");
        }
    });
});
