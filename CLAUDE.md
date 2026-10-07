# Claude Code — Painter OS

Read and follow `AGENTS.md` first. This file is an entry point, not a replacement for repository rules. Read nested AGENTS.md files before editing their scopes.

## Start here

1. Read the current user task and any owning issue/PR; confirm the bounded objective and owned files.
2. Read `README.md`, `docs/contracts/issue-2-freeze.md`, and relevant app instructions. The README contains historical release statements; verify current source, CI and deployment evidence before treating those statements as current status.
3. Inspect git status, branch, recent commits and open overlapping work. Preserve others' changes. Work on an isolated branch/worktree; reserve shared files/interfaces before edits.
4. Inspect package scripts and the lockfile. Use the repository's existing stack and tooling.
5. Establish baseline checks, implement one bounded slice, run affected checks and provide a precise handoff. Do not start a broad rewrite because the product IR includes future capabilities.

## Setup and local acceptance

Root package.json requires Node >=24 and npm >=11.16.0, with packageManager npm@11.16.0. Check the current manifest before setup.

```sh
node --version
npm --version
npm ci --ignore-scripts
npm run dev:local
```

The README documents localhost:3001 for local development. Confirm actual server output. Local mode is an explicit synthetic SQLite acceptance harness, not production Convex or verified cloud identity. Keep it on your development machine; never expose it publicly.

Existing checks:
- `npm run check-types`
- `npm run lint`
- `npm test`
- `npm run test:convex`
- `npm run build`
- `npm run verify` combines the above.
- `npm run build:marketing` checks the separate marketing build.
- `npm run test:http` and `npm run test:browser` require a running local acceptance server; browser acceptance also requires Playwright Chromium.
- Original component verification: from `packages/contractor-os-core`, inspect and run `npm run verify:all` when that scope is affected.

See README for production-build loopback acceptance commands and `PAINTER_TEST_URL`. Report baseline failures separately from introduced failures. Do not claim a check passed unless you have its result.

## Code map

- `apps/web`: authenticated operator UI, customer portal, invitation/auth flows and APIs.
- `apps/marketing`: separate public marketing application.
- `packages/domain`: shared commands, transaction engine and permission projections.
- `packages/backend/convex`: Painter host, schema and Better Auth/component adapters.
- `packages/contractor-os-core`: preserved original core and painting components.
- `packages/ui`: shared UI primitives.
- `docs/contracts/issue-2-freeze.md`: authoritative compatibility constraints and current decision holds.
- `docs/skills/painter-pr-evidence/SKILL.md`: exact-head acceptance evidence procedure.

## Preserve these boundaries

Better Auth owns cloud sessions/users; trusted server membership establishes workspace authority. Keep one writer per aggregate, existing Painter/core/painting store separation, and existing URL/cookie compatibility. Marketing consumes published public-safe CMS projections and must not import admin/business snapshots.

Keep money in safe integer cents at Painter boundaries and preserve original core currency conversion rules. Recorded payment receipts are not payment processing or signed attestations. Never fabricate evidence.

Store/routing cutovers, a new deposit scheduling/start gate, and enabling transactional email or AgentMail need the existing explicit decisions/authorization. Inspect current contracts for updates; do not remove verified-email requirements to bypass onboarding failures. Never commit secrets or turn missing cloud configuration into local fallback.

## Finish each task

Provide changed behavior/files, exact branch/head, checks actually run and results, baseline failures, remaining gaps and rollback implications. Request independent review; the implementation owner does not self-approve or merge. Green CI/local synthetic checks do not prove live login, invitation/email delivery or production readiness.

Perform the required skill-extraction pass using existing repository skills first. Record the skill path or why no verified reusable procedure was found in the session ledger. Do not invent new operating rules, deploy or enable providers merely to complete a handoff.
