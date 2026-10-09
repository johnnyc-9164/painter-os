# Painter agent Worker preparation

This independent Worker workspace installs and exercises the actual Cloudflare Agents/Pi Durable integration. It is a local compatibility spike for issue [#74](https://github.com/johnnyc-9164/painter-os/issues/74), not an activated business agent.

Production entrypoint `src/index.ts` always returns `503 TRUSTED_AGENT_ADAPTER_NOT_CONFIGURED` with `Cache-Control: no-store`. It exposes no public ask/session/RPC router, configures no model credentials, registers no filesystem or business tools, and does not read a company snapshot. Its SQLite Durable Object registers the real `PiHarness` lifecycle capability. The provider/registry seam in `src/harness.ts` is available for a later reviewed adapter; passing a model to that seam does not grant authorization.

Pinned runtime packages: `agents@0.27.0`, `@earendil-works/pi-durable@1.1.0`, `@earendil-works/pi-ai@1.1.0`. Pinned local tooling: `wrangler@4.149.0`, `miniflare@5.20261006.1-alpha`, `@cloudflare/workers-types@5.20261009.1`. The Pi integration is beta and the installed Miniflare release is explicitly alpha.

From repository root:

- `npm run build:agent-worker` bundles the production entrypoint with `wrangler deploy --dry-run`; it does not deploy.
- `npm run test:agent-worker` dry-builds production and a separately configured fixture entrypoint, then runs actual local workerd/SQLite DO tests.
- `npm run check-types` includes this workspace; root `npm test` includes its local runtime tests.

The fixture worker, deterministic keyless model and local fake effect are under `tests/fixtures`, outside the production Wrangler entrypoint. They must never be routed or deployed as a public service. No API/OAuth credential or provider call is used. Temporary durable storage directories are owned by each test and removed after disposing the runtime. Model/tool counters and the effect receipt are persisted in actual SQLite, rather than mocked storage.

Before exposing requests: implement a reviewed trusted membership/auth adapter; bind conversation IDs to verified tenants; keep Convex business/approval authority; add external effect approval, expiration/revocation, deduplication/reconciliation, usage budgets, retention/deletion and redacted UI projections. Pi currently has no built-in approval step. Its input `operationId` deduplicates submission, not an external send. Neither SDK replay nor a deterministic fixture ledger proves production exactly-once effects. Do not install a duplicate Convex Workflow agent loop.

A ChatGPT subscription provider requires its own officially supported commercial eligibility check (issue #79). No Codex OAuth credential, undocumented provider path, paid model or Zapier account is configured here.
