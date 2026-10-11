# Issue 159: bounded generic Painter snapshot and command reads

Source-only change. No deployment, account, provider, cutover or data migration is performed or claimed. Sole aggregate writer is unchanged: `persistPainterState` in `packages/backend/convex/painterStore.ts`.

## Inventory of real readsets (before)

`loadPainterState(ctx, tenantId, requestKey?)` read, in one function: every `painterEntities` row of the tenant (`by_tenant`, all types including `estimate_slot`/`estimate_appointment`), every `painterEvents` row (`by_tenant`), and the exact-key receipt(s) (`by_tenant_request`, legacy raw key plus hashed key). Callers:

| Caller | Purpose | Readset before |
| --- | --- | --- |
| `painter.snapshot` | role-filtered read projection | all entities, all events |
| `painter.command` (non-host actions) | authoritative command state | all entities, all events, receipt |
| `painter.portalCommand` | customer estimate decision | all entities, all events, receipt |

Not changed: `hostCommand` (already exact-key indexed), native appointment/slot APIs (#162, indexed targets, exact receipts, capped windows), `publicLead` (creation delta), portal/member/entity read functions in `painter.ts` (owned by #187).

What the engine (`applyCommand`) actually reads, derived from `packages/domain/src/engine.ts`: events are never read (only appended); native types are never read; receipts only by exact key. Entities are read by id (`get`) or by relation/uniqueness scans: job by estimate (`job.create`), schedules by job (`job.cancel`, `schedule.cancel`), fields by job (`job.complete`, `field.start`), invoices by job (`invoice.create`), payments by reference, reviews by job (`review.create`, `automation.run`), crew conflicts across confirmed schedules, article slug, integration provider.

## After

Read side only, in `packages/backend/convex/painterReadsets.ts`.

- `loadPainterCommandState`: authoritative state selected per command. Seeds: `entityId`, reference ids in `input` (`customerId`, `leadId`, `estimateId`, `jobId`, `invoiceId`, `fileId`), and the ids in a stored receipt result (replay re-projects against current entities). Then a bounded reference closure (4 rounds through the same keys), then only the relation scan the action needs, all through indexes (`by_tenant_entity`, `by_tenant_type_job_customer`, `by_tenant_type_estimate_customer`, plus additive `by_tenant_type_reference` and `by_tenant_type_status_start`). Events are `[]` (the writer already treats `before.events` only as a "do not re-insert" set, and the engine only appends). Native rows are never included; a command naming one fails `NOT_FOUND_OR_FORBIDDEN`, as before. Receipts remain exact-key and permanent (legacy raw and hashed key, conflict if both).
- Complete, not truncated, where correctness requires it: crew conflicts read every confirmed schedule starting before the candidate end; article slug and integration provider scans read the type. These are business state, not native history. Residual: they still grow with the number of schedules/articles (see gaps).
- `loadPainterSnapshotState` (used by `painter.snapshot`): generic business entities by type (native types excluded; they have paged native APIs) and the newest `SNAPSHOT_EVENT_LIMIT` (500) audit events. Role/customer filtering still happens in the engine's `visibleEntities` and `projectAuditEvent` (the same projection the snapshot always applied). `Snapshot.eventsPage` (additive, optional) reports `{limit, complete}`.
- `painterActivity.activityPage` (new paginated query): the complete audit history, newest first, cursor paginated (max 200/page), same membership authority (`resolvePainterMembership`), same entity visibility and role projection; customers and non-members get nothing.
- `persistPainterState` now throws `ID_COLLISION` if a new entity (absent from `before`) already has a row. Previously global ID uniqueness was checked in memory against the full snapshot; the indexed row is now the authority so bounded state cannot silently overwrite.
- `loadPainterState` is retained only as the parity oracle for tests and documented as such; no Convex function calls it.

Additive indexes: `by_tenant_type_reference` (`tenantId,type,data.reference`), `by_tenant_type_status_start` (`tenantId,type,data.status,data.startAt`). No data migration, no pruning, no new table, no second writer.

## Evidence (`packages/backend/tests/painter-bounded-reads.test.ts`)

Real `convex-test` host with real schema, indexes and mutations. 650 native receipts and 300 native entities are seeded beside ordinary CRM/estimate/portal/job/schedule/invoice/payment operations.

- Ordinary operations, crew conflict, duplicate job/invoice/payment-reference refusals all behave as before under that history; native receipts/entities are untouched (not pruned or rewritten).
- Exact-key replay and fingerprint conflict hold; the replay readset loads exactly one receipt.
- For five representative commands the bounded state reads fewer than 25 documents, zero native rows, zero events, and `applyCommand` over it equals `applyCommand` over the full-tenant oracle (result and changed entities).
- Snapshot returns the newest 500 events with `eventsPage.complete=false` and no native entities; `activityPage` pages every event with no loss or duplication.
- Role projection identical between snapshot and paged history; customers/non-members denied; writer refuses an ID overwrite.

## What this does and does not prove

`convex-test` serializes mutations in one process. It proves read-set shape, equivalence with the full oracle, and permanent receipts. It does NOT prove deployed Convex optimistic concurrency (two concurrent commands conflicting on the entities/receipts they read), nor the real per-function document/byte read limits. Document counts are measured with a counting `db` wrapper, not a server limit. Deployed OCC and limit evidence require a deployment and are out of scope here.

## Remaining gaps

- The web app does not yet consume `eventsPage`/`activityPage`; it shows the newest 500 events inline. UI wiring belongs to the web owner.
- `snapshot` still reads all non-native business entities of the tenant (customers, jobs, invoices, ...). Paginating entity projections needs a typed client contract change and is not done.
- Crew-conflict, article-slug and integration scans grow with schedules/articles; an overlap-window index with a duration bound would need a reviewed domain limit.
- Customer-role snapshots still read all customers before email filtering.
- Deployed OCC and read-limit behavior unverified (above).
