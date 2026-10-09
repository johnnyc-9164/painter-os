# Portal view indexed read repair

Base: `22f72c9fe84331a74ade7914add513981ba9a4ea`. Branch: `fix/portal-view-bounded`.

Owned scope: `painter.portalView`, two additive `painterEntities` indexes, and actual backend regression tests. No commands, token hash/expiry logic, provider settings, dependencies, authority, or deployed schema operations changed.

The view formerly loaded every workspace entity and audit event. It now resolves the linked estimate by tenant/business ID, jobs by tenant/type/estimate/customer, then schedules and invoices by tenant/type/job/customer. It reads no events, receipts, payments or customer record. Per-job results are restored to original creation order. Frozen estimate scope retains the live status override; schedules retain cancellation visibility; invoices exclude only draft, retaining void visibility. Related collections remain complete; native Convex quotas still constrain large legitimate output. There is no artificial product cutoff or silent truncation.

Actual `convexTest` regression enforces 20 documents/32 KiB read budget with 100 unrelated records each of tasks, jobs, schedules and invoices, 100 wrong-customer related jobs and each schedule/invoice, 100 foreign-tenant jobs, plus 100 audit events and receipts. Projection and cross-job order assertions pass. A separate larger native-budget fixture returns all 52 legitimate schedules. Token format, missing/expired tokens, missing estimate and mismatched customer denial are covered.

Validation:

- `npm ci --ignore-scripts`: passed; npm 11.9.0 emitted pinned npm >=11.16.0 engine warning.
- `npm run agent:doctor`: initially failed solely on system npm version; rerun through `/workspace/task-npm-1116/node_modules/npm/bin/npm-cli.js` passed with npm 11.16.0 and Node 24.19.0.
- `npm run agent:check`: passed.
- `npx vitest run --config vitest.product.config.ts`: 11 files, 50 tests passed with all regressions.
- `npx vitest run --config vitest.product.config.ts packages/backend/tests/portal-view-lookup.test.ts`: 4 tests included in the passing full suite.
- `npx tsc --noEmit -p packages/backend/convex/tsconfig.json`: passed.
- `git diff --check`: passed.

Independent review and remote CI are pending. Local synthetic evidence does not establish deployed indexes or production operation. Schema deployment requires the existing release process.

Explicit coordinator-approved typed read seam: prior schedule/invoice matching coerced arbitrary `data.jobId` through `String(...)`. Authoritative domain writes persist resolved job entity IDs as strings. Index equality preserves all such records; malformed historical numeric/array/object links are excluded by indexed equality. This intentionally narrows arbitrary `data:any` coercion behavior; the owner confirmed on 2026-10-09 that there is no existing company data, so a historical malformed-link inventory gate does not apply. Existing Vercel domains are retained. No normalization, migration or deployed record rewrite is authorized.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; no new verified reusable procedure is required. Exact commit/reviewer receipt will be supplied at handoff.

Integration refresh: merged current main `c1a241de02753658f6cc234cc0db308e1d61b760` normally, without conflicts or force updates. Source index deployment remains through the existing pipeline; no manual resource creation or provider activation is part of this repair. Fresh integrated actual Convex suite: 11 files / 50 tests passed; backend TypeScript, repository agent checks and diff checks passed. Distinct exact-head integration review and remote CI remain pending.
