import { describe, expect, it } from "vitest";
import { err, ok } from "../src/types/result.js";
describe("Result helpers", () => {
    it("creates ok results", () => {
        const value = ok(42);
        expect(value.ok).toBe(true);
        if (value.ok) {
            expect(value.value).toBe(42);
        }
    });
    it("creates error results", () => {
        const value = err("boom");
        expect(value.ok).toBe(false);
        if (!value.ok) {
            expect(value.error).toBe("boom");
        }
    });
});
