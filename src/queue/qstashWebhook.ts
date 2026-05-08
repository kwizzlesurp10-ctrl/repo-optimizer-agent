import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { err, ok, type Result } from "../types/result.js";

const qstashHeadersSchema = z.object({
  signature: z.string().min(1),
  url: z.string().url().optional(),
  upstashRegion: z.string().optional()
});

export interface QStashWebhookVerifierConfig {
  readonly currentSigningKey: string;
  readonly nextSigningKey: string;
}

export interface VerifyWebhookInput {
  readonly signature: string;
  readonly body: string;
  readonly url?: string;
  readonly upstashRegion?: string;
}

export class QStashWebhookVerifier {
  private readonly receiver: Receiver;

  public constructor(config: QStashWebhookVerifierConfig) {
    this.receiver = new Receiver({
      currentSigningKey: config.currentSigningKey,
      nextSigningKey: config.nextSigningKey
    });
  }

  public async verify(input: VerifyWebhookInput): Promise<Result<"verified", "invalid_signature" | "fatal">> {
    const parsed = qstashHeadersSchema.safeParse(input);
    if (!parsed.success) {
      return err("fatal");
    }

    try {
      const verifyRequest: {
        signature: string;
        body: string;
        url?: string;
        upstashRegion?: string;
      } = {
        signature: parsed.data.signature,
        body: input.body
      };

      if (parsed.data.url !== undefined) {
        verifyRequest.url = parsed.data.url;
      }

      if (parsed.data.upstashRegion !== undefined) {
        verifyRequest.upstashRegion = parsed.data.upstashRegion;
      }

      const verified = await this.receiver.verify(verifyRequest);

      if (!verified) {
        return err("invalid_signature");
      }

      return ok("verified");
    } catch {
      return err("invalid_signature");
    }
  }
}
