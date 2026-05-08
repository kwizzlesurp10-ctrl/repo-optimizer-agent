import { createIdempotencyStore } from "../idempotency/createIdempotencyStore.js";
import type { IdempotencyStore } from "../idempotency/idempotencyStore.js";
import { repositoryJobSchema } from "../domain/job.js";
import { QStashWebhookVerifier } from "../queue/qstashWebhook.js";
import { executeOptimizationPass } from "../worker/optimizerWorker.js";

export interface QStashHandlerInput {
  readonly headers: Record<string, string | undefined>;
  readonly body: string;
  readonly url: string;
}

export interface QStashHandlerResponse {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

const getHeader = (
  headers: Record<string, string | undefined>,
  name: string
): string | undefined => {
  const key = Object.keys(headers).find((headerName) => headerName.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : headers[key];
};

export const handleQStashRequest = async (
  input: QStashHandlerInput,
  store: IdempotencyStore = createIdempotencyStore()
): Promise<QStashHandlerResponse> => {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (currentSigningKey === undefined || nextSigningKey === undefined) {
    return {
      status: 500,
      body: { error: "qstash_signing_keys_missing" }
    };
  }

  const signature = getHeader(input.headers, "upstash-signature");
  if (signature === undefined) {
    return {
      status: 401,
      body: { error: "missing_upstash_signature" }
    };
  }

  const verifier = new QStashWebhookVerifier({
    currentSigningKey,
    nextSigningKey
  });

  const verifyInput: {
    signature: string;
    body: string;
    url: string;
    upstashRegion?: string;
  } = {
    signature,
    body: input.body,
    url: input.url
  };

  const upstashRegion = getHeader(input.headers, "upstash-region");
  if (upstashRegion !== undefined) {
    verifyInput.upstashRegion = upstashRegion;
  }

  const verification = await verifier.verify(verifyInput);

  if (!verification.ok) {
    return {
      status: verification.error === "invalid_signature" ? 401 : 500,
      body: { error: verification.error }
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(input.body) as unknown;
  } catch {
    return {
      status: 400,
      body: { error: "invalid_json" }
    };
  }

  const parsedJob = repositoryJobSchema.safeParse(payload);
  if (!parsedJob.success) {
    return {
      status: 400,
      body: {
        error: "invalid_job_payload",
        details: parsedJob.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    };
  }

  const acquireResult = await store.acquire(parsedJob.data.jobId, 3600);
  if (!acquireResult.ok) {
    if (acquireResult.error === "duplicate") {
      return {
        status: 200,
        body: {
          ok: true,
          duplicate: true,
          jobId: parsedJob.data.jobId
        }
      };
    }

    return {
      status: 500,
      body: { error: acquireResult.error }
    };
  }

  const execution = await executeOptimizationPass(parsedJob.data);
  if (!execution.ok) {
    await store.release(parsedJob.data.jobId);
    return {
      status: execution.error === "retryable" ? 503 : 500,
      body: { error: execution.error }
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      duplicate: false,
      result: execution.value
    }
  };
};
