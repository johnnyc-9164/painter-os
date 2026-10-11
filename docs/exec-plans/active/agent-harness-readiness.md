# Plan: prepare Painter OS for coding agents

- Status: implemented on main; exact-head local `agent:verify -- --browser` passed (24/24 gates) at 52c96bb on 2026-10-11, see [receipt](../../evidence/verification/agent-readiness-browser-2026-10-11.md); distinct review of that head and CI on the PR remain pending
- Baseline: main 6cd31b871188c02602a81b2a40bef61b570a65a3 (all downloaded source blobs hash-verified)
- Executor: Codex /root in the current ChatGPT Work Mode session
- Reviewer: Codex /root/harness_review, read-only independent session
- Branch: codex/agent-harness-readiness, isolated source workspace
- Scope issue: https://github.com/johnnyc-9164/painter-os/issues/39
- Authorization: Johnny requested preparation using OpenAI's February 11 article; then constrained changes to avoid disrupting existing work
- Reserved files: AGENTS.md navigation addition, README setup pointer, package.json additive scripts, .gitignore local artifacts, scripts/agent-*.mjs, tests/agent-harness.test.mjs, .github/workflows/agent-readiness.yml, ARCHITECTURE.md and new docs harness entry points. Existing freeze, auth/business code, deployment configuration, stable CI workflow and draft PR #38 remain separate.

## Acceptance

Prerequisite doctor reflects Node/npm lock requirements. Isolated local app boots and rejects provider env files. Doc/schema/import checks and meaningful regressions pass. Existing combined verification runs with per-gate receipts. Sandbox-enabled browser smoke reports pass/failure explicitly. Distinct reviewer checks current changes and exact remote head; publish draft PR without merging.

## Decisions

2026-10-07: Use current AGENTS.md directly; official Claude docs support it, so no competing CLAUDE.md is needed. Preserve all existing instructions.

2026-10-07: Reuse explicit local acceptance runtime and existing HTTP verifiers. Add developer-only checks/commands; no product policy or infrastructure changes.

2026-10-07: Defer full LogQL/PromQL/distributed-tracing infrastructure and an autonomous cleanup agent. These need separate design/runner provisioning; claim partial local observability accurately.

## Evidence

Local exact-head verification: [2026-10-11 receipt](../../evidence/verification/agent-readiness-browser-2026-10-11.md) (passed after one verifier environment repair). Remote-head/CI links and the independent reviewer verdict belong to the PR; this plan records no review or CI pass that has not happened.

## Rollback

Revert this additive tooling/docs PR. No stored business records, secrets, cloud resources or existing runtime implementation were changed.
