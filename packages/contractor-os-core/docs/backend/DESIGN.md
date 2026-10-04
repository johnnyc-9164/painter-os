# Contractor OS executable backend — v0.3.0

Scope: project_contractor_os_extraction. The input is the attached v0.2.0 component,
not a live repository or a production database. Existing artifacts remain intact.

Deliverable: implement all eleven exported business workflows as actual transactional
Convex mutations, plus controlled lifecycle transitions, subcontractor assignment,
and daily-report submission. Preserve the twenty source-defined contractor types.
No frontend, external sending, payment processing, contract signing, cloud deployment,
or promotion of private historical records is authorized by this build.

A strictly typed command core operates on a narrow transaction port. The Convex
adapter implements that port using the component's actual database and indexes.
Each successful command appends entity events, materializes changes, and saves an
idempotency receipt in the same mutation. Parent wrappers derive identity, tenant,
and attestation authority from a server-owned membership record. No client-provided
role, tenant, or actor is trusted.

New implementation policies (not recovered Port semantics): conservative lifecycle
transitions; required lineage consistency; explicit revision preconditions for
EVERY modified existing entity; initial-only maintenance writes; immutable finalized
financial records; USD two-decimal bookkeeping using safe integer cents internally;
positive invoices/payments and no overpayment; payment evidence replay protection;
issued invoices update job billing and payment records update collections atomically.
Human attestations require a separate host permission and are recorded as attestations,
not as independently verified provider receipts. External outcomes never occur here.

Generic create/update endpoints remain usable for drafts and reference data, but cannot
bypass lifecycle, signed-contract, payment, or posted-financial safeguards. Missing
source trade-field definitions stay unresolved. No inferred field schema is invented.

Verification separates pure command tests, explicit local adapter test doubles,
SDK-backed tests, and real Convex backend tests. A missing runtime is a verification
limitation, not permission to describe local doubles as Convex execution.
