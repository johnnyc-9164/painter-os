# Independent Contractor OS baseline verification

## Verdict
**PASS — preserved Contractor OS v0.6.0 is ready as a local regression baseline.** This is not a verdict that the Painter product, customer portal, host authentication, live deployment, migrations, or external integrations are production-ready.

Evidence is stored alongside this report: each required command has a `.log` output and `.exit` status, with command, cwd, elapsed seconds and status in `results.json`. `npm-ls.log` / `.exit` records installed dependency resolution. Package scripts were read before execution. No source/package metadata edits, installs, deployments, codegen, Convex CLI/network-telemetry commands, or tool configuration changes were performed. The permitted existing `build:core` ran as part of `npm test`.

## Exact results

| Command | Exit | Result |
|---|---:|---|
| `npm test` | 0 | 411 tests passed; 0 failed, cancelled, skipped, or todo |
| `npm run check:generated` | 0 | Domain generated-file check passed; trade IR: 9 components, 52 source fields, no drift |
| `npm run typecheck` | 0 | Semantic TypeScript check passed, no diagnostics |
| `npm run test:integration` | 0 | 41 tests passed in 5 files |
| `npm run check:syntax` | 0 | 168 TypeScript files; 0 syntax errors |
| `npm run check:packaged-component` | 0 | 75 component files; 0 errors, 0 warnings; generated artifacts required |
| `npm run check:composition` | 0 | Valid original composition: 10 runtime components, 6 configuration packs; 20 Python tests passed |

Total actual tests: **472 passed** (411 Node + 41 integration + 20 composition). All **7/7 required command gates passed**. The 10-component result describes the original all-trades backend composition, not a newly derived Painter-only runtime.

## Runtime/dependencies
- Node v24.14.1; npm 11.11.0.
- Original workspace package resolves its own TypeScript **5.8.3**, and its local `node_modules/.bin/tsc` is present. Root TypeScript is 6.0.3; it was not substituted for the original compiler.
- Root binaries were available after package-local binaries in PATH. Convex 1.46.0, convex-helpers 0.1.124, convex-test 0.0.59, Vitest 4.1.10, Vite 8.2.0 and @edge-runtime/vm 5.0.0 resolved successfully; `npm ls` exit 0.
- CI mode and telemetry-disable environment were set for verification; no telemetry command was invoked. Initial `npm ls` emitted an npm update notice only.

## Preservation proof
Compared `/agent/workspace/painter-os-bts/packages/contractor-os-core` against `/agent/workspace/painter_build_sources/backend/contractor-os-core`, ignoring only directories named `node_modules` and `build`. Included generated source artifacts, package metadata, lockfile, tools, models, tests and supplied evidence.

- Supplied files: **358**; preserved files: **358**.
- Source comparison: **0 added / 0 removed / 0 modified**.
- Source before versus after tests: **0 added / 0 removed / 0 modified**.
- Build files: **38 before / 38 after**, **0 added / 0 removed / 0 content-modified**. Compilation may rewrite timestamps; hashes prove content unchanged.
- Matching aggregate SHA256: `7fa9467511ea1588abebbee7aa089fd07489ac886d0e2eee125d6c5e6985f423`.
- Algorithm: SHA256 over sorted relative path + NUL + per-file SHA256 + newline. Per-file inventories are in `source-before.json`, `source-after.json`, `supplied-source.json`, `build-before.json`, and `build-after.json`.

## Uploaded IR review — non-binding advice to factory
Reviewed the uploaded `Painter_OS_Full_IR_Package/ir` contracts, backend bindings, acceptance gates and relevant integration-audit sections. The structural scan is in `ir-structural-review.json`; it is separate from the backend's passing original composition validator.

