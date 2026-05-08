import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { err, ok } from "../types/result.js";
const qstashHeadersSchema = z.object({
    signature: z.string().min(1),
    url: z.string().url().optional(),
    upstashRegion: z.string().optional()
});
export class QStashWebhookVerifier {
    receiver;
    constructor(config) {
        this.receiver = new Receiver({
            currentSigningKey: config.currentSigningKey,
            nextSigningKey: config.nextSigningKey
        });
    }
    async verify(input) {
        const parsed = qstashHeadersSchema.safeParse(input);
        if (!parsed.success) {
            return err("fatal");
        }
        try {
            const verifyRequest = {
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
        }
        catch {
            return err("invalid_signature");
        }
    }
}
