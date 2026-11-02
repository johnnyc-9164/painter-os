# Painter OS — Better T Stack build

A working full-stack implementation of the central painting-business lifecycle, built from Johnny's Painter OS IR, PaintPro references, and preserved Contractor OS 0.6.0 source.

## Agent development setup

Start with [agent setup](docs/development/AGENT_SETUP.md): `npm ci --ignore-scripts`, `npm run agent:doctor`, then `npm run agent:dev`. The [quality record](docs/QUALITY_SCORE.md) and fresh exact-head receipts distinguish local checks from live operation.

## Current deployment topology (verified November 2, 2026)

Painter OS is an actively developed product, **not yet a fully accepted or launched self-service SaaS**. Its source of truth is [johnnyc-9164/painter-os](https://github.com/johnnyc-9164/painter-os); the production applications run as four separate Vercel projects in the `johnnyc` team:

| App in this repository | Vercel project | Responsibility |
| --- | --- | --- |
| `apps/web` | [`painter-os`](https://vercel.com/johnnyc/painter-os) | Authenticated operator application and customer portal |
| `apps/platform-admin` | [`painter-os-platform-admin`](https://vercel.com/johnnyc/painter-os-platform-admin) | Platform administration |
| `apps/marketing` | [`painter-os-marketing`](https://vercel.com/johnnyc/painter-os-marketing) | Public marketing and published content |
| `apps/company-site` | [`painter-os-company-site`](https://vercel.com/johnnyc/painter-os-company-site) | Public customer-company sites |

Vercel reported a **READY production deployment** for all four projects at source commit `8ae8405b3528e89e2fafead670666d6b964a062d` (the November 1 deployment). READY is a hosting/deployment status, **not** proof of live Better Auth, payment, email delivery, customer data safety or end-to-end launch acceptance. Preview build failures are tracked separately from the latest production deployments.

### Release path and controls

[CI](.github/workflows/ci.yml) runs on pull requests and pushes to `main`. Automatic Vercel production deployment from `main` is disabled by repository configuration. When a **push** to the current `main` SHA passes CI, [the production deployment workflow](.github/workflows/production-deploy.yml) waits at GitHub's protected `production` environment for **maintainer approval** and then calls the configured Vercel deploy hook. The Vercel build path (`scripts/vercel-build.mjs`) deploys/typechecks the Convex backend before building the corresponding frontend. Production rollout is therefore approval-gated; merging a PR does **not** itself establish that production was promoted or accepted. Consult [the issue-by-issue launch roadmap](docs/roadmap/LAUNCH_ROADMAP.md) and [quality record](docs/QUALITY_SCORE.md) for remaining work and verification gaps.

## Historical source release status (original source-only milestone)

The following paragraph captures the original source-release milestone **before** hosting was set up. It is **not** a description of the current deployment state; see the deployment topology above for verified November 2026 status.

The production Next.js build, domain tests, Convex product adapter tests, real local HTTP flows, and browser flows have passed. This is a source deliverable, not an already hosted application. No live Convex deployment, authentication/email provider delivery, payment charge, calendar synchronization, repository push, or production deployment has occurred.

The critical workflow is implemented and verified:

Lead → qualification/customer → estimate → private customer approval → deposit receipt → project → crew schedule → field checklist/log/photo/materials → completion → final invoice → payment receipt → review/referral.

## Foundation

Actual create-better-t-stack 3.44.2 CLI scaffold; Next.js App Router, React, Convex, Better Auth, npm/Turborepo workspaces; shared shadcn/Base UI primitives with Artisan Core styling. Scaffold evidence and pinned dependency lock are included. npm 11.16.0 was used because the scaffolder enforces its install-script-policy requirement.

- apps/web: operator UI, customer portal, invitation flow, public article pages, protected APIs.
- packages/domain: shared transaction engine, typed commands, permission projection, synthetic seed.
- packages/backend/convex: real Convex product host and Better Auth adapter; core + painting + Better Auth mounts.
- packages/contractor-os-core: supplied original backend; source preserved unchanged.
- packages/ui: shared UI primitives and styles.
- docs/ir: supplied Painter product IR.
- docs/evidence: test logs, screenshots, baseline and bounded security review.

### Important store boundary

The original Contractor OS component remains a separate store with its original lifecycle policy and authenticated gateway. New Painter product aggregates live in host extension tables. The implementation reuses the original monetary precision policy, mounts the original core and painting components, and preserves original tests; it does not pretend that new product entities automatically mirror or migrate original records. Existing customer data migration and cross-store reconciliation need a deliberate mapping before real-data adoption.

## Two explicitly different runtimes

### Convex — intended deployment

The default runtime is Convex. Use PAINTER_RUNTIME=convex and configure the two Convex URLs, backend SITE_URL and BETTER_AUTH_SECRET, and Next PAINTER_LINK_SECRET. The latter must be a securely configured secret of at least 32 characters; it makes repeated link-issuance requests deterministic. Do not expose secrets via NEXT_PUBLIC variables. See docs/CONVEX_DEPLOYMENT.md.

The cloud adapter uses real Better Auth sessions, resolved memberships, Convex mutations/queries/storage, and the same domain engine. It does not silently switch to local storage when deployment setup is missing. Generic runtime bindings are explicitly hand-authored against installed Convex APIs and schema types, not fabricated generated API files.

Live Convex authentication, storage and full cloud browser acceptance still require end-to-end verification; a READY Vercel deployment does not establish them. Backend invitation acceptance deliberately requires verified email; verification/reset email delivery has not been configured. This is a blocker for normal cloud invitation onboarding, not a gate to remove.

### Local acceptance harness — runnable now

Explicit PAINTER_RUNTIME=local uses a durable Node SQLite acceptance adapter. It allows testing the whole UI and core lifecycle without a cloud account. This is NOT a substituted production Convex backend or a production-ready identity system. Email identity in local invitation signup is not independently verified. Do not expose this harness to the internet.

For your own development machine (Node 24+, npm 11.16+):

```sh
npm ci --ignore-scripts
npm run dev:local
```

The generated web dev script listens on port 3001. Open localhost:3001. Create a fresh empty workspace or use the explicitly synthetic demo. There are no shared/default passwords. Signups use salted scrypt password hashes, opaque HTTP-only sessions and durable state. Demo creates a new isolated tenant for each session; it does not expose a shared demo tenant.

Production-build local verification:

```sh
npm run build
PAINTER_RUNTIME=local PAINTER_ALLOW_DEMO=true PAINTER_COOKIE_SECURE=false npm run start --workspace web -- --port 3010
PAINTER_TEST_URL=http://localhost:3010 npm run test:http
PAINTER_TEST_URL=http://localhost:3010 npm run test:browser
```

If Chromium is not installed on your machine, install the Playwright Chromium browser first. PAINTER_COOKIE_SECURE=false is only for loopback local testing. Data is under apps/web/.painter-data unless PAINTER_DATA_DIR is supplied. No databases, session records, passwords, private upload contents, or active bearer tokens are included in this release archive.

## Implemented product surfaces

- Dashboard metrics/activity and searchable lead pipeline.
- Customers, lead details/qualification, scope-based estimate editor, tax/deposit calculation, immutable approvals.
- Expiring private proposal links with customer-bound approval/change-request/decline, job and non-draft invoice summaries.
- Project lifecycle, crew conflict-checked calendar, field checklists/logs/photos/materials, evidence-backed completion.
- Deposit/final invoice allocation, append-only received payments, duplicate/overpayment protection, expenses and project costs.
- Manually delivered review status/outcomes, referrals, commercial bid records.
- Knowledge documents, explicitly bounded manually invoked task/review rules, tasks, private files and audit history.
- Article authoring/publishing and workspace-scoped public journal pages.
- Workspace name, real roster, role controls, expiring invitations. Cloud invitations require verified identity; local invitation identity is acceptance-only.
- Responsive desktop/mobile operator UI and customer portal, accessible Base UI forms/dialogs.

## Deliberately not claimed complete

Full production rollout and every capability in the broad product IR are NOT complete:

- Integrations are metadata only. No Stripe charge/webhook/subscription billing, Gmail/SMS send, accounting/calendar sync, or provider health verification is implemented/connected.
- Payments record money already received. Issuing an invoice or sending a proposal records status; it sends no message.
- Automation is manually invoked bounded internal task/review creation. No LLM, receptionist, booking agent, automatic event-consumer scheduler, or external-action approval executor is connected.
- Commercial scope currently covers bid tracking, not vendor registration, GC partner management, certification verification, or automated bid discovery.
- Field execution is online-only; offline queues/sync, malware scanning, and richer customer document access are not implemented.
- Notifications are audit/activity presentation, not delivered notification subscriptions. Search filters the loaded snapshot rather than a scalable indexed search service.
- Single default cloud workspace is supported through the web adapter; explicit alternate-workspace query selection is rejected to prevent misdirected writes. A full workspace-switching UX is not implemented.
- Product tables currently load a whole tenant snapshot; pagination, performance/load tests, observability, production rate limiting, backup/restore operations and portal revocation require rollout work.
- No original-to-new-store migration was executed.

## Verification commands

```sh
npm run verify
npm run test:http       # requires running local acceptance server
npm run test:browser    # requires running local acceptance server and Chromium
cd packages/contractor-os-core
npm run verify:all
```

See [the historical source-release report](docs/RELEASE_REPORT.md) for its original results and docs/evidence/SECURITY_REVIEW.md plus remediation notes for the bounded review. Newer hosting deployments exist as documented above; production approval, cloud acceptance and full launch readiness remain separate gates.
