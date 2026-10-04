# Contractor OS — executable Convex backend 0.3.0

This module implements business commands, not just tables or a Port-import catalog.
It preserves the twenty contractor entity types and their supplied field names.
Each business command runs inside one Convex mutation: validated inputs and lineage,
revision checks, events, all affected records, and an idempotent response receipt.

**Build status:** command logic and adapter handlers tested locally; SDK integration
and deployment not verified. The execution environment could not resolve npm's registry.
There is no generated-code shim, fabricated SDK, production deployment, or live data import.
See `docs/VERIFICATION.md` for exact results and remaining checks.

## Working operations

| Command | Implemented behavior |
|---|---|
| `co_create_lead` | Creates a new lead tied to the correct client/contact. |
| `co_schedule_site_visit` | Creates the visit and advances the lead in the same mutation. |
| `co_advance_lead` | Applies allowed lead transitions with optimistic revision checks. |
| `co_create_scope` | Creates a versioned scope and advances the lead to scoping. |
| `co_create_proposal` | Requires an approved scope, matching lead/client and valid USD amount. |
| `co_submit_bid` | Records an attested submission, creates the bid and advances its lead. Does not submit externally. |
| `co_convert_bid_to_contract` | Records an attested award, creates a draft contract, and advances bid and lead. |
| `co_mark_contract_signed` | Records an authorized signing attestation plus signed-document reference. Does not sign or verify a signature. |
| `co_create_job` | Requires a signed contract, initializes financial totals and advances its lead to won. |
| `co_create_invoice` | Creates a draft invoice on the correct job, contract and client. |
| `co_record_payment` | Records a payment, updates the invoice balance/status and job collections, and rejects replayed evidence or overpayment. Does not move money. |
| `transition` | Controls other lifecycle changes, including scope approval, invoice issuance/voiding, and change-order execution. |
| `assign_subcontractor` | Checks stored eligibility/date flags and updates both job and subcontractor links. |
| `submit_daily_report` | Creates a submitted field report for an eligible job. |

There is also one union-validated `execute` command endpoint and five reads:
`listLeads`, `listJobs`, `jobFinancials`, `invoiceBalance`, and `history`.
The 80 original typed maintenance endpoints remain, with new workflow-bypass protections.

## Install in an existing Convex app

1. Extract the **entire `contractor-os-core` directory** into
   `YOUR_APP/components/contractor-os-core`. This is a local source component, not
   a precompiled npm release. Do not copy only its schema.
2. Install the runtime dependencies in YOUR_APP:

```sh
npm install convex@^1.43.0 convex-helpers@^0.1.124
```

3. Register it alongside your existing components in `YOUR_APP/convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import contractorOs from "../components/contractor-os-core/src/component/convex.config";

const app = defineApp();
app.use(contractorOs);
export default app;
```

4. Construct the host service inside YOUR_APP's `convex/` functions. Reuse your
   existing auth provider and trusted membership model. The caller never supplies
   tenant IDs, actor IDs, or permission flags. `examples/convex/backend.ts` is a
   complete wrapper module with all command endpoints. When copying it to your
   app, update its imports from `../../src/` to
   `../components/contractor-os-core/src/`.

```ts
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { ContractorBackend } from "../components/contractor-os-core/src/backendClient";

const backend = new ContractorBackend<DataModel>(
  components.contractorOs,
  async (ctx, identity) => {
    const membership = await ctx.db
      .query("contractorOsMemberships")
      .withIndex("by_identity", q =>
        q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!membership?.enabled) return null;
    return {
      tenantId: membership.tenantId,
      permissions: membership.role === "admin"
        ? ["read", "write", "import", "attest"]
        : membership.role === "operator"
          ? ["read", "write"] : ["read"],
    };
  },
);
```

The membership table and its trusted internal setup mutation are in
`examples/convex/schema.ts` and `examples/convex/memberships.ts`. Merge the table
into your existing schema; do not replace an application schema. Never expose
membership administration as an unauthenticated public endpoint. No membership
is provisioned automatically. Each identity has one server-selected tenant in
this example; multi-workspace selection belongs in your host resolver.

5. Run your **development** workflow to generate Convex's real `_generated` files:

```sh
npx convex dev --typecheck-components
```

Use your intended development project. Do not point these commands at production.
The source package intentionally does not pretend that handwritten generated types
are real Convex output. No login or secret values are bundled.

## Call a workflow

With `examples/convex/backend.ts` mounted as the host's `convex/backend.ts`, the
client-facing API is `api.backend`. The frontend does not call the component directly.

```ts
const result = await client.mutation(api.backend.co_schedule_site_visit, {
  requestKey: "schedule-visit-lead-123-v7",
  input: {
    lead: "lead-123",                 // preserved external identifier, NOT a Convex ID
    visit_date: "2026-10-01T15:00:00Z",
    address: "Synthetic example address",
  },
  expected: [{
    blueprint: "co_lead",
    identifier: "lead-123",
    revision: 7,                       // use the revision returned by your current read
  }],
});
```

