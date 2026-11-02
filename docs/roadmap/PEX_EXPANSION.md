# Painter OS — typed PBI expansion registration

**Planning/review proposal; not approved for execution.** These 48 new issue pairs are tracked and native dependency edges exist. This PR does not change business behavior or authorize workers, billing, production, secrets, or deployments.

## Project isolation — binding scope

**Painter OS and Factory are completely separate projects.** Do not interpret matching PEX titles in another repository as shared execution authority or as mirrored Painter OS work. No Factory repository issue, PR, label, status, or workflow may be linked to, synchronized with, closed for, or used as a dispatcher for these Painter OS PBIs.

- **Painter OS authoritative issues:** Linear **Painter OS** project, `STL-248`–`STL-295`.
- **Painter OS code and GitHub issues:** [`johnnyc-9164/painter-os`](https://github.com/johnnyc-9164/painter-os), issues `#307`–`#354`.
- **Out-of-scope separate product:** `mplsjohnnycage/factory` and all its GitHub issues. Do not add cross-project attachments to Painter OS Linear issues; do not mutate Factory to repair Painter OS.
- **Execution hosts:** `painter-os-dev`, `painter-os-design`, `painter-os-features` only for Painter OS tasks. Each worker requires a Painter OS issue and an approved, repository-local contract.
- Existing `.factory/` and `.github/factory/` **directories inside this repository** describe Painter OS's local contract/CI machinery. Those internal names do not connect Painter OS to the separate Factory repository or authorize shared task dispatch.

## Controls

- Linear ASDLC Painter OS project is the issue source of truth. GitHub Painter OS issues mirror each candidate.
- Each proposed contract is parseable by the existing factory parser; all have `factoryEligible: false`, no base-owned approval record, explicit per-path ownership, CI, security and review gates.
- The existing factory workflow requires base-owned approved contracts on main. Maintainer review and an explicit approval record are prerequisites to any factory PR.
- Preserve single-writer Painter/Contractor OS core boundaries, tenant isolation, full monetary precision, and the separate gated production workflow.
- Design and feature workers are isolated in `painter-os-design` and `painter-os-features`, with `painter-os-dev` coordinating integration.

## New issue registry

| Candidate | Linear | GitHub | Lane | Owner | Phase | Blocked by |
| --- | --- | --- | --- | --- | --- | --- |
| PEX-001 | [STL-248](https://linear.app/johnny-cage/issue/STL-248/pex-001-product-vs-tenant-brand-hierarchy) | [#307](https://github.com/johnnyc-9164/painter-os/issues/307) | A | design | 0 | — |
| PEX-002 | [STL-249](https://linear.app/johnny-cage/issue/STL-249/pex-002-voice-copy-and-truthful-claims-system) | [#308](https://github.com/johnnyc-9164/painter-os/issues/308) | A | design | 0 | [PEX-001](https://linear.app/johnny-cage/issue/STL-248) |
| PEX-003 | [STL-250](https://linear.app/johnny-cage/issue/STL-250/pex-003-photography-iconography-and-illustration-direction) | [#309](https://github.com/johnnyc-9164/painter-os/issues/309) | A | design | 1 | [PEX-001](https://linear.app/johnny-cage/issue/STL-248) |
| PEX-004 | [STL-251](https://linear.app/johnny-cage/issue/STL-251/pex-004-four-app-brand-quality-audit) | [#310](https://github.com/johnnyc-9164/painter-os/issues/310) | A | design | 2 | [STL-130](https://linear.app/johnny-cage/issue/STL-130), [PEX-001](https://linear.app/johnny-cage/issue/STL-248) |
| PEX-005 | [STL-252](https://linear.app/johnny-cage/issue/STL-252/pex-005-typed-accessible-data-table-primitive) | [#311](https://github.com/johnnyc-9164/painter-os/issues/311) | B | design | 0 | — |
| PEX-006 | [STL-253](https://linear.app/johnny-cage/issue/STL-253/pex-006-unified-status-metric-and-progress-components) | [#312](https://github.com/johnnyc-9164/painter-os/issues/312) | B | design | 0 | — |
| PEX-007 | [STL-254](https://linear.app/johnny-cage/issue/STL-254/pex-007-async-feedback-and-failure-state-primitives) | [#313](https://github.com/johnnyc-9164/painter-os/issues/313) | B | design | 1 | [PEX-006](https://linear.app/johnny-cage/issue/STL-253) |
| PEX-008 | [STL-255](https://linear.app/johnny-cage/issue/STL-255/pex-008-form-accessibility-and-focus-utilities) | [#314](https://github.com/johnnyc-9164/painter-os/issues/314) | B | design | 1 | [PEX-007](https://linear.app/johnny-cage/issue/STL-254) |
| PEX-009 | [STL-256](https://linear.app/johnny-cage/issue/STL-256/pex-009-extract-operator-shell-and-responsive-navigation) | [#315](https://github.com/johnnyc-9164/painter-os/issues/315) | C | design | 1 | [PEX-005](https://linear.app/johnny-cage/issue/STL-252), [STL-130](https://linear.app/johnny-cage/issue/STL-130) |
| PEX-010 | [STL-257](https://linear.app/johnny-cage/issue/STL-257/pex-010-universal-command-palette-and-recents) | [#316](https://github.com/johnnyc-9164/painter-os/issues/316) | C | design | 2 | [PEX-009](https://linear.app/johnny-cage/issue/STL-256) |
| PEX-011 | [STL-258](https://linear.app/johnny-cage/issue/STL-258/pex-011-task-first-owner-dashboard-and-exception-feed) | [#317](https://github.com/johnnyc-9164/painter-os/issues/317) | C | design | 2 | [PEX-009](https://linear.app/johnny-cage/issue/STL-256), [STL-105](https://linear.app/johnny-cage/issue/STL-105) |
| PEX-012 | [STL-259](https://linear.app/johnny-cage/issue/STL-259/pex-012-saved-view-preferences-and-personal-density) | [#318](https://github.com/johnnyc-9164/painter-os/issues/318) | C | design | 3 | [PEX-010](https://linear.app/johnny-cage/issue/STL-257) |
| PEX-013 | [STL-260](https://linear.app/johnny-cage/issue/STL-260/pex-013-lead-and-customer-activity-timeline) | [#319](https://github.com/johnnyc-9164/painter-os/issues/319) | D | features | 0 | — |
| PEX-014 | [STL-261](https://linear.app/johnny-cage/issue/STL-261/pex-014-pipeline-velocity-and-conversion-analytics) | [#320](https://github.com/johnnyc-9164/painter-os/issues/320) | D | features | 2 | [STL-105](https://linear.app/johnny-cage/issue/STL-105) |
| PEX-015 | [STL-262](https://linear.app/johnny-cage/issue/STL-262/pex-015-contact-duplicate-review-center) | [#321](https://github.com/johnnyc-9164/painter-os/issues/321) | D | features | 3 | [STL-69](https://linear.app/johnny-cage/issue/STL-69) |
| PEX-016 | [STL-263](https://linear.app/johnny-cage/issue/STL-263/pex-016-follow-up-workbench-and-reminders) | [#322](https://github.com/johnnyc-9164/painter-os/issues/322) | D | features | 2 | [PEX-013](https://linear.app/johnny-cage/issue/STL-260) |
| PEX-017 | [STL-264](https://linear.app/johnny-cage/issue/STL-264/pex-017-estimate-cost-and-deposit-breakdown) | [#323](https://github.com/johnnyc-9164/painter-os/issues/323) | E | features | 0 | — |
| PEX-018 | [STL-265](https://linear.app/johnny-cage/issue/STL-265/pex-018-painting-scope-presets-and-assemblies) | [#324](https://github.com/johnnyc-9164/painter-os/issues/324) | E | features | 1 | [PEX-017](https://linear.app/johnny-cage/issue/STL-264) |
| PEX-019 | [STL-266](https://linear.app/johnny-cage/issue/STL-266/pex-019-change-order-design-and-audited-contract) | [#325](https://github.com/johnnyc-9164/painter-os/issues/325) | E | features | 3 | [PEX-017](https://linear.app/johnny-cage/issue/STL-264) |
| PEX-020 | [STL-267](https://linear.app/johnny-cage/issue/STL-267/pex-020-professional-customer-proposal-and-print-view) | [#326](https://github.com/johnnyc-9164/painter-os/issues/326) | E | features | 1 | [PEX-017](https://linear.app/johnny-cage/issue/STL-264) |
| PEX-021 | [STL-268](https://linear.app/johnny-cage/issue/STL-268/pex-021-crew-load-heatmap-and-conflict-visibility) | [#327](https://github.com/johnnyc-9164/painter-os/issues/327) | F | features | 1 | — |
| PEX-022 | [STL-269](https://linear.app/johnny-cage/issue/STL-269/pex-022-draft-drag-and-drop-schedule-editor) | [#328](https://github.com/johnnyc-9164/painter-os/issues/328) | F | features | 2 | [PEX-021](https://linear.app/johnny-cage/issue/STL-268) |
| PEX-023 | [STL-270](https://linear.app/johnny-cage/issue/STL-270/pex-023-time-off-and-capacity-contracts) | [#329](https://github.com/johnnyc-9164/painter-os/issues/329) | F | features | 3 | [PEX-021](https://linear.app/johnny-cage/issue/STL-268) |
| PEX-024 | [STL-271](https://linear.app/johnny-cage/issue/STL-271/pex-024-weather-aware-job-risk-panel) | [#330](https://github.com/johnnyc-9164/painter-os/issues/330) | F | features | 3 | [PEX-021](https://linear.app/johnny-cage/issue/STL-268) |
| PEX-025 | [STL-272](https://linear.app/johnny-cage/issue/STL-272/pex-025-beforeafter-photo-comparison) | [#331](https://github.com/johnnyc-9164/painter-os/issues/331) | G | features | 0 | — |
| PEX-026 | [STL-273](https://linear.app/johnny-cage/issue/STL-273/pex-026-punch-list-and-final-walkthrough) | [#332](https://github.com/johnnyc-9164/painter-os/issues/332) | G | features | 2 | [PEX-025](https://linear.app/johnny-cage/issue/STL-272) |
| PEX-027 | [STL-274](https://linear.app/johnny-cage/issue/STL-274/pex-027-conflict-safe-offline-field-drafts) | [#333](https://github.com/johnnyc-9164/painter-os/issues/333) | G | features | 3 | [STL-127](https://linear.app/johnny-cage/issue/STL-127) |
| PEX-028 | [STL-275](https://linear.app/johnny-cage/issue/STL-275/pex-028-crew-mobile-handoff-brief) | [#334](https://github.com/johnnyc-9164/painter-os/issues/334) | G | features | 2 | [STL-127](https://linear.app/johnny-cage/issue/STL-127) |
| PEX-029 | [STL-276](https://linear.app/johnny-cage/issue/STL-276/pex-029-job-margin-and-cost-driver-explorer) | [#335](https://github.com/johnnyc-9164/painter-os/issues/335) | H | features | 1 | [PEX-017](https://linear.app/johnny-cage/issue/STL-264) |
| PEX-030 | [STL-277](https://linear.app/johnny-cage/issue/STL-277/pex-030-invoice-backed-cash-flow-forecast) | [#336](https://github.com/johnnyc-9164/painter-os/issues/336) | H | features | 2 | [PEX-029](https://linear.app/johnny-cage/issue/STL-276) |
| PEX-031 | [STL-278](https://linear.app/johnny-cage/issue/STL-278/pex-031-expense-receipt-attachments) | [#337](https://github.com/johnnyc-9164/painter-os/issues/337) | H | features | 3 | [PEX-029](https://linear.app/johnny-cage/issue/STL-276) |
| PEX-032 | [STL-279](https://linear.app/johnny-cage/issue/STL-279/pex-032-aging-and-payment-allocation-explainer) | [#338](https://github.com/johnnyc-9164/painter-os/issues/338) | H | features | 2 | [PEX-029](https://linear.app/johnny-cage/issue/STL-276) |
| PEX-033 | [STL-280](https://linear.app/johnny-cage/issue/STL-280/pex-033-customer-progress-timeline) | [#339](https://github.com/johnnyc-9164/painter-os/issues/339) | I | features | 0 | — |
| PEX-034 | [STL-281](https://linear.app/johnny-cage/issue/STL-281/pex-034-customer-change-decision-center) | [#340](https://github.com/johnnyc-9164/painter-os/issues/340) | I | features | 3 | [PEX-019](https://linear.app/johnny-cage/issue/STL-266) |
| PEX-035 | [STL-282](https://linear.app/johnny-cage/issue/STL-282/pex-035-secure-two-way-project-messages) | [#341](https://github.com/johnnyc-9164/painter-os/issues/341) | I | features | 3 | [STL-115](https://linear.app/johnny-cage/issue/STL-115) |
| PEX-036 | [STL-283](https://linear.app/johnny-cage/issue/STL-283/pex-036-closeout-documentation-and-care-guide) | [#342](https://github.com/johnnyc-9164/painter-os/issues/342) | I | features | 2 | [PEX-026](https://linear.app/johnny-cage/issue/STL-273) |
| PEX-037 | [STL-284](https://linear.app/johnny-cage/issue/STL-284/pex-037-company-identity-and-trust-components) | [#343](https://github.com/johnnyc-9164/painter-os/issues/343) | J | design | 0 | — |
| PEX-038 | [STL-285](https://linear.app/johnny-cage/issue/STL-285/pex-038-project-portfolio-and-real-beforeafter-gallery) | [#344](https://github.com/johnnyc-9164/painter-os/issues/344) | J | design | 1 | [STL-47](https://linear.app/johnny-cage/issue/STL-47) |
| PEX-039 | [STL-286](https://linear.app/johnny-cage/issue/STL-286/pex-039-service-and-service-area-pages) | [#345](https://github.com/johnnyc-9164/painter-os/issues/345) | J | design | 2 | [STL-47](https://linear.app/johnny-cage/issue/STL-47), [STL-114](https://linear.app/johnny-cage/issue/STL-114) |
| PEX-040 | [STL-287](https://linear.app/johnny-cage/issue/STL-287/pex-040-accessible-conversion-ctas-and-consent-analytics) | [#346](https://github.com/johnnyc-9164/painter-os/issues/346) | J | design | 2 | [STL-122](https://linear.app/johnny-cage/issue/STL-122) |
| PEX-041 | [STL-288](https://linear.app/johnny-cage/issue/STL-288/pex-041-four-app-release-health-dashboard) | [#347](https://github.com/johnnyc-9164/painter-os/issues/347) | K | lead | 2 | [STL-132](https://linear.app/johnny-cage/issue/STL-132) |
| PEX-042 | [STL-289](https://linear.app/johnny-cage/issue/STL-289/pex-042-workspace-provisioning-state-machine-spec) | [#348](https://github.com/johnnyc-9164/painter-os/issues/348) | K | lead | 2 | [STL-125](https://linear.app/johnny-cage/issue/STL-125) |
| PEX-043 | [STL-290](https://linear.app/johnny-cage/issue/STL-290/pex-043-admin-auditevent-explorer) | [#349](https://github.com/johnnyc-9164/painter-os/issues/349) | K | lead | 2 | [PEX-041](https://linear.app/johnny-cage/issue/STL-288) |
| PEX-044 | [STL-291](https://linear.app/johnny-cage/issue/STL-291/pex-044-support-diagnostic-packet-and-escalation-ui) | [#350](https://github.com/johnnyc-9164/painter-os/issues/350) | K | lead | 3 | [PEX-041](https://linear.app/johnny-cage/issue/STL-288) |
| PEX-045 | [STL-292](https://linear.app/johnny-cage/issue/STL-292/pex-045-ai-capability-explanation-and-approval-affordances) | [#351](https://github.com/johnnyc-9164/painter-os/issues/351) | L | lead | 0 | — |
| PEX-046 | [STL-293](https://linear.app/johnny-cage/issue/STL-293/pex-046-ai-usage-and-entitlement-transparency) | [#352](https://github.com/johnnyc-9164/painter-os/issues/352) | L | lead | 2 | [STL-28](https://linear.app/johnny-cage/issue/STL-28) |
| PEX-047 | [STL-294](https://linear.app/johnny-cage/issue/STL-294/pex-047-cross-app-visual-regression-and-ux-budgets) | [#353](https://github.com/johnnyc-9164/painter-os/issues/353) | L | lead | 1 | [STL-121](https://linear.app/johnny-cage/issue/STL-121), [STL-126](https://linear.app/johnny-cage/issue/STL-126) |
| PEX-048 | [STL-295](https://linear.app/johnny-cage/issue/STL-295/pex-048-product-journey-evidence-dashboard) | [#354](https://github.com/johnnyc-9164/painter-os/issues/354) | L | lead | 2 | [STL-92](https://linear.app/johnny-cage/issue/STL-92), [STL-123](https://linear.app/johnny-cage/issue/STL-123) |

## Admission criteria

1. Recheck the relevant canonical existing STL issue, active PR, current main SHA, and owner of every source file. Do not duplicate work already in progress.
2. Review candidate acceptance and allowed path list; expand only through an explicit contract revision and second approval.
3. Obtain maintainer approval on contract content and base-owned approval record. A proposed contract is never automatically approved by a passing CI build.
4. Issue scoped isolated worktree, write failing test, implement minimal solution, run focused and affected integration tests.
5. Push PR with Factory-Contract-Hash, Factory-Attempt, exact SHA evidence and green required CI; separate authorized reviewer signs off.
6. Merge only when all gates and dependencies pass; no implicit production promotion or payment/provisioning authorization.

## Existing roadmap complement

These PBIs are intentionally narrower than existing STL-130 (design tokens), STL-47 (website builder), STL-127 (PWA), STL-121 (browser E2E), STL-122 (analytics), STL-92 (lifecycle E2E), STL-28 (AI entitlements), STL-24 (AI lead chat), STL-105 (bounded reads), and STL-123 (ruleset review). Their dependencies link to those existing issues rather than creating duplicates.
