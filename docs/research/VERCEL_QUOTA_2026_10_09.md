# Vercel quota assessment — 2026-10-09

Read-only official documentation research. No account upgrade, plan change, redeployment, credentials or source edits.

## Observed context supplied by coordinator

Latest main e9d4da3c has combined GitHub status Vercel–painter-os failure linked to https://vercel.com/johnnyc?upgradeToPro=build-rate-limit . Latest listed production READY belongs to older04faa commit at12:37. These are coordinator observations, not independently fetched deployment records in this research.

A build-rate-limit link indicates deployment admission/quota failure, not evidence the application source failed typecheck/tests. Conversely source CI success does not establish latest main deployed. Record the exact latest READY fullSHA/deployment and current main fullSHA separately.

## Official limits

https://vercel.com/docs/limits

Hobby:
- Deployments/builds per hour:100 every3600seconds, limit api-deployments-free-per-hour.
- Deployments per day:100 every86400seconds, limit api-deployments-free-per-day.
Both have owner scope (team or user depending resource), not independent allowance per PR/project.

Docs say once a limit is hit it resets after the Duration expires. An hourly example says wait another hour; daily example says another day. The upgradeToPro=build-rate-limit link alone does not reveal which counter is exhausted, window start or precise account reset. Do not promise reset at midnight or fixed clock time. Read provider UI/API rate-limit metadata when available; otherwise record reset unavailable.

Monthly resource exhaustion is different: Hobby docs generally say30days for certain feature usage overages. That general statement must not be used instead of3600/86400deployment windows.
https://vercel.com/docs/plans/hobby

Pro limits are higher, but upgrading is an account/billing decision, not a required authorized research action or an automatic repair. Existing commit author identity preference johnnyc@agentmail.to is separate from a consumed quota; changing identity does not establish new legitimate allowance.

## Safe continuation

Continue local/CI independent verification and exact-head source review while quota blocked. Keep deployed acceptance pending; do not relabel sourceCI as production-ready, repeatedly redeploy, or create alternate accounts/projects to evade owner quota. Avoid unnecessary commit/redeployment churn; prepare one reviewed candidate for eventual authorized deployment and inspect terminal result.

The latest READY deployment remains the deployed baseline until a newer READY exacthead is verified; this quota failure alone does not prove the existing site is down. Main may differ from production, so state that explicitly in release notes.

Commercial readiness note: Hobby is documented for personal non-commercial use. Painter OS commercial production requires an owner-approved compatible hosting plan or hosting decision; no upgrade was performed or inferred authorized by this research.
https://vercel.com/docs/plans/hobby

No implementation procedure validated; research only.

