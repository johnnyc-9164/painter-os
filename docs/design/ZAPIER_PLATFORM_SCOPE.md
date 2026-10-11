# Zapier Platform SDK integration scope

Tracking: [issue #76](https://github.com/johnnyc-9164/painter-os/issues/76). Related, separate: [#75](https://github.com/johnnyc-9164/painter-os/issues/75) (Zapier MCP tools for Pi) and [#72](https://github.com/johnnyc-9164/painter-os/issues/72) (research). Source baseline: main `7c80a47`, 2026-10-11.

This is a scoping and assessment document. It installs nothing, adds no dependency, registers no Zapier app or OAuth client, creates no account, and authorizes no publication, billing or live business action. Broad issue #76 stays open: its acceptance criteria (isolation, idempotency, projection, fixtures) need implementation issues listed in the last section.

## Evidence status of Zapier claims

The Zapier documentation host (`docs.zapier.com`, `platform.zapier.com`) was **not fetchable** from this environment (DNS failure via WebFetch, proxy 403 via curl). Every Zapier statement below is therefore **unverified against the page itself**; it comes from search-result excerpts of the cited official URL, or from the earlier [Pi harness proposal](../architecture/PI_AGENT_HARNESS.md) research. Re-fetch each page before any implementation issue pins behavior. Nothing here fixes an SDK version.

| Claim (unverified) | Official URL (surfaced by search, not fetched) |
| --- | --- |
| REST Hook triggers need subscribe/unsubscribe endpoints; Zapier supplies a per-Zap target URL; the app returns an id used on unsubscribe; optional `expiration_date` triggers resubscribe | https://docs.zapier.com/platform/build/hook-trigger , https://platform.zapier.com/build/hook-trigger |
| Hook ingest/processing has a 30 second limit; dedupe table holds 105,000 rows per Zap | https://docs.zapier.com/platform/build/operating-constraints |
| Polling triggers are deduplicated automatically by Zapier | https://docs.zapier.com/integrations/build/trigger |
| Platform UI OAuth v2 supports only the Authorization Code grant; optional refresh-token request; `state` must be returned unchanged; PKCE supported | https://docs.zapier.com/integrations/build/oauth |
| CLI supports OAuth2 (PKCE since CLI v14.0.0); a `/me`-style test request is expected; OAuth v2 is preferred over other schemes | https://docs.zapier.com/platform/build/auth , https://docs.zapier.com/integrations/build-cli/overview |
| Publishing guidelines exist for OAuth/webhooks/REST | https://docs.zapier.com/integrations/publish/integration-build-guidelines |
| CLI is Node.js/TypeScript; a search excerpt showed 18.5.1 as latest at some time | https://docs.zapier.com/integrations/build-cli/typescript-integrations |

Not found at all (do not assume): Zapier-side rate limits for calls into a partner API, REST Hook dedupe-key semantics, retry/delivery guarantees for hook payloads, the Node.js version the CLI requires, Zapier review/publication steps and fees. These are open verification items, not facts.

## What a Zapier app would be here

A Zapier app is an external client of Painter OS. It adds no new product capability and, under the [compatibility freeze](../contracts/issue-2-freeze.md), no new writer. It is a new **transport and credential surface** in front of the existing authority:

- Better Auth stays the only user/session authority; host `painterMembers` resolution (`resolvePainterMembership` in `packages/backend/convex/painter.ts`) stays the only membership authority.
- Every write is an existing host command (`painter.command`, dedicated mutations). The Zapier app holds no business logic, no copy of domain rules and no cached authority.
- Distinct from #75: there Pi is the Zapier MCP **client** calling other apps. Here Zapier is the **caller** of Painter OS. The two share no code, credentials or tables.

## Mapping onto existing commands and sole writers

Aggregates and writers are from the freeze and `actionContract` in `packages/domain/src/contracts.ts`. "Existing" means the exact action already exists; nothing below needs a new writer.

### Actions (create/update)

| Candidate Zapier action | Existing command / sole writer | Notes |
| --- | --- | --- |
| Create lead | `lead.create` via `painter.command` (domain `applyCommand`) | Minimal useful action. Public site intake (`/api/intake`, `/api/contact-intake`, `publicLead.ts`) is a separate admission path with its own receipts; Zapier must not route through or weaken it. |
| Update lead / qualify / lose | `lead.update`, `lead.qualify`, `lead.lose` | Requires `expectedRevision`; stale revision fails, never overwrites. **Origin-specific rule (verified in `intakePrivacyHooks.ts`, `intakeCommandContext`)**: for a lead with a `painterPublicLeadReceipt` (public-intake origin), `lead.qualify` and `lead.update` carrying `customerId` (customer linking) are allowed only for `owner` and `office_admin`; other roles get `INTAKE_RETENTION_TRANSFER_FORBIDDEN` (the retention-transfer constraint is also enforced when state is persisted). Deleted/`deletion_pending` intake leads reject all `lead.*` with `INTAKE_CONTACT_DELETED`. The role matrix and fixtures must encode this: a salesperson Zap on a public-intake lead fails by design, and the Zapier app must surface it as a permanent, non-retryable error. |
| Create or update customer | `customer.create`, `customer.update` | Customer matching by authenticated-user email is unrelated to Zapier input; no email-based merge. |
| Create task | `task.create` | Low-risk follow-up action. |
| Create draft estimate | `estimate.create` | Draft only. |
| Record expense | `expense.create` | Phase 2; finance role. |

Excluded from the first scope (high consequence; need their own review): `estimate.send/approve/reject/portal` (customer-facing; approval is a customer act via portal token), `invoice.*`, `payment.record` (append-only money; no fabricated payment evidence), `job.*`/`schedule.*` (deposit-gate decision is held by the freeze), `member.*`, `workspace.update` (owner-only host actions), `integration.configure`, `article.publish` (CMS authority), `originalExecute`/Contractor OS workflows (separate store, attestations, no mirroring), and files.

### Searches (read-only)

| Candidate search | Source | Constraint |
| --- | --- | --- |
| Find customer / lead by id, email or phone | `painter.snapshot` projection (role-redacted) | Today only whole-workspace `snapshot` exists. Bounded keyed reads must be added as a **read** query reusing `visibleEntities`/`customerSafe`; no new store. |
| Find estimate / job / invoice by id | same | Same projection. |

### Triggers

**Public-intake exclusion (default, verified)**: `publicLead.submit` writes a `lead.received` event for every anonymous consented submission (`source: consented_public_intake`; contact and project fields live in the lead aggregate) and the data is purged on the intake retention schedule (30 days unless transferred). Current consent text covers storage by the workspace only: it has no third-party-sharing permission and no way to delete a copy held by Zapier or downstream apps. Therefore the trigger/search feed **excludes by default** every event and entity with a public-intake receipt (until a staff `lead.qualify`/customer-link transfer, and even then only through an explicit later decision), and the integration DTO never carries intake contact or project fields. Enabling them requires a versioned third-party-sharing consent plus an external deletion contract (purge propagation), as a separate reviewed issue. Fixture: a public-intake lead never appears in any trigger or search output.

| Candidate trigger | Source | Gap |
| --- | --- | --- |
| New lead, new customer, estimate approved, invoice issued, payment recorded, job completed | `painterEvents` rows written by `persist` in the host transaction | There is **no delivery mechanism today**: no outbox, no cursor index (only `by_tenant`, `by_tenant_entity`), no subscription table, no HTTP route for events. The freeze states no event bus or consumer is deployed. |

Event payloads exist at `schemaVersion: 1` but the freeze says events are redacted per role (`snapshot` strips payload for non-privileged roles) and that new integration envelopes must be explicitly versioned, source-tagged and deduplicated per `(source, tenantId, eventId, consumer)`. A trigger therefore needs a **new, versioned, public-safe integration event projection** (not the raw `painterEvents.payload`). That projection is a read-side derivation of the existing event log, not a second event store.

Trigger mechanism is **undecided**: polling is not selected yet. Zapier polling is reported to fetch only the first page of a reverse-chronological list and not paginate (per the [deduplication guide](https://docs.zapier.com/integrations/build/deduplication); unverified, not fetched), so a bounded "latest N" window silently loses events once more than N arrive between polls. A polling design is acceptable only if the implementation issue first specifies and tests:

- **Cursor ownership**: the stateless poll has no per-Zap cursor Zapier-side that Painter can rely on; any server-side cursor would be a new per-connection writer (persisted, removable, owned by the connection record) and is not assumed. Absent one, the response is a fixed window and loss is possible.
- **Global sort key**: a tenant-scoped, strictly monotonic key (not wall-clock time; ties broken by event id), returned newest first.
- **Retention and window**: how long feed items stay readable, the window size, and that the window must exceed worst-case events per polling interval for the largest workspace.
- **Overload behavior**: if events exceed the window, the response must signal the gap (alert/kill-switch for that connection) instead of silently dropping; backlog semantics are "at-most-window, gap-detected", never "eventually all".
- **Fixtures**: burst of events larger than the page between two polls; assert gap detection or no loss.

If these cannot be met, use REST Hooks instead (below) or a different design; both options stay open.

Deferred REST Hook considerations (if polling is rejected or as the alternative): they add a subscription table (an additional writer), outbound HTTP, SSRF controls on target URLs, retries and unsubscribe/expiry, and the 30 second limit and dedupe table size are unverified.

## Auth model

Principle: Zapier never establishes identity or authority; it presents a credential that the server maps to a Better Auth user and then resolves membership on every call, exactly as the browser does.

- **Identity**: the end user connects their Zapier account through an authorization-code flow against Painter OS, authenticating with Better Auth. The resulting token identifies one Better Auth `user._id` and one workspace chosen server-side from that user's enabled memberships. A workspace id sent by Zapier selects a candidate only (freeze rule); membership grants authority.
- **Bearer-to-Convex identity seam (explicit prerequisite, verified gap)**: `painter.command`, `snapshot` and the other host functions derive the actor only from `authComponent.safeGetAuthUser(ctx)` and throw `UNAUTHENTICATED` otherwise; a Zapier OAuth bearer carries no Convex auth context, so a bare HTTP edge forwarding to `painter.command` fails every call. Before any implementation, a reviewed contract must define a **server-only bearer-validation / credential-exchange seam** that (1) validates the presented token (issuer, audience, expiry, signature or hashed lookup), (2) binds it to exactly one Better Auth `user._id` and one workspace selected from that user's enabled memberships, (3) checks revocation (token, connection record, user disabled/deleted) on every call, and (4) only then invokes the existing `resolvePainterMembership`/command path, with the actor still derived from Better Auth user plus the host membership row. The seam must not mint a parallel user, membership or role store, must not trust token-embedded role/tenant claims, and its secrets stay server-side. Whether the seam is a Better Auth capability or a thin exchange that yields a short-lived Better Auth session is the open decision for follow-up issue 2; until that is accepted, no Zapier edge may be built.
- **Per-call authority**: each trigger/search/action calls the existing resolver, so current role and `enabled` state apply immediately. Role removal, member disable or token revocation takes effect on the next call. No role or tenant claim inside the token is trusted.
- **Role scope**: allow only roles with the underlying capability; `customer` role is never permitted through Zapier. Zapier-created records carry the Better Auth user id as actor, consistent with existing audit history.
- **OAuth app concerns** (all unverified against Zapier docs, all need explicit approval before action): who hosts the authorization/token endpoints (the Better Auth component's OAuth provider capability, if any, has not been assessed and is not assumed; adding an OAuth provider/plugin changes the auth authority and needs its own freeze revision and dependency review); client registration, redirect URIs, scopes, PKCE, refresh/rotation, token hashing at rest, revocation, and whether auth cookies/origins are touched. The marketing/admin split forbids moving auth callbacks or cookies without a verified cutover, so the authorization endpoint must live on the existing admin origin.
- **Fallback if OAuth on Better Auth is not viable**: per-user API keys are a Zapier-supported scheme (unverified) but create a new credential store (a second auth authority). Treat as a rejected default; adopt only through a reviewed contract revision.
- **Secrets**: client secret, signing keys and tokens are server-side only, never in docs, repo, logs, model context or URLs.

## Tenant and role isolation

- One connection = one (user, workspace). A user in several workspaces creates separate connections; no cross-workspace selection by input.
- All queries/mutations resolve tenant from membership; every Convex read uses tenant-prefixed indexes (`by_tenant*`); Zapier-supplied ids are looked up under the resolved tenant and return not-found otherwise.
- Output goes through the same role projection as `snapshot` (including `customerSafe` and event payload redaction) and an additional integration allowlist of fields (no private notes, pricing internals, tokens, storage ids, portal tokens, intake PII beyond the field the actor may already see).
- Responses and replays use identical projection (freeze requirement). Hidden UI controls never authorize.
- Fixtures must include a second workspace and a demoted/disabled member and assert zero leakage.

## Idempotency and replay

- **Actions**: map one Zap step execution to one `requestKey`, derived deterministically from a Zapier-stable input (for example the Zap/step run identifier if Zapier provides one, otherwise a customer-supplied dedupe field; availability of a stable run id is **unverified**). The existing `painterReceipts` (tenant + requestKey, fingerprint conflict `IDEMPOTENCY_KEY_CONFLICT`) gives replay-safe behavior; same key and same input returns the original result with `replayed: true`. Changed input under the same key is rejected. **Actor drift (verified)**: `commandFingerprint` hashes `actor.id`, `tenantId`, `role` and `email` as well as the command, so a retry after a still-permitted role or email change (for example `owner` to `office_admin` retrying `lead.create`) raises `IDEMPOTENCY_KEY_CONFLICT` instead of replaying, and a completed Zap step could be reported failed. Intended behavior (decision for the action-set issue, with a domain change only through a reviewed freeze revision): a retry of an already-applied key by the same user and tenant should replay the original receipt even if role or email changed, provided the current role is still authorized; the receipt remains bound to user and tenant. Until that change exists, the Zapier layer must treat `IDEMPOTENCY_KEY_CONFLICT` as "outcome unknown, reconcile by search", never as proof of non-application, and must not blindly mint a new key. Fixture: apply with role A, change to a still-permitted role B (and separately change email), retry same key and input; assert the chosen behavior (replay, or documented conflict with reconcile), plus a demoted-to-unauthorized retry is denied. The key must be namespaced (`zapier:`) so it cannot collide with browser keys. Keys are limited to 200 chars on host commands.
- **Triggers**: each item has a stable id = the integration event id (versioned, source-tagged). Consumers (Zapier) must tolerate duplicates; ordering is guaranteed only per aggregate revision. Replay is a re-read of the feed from a cursor; the feed is append-derived from `painterEvents`, so replay never re-executes business logic.
- **Unknown outcomes**: a timed-out Zapier action retried with the same key returns the original receipt, so no double create. This is submission idempotency; it says nothing about external effects Zapier performs afterwards (outside Painter OS).
- No Zapier-triggered path may send customer email/SMS or record payments implicitly; those remain behind their held providers (AgentMail inbound/outbound is disabled in `agentmailProvider.ts`).

## Rate limits and abuse controls

Per-connection and per-workspace limits are required; the repo does not mount a rate limiter component (see [Convex components research](../research/CONVEX_COMPONENTS_2026_10_09.md)). Adoption of `@convex-dev/rate-limiter` or an in-Convex counter is an overlap decision for an implementation issue, not approved here. Also needed: request size caps, bounded page sizes (no whole-workspace reads), per-connection kill switch, and structured, secret-free logging. Zapier's own limits are unverified.

## Overlap and compatibility assessment (AGENTS.md requirement)

| Existing component | Overlap | Assessment |
| --- | --- | --- |
| Better Auth | Credential issuance/verification | Must stay sole authority. OAuth-provider capability on Better Auth is an unassessed dependency; no second token/user store. |
| `painterMembers` resolver | Membership | Reuse unchanged; Zapier adds no membership data. |
| `painter.command` / `applyCommand` / receipts | Writes, idempotency | Sole writer for all in-scope actions. A Zapier HTTP edge only authenticates and forwards; it must not call the store directly. |
| `painter.snapshot` projection | Reads | Reuse projection helpers; add bounded keyed reads. No raw `painterEntities` exposure. |
| Public intake/contact-intake/publicLead | Inbound lead creation | Keep separate: public admission has privacy/digest rules. Zapier uses authenticated `lead.create` only. |
| Portal links (`portalCommand`) | Customer approvals | Not exposed; token-scoped customer boundary. |
| Contractor OS component (`originalExecute`) | Workflows, attestations | Out of scope; separate store; no mirroring. |
| AgentMail provider | Email/webhook callbacks | Disabled; unaffected. Zapier must not add an alternate email path. |
| Pi / Zapier MCP (#74, #75) | Same vendor, opposite direction | Independent. MCP is a client with per-connection tokens held for Pi; this is an inbound OAuth app. Do not share credentials, tool allowlists or code. Pi calling Painter OS through Zapier would loop back into the same commands and needs an explicit anti-recursion rule (two approval layers would otherwise both authorize one effect). |
| Marketing app | Public site | Must not import any Zapier/auth module; Zapier gets no draft or admin data. CMS stays authoring authority; `article.publish` excluded. |
| Next.js `apps/web` routes | Host for an HTTP edge | Any route under `apps/web` must follow `apps/web/AGENTS.md` and the versioned Next.js guide; alternatively Convex `http.ts` (currently registers Better Auth routes and media only). Choice deferred to an implementation issue with owner for shared files `http.ts`, `convex.config.ts`, auth bridges. |
| Zapier SDK package | New dependency and separate deployable | Lives outside the app bundles (its own package/workspace or repository), with no imports from `apps/*`; shares only a typed contract. Version selection (CLI, `zapier-platform-core`, Node) is deferred until docs are fetched and a compatibility check runs, per issue #76. |

Compatibility with the freeze: no change to authority, identity mapping, money units, deposit gates or signed evidence. Money fields (if any action later carries them) use integer cents via `businessPolicy.minorUnits`. Rollback: disable the connection kill switch and unpublish/disable the Zapier app; no data migration is created because no new aggregate store is introduced (the only new persisted state, connection/token metadata and a feed cursor, is additive and removable).

## Explicit non-goals

- No installation of `zapier-platform-*` packages, no scaffold, no code, no CI changes in this PR.
- No Zapier account, app registration, OAuth client, publication, review submission, billing or plan change.
- No new customer, estimate, invoice, payment, CMS or membership writer; no mirror or dual-write; no store cutover.
- No payments, invoices, signed-contract evidence, member/role, workspace, integration-config, publishing or file actions.
- No customer-role access; no portal-token exposure; no public draft endpoint.
- No REST Hook infrastructure in the first release; no event bus claim.
- No use of Zapier as an email/SMS path; no change to AgentMail or Better Auth email.
- No claims about Zapier limits, pricing or SDK versions beyond the unverified list above.
- Not a replacement for, or dependency on, the Pi MCP work (#74/#75).

## Acceptance gates (carry into implementation issues)

Fixtures that run locally with a fake Zapier caller must pass first: cross-tenant denial, bearer without Convex context rejected and valid bearer bound to exactly one (user, workspace), revoked/expired bearer denied on the next call, public-intake leads absent from all trigger/search output, `INTAKE_RETENTION_TRANSFER_FORBIDDEN` for non-owner/office_admin on public-intake `lead.qualify`/customer-link, role/email-change retry behavior, polling burst larger than the window, disabled/demoted member denial on next call, customer-role denial, token revocation, projection allowlist (no private fields), stale `expectedRevision` rejection, duplicate action replay returns original result, conflicting-input replay rejected, trigger feed duplicate/ordering tolerance, bounded pages, rate-limit rejection, and secret redaction in logs. Only then may a separate, explicitly approved issue cover OAuth registration, Zapier app creation, review or publication.

## Proposed follow-up issues

1. **Verify Zapier docs and pin SDK versions** (research, no install): re-fetch the URLs above from a reachable environment, record actual OAuth, polling/hook, dedupe, rate-limit and Node/CLI facts with dates, and choose CLI vs Platform UI. Output: dated research record.
2. **Decide OAuth authority and the bearer-to-Convex identity seam**: assess Better Auth OAuth-provider options against the freeze, token storage, scopes, revocation, origins; produce a contract revision. No implementation.
3. **Integration read model**: bounded keyed read queries plus role-projected, field-allowlisted DTO types over the existing projection, with isolation tests. Owner of `painter.ts` changes coordinated.
4. **Integration change feed**: versioned, source-tagged, tenant-scoped, monotonic read projection over `painterEvents` with cursor, and duplicate/order tests; no new event store.
5. **Authenticated HTTP edge + connection records**: trusted bridge forwarding to `painter.command`, connection/revocation metadata, namespaced `requestKey`, rate limiting (including the rate-limit component overlap decision), kill switch, redacted logging.
6. **Action set v1**: `lead.create/update/qualify/lose`, `customer.create/update`, `task.create`, with fake-caller fixtures for idempotency and role matrix.
7. **Zapier app package scaffold** (blocked on 1, 2): separate workspace outside `apps/*`, local fixtures only, no publication.
8. **Approval and publication gate** (separate, human approval): OAuth registration, credentials, Zapier account, billing, review and live-action evidence.
9. **Anti-recursion rule with #75**: document and test that Pi-via-Zapier-MCP and Zapier-to-Painter calls cannot double-authorize or loop.
