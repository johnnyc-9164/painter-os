# Runtime acceptance checklist

These checks have NOT run in the authoring environment. Run on a development deployment.

1. Install dependencies, let the real Convex CLI generate both component and host APIs,
   then run `npm run typecheck` and `npm run test:integration` (21 authored SDK-harness tests).
2. Configure the host's intended authentication provider and approved memberships.
3. Use two synthetic tenants. Verify anonymous, disabled-member, foreign-tenant,
   viewer-write, and operator-attestation denial through the real public API.
4. Execute the same create/schedule/payment command twice concurrently. Expect one
   committed command and identical replay, with no duplicated totals or receipts.
5. Send two distinct payments with the same old invoice/job revisions. At most one
   should commit; the other must return a revision conflict after transaction retry.
6. Race two create-job commands against one contract with different job numbers.
   Exactly one operational job may exist; the other must be refused.
7. Race two invoice issuances that together exceed the job budget. At most the
   affordable subset may commit. No negative/unbounded totals may be materialized.
8. Verify pagination boundaries under concurrent inserts and same-identifier records
   in different tenants. Inspect deployment resource limits with representative data.
9. Reconcile all signed/paid legacy data before enabling these commands on it. Review
   the stricter write policy and the new attest permission before replacing callers.
10. Run the dependency security audit in a network-enabled environment. Pin a lockfile
    only from actual dependency resolution; this package does not fabricate one.

Keep the outputs as execution evidence. Passing simulations is not a substitute for
these real backend checks, and this checklist is not a claim that they passed.
