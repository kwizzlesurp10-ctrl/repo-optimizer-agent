# Repo Optimizer Sentinel — Agent Design Canvas (Production)

Production specification for the HyperAgent that audits, hardens, and optimizes customer repositories under agency and SaaS constraints. Use this canvas for implementation, review, and ops.

---

## 1. Objective & Success Metrics

**Primary objective**

- Ingest a target repository (scope: agreed paths, default branch, optional PR scope), run a deterministic + LLM-assisted optimization pass, and deliver mergeable changes plus a concise audit report.

**Success metrics (measurable)**

- **Correctness:** Zero regressions on agreed test/lint/type gates; behavior changes only where explicitly approved or behind flags.
- **Throughput:** Complete a “standard” repo pass within SLA (define per tier: e.g. < 30 min small, < 2 h medium) excluding cold starts.
- **Signal quality:** Report lists every change with file:line, rationale, and rollback note; false-positive rate tracked per rule category.
- **Business:** Conversion-relevant outcomes for SaaS (e.g. time-to-first-value, upgrade prompts) without blocking the core optimization job.

**Non-goals**

- Silent credential exfiltration, license laundering, or edits outside the contracted scope.

---

## 2. Environment & Constraints

**Runtime**

- Prefer isolated execution (CI runner, sandbox, or ephemeral VM) with read-only clone + writable worktree or fork-based PR flow.
- Secrets only via OIDC, short-lived tokens, or platform secret stores — never persisted in agent memory or logs.

**Constraints**

- **Tenancy:** One customer/repo context per job; no cross-repo data in prompt unless explicitly allowlisted.
- **Rate limits:** Git provider API quotas; LLM token and RPM limits; backoff and chunking for large repos.
- **Size:** Cap file count / LOC scanned per pass; paginate tree and diff; stream large files only when necessary.
- **Compliance:** SOC2-friendly logging (no PII in raw prompts where avoidable); retention policy for traces and artifacts.

---

## 3. Core Capabilities & Tools

| Capability | Tooling / Pattern |
|------------|-------------------|
| Clone, branch, PR | GitHub/GitLab API + git CLI or libgit2; signed commits optional |
| Static analysis | Language servers, ESLint/Ruff/tsc, dependency scanners, SBOM |
| Structured edits | AST transforms (preferred) over blind string replace |
| LLM reasoning | Strict tool schema; retrieval over repo index; small context windows per file/cluster |
| Validation | `pnpm test`, `pytest`, `go test`, etc. — declared in repo manifest or agent config |
| Notifications | Webhook, email, Slack — config-driven |

**GitHub (and equivalents)**

- Fine-grained PAT or GitHub App with least privilege: contents, PRs, checks, metadata — not admin unless required.
- Mandatory: label/tag convention for agent PRs (e.g. `hyperagent`, `automated`).

---

## 4. Reasoning & Decision Loop

1. **Ground:** Resolve default branch, detect stack (`package.json`, `go.mod`, etc.), load `AGENTS.md` / `CONTRIBUTING` if present.
2. **Inventory:** Build file graph; classify entrypoints, configs, tests, CI.
3. **Triage:** Score issues (security > correctness > perf > style) using static signals + policy.
4. **Plan:** Batch edits by dependency order; produce a patch plan with verification steps per batch.
5. **Act:** Apply patches; run declared gates; on failure, roll back batch and narrow scope.
6. **Report:** Emit human summary + machine-readable JSON (findings, diffs, commands run, exit codes).
7. **Handoff:** Open PR or attach patch artifact; link to observability run id.

**Stop conditions**

- Max iterations per job; unrecoverable tool error; policy violation; user cancel.

---

## 5. Memory & State Management

**Ephemeral (per job)**

- Working tree hash, intermediate AST caches, failed-attempt traces (redacted).

**Durable (controlled)**

- Optional vector/index of repo snapshots **per customer** only; TTL and legal basis documented.
- No long-term storage of full source in LLM vendor logs if policy forbids — use enterprise API or scrub.

**Idempotency**

- Job id keyed to `(repo, commit, ruleset_version)`; safe to retry without duplicate PRs when using idempotent branch names or locks.

---

## 6. Guardrails & Safety

- **Input:** Zod (or equivalent) for all webhooks and CLI args; path traversal blocked; submodule and large-binary policies explicit.
- **Output:** No raw secrets in PR descriptions; redact tokens in logs.
- **Automation:** Require human review for destructive ops (force-push, branch deletion, `--no-verify`).
- **Supply chain:** Pin action hashes in generated workflows; prefer widely audited patterns.
- **Abuse:** Per-org concurrency limits; kill switch via feature flag.

---

## 7. Deployment & Observability

**Deployment**

- Container or serverless job triggered by queue (SQS, Cloud Tasks, GitHub `workflow_dispatch`) or Cursor/SDK agent orchestration.
- Config: ruleset version, model id, timeouts, repo allowlist.

**Observability**

- Structured logs: `job_id`, `repo`, `duration_ms`, `findings_count`, `gates_passed`.
- Traces: spans for clone, analyze, patch, verify, publish.
- Metrics: success rate, p95 duration, token usage, API 429 rate.
- Alerts: consecutive failures, sudden spike in gate failures, secret-in-log detector trips.

**Artifact retention**

- Patches and reports N days; logs per compliance policy; reproducible via `ruleset_version` + lockfile.

---

## Appendix — Ruleset versioning

- Tag each run with `ruleset_version` (semver or git sha). Breaking policy changes bump major; agents must refuse mixed-version comparisons in dashboards.

*Tailored for HyperAgent Production specialization (agencies + free-to-paid SaaS).*
