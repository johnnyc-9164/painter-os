# Local Pi / AG-UI projection comparison — issue 137

This is a local protocol experiment. Production `index.ts` still returns
`503 TRUSTED_AGENT_ADAPTER_NOT_CONFIGURED`, including the fixture event paths.
No production agent endpoint, provider call, approval, deployment, or public
transcript is introduced. The fake provider/effect ledger exists only in the
existing test Worker. Pi remains the sole transcript, run and recovery owner;
Convex remains the eventual authorization, approval and budget authority.

## Contract and dependency direction

`packages/agent-worker/src/pi-view-contract.ts` owns a neutral read-only DTO,
its explicit local validation, ephemeral ordering receiver and direct SSE
encoding. It has no runtime dependencies. `pi-ui-projection.ts` projects actual
Pi snapshots/events into that contract and wraps it in installed AG-UI core
1.0.2 `STATE_SNAPSHOT` and `MESSAGES_SNAPSHOT` schemas. It does not use client,
RxJS or CopilotKit. Existing Zod 4.6.5 is retained. The lock changes only the
worker dependency and the new core artifact.

Core's `STATE_SNAPSHOT.snapshot` accepts arbitrary data; core validation alone
is not authority validation. The neutral DTO rejects unexpected keys,
malformed IDs/statuses, duplicate message IDs and oversized local values.
This experiment explicitly rejects over 128 messages/tools or 65,536-character
text values; these are local fixture limits, not a production pagination
contract. No silent truncation is claimed.

Persisted message IDs derive from Pi entry IDs and message indexes. Partial
assistant text uses provisional IDs and is replaced by persisted message end
or an authoritative reset. IDs and sequence numbers for partial delivery are
attachment-local, not a durable replay cursor. Duplicate frames are ignored;
gaps or backward delivery require a fresh snapshot. A new attachment starts
with a snapshot at sequence zero. Installed Pi supplies atomic snapshot and
subscription attachment. Its unavailable-listener backlog over 100 committed
frames becomes an authoritative snapshot reset.

Tool `recorded` means Pi persisted a result, never that an external effect
succeeded. A tool-end without an entry is uncertain. Thinking, tool arguments,
provider metadata, agent configuration and arbitrary detail fields are not
projected. No approval object is inferred from a tool or run event.

## Executed local evidence

Worker TypeScript checking, `node scripts/agent-check.mjs`, and both Wrangler
dry-run builds pass. All 28 worker tests pass using the existing
`workerGateEnvironment` and pinned npm CLI to run
`npm run test --workspace @painter-os-bts/agent-worker`. Real Miniflare/SQLite
Pi tests exercise atomic attachment, stream projection, stable persisted IDs
across restart, actual watch overflow, and an interrupted fake effect whose
ledger remains dispatching. Existing restart, abort, dedup, isolation, model
budget and subscription wire tests remain in the affected worker suite.
Focused receiver/schema tests cover replay, gaps, order inversion, unknown
effects, provisional reconciliation, malformed DTOs and mismatched messages.
The production worker refuses the fixture event routes.

The worker gate uses the existing metadata-only legacy Wrangler config
preflight and private XDG/log paths, without overriding HOME or reading
credentials. Builds are dry runs only. Installed Worker runtime executes the
core schemas through the test-only event collector. Its bounded 256-frame
in-memory capture surfaces errors and is not another persistent event journal.

The `neutral direct encoder keeps core runtime out of its bundle` test in
`pi-ui-projection.test.mjs` reproduces these bundle and wire measurements.
With esbuild browser bundling, minification, and a single encoder entry:
direct SSE is 1,470 bytes with zero dependency modules; AG-UI SSE is 472,991
bytes with 99 dependency modules. These are isolated encoder measurements,
not an app bundle benchmark. The same two-message snapshot is 240 wire bytes
for direct SSE and 426 for AG-UI. Sending both state and messages snapshots
duplicates transcript text. This bounded experiment gains a standard schema
and message envelope, but direct SSE is substantially lighter. It deliberately
does not manufacture fine-grained AG-UI token IDs or completion semantics.
Production dry-run upload remains 3,192.14 KiB; the test fixture including the
projection is about 3,327.15 KiB. No production import of the adapter exists.

## Proposed phase 2 — not implemented

Use a local-only Next fixture under `tests/fixtures/pi-run-viewer/app/`, a
bounded loopback runner `scripts/run-pi-run-viewer.mjs`, and browser checks
`tests/pi-run-viewer.browser.mjs`. A shared shadcn/Base UI renderer would live
in `packages/ui/src/components/agent-run-view.tsx`, accepting neutral props.
A server/business module must never depend on the UI runtime. Before phase 2,
review whether the neutral contract should move to a dedicated domain type
module or be copied into fixture input via a reviewed boundary; do not create
a competing transcript schema. Any host approval DTO must be explicitly
synthetic and separate from Pi, with no action dispatcher or automatic
approval. Compare direct SSE and AG-UI using identical authoritative frames.

The existing painter-pr-evidence skill is reused for exact-head review and
CI receipts; this experiment does not need a new reusable shipping recipe.
