# Technical debt and held decisions

| Item | Owner / decision | Next bounded evidence |
| --- | --- | --- |
| Cloud login, verified invitation and email delivery | Auth/platform track; email enablement remains Johnny's decision | Real development/preview signup, verification, invite and signout receipts |
| Store/routing/cookie cutover | Johnny and integration lead | Reviewed source/tenant/evidence mapping and rollback rehearsal |
| Deposit satisfaction gate | Owner chose full satisfaction with audited override; PR60 activation remains held | Reviewed activation/mapping/rollback evidence; preserve receipt-versus-satisfaction semantics until the approved gate is activated |
| Legacy browser sandbox and artifact isolation | Repaired locally; independent review pending | Issue #47 runner retains lifecycle assertions, uses sandboxed Chromium and owned synthetic loopback state, and writes ignored private artifacts. Actual local acceptance passed; cloud/payment acceptance remains separate. Browser smoke receipt: [2026-10-11](../evidence/verification/agent-readiness-browser-2026-10-11.md). |
| Full local LogQL/PromQL and internal distributed traces | Developer platform | Concrete overlap/compatibility review before adding services; local probes are partial |
| Autonomous doc/debt repair agent | Runner/control-plane owner | Actual dispatch/auth and distinct reviewed repair PRs; weekly deterministic report is not agent dispatch |
| Existing large UI/domain files | Relevant component owner | Extract one coherent typed seam at a time; size ceilings block further unreviewed growth |
| Schema fields using v.any and whole-tenant snapshots | Backend owner | Bounded typing/pagination/performance work against freeze; no unilateral schema rewrite |
| Self-service SaaS billing/onboarding | Future product scope | Harden individually deployed workflow first |

Weekly hygiene reports this list and checks links/freshness/schema/dependency rules. It neither resolves held decisions nor automatically fixes source.
