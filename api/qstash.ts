import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleQStashRequest } from "../src/api/qstashHandler.js";

export const config = {
  api: {
    bodyParser: false
  }
};

const readRawBody = async (request: VercelRequest): Promise<string> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const buildAbsoluteRequestUrl = (request: VercelRequest): string => {
  const protocolHeader = request.headers["x-forwarded-proto"];
  const protocol = Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader;
  const hostHeader = request.headers.host;
  const requestPath = request.url ?? "/api/qstash";

  if (hostHeader === undefined) {
    return `https://localhost${requestPath}`;
  }

  return `${protocol ?? "https"}://${hostHeader}${requestPath}`;
};

const toHeaderRecord = (
  headers: VercelRequest["headers"]
): Record<string, string | undefined> => {
  const output: Record<string, string | undefined> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      output[name] = undefined;
      continue;
    }

    output[name] = Array.isArray(value) ? value.join(",") : value;
  }
  return output;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  if (request.method !== "POST") {
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = await readRawBody(request);
  const result = await handleQStashRequest({
    headers: toHeaderRecord(request.headers),
    body,
    url: buildAbsoluteRequestUrl(request)
  });

  response.status(result.status).json(result.body);
}
