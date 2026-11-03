# STL-11 / PR #60 — deposit policy port to current Painter OS main

**Status:** isolated replacement branch; NOT production approved or promoted.

## Conflict resolution and hardening

The October 2026 preparatory deposit policy branch (#60, `feature/deposit-policy-review`) conflicted with current main in:
- `painter-app.tsx`: preserved recent workspace navigation and structured error status while adding deposit denial messages and owner/office-admin override controls.
- `contracts.ts`: preserved native `estimate_slot`/`estimate_appointment` business types while adding the deposit view and override contracts.
- `engine.ts`: preserved new estimate-visit field isolation, membership visibility, and customer projection while adding deposit policy checks, owner/office-admin capability, and internal approval redaction.
- `vitest.forms.config.ts`: retained all existing form tests and added deposit UI acceptance.

The first integrated Convex test run exposed an actual command-state integration bug: the bounded indexed loader lacked deposit-invoice and recorded-payment evidence on `schedule.create/reschedule`, `job.start`, `field.start` and owner override actions. A fully paid deposit was incorrectly denied. The fix adds job-indexed invoice and payment reads through the existing `by_tenant_type_job_customer` index before engine evaluation. It does not reintroduce unbounded whole-tenant history reads and does not add a second writer.

The bounded-read test's synthetic scheduling scenario now explicitly records owner-approved exceptions instead of unintentionally relying on unpaid-job scheduling. The independent domain/Convex deposit tests continue to assert that unpaid and partially paid jobs fail closed, valid receipts unlock work, and foreign, void, mismatched, malformed or final-invoice payments do not count. The customer/crew projections remove internal approval details.

## Verification

Verified in isolated Sprite `painter-deposit-review` on main base `8ae8405b3528e89e2fafead670666d6b964a062d`:
- Repository-pinned npm 11 clean install: PASS.
- All workspace TypeScript checks: PASS.
- Scoped deposit policy tests: **9/9 PASS**.
- Forms/component tests: **56/56 PASS**, including 8 deposit UI cases.
- Convex tests: **203/203 PASS** after the indexed-ledger fix; initial RED was 2 failing tests.
- Full `npm test`: PASS (187 main domain tests, additional form, worker and platform suites).
- Lint: PASS, 0 errors and two pre-existing fixture warnings.
- `npm run agent:check`: PASS.
- `npm run build`: PASS (production Next web build).
- `PAINTER_AGENT_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome npm run test:browser`: PASS; the system Chrome executable was used because Playwright does not ship Ubuntu 26.04 Chromium in this Sprite.
- Local production-built HTTP acceptance against an explicitly owned `PAINTER_RUNTIME=local` server: **52 Painter lifecycle + 121 platform HTTP checks PASS**, no external provider calls or production data.
- `git diff --check`: PASS.

**Release restrictions:** Draft until exact-final-head hosted CI, independent reviewer and owner confirmation of policy rollout, production backward compatibility and scope. Browser/HTTP tests use synthetic local data, not a live Convex tenant or production payments. No production deployment, Convex schema migration, DNS, provider activation, or billing action has occurred in this port.
