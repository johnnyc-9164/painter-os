# Deposit policy preparation

User decision on 2026-10-09: full required deposit satisfaction, with an audited owner/office-admin override. Source preparation and independent review only; deployment and production cutover remain held.

The engine remains the single writer. The new typed domain helper derives satisfaction from the approved job snapshot and matching recorded deposit-invoice receipts, rejects unsafe/excess cents and malformed related links, and ignores final money and cached totals. No schema, provider, migration or additional financial authority is introduced. The package exposes the helper through its own domain subpath.

Scheduling/rescheduling, job.start and first field.start (even for a legacy active job) require satisfaction or an active permission tied to the same required amount. Existing field operations continue after revocation; cancellation remains possible. Owner/office_admin approval/revocation requires a trimmed nonempty bounded reason and server actor/time. Events include policy version 1, balance snapshot and before/after history. Actor-bound replay and revision/atomic failure semantics remain unchanged. Crew/customer job projections hide approval/revocation evidence. Project managers retain their existing finance visibility but cannot grant permission.

Synthetic demo scheduling now uses an explicit audited demo exception; it does not fabricate a payment. Existing domain lifecycle tests that exercise unpaid starts explicitly approve test exceptions, retaining their original lifecycle/immutable-state assertions. Other fixtures with zero deposits remain unchanged.

Validation: own pinned npm 11.16 `ci --ignore-scripts` and agent:doctor passed (Node 24.19). Node loader TS suite passed 66 tests (including nine dedicated policy regressions); actual Convex suite passed 48 tests across 11 files, including two transaction/membership/audit regressions. Domain/backend TypeScript, scoped ESLint, compatibility tests (4), agent:check and diff whitespace checks passed. The Convex tests mock only the identity-provider boundary; membership resolution, command mutation, database persistence/rollback and replay are real convex-test operations. These are local synthetic checks, not live Better Auth/provider or deployed policy acceptance.

Release gates: independent exact-head review and combined UI tests, historical job-snapshot/payment-link inventory, live authentication/email acceptance, routing/cookie cutover and any explicitly approved production activation. Source has not been deployed or merged by this implementation owner. Revert this bounded policy/helper/UI revision together to restore previous scheduling behavior; no database migration is part of this change.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; no new reusable procedure was needed. Coordinator will attach source PR, exact accepted head and fresh CI evidence. Source checks alone do not authorize merge/deployment.
