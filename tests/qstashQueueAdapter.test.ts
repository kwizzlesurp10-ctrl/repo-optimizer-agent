import { beforeEach, describe, expect, it, vi } from "vitest";
import { QStashQueueAdapter } from "../src/queue/qstashQueueAdapter.js";

const { publishJSON } = vi.hoisted(() => {
  const publish = vi.fn();
  return { publishJSON: publish };
});

vi.mock("@upstash/qstash", () => ({
  Client: class {
    public publishJSON = publishJSON;
  }
}));

describe("QStashQueueAdapter", () => {
  beforeEach(() => {
    publishJSON.mockReset();
  });

  it("publishes jobs to qstash", async () => {
    publishJSON.mockResolvedValue({ messageId: "msg-1" });

    const adapter = new QStashQueueAdapter<{ jobId: string }>({
      token: "token",
      callbackUrl: "https://example.com/api/qstash"
    });

    const result = await adapter.enqueue("job-1", { jobId: "job-1" }, { retries: 5 });
    expect(result.ok).toBe(true);
    expect(publishJSON).toHaveBeenCalledOnce();
  });

  it("returns fatal when publish fails", async () => {
    publishJSON.mockRejectedValue(new Error("publish failed"));

    const adapter = new QStashQueueAdapter<{ jobId: string }>({
      token: "token",
      callbackUrl: "https://example.com/api/qstash"
    });

    const result = await adapter.enqueue("job-1", { jobId: "job-1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("fatal");
    }
  });
});
