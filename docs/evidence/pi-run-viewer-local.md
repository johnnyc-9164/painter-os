# Local Pi run viewer — issue 145

Phase 1 (PR143) remains a historical projection/protocol receipt. This phase
moves only its neutral DTO types into a canonical pure domain export and
adds a shared, controlled shadcn/Base UI renderer. Worker validation, Pi
transcript/run/recovery authority and production503 refusal remain intact.
The worker declares the existing local domain workspace dependency; the lock
changes only that worker metadata entry, with zero added/removed artifacts or
third-party versions. UI imports the exact DTO as an erased `import type`,
covered by a narrowly scoped AST guard and forbidden-import regressions.
Server business modules never depend on UI runtime.

The Next app is under `tests/fixtures/pi-run-viewer`, not a production app or
Vercel project. Its sole API is fixture-only `/api/local-pi-view`. The runner
binds Next to127.0.0.1, captures actual keyless Pi/Miniflare snapshots/events
into a private owned temporary file, then replays the same authoritative view
frames through direct SSE and AG-UI. The file is ephemeral test evidence,
not a second transcript store or durable event journal. No public transcript,
provider call, cloud configuration, paid resource, deployment, approval or
business dispatcher is added. No synthetic approval is displayed.

Both modes preserve actual persisted message IDs, partial snapshot text and
interrupted fake-effect ledger truth. The ledger remains dispatching; there
is no confirmed external-effect receipt. Directly received gaps fail clearly,
and explicit refresh replaces them with a fresh authoritative snapshot.
Decoder bounds fail explicitly at2MiB/512events; split UTF8/JSON chunks are
retained until complete, and incomplete data is not silently skipped.

## Local verification

- Own pinned npm ci/agent doctor; Worker/domain/UI/fixture TypeScript checks.
- Ten scanner/harness tests, two transport/environment tests and two shared
  renderer state/escaping tests pass.
- Actual Next16.3.8 production fixture build and loopback HTTP acceptance pass
  for both encodings; completed/running/interrupted/empty views are identical.
  Gap reset, invalid requests, no-store responses and fixture503/404 pass.
- Sandboxed Chromium151 with Playwright1.57 passes encoding parity, provisional
  text, interrupted-ledger notice, empty/failure states, snapshot-gap refresh,
  late slow-request cancellation, keyboard focus and mobile390px no overflow.
  Actual shared Button colors are primary rgb(0,82,255) and white text.
- The skill's strict audit on the isolated fixture reports zero findings.
  Shared platform design context and token ownership are preserved.

Development browser failures are retained in private run receipts. Initial
assertions incorrectly expected idle color while hovered and a tool-output
disclosure when actual slots contained no output. Another failure exposed
fixture settling ambiguity; selected/settled request markers now distinguish
new requests and the test scopes alerts to the view rather than Next's route
announcer. These were repaired; no blanket skipped assertions or sandbox bypass
was used. Optional output escaping/disclosure markup has renderer coverage;
actual captured slots do not provide output text for browser disclosure tests.

Historical dirty desktop capture (one first round) lives at
`.agent/runs/pi-viewer-d8dd68a4-587f-416c-af09-c3d3f55bcf4c/viewer-desktop-1280.png`.
The later successful no-screenshot browser receipt is
`.agent/runs/pi-viewer-d7372fef-18d9-4e55-b53a-00b0f8912043/{receipt,browser}.json`.
These precede final source freeze and are not exact-head captures.
Final affected worker tests, exact-head browser capture and independent review
remain pending at this draft evidence revision.

## CI and limits

`npm run test:local-pi-viewer` runs focused transport/renderer checks, the actual
Worker fixture dry-run build, actual Pi frame preparation, fixture Next build
and real HTTP acceptance. CI adds this step to the existing build job without
renaming required checks. Browser mode is optional and sandboxed; CI HTTP does
not imply browser interaction. Existing default23 agent gates remain unchanged.

The runner checks configuration filenames without reading secrets, filters
child environments, does not override HOME, and uses the existing worker metadata-only
legacy-config preflight with private XDG/log paths. Every child/readiness phase
is bounded and owned child processes are stopped on success/failure/signals.
Snapshots may include commits newer than their triggering partial-text batch;
this remains a view experiment, not precise token replay or a latency benchmark.
The phase1 isolated encoder costs (direct1635B,AGUI473156B; sample wire240/426B)
remain separate from this fixture app's bundle or actual multi-frame wire size.

The frontend design skills and existing painter-pr-evidence skill were reused.
No additional shipping skill is justified by this local-only fixture; the
existing exact-head review/evidence recipe applies.
