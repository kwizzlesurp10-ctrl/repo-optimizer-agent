import { z } from "zod";
const envSchema = z.object({
    QUEUE_BACKEND: z.enum(["memory", "qstash"]).default("memory"),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CALLBACK_URL: z.string().url().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional()
});
export const readAppEnv = (input) => envSchema.parse(input);