### Exact contract inventory / inconsistencies
- 9 IR YAML files; 15 registered modules: 3 existing, 8 partial, 4 planned.
- 15 routes; 11 screen contracts; 8 canonical screenshot references.
- 8 aggregates: 1 existing, 3 `existing/extend`, 1 extend, 3 planned.
- 11 events; 10 phases P0–P9; 9 roles; 11 capability defaults.
- 0 module-dependency cycles in the uploaded registry.
- 2 referenced dependencies not registered: `files`, `tasks` (commercial procurement).
- 4 system core modules missing registry entries: `tasks`, `files`, `notifications`, `search`.
- 4 routes have no corresponding screen contract: lead-detail, estimate-detail, job-list, bid-tracker.
- 3 aggregates use `existing/extend`, but declared contract status values are only existing/extend/planned as separate values; normalize or explicitly admit the composite value in a validator.

These are completeness/validation blockers for accepting the entire IR as machine-executable, not defects in the unchanged backend baseline. Recommend complete registry/screen contracts or explicitly scope these routes out of an accepted phase, then add a product-IR validator.

### Security and implementation blockers before material product use
1. **Fine-grained host authorization must be added outside the frozen core.** The original `src/shared/port.ts` permission vocabulary is read/import/write/attest, and `src/backendClient.ts` checks generic read or write. Product capability defaults (finance.write, estimate.write, field.update, etc.) are not enforced by those checks alone. Do not expose an unrestricted generic execute wrapper to product roles; validate a command-to-capability allowlist in host wrappers. Test finance-write denial for salesperson/crew, read-model redaction, forged membership and disabled users.
2. **Customer isolation is narrower than tenant isolation.** `/customers/:customerId/portal` plus generic tenant read permission does not establish customer ownership. The uploaded audit explicitly says the portal bounded API is incomplete. Build a separate customer-scoped host resolver/read API that binds identity to authorized customer records and linked estimates/jobs/invoices/files; test cross-customer access within one tenant as well as cross-tenant access. Do not reuse tenant-wide inspectRecord/history/list operations unfiltered.
3. **Planned product commands/states are not existing APIs.** Lead commands in IR use product names while current host examples use `co_create_lead`, `co_advance_lead`, etc.; estimate revision/approval, ScheduleEntry, FieldRun and ReviewRequest contracts need deliberate adapters/extensions. The baseline does not prove those planned lifecycle seams. Preserve original core and express adapters/extension work in host/product packages with explicit regression gates.
4. **Event envelope/delivery details are underspecified.** Payloads list fields but not formal types or event IDs/version/aggregate sequence. Idempotent consumer policy alone is not durable deduplication. Define versioned event schema, event identity, producer transaction/outbox semantics, tenant-bound consumption, replay/dedup storage, revision preconditions and evidence before wiring side effects. Approved estimate snapshots must not drift under downstream consumers.
5. **Money and external integrations need dedicated gates.** IR lacks concrete currency/minor-unit, refund/reversal, provider webhook signature/replay and credential-storage policies. Keep billing/provider actions disabled or clearly stubbed pending verified server-side adapters; never infer settled payment from browser state. Scope idempotency to tenant/provider/payment identity, audit reversals, and avoid secrets in client props/logs.
6. **Agent approvals/evidence must be server enforceable.** The uploaded principles are good requirements, not an implemented authority model. Bind material-action approvals to exact actor, tenant, command, revision and expiry, and require the same host authorization for automation. Treat knowledge uploads and provider content as untrusted data; deny authority escalation through them.
7. **Files/offline field operations need an explicit policy.** Photo/evidence attachment and poor-network support are planned, while files/tasks registry entries are absent. Specify tenant/customer access checks on upload/download, content limits, signed-URL lifetime, retention and optimistic-revision/retry behavior before accepting field evidence workflows.

These are non-binding design/security recommendations, not a full penetration test or claims of confirmed exploitable vulnerabilities. No production auth provider, network deployment, migrations or provider integration was tested. Factory should use this green frozen baseline for P0 and add independently testable Painter host/product slices for P1 onward.
