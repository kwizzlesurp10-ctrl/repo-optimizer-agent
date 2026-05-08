import { z } from "zod";

export const repositoryJobSchema = z.object({
  jobId: z.string().min(1),
  repository: z
    .string()
    .min(1)
    .regex(/^[\w.-]+\/[\w.-]+$/u, "repository must match owner/name"),
  commitSha: z.string().min(7).max(64),
  rulesetVersion: z.string().min(1),
  mode: z.enum(["report", "patch"]).default("report"),
  requestedBy: z.string().min(1)
});

export type RepositoryJob = z.infer<typeof repositoryJobSchema>;

export const parseRepositoryJob = (input: unknown): RepositoryJob =>
  repositoryJobSchema.parse(input);
