# Painter OS historical source-build and acceptance report

> **Historical milestone, not current hosting status.** This report records local source/build acceptance from the initial release. As verified November 2, 2026, all four Vercel projects (`painter-os`, `painter-os-platform-admin`, `painter-os-marketing`, `painter-os-company-site`) have READY production deployments at commit `8ae8405b3528e89e2fafead670666d6b964a062d`. These hosting states do not prove live Convex/Better Auth, provider email or payments. See [current deployment topology](../README.md#current-deployment-topology-verified-november-2-2026), [quality gaps](QUALITY_SCORE.md) and [launch roadmap](roadmap/LAUNCH_ROADMAP.md).

## Delivered

Actual Better T Stack scaffold with a Next.js/React operator application, shared Base UI/shadcn components, Convex/Better Auth product host, preserved original core + painting component mounts, shared domain engine, protected APIs, customer proposal portal, invitation flow and public article pages.

This is a runnable source release. It is not a claim that the full broad IR or production deployment is complete. See README's explicit incomplete-scope section.

## Verified results

| Gate | Actual result | Evidence |
|---|---|---|
| Original core/source behavior | 411 passed | evidence/backend-baseline/test.log |
| Original SDK integration | 41 passed | evidence/backend-baseline/test-integration.log |
| Original composition | 20 passed | evidence/backend-baseline/check-composition.log |
| Original source preservation | Source and build content-identical to supplied archive | evidence/backend-baseline/BASELINE_REPORT.md |
| New domain behavior/security | 16 passed | evidence/domain-tests.log |
| Convex product persistence adapter | 5 passed using convex-test; auth user mocked, transactions real | evidence/convex-product-tests.log |
| Real HTTP acceptance | 52 assertions passed | evidence/http-acceptance.log |
| Real browser acceptance | 19 routes, 10 interaction flows, no page errors or 5xx, no network mocks | evidence/browser/results.json |
| Mobile | 390px viewport/document width; navigation exercised | evidence/browser/06-mobile.png |
| Type checking | Web, domain and Convex host passed | evidence/typecheck.log |
| Lint | Passed, no errors/warnings | evidence/lint.log |
| Optimized production Next build | Passed | evidence/production-build.log |

The original baseline totals 472 tests. New unit/adapter tests total 21. HTTP assertions and browser routes are separate acceptance checks, not counted as additional unit tests.

## End-to-end path exercised

A real account creates a tenant; a lead becomes a customer; a server-calculated estimate is sent; an anonymous customer uses a scoped bearer portal to approve; the operator creates a job and deposit invoice; recorded deposit payments replay safely; crew scheduling rejects conflicts; field work requires all checklist items and a site log; a private image is uploaded and attached; the job is completed; the final invoice excludes allocated deposit; overpayment is rejected; received payments reconcile; review/referral outcomes and safe internal tasks are recorded; public article publishing and role-bound invitations work in the local acceptance harness.

Browser testing separately used real API persistence for demo login, lead creation/search/qualification, estimate creation/send, portal issuance, anonymous approval, project creation and mobile navigation. No snapshots/commands were intercepted or mocked in the final browser suite.

## Bounded security review remediation

Read the original findings in evidence/SECURITY_REVIEW.md. Following that review:

- Crew command responses AND idempotent replay results now use the same financial projection as snapshots. Domain and Convex regression tests verify this.
- Staff cannot approve, reject or request changes as a customer. Customer decision verbs require a customer actor bound to the estimate. Domain/Convex/HTTP tests verify staff denial and real portal approval.
- Customer snapshots and local portal exclude draft/void invoice summaries; the HTTP suite verifies draft exclusion.
- Cloud web alternate-workspace query selection is rejected instead of mixing selected read state with default write targets. A single default membership workspace remains the implemented web scope.
- Repeated cloud link issuance uses an actor-bound deterministic HMAC token with a separately configured secret; backend hash reuse is checked, expiry is not extended, and portal revision checks are applied. A Convex test verifies only one portal row is created for repeated issuance. Full cloud request-key conflict semantics across different command kinds are not established.
- Cloud entity IDs are URL-safe tenant/hash/sequence values; the UI also decodes path segments on reload.

These changes are source/test verified, not a production security certification. Portal revocation, distributed production abuse controls, full load/performance testing and real provider credentials remain rollout gates.

## Runtime and deployment boundaries

All final HTTP/browser acceptance ran against the optimized Next production build using explicitly selected SQLite LOCAL ACCEPTANCE mode. They prove application integration, not real Convex hosting or Better Auth cloud cookie behavior. Convex product tests exercised actual indexed persistence/transactions via convex-test with the auth user boundary mocked.

**At the historical source-only milestone:** no live Convex deployment, cloud signup/session/logout/storage flow, original mounted-component cloud smoke test, hosting deployment, external send/charge, subscription billing, real-data migration, repository push or production deployment had occurred. Hosting and repository status subsequently changed (see the current README); provider-backed acceptance is still unproven by these historical tests.

## Product completeness boundaries

Commercial procurement is bid tracking only, not vendor/GC/certification management. Automation is manually invoked bounded rules, not connected AI agents or durable event consumers. Field work is online-only. Integrations are metadata only, payments manual receipts, billing unavailable, notifications activity only, and search a loaded-snapshot filter. Original core and new Painter product stores are explicitly separate and have not been migrated/reconciled. The full requested production scope remains open for these items.

## Next authorized phase

Choose/provision the Convex staging deployment and web host; configure secrets through their secure settings, configure verification/reset email delivery, run actual cloud acceptance including file uploads and component mounts, then implement the remaining provider-backed and broad-IR capabilities. Production needs Johnny's explicit approval.
