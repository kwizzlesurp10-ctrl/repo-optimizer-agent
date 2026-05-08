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

export type AppEnv = z.infer<typeof envSchema>;

export const readAppEnv = (input: NodeJS.ProcessEnv): AppEnv => envSchema.parse(input);
