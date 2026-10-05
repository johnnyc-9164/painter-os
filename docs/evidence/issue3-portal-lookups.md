# Bounded portal issuance lookup — Issue 36 / Issue 3

## Contract and scope

Base: cb2ffae7a011e4f660c5e68598e2b1237537d92f. Issue36 narrows Issue3's bounded-read requirement to `painter.createPortal`; the authenticated host remains the one writer for existing Painter portal records. No component/store cutover, schema/index addition, second data authority or migration is introduced.

Before this repair, issuing a link for one estimate called the whole-workspace `load` helper, reading every entity and audit event. It used only one estimate and one customer. The repaired mutation uses the existing tenant/entity index for those two records, then the existing token index. Authentication/membership resolution is unchanged and still runs first. Other snapshot, membership, command and public portal-view reads retain their existing behavior; this does not claim the whole application is bounded.

## Preserved behavior

The original Better Auth session and tenant membership remain authoritative. Customer/unauthorized roles are denied; token hashes are validated; the estimate must be sent/viewed; the linked same-tenant row must be a customer with an email; expected revision, token replay/conflict and seven-day expiry semantics remain. Portal scope still uses the existing publicEstimate projector. A returns validator documents the exact existing first-write/replay response shape. Existing unique-entity invariant is enforced by the indexed unique read rather than silently selecting one of corrupt duplicate business IDs.

No returned field, email delivery, verification flag, live portal, grant, provider setting, credential, dependency or UI behavior changes. No artificial production workspace-size cutoff or silent truncation is added. Reverting the source/test change restores the earlier lookup implementation; there is no data migration to reverse.

## Regression evidence

The first test uses actual published Better Auth schema/adapter fixtures and Convex-test's transaction metrics. With 500 unrelated entities and 500 audit events, the original mutation fails with “Scanned too many documents in a single function execution (limit: 20).” After the indexed repair, both issuance and exact replay succeed under the same 20-document/32-KiB read budget. Those deliberately tight limits belong only to the test fixture, not production configuration.

The stored portal is checked for its exact public scope, same-tenant customer and unchanged replay expiry. Additional cases cover missing/wrong-type/unsent/foreign estimates, missing/wrong-type/foreign customer linkage, no writes on rejection, anonymous/expired session/customer-role denial, invalid hashes, viewed status, stale revisions and token conflicts. Existing adapter lifecycle tests continue to cover anonymous portal approval and immutable financial state.

Full current-head CI and an independent reviewer must accept the final branch before merge. Local synthetic fixtures do not claim live Convex or real customer approval acceptance.

## Skill extraction

Reused `docs/skills/painter-pr-evidence/SKILL.md` for exact-head, independent-review and bounded-failure receipts. The installed Convex-test `transactionLimits` API provides a verified regression technique: seed unrelated synthetic history, enforce a small read budget, observe the original operation fail, then require the repaired operation and replay to pass without changing the fixture limit. No new production component or runtime dependency is needed. This evidence document is the scoped session receipt; broader Issue3 remains open.
