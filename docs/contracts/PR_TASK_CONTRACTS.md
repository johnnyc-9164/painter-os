# Painter OS PR task contracts

This is the repository task-contract standard requested by Johnny on October 4, 2026. The default PR body is in `.github/pull_request_template.md`. Copy the relevant full contract below into each substantive PR, narrowing acceptance criteria for intentionally split changes and retaining dependency/evidence gates.

Only source PR #1 existed when inspected. Issues #2–#7 are workstream contracts, not already created implementation PRs. Muse is designated for #5; other actual executor identities remain pending. This documentation does not dispatch any agent.

## Ownership and order
| Work | Executor | Depends on |
|---|---|---|
| Source PR #1 | Integration lead; identity pending | Archive/main |
| Issue #2 contracts | Integration lead; identity pending | Source baseline |
| Issue #3 backend | Convex specialist; identity pending | #2; auth seam |
| Issue #4 authentication | Auth specialist; identity pending | #2/#3 identity; #5 preview |
| Issue #5 platform | Muse; session/dispatch pending | Baseline; auth for full preview |
| Issue #6 UI | UI specialist; identity pending | #2 interfaces; backend/auth integration |
| Issue #7 verification | Independent verifier; identity pending | PR heads and preview |

CI scaffolding, inventory and pure compositions may proceed in parallel. Backend/auth/UI integration waits only for its relevant frozen contracts. No global lockstep is required.

# Task contract — Source import and baseline preservation

## Identity and links
- PR: https://github.com/johnnyc-9164/painter-os/pull/1
- Executor: integration-lead-agent — actual specialist identity pending; no dispatch claimed
- Reviewer: verification-agent — actual identity pending
- Branch: `import/better-t-stack-baseline`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Capture the supplied source faithfully and expose its limitations without claiming full IR compliance or production readiness.

## Owned files and components
Imported archive files only; source inventory/preservation evidence under docs/evidence/import/. No feature repairs in this PR.

## Dependencies and parallel work
Authorized source archive and current main. Repair issues #2–#7 follow this baseline.

## Allowed changes
Faithful source import, manifest comparison, reproducible baseline checks and documented environment limitations.

## Prohibited changes
Unrelated repairs, fake generated bindings, committed databases/tokens, declaring cloud verification from local tests.

## Acceptance criteria
- [ ] Archive file inventory and hashes reconciled against imported files; exclusions explicitly recorded.
- [ ] No private runtime data or secrets imported.
- [ ] Baseline commands executed against the actual PR head, with failures and limits accurately recorded.
- [ ] Architecture and incomplete capabilities are stated; independent import review complete.

## Validation commands and evidence
Archive manifest/hash comparison; inspect package scripts; npm ci --ignore-scripts; npm run check-types; npm run lint; npm test; npm run test:convex; npm run build. Preserve and run applicable core/component checks. Do not mark a blocked check passed.

## Blockers and escalation
Archive/source mismatch, secrets, instructions conflict, or environment preventing checks. Report concrete evidence; do not repair unrelated business behavior inside the import.

## Rollback
Close/revert the import PR without altering external infrastructure.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

---

# Task contract — Freeze component APIs and coordinate integration

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/2
- Executor: integration-lead-agent — actual specialist identity pending
- Reviewer: verification-agent — actual identity pending
- Branch: `contracts/issue-2-component-boundaries`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Publish the authoritative modular component map and APIs so independent workers can implement without duplicating stores or changing each other's contracts.

