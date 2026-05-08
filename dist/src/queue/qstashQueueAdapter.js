import { Client } from "@upstash/qstash";
import { err, ok } from "../types/result.js";
export class QStashQueueAdapter {
    client;
    callbackUrl;
    constructor(config) {
        this.client = new Client({ token: config.token });
        this.callbackUrl = config.callbackUrl;
    }
    async enqueue(jobId, payload, options) {
        try {
            const request = {
                url: this.callbackUrl,
                body: payload,
                retries: options?.retries ?? 3,
                deduplicationId: options?.deduplicationId ?? jobId,
                headers: {
                    "content-type": "application/json",
                    "x-repo-optimizer-job-id": jobId
                }
            };
            if (options?.delaySeconds !== undefined) {
                request.delay = options.delaySeconds;
            }
            await this.client.publishJSON(request);
            return ok("enqueued");
        }
        catch {
            return err("fatal");
        }
    }
}
