# Next-action proposal boundary — issue 67

Owned paths: `packages/domain/src/next-action-queue.ts`, `tests/next-action-queue.test.ts`, and this receipt. No engine, command registry, package export, app, provider or schema changes.

The pure `nextActionQueue(actor, entities, now)` helper takes a host-resolved trusted actor, real entity state and an explicit timezone-bearing timestamp. It reuses `visibleEntities` and `canCommand`; caller-supplied roles do not establish cloud authorization. Output is an ordered typed proposal list with source ID/type/revision/update time, exact title/status facts, a revision-bound key, due time, rationale and a `task.create` draft requiring approval.

Rules:

- Leads in `new`/`contacted` become follow-up review proposals 24 hours after `updatedAt`, including the exact threshold.
- Estimates in `draft`/`changes_requested` become review proposals at `updatedAt`. This says nothing about price validity, physical readiness, customer approval or successful delivery.
- Future source timestamps, invalid timestamps/revisions and terminal statuses are omitted. Invalid `now` fails explicitly.
- Both source-update capability and `task.create` capability are required. Under current policy only owners and office admins receive these two draft kinds. No capability matrix is copied or expanded.
- Existing visible open tasks with the exact stable source-marker line in `notes` suppress repeat proposals across source revisions. Completed tasks do not suppress later reviews. Foreign-tenant tasks do not suppress local proposals.
- Source data is not mutated. No command or provider is invoked. The focused test submits one draft through the existing writer solely to prove schema compatibility and duplicate suppression.

Later UI approval must rederive the queue from freshly authorized state, verify the revision-bound key, preserve one logical request key across retries, and invoke the existing writer. This helper alone does not provide atomic source preconditions, scheduling, sending, AI execution or a deployed agent loop. Task creation is an existing aggregate creation; its command cannot carry an unrelated source `expectedRevision`.

Rollback removes the unused helper/tests/receipt. Existing tasks and their history remain owned by the existing writer. No application imports the helper yet and no production behavior changes.

Verification receipt: isolated pinned npm 11.16 install; doctor, agent check, full root typecheck and full root lint passed. Focused Node/tsx tests cover five groups: due boundaries and invalid data, deterministic immutable factual proposals, actor/tenant restrictions, existing-writer duplicate suppression, and ambiguous IDs/revision validation. Combined queue and existing domain lifecycle tests passed 21 tests. Exact head is supplied to the coordinator separately. Independent acceptance is pending; local source checks do not prove live provider or deployed UI behavior.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; no new general procedure is justified by a single unused pure helper. The coordinator retains exact-head review and CI receipts.
