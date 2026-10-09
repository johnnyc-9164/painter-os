# Painter OS Pi agent harness proposal

Research checked against official documentation on 2026-10-09. This is a bounded integration plan and overlap assessment, not an installed SDK, running agent, connected account, paid deployment, or production acceptance receipt.

## Decision and service ownership

Put the agent experience inside the authenticated company admin and platform operator UI. Run the durable agent service as a separate Cloudflare Worker/Durable Object deployment, outside the Vercel Next apps. Use Cloudflare Agents SDK `PiHarness` with Pi Durable and Pi AI rather than building a second agent loop. Keep existing Vercel origins and auth callbacks intact.

| Responsibility | Authoritative owner | Boundary |
| --- | --- | --- |
| Cloud identity and session | Existing Better Auth | Neither Pi nor Zapier establishes Painter OS identity |
| Company membership, roles, business records, CMS publishing and approval authority | Existing Convex host and commands | Tools recheck trusted membership; no direct alternate database writes |
| Agent transcript, input inbox, run/task recovery and effect outcome ledger | Pi/agent service in SQLite-backed Durable Objects | No Convex run-state mirror or second scheduler |
| UI run view | Projection from agent service | Read-only presentation; reconnect obtains an authoritative snapshot |
| External app credentials and configured tools | Per-user Zapier server/account | Secret stored server-side, never shared globally or shown to the model/browser |
| Existing app email delivery | Existing provider integration | Zapier email is not a replacement installed implicitly |
| Repository engineering loop | Existing factory/CI harness | Runtime business agents do not automatically acquire GitHub/Linear release authority |

Use Pi Durable for the agent loop and Convex for business records, membership and approvals. There is no concrete need for Convex Workflow or Cloudflare Workflows alongside Pi's lifecycle/job recovery in this first integration. A future Convex Workflow may own a separately defined deterministic business process, but must not duplicate the agent transcript/run/retry owner. Do not add a parallel workflow engine or mirror business data to Durable Objects. Any later provider must have an explicit overlap assessment.

## Pi Durable versus Convex Workflow