## Owned files and components
docs/architecture/**; docs/contracts/**; docs/ir/**; docs/integration/**. Other agents own their scoped evidence. Coordinate changes to existing IR explicitly.

## Dependencies and parallel work
Source PR #1. Contract freeze precedes dependent backend/auth/UI integration; platform CI scaffolding can proceed independently.

## Allowed changes
Document component-owned aggregates, public commands/queries, typed event payloads, trusted identity/tenant context, adapter seams, file ownership, migration compatibility and integration order.

## Prohibited changes
Implementing other owners' features, assigning nonexistent agent identities, replacing components with generic host business tables, silently rewriting IR contradictions.

## Acceptance criteria
- [ ] Map official Better Auth, Contractor OS and painting components and all bypass paths.
- [ ] Specify aggregate authority inside modular component boundaries, public interfaces, tenant permissions, event versioning and idempotency.
- [ ] Reconcile IR/source contradictions, deposit receipt versus satisfaction policy, duplicate identity/membership logic and compatibility/migration strategy.
- [ ] Publish dependency/ownership matrix and shared-file change protocol.
- [ ] Provide API examples/types for backend, auth and typed UI hooks; independent review accepts the contracts.

## Validation commands and evidence
Compare docs/ir/system.ir.yaml, domain/event/component contracts with actual mounts and call paths; run existing composition/component validators after inspecting package scripts. Validate referenced paths and API examples.

## Blockers and escalation
Contradictory authority, unresolved business policy, undocumented data migration, or shared-file overlap. Record decision proposals and route material product decisions to Johnny.

## Rollback
Revert contract changes and dependent work together if incompatible; never erase the original IR trail.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

---

# Task contract — Integrate modular backend and repair scheduling/events

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/3
- Executor: convex-component-agent — actual specialist identity pending
- Reviewer: verification-agent — actual identity pending; integration lead reviews API compliance
- Branch: `backend/issue-3-component-repairs`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Route business flows through agreed Convex component APIs; remove unapproved bypasses and repair scheduling/event correctness while preserving existing behavior and data.

## Owned files and components
packages/contractor-os-core/**; packages/domain/**; packages/backend/convex business modules including painter.ts/schema.ts/runtime.ts/convex.config.ts by coordinated edits. Auth modules belong to #4. Own targeted regression tests and docs/evidence/backend/.

## Dependencies and parallel work
Issue #2 component/API freeze. Auth identity seam from #4. Shared client/runtime adapter sections coordinated with #4 and #6.

## Allowed changes
Stable tenant-owned crew identities, conflict validation, typed commands/events, component business adapters, bounded queries and explicit non-destructive compatibility mapping.

## Prohibited changes
Second password/session store, duplicate business authority, destructive data removal, speculative component installation, external platform or UI redesign.

## Acceptance criteria
- [ ] Inventory duplicate auth/membership/business logic; official Better Auth remains the only cloud auth owner.
- [ ] Primary lifecycle uses component public APIs; existing data mapping is explicit and tested.
- [ ] Reject same-crew overlap including capitalization/whitespace aliases; permit distinct crews and adjacent slots; test shared-member conflicts where the frozen crew model requires them.
- [ ] Validate emitted approval/scheduling/payment events against frozen payload schemas and duplicate-delivery semantics.
- [ ] Define and test deposit satisfaction separately from partial receipt as agreed with #2.
- [ ] Replace unbounded business reads in repaired paths with bounded component queries; document remaining bounded limits.
- [ ] Cross-tenant access, role restrictions, atomic failures, revisions, idempotency and original core regression gates pass.

## Validation commands and evidence
Write failing reproductions first. Inspect/run npm test, npm run test:convex, npm run check-types and component/core verification scripts; add event-schema and query-bound tests. Run the integrated lifecycle after dependent APIs land.

## Blockers and escalation
Frozen contracts absent, migration affecting real data, unsupported component APIs, or shared schema edits without coordination. Split this broad issue into ordered substantive PRs if needed; each PR inherits this contract with a narrower acceptance subset.

## Rollback
Version interfaces and preserve compatibility; revert scoped PRs in dependency order. Supply data rollback/migration plan before any real-data mutation.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

---

# Task contract — Complete official Better Auth onboarding and trusted identity

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/4
- Executor: auth-agent — actual specialist identity pending
- Reviewer: verification-agent — actual identity pending
- Branch: `auth/issue-4-verified-onboarding`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Make cloud signup, verification, sessions and invitation acceptance work using the existing official Better Auth Convex component and trusted tenant membership.

## Owned files and components
packages/backend/convex/auth.ts/auth.config.ts/http.ts; apps/web/src/lib/auth-client.ts/auth-server.ts; auth/invitation components and API routes. Auth sections of painter.ts/convex-runtime.ts and environment templates require coordination with #3/#5. Own auth regression tests and docs/evidence/auth/.

## Dependencies and parallel work
Issue #2 identity/API contract; #3 membership boundary; Muse/#5 supplies deployed development backend, preview settings and secrets.

## Allowed changes
Verification/reset delivery hooks, invite resume UX, session bridge, backend identity/role checks and runtime parity for documented auth behavior.

## Prohibited changes
Clerk/Neon Auth migration, second auth implementation, marking browser email verified, dropping verification gates, exposing local acceptance identity to production.

## Acceptance criteria
- [ ] Official Better Auth mounted once; no competing production password/session owner.
- [ ] Real signup → verification → signin → invitation resume → scoped workspace acceptance works.
- [ ] Wrong email, expired token, used-token misuse, disabled membership, role escalation and cross-tenant access are rejected; exact retries are handled according to contract.
- [ ] Signout invalidates authenticated access; protected APIs reject unauthenticated callers.
- [ ] Email delivery and cookie/session behavior tested against intended development/preview backend; provider credentials remain secret.
- [ ] Local-only acceptance auth is visibly bounded and cannot silently replace cloud auth.

## Validation commands and evidence
Targeted auth/component tests plus npm run check-types, npm run lint, npm run test:convex, npm run build; real preview browser signup/verification/signin/invite/signout tests. Coordinate platform evidence with Muse.

## Blockers and escalation
Missing email provider credentials, preview origin/auth mismatch, membership contract unresolved or deployment unavailable. Report remaining gaps; do not bypass identity verification.

## Rollback
Revert auth-code/config changes with compatible sessions and documented key rotation requirements; preserve user data.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

---

# Task contract — CI, protections and verified Vercel/Convex preview

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/5
- Executor: Muse — user-designated executor; actual session/account and dispatch status must be recorded
- Reviewer: verification-agent — actual identity pending
- Branch: `platform/issue-5-ci-deployment`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Establish passing CI, enforced GitHub merge protections and a working protected Vercel preview using existing Convex and official Better Auth.

## Owned files and components
.github/workflows/**; deployment configuration; repository/ruleset settings; Vercel root/framework/build/environment settings; secure Convex deployment configuration; docs/evidence/platform/. Auth code is #4 and business code is #3.

## Dependencies and parallel work
Source baseline; #2 component deployment contract; #4 auth code for complete onboarding. CI/config preparation may run before auth repairs.

## Allowed changes
Reuse johnnyc infrastructure, configure supported settings and secrets securely, deploy development/preview components, open CI PR and verify actual checks.

## Prohibited changes
Recreating resources, connecting Clerk, rewriting business/auth modules, deleting unused Clerk resource under this contract, weakening checks or protection, automatic merge/production promotion.

## Acceptance criteria
- [ ] PR/main CI uses declared Node/npm requirements and lockfile; type checks, lint, domain tests, Convex adapter tests and production build pass with stable check names.
- [ ] Workflow permissions minimal; obsolete runs cancelled; secrets unavailable to untrusted PR execution.
- [ ] Main requires PR, independent current approval, resolved conversations and exact existing CI checks; force-push/deletion blocked; bypass actors and unsupported enforcement disclosed.
- [ ] Bootstrap does not require nonexistent checks on the source import.
- [ ] GitHub connection, production branch, apps/web root, Next framework, Node and monorepo install/build behavior verified.
- [ ] Existing Convex components deployed using supported tooling/genuine generated bindings; preview/production environments separated and deployment protection preserved.
- [ ] Successful preview tied to SHA; Better Auth signup/signin/session/signout tested; unauthenticated business API access denied; invitation gaps coordinated with #4.

## Validation commands and evidence
Read scripts first; execute npm ci --ignore-scripts, npm run check-types, npm run lint, npm test, npm run test:convex, npm run build in CI. Verify live rules/settings and real preview auth. Record CI URLs, exact check names, preview deployment and Convex deployment identity.

## Blockers and escalation
Missing admin access, provider failures, unsupported GitHub plan enforcement, cloud credentials or native approval. Do independent CI work while blocked; do not claim provisioning equals working integration.

## Rollback
Capture previous settings; revert CI/config changes and restore settings as appropriate without deleting shared infrastructure.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

## Existing resource snapshot — reconcile, then reuse
- Vercel team: johnnyc; team_JSyn0ONxl6qIWJc9dtcGKxEc
- Project: painter-os; prj_z3e5NZVUALt5myKBQu8hJPugLjP3
- Convex Marketplace: store_v2M7cNwEUQ8qRg6z; vendor ID 3143455
- Required configuration names where used: SITE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CONVEX_SITE_URL, PAINTER_LINK_SECRET.
- Only public URLs belong in NEXT_PUBLIC variables; do not publish secret values.
- These are prior recorded resources, not fresh verification of live settings.


---

# Task contract — Reusable Base UI/shadcn compositions and typed hooks

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/6
- Executor: ui-component-agent — actual specialist identity pending
- Reviewer: verification-agent — actual identity pending
- Branch: `ui/issue-6-reusable-compositions`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Replace screen-local monoliths incrementally with the IR's reusable compositions and typed hooks, preserving working behavior and Artisan Core visual intent.

## Owned files and components
packages/ui/**; apps/web/src/components/painter-app.tsx/painter-forms.tsx; non-auth feature components/hooks/view-models and styles. Coordinate embedded auth extraction with #4. Own UI regression tests and docs/evidence/ui/.

## Dependencies and parallel work
#2 typed view-model/API contracts; #3 stable backend interfaces; #4 owns auth screens. Pure compositions can be extracted against agreed typed interfaces before backend integration.

## Allowed changes
Extract AppShell, Sidebar, headers/toolbars, EntityTable, StatusBadge, summaries, ScheduleBoard, FieldChecklist, loading/empty/error states and typed data hooks; normalize adapters and preserve retry keys where owned.

## Prohibited changes
New business authority or frontend-only authorization, auth provider changes, a second design system, fake data masquerading as live backend, API changes without lead approval.

## Acceptance criteria
- [ ] Publish IR-to-component inventory with implemented/missing status.
- [ ] Compositions exported with typed view models; no raw database documents/any-driven feature contracts.
- [ ] Implement useJob(), useJobs(), useCreateEstimate(), useScheduleJob() against agreed APIs.
- [ ] Remove duplicate role rules by consuming shared capability projections; backend remains authoritative.
- [ ] Desktop/mobile workflows retain behavior; keyboard navigation, labels, dialog focus and error recovery pass.
- [ ] Retain request keys on ambiguous retries; show remote changes through the agreed refresh/reactivity contract.
- [ ] Runtime labels use explicit identifiers; documented local/cloud UI differences are tested.
- [ ] Type/lint/build and meaningful component/browser regressions pass.

## Validation commands and evidence
npm run check-types; npm run lint; npm run build; targeted component tests and real browser lifecycle checks. Include desktop/mobile screenshots, focus evidence and IR mapping at tested SHA.

## Blockers and escalation
Missing API contracts, shared auth/layout edits, unapproved visual scope changes or unavailable live backend. Extract independently testable compositions while integration is blocked.

## Rollback
Migrate screens incrementally with compatible props/routes; revert scoped compositions without losing persisted business data.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.

---

# Task contract — Independent PR and combined-system verification

## Identity and links
- Issue: https://github.com/johnnyc-9164/painter-os/issues/7
- Executor: verification-agent — actual specialist identity pending; must be distinct from implementation executors
- Reviewer: integration-lead-agent — actual identity pending; no self-review
- Branch: `verification/issue-7-acceptance`
- Actual agent/session, worktree, tested SHA and PR URL: record before execution; never invent.
- Initial status: queued; contract publication is not dispatch.

## Objective
Independently establish that each repair satisfies its contract and that the combined modular system works before recommending merge.

## Owned files and components
tests/acceptance/**; independently authored test fixtures; docs/evidence/verification/** and review reports. Implementation owners retain their own regression tests. No implementation changes in this track.

## Dependencies and parallel work
Current repair PR heads; agreed #2 contracts; deployed #5 preview; #4 verified auth onboarding for cloud acceptance.

## Allowed changes
Independent tests/reviews, read-only live-setting inspection, isolated synthetic test records in authorized development/preview environments and actionable defect reports.

## Prohibited changes
Editing implementation to hide defects, reviewing own changes, accepting stale evidence, destructive production tests, production deployment or automatic merging.

## Acceptance criteria
- [ ] Each PR reviewed against owned-file/dependency/acceptance contract at exact SHA.
- [ ] Independent tenant isolation, role denial, invitation expiry/misuse, immutable proposal approval, crew conflicts, idempotent retries and invoice/payment invariants pass.
- [ ] Combined lifecycle lead → qualify → estimate → customer approval → deposit → job → schedule → field evidence → completion → invoice/payment → review tested.
- [ ] Official auth mount and component business API boundaries checked; no duplicate authoritative stores/services.
- [ ] UI states/accessibility/mobile and real-cloud session/storage behavior tested where required.
- [ ] CI/rules/preview evidence verified independently; limitations stated precisely.
- [ ] Failures returned to owning issue with repro; evidence refreshed after relevant changes; lead reviews verification deliverables.

## Validation commands and evidence
Inspect actual scripts; run unit/component/regression suites and independent HTTP/browser acceptance on tested integrated SHA. Verify current CI checks, protected preview and intended Convex deployment; do not substitute archived reports for fresh results.

## Blockers and escalation
No actual independent identity, missing preview/cloud capability, absent implementation, or conflicting contracts. Mark only affected gates blocked and continue independent review.

## Rollback
Remove synthetic records using the documented test cleanup; revert acceptance-only changes if needed. Never alter production business data.

## Execution rules
- Read the current issue, PRs, repository instructions, IR and source before editing. Reconcile changed facts.
- Record the actual executor identity, reviewer identity, branch, worktree and status. A role name is not proof of dispatch. Status starts queued unless execution is independently observed.
- Use an isolated branch/worktree; do not rewrite another executor's branch or force-push shared branches.
- Preserve modular Convex components, the official @convex-dev/better-auth authentication owner, and reusable Base UI/shadcn compositions. No Clerk, Neon Auth, replacement database or duplicate auth implementation.
- Reuse existing infrastructure. Additional components require a concrete need, overlap/provenance/compatibility review and acceptance tests.
- Implementation owners write regression tests for their changes. Verification owns independent acceptance tests and evidence; it does not monopolize all tests.
- Coordinate shared files and API changes through issue #2's lead. Stop dependent edits when contracts conflict; continue independent work.
- Attach validation to the current commit SHA. State configured, executed, passed and independently verified separately.
- Keep drafts while acceptance is unresolved. No empty repair PRs, automatic merges, production promotion, secret disclosure or destructive migration.

## PR target and baseline
Source PR #1 imports commit 243a53e3201b41046611e31dda9579e1591c27bf.
If main lacks that baseline, implementation branches start from the current import head and target import/better-t-stack-baseline. After baseline integration, rebase/retarget to main with lead coordination. The documentation/template PR can target main independently.

## Required PR evidence
Linked issue/contract; actual executor and independent reviewer; head/base SHAs; owned and changed files; before/after behavior; repro or regression test; exact commands and results; CI run links; preview/evidence links where relevant; risks, rollback and remaining blockers.
Report queued → assigned → running → blocked/verified → merged accurately. Completion requires the current commit's acceptance evidence and independent review.
