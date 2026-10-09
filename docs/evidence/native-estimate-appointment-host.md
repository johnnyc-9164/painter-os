# Native estimate appointment host (#141)

Authenticated owner/office-admin operations manage company slots and proposed/internal reservations through the existing sole `persistPainterState` writer. Estimators can read only their assigned native slots and appointments. Current BetterAuth identity, enabled company membership, real eligible estimator resource, qualified customer-linked source, exact revisions and indexed padded conflicts are checked at authoritative boundaries. Public-intake sources additionally require the existing explicit audited converted-customer transfer; booking does not promote a lead or copy contact data.

The authenticated Node action validates bounded local-time inputs using IANA timezone normalization. Its internal transaction rechecks membership/resource/clock and binds the exact normalized input. Persisted private normalization proofs are excluded from snapshots. Browser actor, instant and normalization proof are never accepted. Retries bind canonical intent and return the current target, including cancelled/closed state. Audit metadata records revisions, resource/slot and before/after times without contact copies.

## Release limits and holds

The initial contract permits 256 entities and 512 receipts **per native kind for the lifetime of that company history**. Reads reject cap+1 rather than silently truncating conflict or replay evidence. New transitions, including cancellation, deny at receipt capacity. This is a production capacity/recovery hold tracked by [#151](https://github.com/johnnyc-9164/painter-os/issues/151), not indefinite scheduling capacity. Permanent idempotency must survive its resolution.

These are internal reservations only: no customer notification, external calendar checks, crew-calendar duplication, providers or production activation. Actual cloud Node timezone execution and deployed concurrent Convex OCC acceptance remain unclaimed. Local convex-test fixtures serialize writes; their overlap test establishes application rejection behavior, not deployed OCC execution proof. No project/account creation or deployment was performed.

## Local validation

The focused host suite uses actual registered BetterAuth/Convex fixtures and covers authorization/revocation, DST gaps and folds, normalization binding, canonical reordered retries, revisions, conflict rejection, cancellation/reschedule replay, bounded capacity, eligible sources and real public-lead transfer. Pure tests cover default strict normalization, invocation-only host options and scoped/proof-free snapshots. Final command receipts and independent exact-head review will be recorded on the PR; no live-provider acceptance is implied.
