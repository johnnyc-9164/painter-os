# Issue 2 compatibility freeze

Inspected source baseline: `61a212e75988586dda126da462e04750c327c659`, import/better-t-stack-baseline. Verified target after PR #1 merge: main `e683b000b8a069397f0099f8a354b01514b46d66`. This is an additive source-backed contract, not a claim that the product IR is implemented. Original IR remains intact. Independent review is required before acceptance.

## Actual authority and call paths

`packages/backend/convex/convex.config.ts` preserves the Better Auth, Contractor OS and painting mounts and additionally registers the owner-approved official AgentMail provider. All three existing authorities remain unchanged. AgentMail owns its isolated provider records and built-in workpools; source registration does not establish deployment or authorize outbound sends, incoming webhooks/actions, remote reads or mailbox creation. The initial typed provider boundary is disabled and checks no credentials. No duplicate queue or new business/auth authority is introduced. Better Auth transactional email remains separately held. Better Auth owns cloud sessions and authenticated users. `packages/backend/convex/painter.ts` resolves enabled `painterMembers` for `painterWorkspaces` on each authenticated invocation. That resolver is the single cloud membership authority; Contractor OS receives its server-resolved tenant and permissions through `MembershipResolver`. No new membership store or second cloud auth.

| Aggregate / surface | Current write authority | Read / command boundary |
| --- | --- | --- |
| Painter customers, leads, estimates, jobs, schedules, field, invoices, payments, expenses, reviews, referrals, bids, knowledge, automation, tasks, integrations, articles | Host `painterEntities`, domain `applyCommand`; host transaction persists entities/events/receipts | `painter.snapshot`, `painter.command`, domain dotted actions |
| Workspace, membership, invites, portal links, file metadata | Host schema and dedicated Painter mutations | `createWorkspace`, `createInvite`, `acceptInvite`, `createPortal`, portal/file endpoints; `member.role`, `workspace.update` host actions |
| Original Contractor OS records, workflows, history, projections | Isolated Contractor OS component | `painter.originalExecute` → `ContractorBackend.execute`; `originalComponentInfo`; existing backend client queries |
| Trade painting records/calculations | Mounted painting component owns its records | Existing `packages/contractor-os-core/src/trades/painting/client.ts`; Painter engine paintingScope is host advisory data, not a mirrored trade record |

The web `/api/command` and `/api/snapshot` routes select `apps/web/src/lib/convex-runtime.ts` or the explicit local acceptance harness. The cloud adapter intercepts `estimate.portal` and `member.invite`, translates `member.role` memberId to userId, and otherwise calls Painter host mutations. Public article reads, token-scoped portals and private files are dedicated boundaries, never generic public business snapshots. Browser workspace IDs select a candidate only; membership grants authority. The web adapter currently rejects alternate workspace selection. Local SQLite identity is acceptance-only; it must not establish cloud identity or become a production fallback.

## Identity, authorization and response projection

Painter actor/audit IDs are Better Auth `user._id`. ContractorBackend derives its actor ID from verified Convex `identity.tokenIdentifier` via `requireScope`. Preserve both histories; do not equate strings or rewrite historical actors. Any future linking is server-resolved, explicit and reviewed. Customer matching uses authenticated user email; invitation acceptance requires verified identity. Preserve owner-only role changes and last-owner protection.

Painter finance permits owner/office_admin/accountant, while originalExecute permits writes only owner/office_admin and attestations only owner. A Painter payment reference/method is not core `payment_received` attestation. Keep these policies distinct. Every new command response and replay must use the same role/customer projection as reads; hidden controls never authorize a command. This is a repair contract, not an assertion that every current response is safe.

## Typed seam and event compatibility

`docs/contracts/compatibility.ts` composes existing `Command`, `Snapshot`, `BusinessArgs` and `BusinessResult` without copying core workflow definitions. Source discrimination prevents silently routing a Painter action into a core workflow. `PainterAction` derives the complete dotted action union from the existing action registry; payload validation remains the engine/host's responsibility. Dedicated link and membership commands retain their current transport translation. Input-specific narrowing can be added by the relevant owner with regression tests.

`PainterTransitionPayload` describes full engine transition events at schemaVersion 1. Host workspace/member events and role-redacted activity are separate shapes; do not cast them to full transition events. Core `BusinessEvent` retains its existing numeric timestamp, policyVersion, beforeJson/afterJson and attestation evidence. IR events are target requirements: their payloads are not the current engine envelope. Version new integration envelopes explicitly, source-tag IDs, and deduplicate per `(source, tenantId, eventId, consumer)`; consumers must tolerate duplicates and preserve per-aggregate revision ordering. No event bus or automatic consumer is claimed deployed.

