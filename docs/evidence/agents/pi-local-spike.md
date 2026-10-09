# Pi Durable local runtime compatibility evidence

Issue: https://github.com/johnnyc-9164/painter-os/issues/74

Ownership: `packages/agent-worker` owns the Worker adapter and local fixtures; the existing Convex/Better Auth domain writer and identity boundaries remain unchanged. Root package scripts/lock add independently executable verification. No SDK imports enter public marketing, company sites or existing business/auth runtime modules.

## Installed interface proof

Installed and locked `agents@0.27.0` exports `agents/harness/pi` and `agents/models/pi-ai`; both Pi packages are `1.1.0`. The compiled source uses the actual `PiHarness`, `Harness.open`, `createModels`, `createRegistry` and `this.lifecycle.use`. Wrangler `4.149.0` dry-run bundles the production Worker with a SQLite Durable Object migration. No Cloudflare deploy or account configuration is performed.

Tooling uses `miniflare@5.20261006.1-alpha` and workerd. Its constructor differs from earlier examples: the installed `convertV4MiniflareOptions` adapter is used, with instance `resourcePersistencePath` explicitly set. The old V4 `durableObjectsPersist` option is not preserved by that conversion; initial restart assertions exposed this, and were repaired without weakening assertions. Actual disposal/recreation over the same temporary SQLite directory proves persistence.

The Agent SDK requires exact peer `@modelcontextprotocol/sdk@1.30.0`, replacing the previously indirect root `1.32.0`. Preserving `1.32.0` produced an invalid peer graph; those exploratory explicit pins were removed. The resulting `npm ls` graph is valid and the existing `shadcn` dependency accepts this SDK. This is the only previously installed package version changed. New SDK/tooling adds approximately 240 dependency nodes. Lock key ordering was preserved to reduce irrelevant diff; clean pinned `npm ci --ignore-scripts` validates the resulting graph.

## Local acceptance

Six tests use actual separately bundled Workers, Pi lifecycle and durable SQLite:

1. Production requests to root/ask/submit/snapshot always fail closed with 503/no-store.
2. Completed input dedup, transcript snapshot and separate named conversation objects survive runtime restart.
3. An interrupted replay-safe read runs again and completes the persisted operation.
4. An interrupted unsafe fake effect is not automatically replayed. A deliberate fresh model retry is blocked by a durable unresolved-outcome fixture ledger; count remains one. This fixture demonstrates the required dispatcher boundary, not an implemented production approval/side-effect adapter.
5. Explicit session abort reaches a tool honoring `context.abortSignal`, settles unanswered and clears pending work.
6. An interrupted model stream is requested again after restart; local call counts demonstrate why recovery needs a usage budget.

The deterministic provider has no network transport or credentials. The fake effect changes only its test-local SQLite ledger. Tests prove object separation, not trusted tenant authentication: the fixture router deliberately chooses names from test inputs and is excluded from production.

Pinned install, agent doctor/check, full repository types/lint, production/fixture dry-run builds and the six local runtime tests are the scoped checks. Initial fixture syntax, RPC type-inference, generated-file lint and Miniflare configuration errors were preserved during development and repaired. Exact final head, full regressions, CI and independent review must be attached to the PR. There is no deployed browser/provider acceptance claim.

## Release and rollback scope

No paid model, ChatGPT subscription, Zapier connection, email/send provider, live company data, domain/cookie/auth cutover or production Worker is activated. Source preparations remain closed until a reviewed trusted request adapter and budgets/approval/reconciliation/retention gates exist. Disable submissions and external dispatch before any future rollback; preserve unknown outcomes for reconciliation rather than clearing durable storage.

Skill extraction reused [Painter PR evidence](../../skills/painter-pr-evidence/SKILL.md); the verified Miniflare persistence/API lesson is recorded here. No new skill grants runtime activation authority.
