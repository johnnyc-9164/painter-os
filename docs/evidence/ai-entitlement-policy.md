# AI entitlement admission contract — issue 85

This slice owns only `packages/backend/ai-entitlement-policy.ts`, its backend tests, and this receipt. The module imports existing Zod only and has no app, auth, database, provider, billing, engine or command imports. No schema, price, checkout, invoice, root manifest or lock changes.

The caller supplies server-resolved current actor/workspace scope, trusted integer clock milliseconds, an authoritative entitlement grant, separate provider-commercial permission, authoritative budget view, stable operation ID and maximum billable attempts. This pure validator establishes none of those authorities; browser flags, role, email/domain or connection state cannot substitute for grant provenance. Current capabilities are only `workspace_summary` and `recommendation_draft`.

Paid-customer grants require current billing-evidence record/revision/audit identity. Internal exemptions require explicit actor/workspace binding, current grant revision, platform issuer/grant provenance and audit identity. Company owner role alone grants no exemption. Both grants expire and may be revoked. These supplied records still require a future trusted grant administration/persistence boundary; the validator cannot authenticate provenance strings or verify payment against a provider.

Commercial provider permission is separate and bound to the same actor/workspace. It requires current audited permission, registered adapter, commercial allowance and expiry. `openai_api` is a contract label, not an activated or fallback provider. The first own-subscription path is limited to explicit internal grants; customer BYO eligibility is future separately reviewed scope. No OpenAI subscription is inferred to permit every commercial use merely because an account connects.

All numeric budget counters and caps are nonnegative safe integers; requested attempts and revisions are positive. The budget must be in its explicit current period (inclusive start, exclusive end). Admission subtracts settled and reserved attempts without unsafe addition, and checks capacity for the caller's complete maximum initial/retry/recovery attempt budget without reserving it. Failures return closed codes only: `quota_exhausted`, `provider_not_authorized`, `entitlement_required`, `expired`, `revoked`, `unsupported`.

## Durable usage follow-up

Admission is not a reservation. A subsequent storage owner must atomically check current actor membership, grant/provider revisions and aggregate budget while persisting one reservation per stable `(workspaceId, operationId)`. Preserve the reservation ID and operation ID across transport retries; conflicting payload reuse fails. Recheck revocation before every provider attempt. A pure in-memory helper cannot enforce concurrent quota or authenticate grants.

Reservation and settlement are distinct typed contracts. Settlement keeps unique stable attempt IDs, initial/model-retry/recovery classifications, actual outcomes and billable flags. Count every billable attempt, including failed, cancelled and recovery attempts; count by actual provider billing evidence rather than successful output. An unknown billing outcome requires reconciliation and must retain its reserved capacity rather than releasing it as free. Persistence must validate numeric caps, scope/period identities, unique attempts and actual count equality; these interfaces alone are not runtime settlement validation.

Persist settlement idempotently by reservation/operation identity; repeated identical settlement does not charge twice and conflicting settlement fails. Release only proven unused capacity. If actual billing unexpectedly exceeds the reservation, retain and account for all actual costs, block further admission and reconcile the overrun; never drop a real billable attempt to fit a cap. Hard limits require provider-attempt scheduling before dispatch, not settlement-time rejection. Token/currency accounting and authoritative storage are separate follow-up scope; attempt units do not claim a dollar cap.

Rollback removes this unused module/tests/receipt. No call sites, live grant, budget reservation, provider dispatch, paid API fallback or customer pricing are introduced. Source tests cannot prove durable quota, commercial approval or live billing correctness.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; no new reusable operating procedure is warranted for an unused pure contract. Exact-head test and independent review receipts are handed to the coordinator separately.