The choice is ownership, not whether one system can run durable work. [Convex Workflow's official component documentation](https://www.convex.dev/components/workflow) supports deterministic durable functions, query/mutation/action steps, parallelism, retries, sleeps, typed approval events and reactive status. Its mutation guarantees do not make external action effects exactly once. Cancellation does not stop already running actions, and changing an active workflow's step structure can cause determinism violations.

Pi Durable directly owns the requested conversational agent loop, transcript, steers, model/tool execution and recovery on Cloudflare; select it for that responsibility. Keep approvals and business mutations in Convex. If a specific deterministic business process later warrants Convex Workflow, give it a distinct process ID and single owner, not the same conversational run. Installing Workflow merely to wait for an approval duplicates orchestration unnecessarily; Pi can return a pending approval, and a trusted approved command can submit the bounded continuation after validation.

## Verified SDK behavior and limits

[Cloudflare's October 2 announcement](https://developers.cloudflare.com/changelog/post/2026-10-02-pi-harness/) introduces the beta integration. [The current Pi guide](https://developers.cloudflare.com/agents/harnesses/pi/) documents:

- `agents/harness/pi` exports `PiHarness`; `@earendil-works/pi-durable` supplies `Harness` and `createRegistry`; `@earendil-works/pi-ai/models` supplies `createModels`; `agents/models/pi-ai` supplies `createAI`.
- Install both optional Pi peers only if using the harness; the Pi peers require version 1.0 or later. Pin reviewed versions after an isolated compatibility check rather than adopting `latest` silently.
- Register the capability with `this.lifecycle.use(this.harness)`. Pi owns transcript/inbox/tasks in SQLite `pi_` tables; lifecycle jobs wake an evicted object and resume work. Model-call recovery may repeat a call and incur more usage.
- `submit(input, { operationId })` durably accepts input and deduplicates the same operation ID. Submission idempotency does **not** establish external-effect idempotency.
- Session IDs are assigned by Pi; an object per conversation with its root session is the documented isolation pattern. Derive the object name from verified workspace/conversation identity, never an untrusted URL or browser role.
- Event streams begin with a snapshot and have no replay cursor. Reconnect by replacing UI state with a fresh authorized snapshot, then applying subsequent batches; do not invent cursor-resume guarantees.
- `wait(operationId, signal)` cancellation stops waiting, not agent work. Actual cancellation calls `session.abort(operationId)` and requires tools to honor `context.abortSignal`. Abort waits for running tools to return.
- Pi Durable currently has **no built-in approval or permission step for tool calls** and cannot delete a conversation. Approval enforcement and retention/deletion policy must be designed before private transcript/provider activation.

[Extensions documentation](https://developers.cloudflare.com/agents/harnesses/pi/extensions/) specifies schema-validated `ToolRegistration`, `api.memo()` durable values, and `executionMode: "sequential"`. Tools normally run in parallel. `replay: "safe"` reruns interrupted tools; `replay: "unsafe"` is the default and returns an interruption to the model instead. Read-only tools may be replay-safe after authorization and cost checks. Sends, payments, publishing, record mutations and deployment actions remain unsafe. A model can choose another call after interruption, so the dispatcher must independently block duplicate or unresolved effects.

## Zapier interface selection

[Zapier MCP](https://docs.zapier.com/mcp/home) connects agent clients to configured app actions over **Streamable HTTP**, not SSE. [Connection documentation](https://docs.zapier.com/mcp/overview/how-connections-work) gives the endpoint `https://mcp.zapier.com/api/v1/connect` and distinguishes supported OAuth clients from custom TypeScript/Python clients using a per-server connection token. Do not assert that Painter OS is an approved OAuth MCP client without registering and verifying that flow.

The documented custom-client first path is a per-user/server connection token stored through a secret manager and sent in an `Authorization: Bearer` header. Never use the query-string token variant, store a raw endpoint/token in transcripts, log authorization headers, or share a Painter OS operator's connection across companies. Bind each connection record to trusted workspace, actor, enabled tool allowlist, revision and revocation state; resolve the credential outside model-visible arguments. Revalidate this binding immediately before every call and whenever recovering an interrupted run.

[Zapier Integration Builder/CLI](https://docs.zapier.com/integrations) is a separate SDK for publishing an app integration with triggers/actions/searches. It is appropriate if Painter OS needs to appear as an app in Zapier, not as a substitute for the MCP client used by Pi to call existing apps. A future Painter OS integration must invoke the existing authenticated Convex command boundary, not create another authoritative writer.

The researched MCP home reports each successful tool call consumes two Zapier tasks and sharing a server requires Team/Enterprise. Check current billing at activation; do not create an account, upgrade a plan, or promise a fixed cost. Enforce explicit application budgets even when Zapier advertises no per-server tool-call limit.

## Trusted request and approval contract

A small deployment-independent contract package should precede SDK installation. Reserve its files separately before implementation. Its inputs are trusted server-derived context plus validated user intent, not browser-supplied roles. Proposed commands: create/submit run, inspect authorized snapshot, request effect approval, approve/reject effect, cancel run and revoke connection. Proposed projections contain run ID, operation ID, status, safe output, pending approval summary, usage and timestamps; no credential, session token or private diagnostic payload.

Every effect approval binds the workspace, run, operation, connection ID/revision, tool identity/version, canonical argument fingerprint, recipient/resource, approving actor and trusted role, expiry and approval revision. The UI shows the concrete action and content before approval. Editing content, recipient, connection or tool invalidates approval. Treat tool output, retrieved pages and skill content as untrusted data; they cannot grant capabilities or broaden this envelope.

The Durable Object dispatcher, not the model or prompt, validates and consumes the authoritative Convex approval through a reviewed authenticated command and writes an effect-intent receipt before any external network call. Convex remains the sole approval writer; the DO stores the approval reference/fingerprint with its execution outcome, not a second editable approval record. If approval consumption acknowledgement is unknown, reconcile it before dispatch; cross-service calls are not an atomic transaction. Tool availability is a convenience, not an authorization boundary. Serialize effect ledger transitions, enforce idempotency by stable effect identity, and persist acknowledgements/provider identifiers afterward. An interrupted call with no reliable acknowledgement becomes `outcome_unknown`; neither automatic replay nor a newly generated model call may resend it. Reconcile by provider receipt/query where supported, otherwise request operator resolution with the unknown outcome disclosed. Do not claim exactly-once effects from Pi recovery or from an `operationId` alone.

Existing Convex business commands retain their authorization, financial and release gates. A durable agent proposal cannot bypass the full-deposit requirement or its audited owner/office-admin override. Do not forward a privileged shared operator identity or accept model-supplied tenant/role claims. A resumed run rechecks membership, connection revision, approval expiry, cancellation and budgets. A revocation/cancellation blocks subsequent dispatch; an already accepted external effect cannot be undone by abort and must remain visible in the receipt.

Apply bounded timeouts, response/body size limits, per-run model/tool/task budgets, model allowlists and per-tenant concurrency/usage reservations. If multiple conversation objects share a tenant budget, designate one server-side tenant quota owner before enabling concurrent runs; per-conversation counters alone do not enforce a company-wide budget. Durable budget reservations and refunds must survive restarts and never be duplicated by retry.

## Implementation slices and acceptance

1. **Pure contract/policy package.** Validate trusted tenant envelopes, approval fingerprints, effect state transitions, cancellation/revocation and usage limits. Unit tests prove cross-tenant denial, expired/demoted approval denial, modified-argument denial, approval replay denial and unknown-outcome resend denial. No SDK installation, external calls or auth bypass.
2. **Isolated Worker adapter.** Pin reviewed Agents/Pi packages in an independently buildable worker workspace; use SQLite DO migration and lifecycle integration. Start with deterministic/local read-only test tools, an explicit server authorization adapter and no production credentials. Test idempotent submission, eviction/restart recovery, snapshot reconnect, safe replay, unsafe interruption, honored abort and bounded usage. A dry-run build is not a deployment.
3. **Painter OS UI adapter.** Add authorized run views and approve/reject/cancel controls in admin with server-enforced grants. Preserve existing routes/cookies. UI integration tests prove tenant/run isolation, changed approval content and safe error redaction; browser acceptance covers reconnect and cancellation. Do not expose an arbitrary public `ask` endpoint from the demonstration snippet.
4. **Zapier MCP adapter.** Implement Streamable HTTP discovery/calls with per-actor connection resolution, explicit tool allowlists, replay classification and effect reconciliation. Contract tests use local fixtures and verify credential redaction, connection revocation, task limits and duplicate-send denial. Actual account connection/provider effects require separate activation evidence.
5. **Controlled live acceptance.** Identify the Cloudflare account, Worker/DO migration, model/provider budget and chosen Zapier connection method. Independently review exact-head tests, account scopes and rollback before activation. Verify a read-only live run first, then an explicitly approved bounded effect. Keep broad platform readiness open until all existing release gates and the four-app acceptance criteria pass.

## Compatibility, rollback and remaining decisions

The UI remains on existing Vercel domains; the Worker uses a separately reviewed service origin. Verify transport/CORS and server authorization without moving auth cookies or changing callback domains. No private cross-origin bearer belongs in a browser-readable URL. Disable new submission and external dispatch before rollback; preserve pending/unknown receipts for reconciliation. Pinning or changing the harness schema requires a storage migration/recovery test, not clearing the DO database.

Before activation, decide the Cloudflare account and usage budget, model/provider, permitted tenant/user Zapier connection arrangement, approval roles, transcript retention/deletion approach and which external actions are enabled. These decisions do not block preparation of pure contracts, local adapters or tests. Documentation research does not grant billing upgrades, live messages, production credential reads, provider activation or deployment authority.

Skill extraction: reused the repository's [Painter PR evidence procedure](../skills/painter-pr-evidence/SKILL.md). This research adds no verified runtime procedure requiring a new skill. Record exact-head independent documentation review and source checks with the PR.