UI facade targets explicit runtime.kind; current runtime.storage is a human-readable label and must not be compared with `'convex'`. Preserve a requestKey for one logical intent across network retries, and change it when input/intent changes. Server receipts are tenant-scoped with fingerprint conflict rejection; expectedRevision guards editable entities. Core expected revision arrays/evidence remain BusinessArgs. Host role/workspace commands currently reject expectedRevision. Do not generalize their support.

## Money and deposit decision boundary

All Painter stored money is nonnegative safe integer cents with the existing 1e12 ceiling. User decimal amounts are converted once with shared `businessPolicy.minorUnits`; retain rounding behavior, approved snapshots, append-only payments, duplicate protection and no-overpayment allocations. Core currency inputs and precision policy retain their original contract; never pass cents into a dollars input.

Current Painter `DepositReceived` records a positive deposit payment transition. It does **not** mean the whole deposit is satisfied. Current schedule creation and job.start do not gate on full satisfaction. `depositView` is a proposed derived read model: required from the approved job snapshot, received from payments against deposit invoices only, remaining = required minus received, and status not_required/unpaid/partial/satisfied. Never substitute job.collectedCents, which can include final payments. Receipt amount/payment ID must be explicitly mapped in any new normalized event; the current transition payload does not promise those IR fields.

Johnny must choose warnings, required full satisfaction, or an audited override before a new scheduling/start gate is implemented. Zero required means not_required. Freeze preserves existing behavior while exposing that decision; it does not silently choose a blocking policy. Receipt and satisfaction are separate concepts even if later satisfied events are introduced.

## Cutover hold and parallel release

Painter job.create requires an approved estimate. Core co_create_job requires a fully executed signed contract; core signing/payment transitions use attestations and revision preconditions. They are not interchangeable. No mirror, migration, second writer or automatic dual-write is authorized.

Hold only store cutover until a reviewed mapping covers tenant/source IDs, customer/estimate/contract linkage, lifecycle translation, signed evidence, permissions, money units, source-tagged events, actor linkage, idempotency, reconciliation and rollback. Inventory real records without secret reads; rehearse on synthetic fixtures; preserve source history and prove no duplicate aggregates before adoption. A mapping proposal is not permission to migrate.

| Issue | Released work preserving compatibility | Owned files / coordination |
| --- | --- | --- |
| #2 | Contracts, architecture and integration documentation | docs/architecture/**, docs/contracts/**, docs/ir/**, docs/integration/** |
| #3 | Crew identity normalization preserving display, adjacency/conflict regression tests; bounded reads; versioned event adapters | Backend/component scope in Issue 3; coordinate domain engine/contracts before edits |
| #4 | Existing Better Auth bridge, verified invitations, membership/context consistency | Auth scope in Issue 4; coordinate painter.ts/schema/runtime with #3 |
| #6 | Typed hooks/viewmodels, stable intent retries, explicit runtime.kind, reusable UI compositions | UI scope in Issue 6; coordinate cloud adapter/auth touchpoints with #4 |
| #5 | CI and preview checks | Platform scope; no production promotion |
| #7 | Independent acceptance evidence and review | tests/** and own evidence; implementation owners may add scoped regression tests |

Shared files include packages/domain/src/contracts.ts, engine.ts, backend convex/painter.ts, schema.ts, runtime.ts, convex.config.ts, web lib/convex-runtime.ts, auth bridges, package manifests/lockfile and IR. Before changing one, record the owner, exact file/API and expected compatibility in the owning issue/PR; the coordinator resolves overlap and sequencing. Never overwrite another owner's branch. Independent tests do not monopolize all test files. Changes to source/write authority, identity, deposit gates or signed evidence require a new reviewed contract revision. Preserve original IR and record discrepancies here.

## Validation and rollback

Run `node --test --test-isolation=none docs/contracts/compatibility.test.mjs`, core `node tools/check_component_contract.mjs`, and `python tools/validate_composition.py` plus its unittest suite from the core directory. Typecheck examples with `tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions docs/contracts/compatibility.ts` (TypeScript 6). Tests validate money edge cases and referenced source/mount/API assumptions. Examples are additive and not installed production exports. Revert these docs and any dependent adapter adoption together if incompatible; no database rollback or production operation occurs in this PR.
