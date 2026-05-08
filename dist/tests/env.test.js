import { describe, expect, it } from "vitest";
import { readAppEnv } from "../src/config/env.js";
describe("readAppEnv", () => {
    it("defaults to memory backend", () => {
        const env = readAppEnv({});
        expect(env.QUEUE_BACKEND).toBe("memory");
    });
    it("accepts qstash backend with optional keys", () => {
        const env = readAppEnv({
            QUEUE_BACKEND: "qstash",
            QSTASH_TOKEN: "token",
            QSTASH_CALLBACK_URL: "https://example.com/api/qstash"
        });
        expect(env.QUEUE_BACKEND).toBe("qstash");
        expect(env.QSTASH_TOKEN).toBe("token");
    });
});
