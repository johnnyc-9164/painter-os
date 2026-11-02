# Painter OS — production backup and rollback

**Scope:** `STL-119` / [GitHub #231](https://github.com/johnnyc-9164/painter-os/issues/231), 2026-11-02. This runbook documents operations only. No backup schedule, production restore, production rollback, new Convex deployment, paid upgrade or schema migration is authorized by its existence. See [the non-production rehearsal record](../evidence/backups/STL-119-rehearsal-status.md) for execution status.

## Authority and boundaries

- **Production source**: [`johnnyc-9164/painter-os`](https://github.com/johnnyc-9164/painter-os), `main`. Vercel team `johnnyc` hosts `painter-os`, `painter-os-platform-admin`, `painter-os-marketing` and `painter-os-company-site`.
- **Backend**: Convex, team `johnny-cage`; identify the authoritative production **project and deployment in the Convex dashboard** before any data action. Never select a project by guess or by a developer `.env` value. Better Auth and painter data must remain under the same intended production authority and review boundary.
- **Release chain**: GitHub CI on `main` → GitHub `production` environment review → deploy hook → `scripts/vercel-build.mjs` builds/deploys Convex then the web app. A Vercel frontend rollback **does not roll back Convex code, schema, data or environment variables**.
- A maintainer authorizes each production backup configuration, production deployment, production data operation and any restoration. Credentials and downloaded backups remain in approved secret storage only; never attach them to GitHub issues, evidence, commits, logs or agent prompts.

## Scheduled backups — maintainer-owned setup

1. Confirm which Convex project and production deployment the production Vercel `NEXT_PUBLIC_CONVEX_URL` and deployment key reference. Use the provider dashboards and deployment metadata; do not display secret values. Record the nonsecret team/project/deployment name and environment in the rehearsal evidence.
2. Confirm the current Convex plan. Per [Convex Backup & Restore](https://docs.convex.dev/database/backup-restore), manual backups exist, but **automatic daily/weekly backups require Convex Pro**. An upgrade or expense requires Johnny's explicit approval. Do not silently enable paid billing.
3. After approval, open Convex dashboard → production deployment → Backup & Restore. Enable **Backup automatically**, choose daily vs. weekly, schedule time and **include file storage** where project files require recovery. Record the chosen retention and the actual first successful backup, without its contents.
4. Verify coverage for both table data and stored files. Backup snapshots exclude code, deployment configuration, environment variables and scheduled functions. Retain separately reviewed git SHA, component version, exact nonsecret runtime configuration keys, and secrets recovery ownership. Convex documents seven-day retention for daily backups and fourteen days for weekly backups; validate the plan's actual limits at setup.
5. Record recovery point objective and recovery time objective only after a measured non-production drill. Until then **RPO and RTO are unverified**.

## Restore rehearsal — non-production ONLY

**Prerequisites:** Johnny-approved distinct non-production Convex deployment; scoped operator authorization; non-production auth identities and storage destinations; reviewed consent for copying any real customer data; confirmed backup ID; no shared production secrets. This is a rehearsal plan, **not an instruction to restore production**.

1. Validate target team, project and deployment names independently. Write `SOURCE`/`TARGET` labels and evidence timestamps to the rehearsal record; source must be production read-only, target must be explicitly non-production. Refuse if target resembles production or identity cannot be proven.
2. Take/download the approved source backup through the Convex dashboard. If performing an operator-approved CLI export instead, the documented read-only command is `convex export --prod --include-file-storage --path /path/to/secure/snapshot.zip`; run only from a verified linked project, and keep snapshots outside the repository, agent receipts and public logs. Production export still involves personal data and requires the approved handling plan.
3. Use the dashboard Restore UI or reviewed `convex import` procedure **against the selected non-production target only**; verify the target shown in the final confirmation before proceeding. Do not substitute `convex deploy` for a data restore. Record backup/import job ID without sharing contents.
4. Before enabling access, verify expected tables, representative record counts, stored file lookup, core membership isolation, invitation expiry, read/write boundaries and that production records were not mutated. Use only synthetic test users and an isolated outbound-email policy.
5. Run focused Convex tests, app smoke tests and rollback checks on non-production. Redact sensitive data in screenshots/logs. Record actual duration, result, recovery gap and unexpected errors. **If validation fails, stop; do not promote the restored target.**

## Production incident: choose the correct rollback

| Failure | Containment | Recovery route | Stop point |
| --- | --- | --- | --- |
| Frontend regression, compatible backend | Pause/restrict any pending promotions | Maintainer approves Vercel Instant Rollback of affected project to eligible last-known-good production deployment | Verify login, tenant routing, customer portal and backend compatibility |
| Convex code regression without incompatible data writes | Stop further releases and identify source SHA | Authorize a reviewed backend code revert, test on isolated deployment, deploy via protected release path | Require evidence that current data/schema are forward/backward compatible |
| Corrupted data or irreversible migration | Isolate writes and preserve incident evidence | Escalate for owner-approved **production** restore plan, recovery-point selection, and customer/data-loss assessment | Never run `convex import`/restore against prod from this runbook without a separate approval |
| Auth or secrets exposure | Rotate/revoke with approved incident procedures | Contain sessions and investigate; never paste values in logs/issues | Security incident and provider credential ownership |

### Vercel frontend rollback

1. Identify failing project and exact production deployment/commit; inspect Vercel runtime errors, relevant dashboards and current approved release. Frontend rollback is **per project** across the four independently hosted apps.
2. Verify that the older frontend still understands the *current* Convex endpoints, schema and auth flows. Rolling back only the UI can break clients if backend changed incompatibly.
3. With explicit production approval, use Vercel dashboard → Production Deployment → **Instant Rollback** (or a reviewed equivalent CLI command). Under Vercel Hobby, only the immediately prior eligible production deployment may be available. External env vars remain unchanged and cron configuration may change; review before confirmation. [Vercel rollback reference](https://vercel.com/docs/instant-rollback).
4. Verify all active hostnames, protected sign-in, authenticated activity and external monitors. Record rollback deployment IDs, completion time, relevant production error-rate changes and a release freeze owner. Vercel may disable automatic domain assignment after a rollback; do not undo it without approval.

### Convex backend revert and schema rules

- **Never assume frontend rollback reverts backend**; production Convex code is deployed separately by the approved build workflow. Do not invoke `convex deploy --prod` ad hoc.
- For additive schema changes, preserve old readers and old data until both old/new frontend revisions have passed compatibility tests. For removal/rename, require staged expand → migrate → contract planning, backups, a non-production rehearsal and specific signoff.
- Do not delete or truncate production tables or re-import historical snapshots as a generic rollback. Production data may have changed since backup. Restoration needs a point-in-time and loss/reconciliation decision, an auditable change record and customer impact assessment.
- A previous git SHA is not proof of safe backend rollback: test its schema/components against a representative non-production copy first, including Better Auth, mounted Contractor OS components and Painter host tables.

## Verification evidence and completion gate

Required for `STL-119` Done: backup schedule **actually enabled and verified**, one isolated non-production restore **actually performed**, operational checks recorded, explicit source/target and approval identities, and fresh exact-head PR CI + distinct review. Until these all exist, status must remain *partial / blocked*, even if this runbook passes its documentation checks.