An identical retry uses the same request key and returns the original result.
A changed payload needs a new key. Every **existing record changed** by a command
needs a current revision precondition. For example, payment recording needs both
the invoice and the job revisions. Read with the original `TypedContractorOS`
record APIs or the supplied list/financial query methods. Results expose the
primary effect, every related effect, event IDs, new revisions and replay status.

To record a payment, an authorized attestor supplies a reference to independently
retained evidence. The module records that person's assertion; it does not verify
bank settlement, a signed document, or the authenticity of a URL.

```ts
await client.mutation(api.backend.co_record_payment, {
  requestKey: "record-payment-bank-row-123",
  input: {
    invoice: "inv-I1",
    client: "client-001",
    amount: 125.50,
    payment_date: "2026-09-22T11:00:00Z",
    payment_method: "ach",
    reference_number: "bank-row-123",
  },
  expected: [
    { blueprint: "co_invoice", identifier: "inv-I1", revision: 2 },
    { blueprint: "co_job", identifier: "job-J1", revision: 3 },
  ],
  evidence: {
    kind: "payment_received",
    reference: "bank-ledger:bank-row-123",
    occurredAt: "2026-09-22T11:00:00Z",
  },
});
```

## Policy and boundaries

The source describes types and allowed values, not a complete transition policy.
`src/shared/businessPolicy.ts` is a new, conservative implementation policy. Its
policy version is recorded on business events; it is not represented as a recovered
Port rulebook or an approved company policy.

The v1 billing policy is USD, two-decimal amounts, integer-cents arithmetic, no
negative invoices/payments, no overpayments, and no issuance beyond the job's
contract amount. A job cannot close with unpaid or unbilled contract amounts. Draft invoices do not count as billed. Issuance increments job
billing; voiding an unpaid issued invoice reverses that increment. Executed change
orders adjust the job's contract amount, preserving the original signed contract.
**One operational job per contract** is enforced to avoid multiplying the same
budget. Contracts requiring multiple job budgets need a reviewed allocation model.
Tax calculations, retainage allocation, FX, credits, refunds, and corrections to
posted payments are not implemented. Do not use direct database edits to improvise them.

Generic maintenance cannot set outcome statuses, create jobs/payments, alter
managed balances, rewrite finalized financial records, reassign existing client
lineage, or change job/subcontractor assignments. Low-level administrator database
access is outside this application API boundary. Audit events are append-only
through the exposed APIs, not cryptographically tamper-proof against administrators.

Subcontractor readiness checks stored values; they do not independently verify
licensing, insurance, tax documents, or legal eligibility. Link URLs are references
only and are never fetched by this backend. The original unresolved trade-specific
fields, formulas and scorecard logic are still explicit source gaps. Markdown
`conditions` are never evaluated as code; automation activation fails closed until
an executor is configured. No external email/SMS, e-signature, QuickBooks, Stripe,
or other payment-provider integration is claimed.

## Source structure

- `src/component/workflows.ts`: registered transactional command functions.
- `src/shared/business.ts`: executable workflow and invariant logic.
- `src/shared/businessPolicy.ts`: transition graphs and maintenance guards.
- `src/component/businessStore.ts`, `businessRecords.ts`: actual Convex database adapter.
- `src/component/operations.ts`: bounded/indexed read methods and financial views.
- `src/backendClient.ts`: parent-authenticated command/query service.
- `src/component/records/`: 20 typed record modules, now guarded.
- `src/component/schema.ts`: 20 domain + 8 audit/import/support tables.
- `examples/convex/`: complete host wiring and membership integration examples.
- `tests/`: offline logic tests, explicit adapter doubles, and authored SDK-harness tests.

Original records and agent/personal traces are NOT included. The original import
catalog remains isolated; its historical snapshots are not silently promoted into
operational tables or treated as proof of signed/paid/completed outcomes.

## Verification commands

In this source directory:

```sh
npm install
npm test                         # pure core + explicitly fake adapter/database tests
npm run check:generated          # detects changes from the source model generator
node tools/check_syntax.cjs
npm run verify:sdk               # intended development deployment only; real codegen + TS + SDK tests
```

The last command has NOT passed in this build environment. The SDK tests use the
official `convex-test` simulation; even after those pass, test concurrent writes,
resource limits and deployment behavior on a real development backend. The new
source has not been run against an existing v0.2.0 database; review legacy records
and the migration notes before enabling it on one.

Platform references: https://docs.convex.dev/components/authoring and
https://docs.convex.dev/testing/convex-test. Evidence and limitations are in
`docs/VERIFICATION.md`. Historical v0.2.0 reports are retained under `docs/history/`.
