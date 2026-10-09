# Internal AI access and shared usage persistence — issue 93

Owned changes: new `aiEntitlements`, `aiUsage`, `aiUsageStore` and `aiValidators` Convex modules; seven additive host tables and exact generated schema inventory; focused backend tests and this receipt. Existing `resolvePainterMembership`, Better Auth identity, platform-owner bootstrap and origin gates are reused unchanged. No UI, manifests, dependencies, painting aggregate writer or payment/billing changes.

## Authority and stored state

`grantInternal` and `revokeInternal` are authenticated mutations. Each requires the actual verified Better Auth user and enabled stored platform-owner grant, active target workspace membership, safe bounded input, optimistic revisions and a unique audited request identity. Ordinary company owners, claimed browser roles, email strings and connection flags confer no exemption. Grant updates carry an explicit company entitlement revision and access-grant revision; replay after revocation reports the current disabled state and never restores access. Issuer revocation or loss of verified identity also stops access. Current internal grant provenance is checked against its stored audit revision and issuer.

One company entitlement owns the company cap and supported capabilities; actor grants bind explicit internal exemptions to individual staff. One UTC calendar-month budget aggregates every member's reservations and charges. Grant/member amendments do not reset existing period counters. Company configuration changes conservatively invalidate dispatch from reservations bound to older entitlement/access revisions; an actor addition is also an audited company amendment. The current company cap applies on the next reserve, preserving all settled/reserved quantities.

Only internal entitlement records can be written here. Paid-customer authority is absent until a separately verified billing integration exists; no painting invoice, payment receipt, browser paid flag or platform boolean creates paid access. The prior pure policy describes future paid/provider admission, but no active provider permission or complete provider-backed admission is fabricated here.

Public eligibility reads reuse the existing authenticated membership resolver and return only safe refusal codes. Active internal access currently returns `provider_not_authorized`. Production `aiUsage.reserve` and `claimAttempt` are internal-only and always refuse provider dispatch while activation is held. There is no setter that can turn provider permission on. No model, subscription, checkout, billing adapter or worker is activated.

## Atomic storage mechanics

The exported store helpers are ordinary private module functions, not registered Convex endpoints. A future authorized adapter must call them inside a mutation only after full verified provider admission. Tests register explicitly synthetic mutation wrappers solely to exercise positive atomic mechanics; those wrappers are outside deployed Convex modules. Passing those tests does not establish a production provider permission.

Reservation identity is unique per `(tenant, operationId)` across actors. Exact payload/actor replay is inert, altered actor/input conflicts, and current access is checked before replay. Capacity is reserved with overflow-safe arithmetic in the same transaction that persists the reservation. Per-operation cap is 128 attempts; shared company cap is at most 100,000 attempts per period. These are attempt units, not a promised dollar/token budget or customer price.

Each dispatch claims a stable initial/retry/recovery attempt before any external work. Current target membership, issuer/access status, entitlement/access revisions, current reservation period and remaining attempt allowance are checked. Exact claim replay returns `dispatch: false`, never permission to send again. Persisted unknown billing retains capacity. A crashed worker would reconcile the same identity rather than dispatch blindly; actual provider recovery integration remains future work.

Settlement is an internal trusted operator/worker boundary; public users cannot supply billing flags. It may reconcile actual costs after membership/grant revocation. Stable settlement IDs/fingerprints make exact replay inert and conflicting replay fail. Attempt billing can advance from unknown to a terminal state, never reverse terminal evidence. Unexpected real billable attempts are retained and charged even beyond the reservation; an exhausted company budget refuses further admission. Unresolved attempts retain capacity; proven unused allowance releases only when settlement closes dispatch. Arrays and total attempt history are bounded to 256 per reservation.

Settlement evidence authentication is a future provider adapter responsibility. Internal callers are privileged trusted operators/workers; this source does not verify provider billing signatures or claim that submitted billing facts were observed live. Atomic errors roll back attempt updates, counters and receipts together. Distinct reconciliation settlement identities may resolve unknown facts; identical old settlement replay returns its original receipt and never changes current counters.

## Verification and rollback

Focused tests use the actual published Better Auth component/adapter and sessions, actual platform-owner bootstrap/revoke, actual memberships and Convex transactions. Seven groups cover identity/platform/member denials, audited replay/provider hold, concurrent actors competing for final capacity, cross-actor/input conflicts, revoked replay/dispatch with post-revocation billing, unknown/recovery attempts, settlement replay/conflicts, unexpected overrun, unchanged counters after amendments, failed-transaction rollback and expiry/capability/issuer checks. Positive quota transactions are marked synthetic; production admission remains denied.

Exact head, test commands/results and distinct review receipts are supplied to the coordinator separately. Schema source inventory is generated with the existing tool. No browser test is appropriate to this backend-only slice, and no live cloud/provider/quota operation is claimed.

Rollback removes the new entrypoints/helpers together. Preserve any stored audit, usage and billing reconciliation history; table removal requires separate migration approval after actual production usage. No runtime call site dispatches through these tables yet.

Skill extraction reused `docs/skills/painter-pr-evidence/SKILL.md`; no new operating skill is warranted before verified provider/persistence operation. The current procedure retains source/fixture boundaries and exact-head independent review.
