# HyperAgent Lab: Repo Optimizer Sentinel

Live training ground for building production-grade HyperAgents.

## Node + Queue Baseline

Minimal production-oriented scaffold with:

- strict TypeScript settings
- Zod-validated repository job contracts
- Result pattern (`Result<T, E>`)
- in-memory queue with retry + dead-letter behavior
- QStash adapter for Vercel-compatible production delivery
- test coverage for all business-logic modules

## Quickstart

```bash
npm install
npm run typecheck
npm test
npm run build
```

Entry point: `src/index.ts`  
Design spec: `agent_design_canvas.md`

## Queue Backend Selection

- `QUEUE_BACKEND=memory` (default): local/dev flow
- `QUEUE_BACKEND=qstash`: production queue push via Upstash QStash

Required for QStash mode:

- `QSTASH_TOKEN`
- `QSTASH_CALLBACK_URL`

For webhook verification handlers:

- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

Optional idempotency backend for duplicate-delivery protection:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Vercel QStash Endpoint

- Route: `/api/qstash`
- File: `api/qstash.ts`
- Flow: verify signature (`QStashWebhookVerifier`) -> parse payload (`repositoryJobSchema`) -> execute (`executeOptimizationPass`)
- Duplicate delivery protection: acquires `jobId` idempotency key before execution (Redis in production, memory fallback in local dev)
