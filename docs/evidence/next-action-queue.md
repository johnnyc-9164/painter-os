# Next-action proposal boundary — issue 67

Owned paths: the new domain helper and additive domain package export, modular `next-action-panel.tsx`, the small overview seam in `painter-app.tsx`, focused domain/panel/browser tests and this receipt. No engine, command registry, provider or schema changes.

The pure `nextActionQueue(actor, entities, now)` helper takes a host-resolved trusted actor, real entity state and an explicit timezone-bearing timestamp. It reuses `visibleEntities` and `canCommand`; caller-supplied roles do not establish cloud authorization. Output is an ordered typed proposal list with source ID/type/revision/update time, exact title/status facts, a revision-bound key, due time, rationale and a `task.create` draft requiring approval.

Rules:

- Leads in `new`/`contacted` become follow-up review proposals 24 hours after `updatedAt`, including the exact threshold.
- Estimates in `draft`/`changes_requested` become review proposals at `updatedAt`. This says nothing about price validity, physical readiness, customer approval or successful delivery.
- Future source timestamps, invalid timestamps/revisions and terminal statuses are omitted. Invalid `now` fails explicitly.
- Both source-update capability and `task.create` capability are required. Under current policy only owners and office admins receive these two draft kinds. No capability matrix is copied or expanded.
- Existing visible open tasks with the exact stable source-marker line in `notes` suppress repeat proposals across source revisions. Completed tasks do not suppress later reviews. Foreign-tenant tasks do not suppress local proposals.
- Source data is not mutated. No command or provider is invoked. The focused test submits one draft through the existing writer solely to prove schema compatibility and duplicate suppression.

The overview panel shows actual proposals, rationale, status, due time and source version. Review refreshes the authenticated snapshot and verifies the revision-bound key before opening the existing task creation form. Confirmation refreshes and checks again before invoking the existing command/intent-key pipeline; the source marker is retained in notes because it is not an editable task schema field. A changed source, removed capability or pending duplicate refuses the stale suggestion. Merely opening the panel or form never creates a task. This does not provide atomic source preconditions, scheduling, sending, AI execution or a deployed agent loop. Task creation is an existing aggregate creation; its command cannot carry an unrelated source `expectedRevision`.

Rollback removes the overview panel seam, component, domain export/helper and tests together. Existing tasks and their history remain owned by the existing writer. The panel adds operator-approved task creation; business lifecycle and provider behavior remain unchanged.

Verification receipt: isolated pinned npm 11.16 install; doctor, agent check, full root typecheck and full root lint passed. Focused Node/tsx tests cover five groups: due boundaries and invalid data, deterministic immutable factual proposals, actor/tenant restrictions, existing-writer duplicate suppression, and ambiguous IDs/revision validation. Combined queue and existing domain lifecycle tests passed 21 tests; two additional panel render/fresh-source validation tests are included in the default forms/CI gate. The installed Next server/client component guide was read before adding the client component. Root independently accepted the initial helper at `7680c0f400e3e9da08d151cd051eee620f0cd5cb` and expanded UI/source/browser receipt at `bb333ee672c710ada179eaf6ed6e55e5c102e51d`. That clean-head sandboxed Chromium 151 browser run passed real overview display, no automatic write, existing form approval, fresh-source refusal and duplicate suppression without network mocks, page errors or server failures. Final integration/test-gate head and CI receipts are supplied separately. Local synthetic acceptance does not prove live provider or deployed cloud authorization.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; no new general procedure is justified by a single unused pure helper. The coordinator retains exact-head review and CI receipts.
