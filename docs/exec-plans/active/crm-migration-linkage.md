# Plan: durable CRM source linkage and resumable contact migration (design, then gated implementation)

- Status: queued (design PR open; implementation not started)
- Source baseline: 7c80a4776ad51ba7cca707eee6dac1bc42d277ec
- Executor: Claude Code implementer session_0175wcCZsMHXxNLVSg8UG7un (design PR only)
- Reviewer: pending, distinct identity required
- Branch/worktree: design/crm-migration-linkage, .claude/worktrees/agent-a082d135eff984fe4
- Issue/PR: #161 (child of #144); PR link added on creation (Refs #161, issue stays open)
- Owned files: docs/design/CRM_MIGRATION_LINKAGE.md, this plan, packages/backend/crm-migration-contract.ts, packages/backend/tests/crm-migration-contract.test.ts, one docs/index.md row. No shared-file edits.

## Goal and acceptance

Review persistence and operation contracts before any runtime work. Design acceptance: every #161 bullet is covered in the design doc sections 1-8; type-only contract compiles; `npm run agent:check` passes. Non-goals: schema, Convex functions, UI, provider selection, connector, dependency/lock changes, cutover.

## Proposed file leases (proposed only, none granted)

| Stage | Files | Condition |
| --- | --- | --- |
| A contract | packages/backend/crm-migration-contract.ts | this PR |
| B host | NEW packages/backend/convex/crmMigrationSources.ts, crmMigrationStore.ts, crmMigrationOperations.ts, crmMigrationValidators.ts | after contract review; use exact-key reads from #159 |
| C schema | additive private tables/indexes in packages/backend/convex/schema.ts and generated schema doc | explicit lease + contract review; schema.ts is shared (issue 2 freeze) |
| D tests | NEW packages/backend/tests/crm-migration-*.test.ts; real local OCC evidence under docs/evidence | with B/C |
| E UI | NEW components/lib modules; tiny WorkspaceSetup seam | after host acceptance; keep customer form/account reset |
| Not touched | painter.ts, painterStore.ts, domain contracts/engine, runtime.ts, root manifests/lock, auth, Pi/provider authority | any change needs owner approval first |

## Progress and decision log

- Design doc, contract and type test drafted. Checks recorded in PR evidence.
- Decision: capability = owner/office_admin via server role check; revisit with contracts owner.
- Decision: derived idempotency key becomes the canonical requestKey so existing painterReceipts is the replay authority.
- Open: candidate search needs bounded index (#159) or operator-selected target only.

## Evidence and handoff

Tested head, commands and verdict recorded in the PR. Nothing in this plan has been run against Convex; convex-test results, when added, do not substitute for real OCC evidence. Rollback: remove the added files.
