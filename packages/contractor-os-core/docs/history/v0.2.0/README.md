# Contractor OS for Convex — 0.2.0 source candidate

20 source-grounded contractor entity tables, 199 explicitly typed properties,
45 named relations, and tenant-authorized record APIs. Includes the prior
lossless Port import/catalog layer. No UI, outbound messaging, signature,
pricing engine, payment processing, live deployment, or production-readiness claim.

## What this version changes

The supplied blueprint summary names 20 contractor blueprints, not the 18 stated
in its summary table. Its complete heading count is 32: 20 contractor, 5 agent,
and 7 platform. Only the contractor model is implemented here.

Six types have been added: `co_contact`, `co_bid`, `co_subcontractor`,
`co_trade_spec`, `co_pricing_rule`, and `co_daily_report`.

Every domain type has `create`, `get`, `list`, and `update` component functions,
exposed to the parent application under `components.contractorOs.records.co_*`.
These are record-maintenance APIs, not implementations of the named business
workflows. Data entry does not prove that a contract was signed or an invoice paid.

## Contents

- `src/component/records/`: 20 modules, 80 record endpoints.
- `src/component/domainValidators.ts`: validators for each supplied property and relation.
- `src/component/domainTables.ts`: 20 typed domain tables, source identifiers, revision metadata and indexes.
- `src/component/schema.ts`: 26 tables total: 20 domain, 2 domain-audit/receipt, and 4 existing import/catalog tables.
- `src/domainClient.ts`: `TypedContractorOS`, a server-side, authenticated membership wrapper.
- `src/client.ts`: the original `ContractorOS` lossless-catalog client.
- `src/shared/domain.ts`: property, enum, format, relation and conversion validation.
- `model/blueprints.summary.json`: source-derived model with explicit unknowns and provenance.
- `tests/`: offline tests and a separate SDK-backed suite requiring real codegen.
- `tools/generate_domain.py`: deterministic generator; `--check` is read-only.
- `tools/review_typed_import.mjs`: local conversion review, never remote import.
- `COMMIT_PACKET.json`: proposed Founder OS events; no claim of Library persistence.

## Install as a local component in an existing Convex app

This is the preferred route until real SDK/codegen verification is complete.
Copy this entire folder to `YOUR_APP/components/contractor-os-core/`. Keep its
`src/shared` directory; the component imports those validators.

In YOUR_APP, install the runtime dependencies:

```sh
npm install convex@^1.43.0 convex-helpers@^0.1.124
```

Merge this registration into YOUR_APP's `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import contractorOs from "../components/contractor-os-core/src/component/convex.config";

const app = defineApp();
app.use(contractorOs);
export default app;
```

Preserve existing component registrations. Run YOUR_APP's ordinary development
workflow on a development deployment, with component typechecking enabled:

```sh
npx convex dev --typecheck-components
```

Convex must generate the component's `_generated` files. They are deliberately
not fabricated or replaced with handwritten type shims in this package.

## Parent-authenticated API

Authentication and tenant selection happen in the host, not inside the component.
Never expose component operations through wrappers accepting arbitrary tenantId,
actorId or roles from a browser. See `examples/convex/typedRecords.ts` for a
complete example tied to a server-side membership table. Merge with your existing
auth provider rather than introducing a second authentication system.

After constructing `TypedContractorOS` with that membership resolver:

```ts
const created = await os.co_client.create(ctx, {
  identifier: "client-demo-001",
  requestKey: "create-client-demo-001",
  title: "Synthetic Demo Client",
  properties: { client_type: "commercial", status: "prospect" },
});

await os.co_client.update(ctx, {
  identifier: "client-demo-001",
  requestKey: "update-client-demo-001-v1",
  expectedRevision: created.revision,
  properties: { city: "Example City" },
});
```

The example records are synthetic. Membership changes are administrator actions;
this package neither provisions users nor grants anyone permissions automatically.
`read`, `write` and `import` are separate permissions. Import rights do not grant
record-write rights. Use a fresh requestKey for a new command, reuse the original
key only for an identical retry, and refresh after a revision conflict.

## Safety controls implemented

Every lookup and write is scoped to a server-selected tenant. Linked IDs must
exist in the declared component-owned target table and belong to that tenant.
Missing and foreign-tenant targets return the same failure. The same external
identifier may exist independently in different tenants or tables.

Creates reject duplicate external identities. Updates require expectedRevision.
Successful commands append a domain event before materializing the record and
store a repeat-safe request receipt in the same mutation. No public event-edit
or hard-delete operation is exposed. Offline tests exercise the control logic;
only the actual Convex runtime can establish its transaction/concurrency behavior.

Updates merge supplied fields. `unsetProperties` and `unsetRelations` explicitly
remove optional fields; setting and unsetting the same key is rejected. No status
transition graph or approval policy is guessed from enum membership. Host business
workflows must add the required approvals and evidence before reporting outcomes.

## Deliberate unknowns — not hidden defaults

All business properties are optional because required-field lists were not
supplied. This permits incomplete records and is a storage compatibility choice,
not a claim that an operational job needs no required fields. Write APIs reject
null properties; the converter explicitly reports historical null omissions.

Only `co_job.subcontractors` and `co_subcontractor.jobs` are explicitly many.
Other supplied relation cardinalities remain unknown: their storage validators
accept a single local ID, an ID array, or null until the raw flags are available.
No inverse relation is automatically synchronized, and no one-to-one uniqueness
constraint or cascade deletion rule is invented.

`tags` and `certifications` have unspecified element types, so their named array
fields retain JSON elements rather than guessing string-only schemas. The 45
trade-specific field mentions (44 unique names) lack individual type/enum details
and are blocked from the typed write API. Only the explicitly described contact
`full_name` calculation is implemented. Financial formulas, gallons/coverage,
aggregates, scorecard execution, and workflow transitions remain unimplemented.
Original workflow/scorecard definitions are retained as reference data, not runtime
logic. See `docs/SOURCE_GAPS.md`.

Money remains a number in the source's stated unit; this package does not invent
cents conversion, rounding, tax treatment or margin formulas. URL validation is
restricted to HTTP(S), and date-time validation requires a timezone; these are
explicit implementation policies, not claims about undocumented Port constraints.

## Your original records

The original six records remain in the separate private upload bundle, not in the
reusable source. `ContractorOS.importBatch` preserves complete source snapshots,
including nulls, mirrors and calculated values, in the catalog only. It does not
automatically create operational rows in the 20 domain tables.

To review a raw array locally:

```sh
npm run build:core
node tools/review_typed_import.mjs private-records.json private-review.json
```

The six-record review preserved all source values. It found 27 non-null known
property values, 20 explicitly reported null omissions, and 35 deferred properties
(mainly derived/mirror snapshots). Two relation occurrences point to one contact
record absent from the supplied dataset. A blueprint definition does not create
that missing contact. Live target availability was not queried.

Do not silently discard deferred fields or unresolved relations. Import the
missing source records or review the mapping before a typed migration. Circular
relations need an explicitly reviewed multi-pass migration; no synthetic target
records or automatic approvals are created by this package.

## Verification

```sh
npm test                 # strict dependency-free model compilation + offline tests
python3 tools/generate_domain.py --check
npm run typecheck        # requires real Convex SDK + generated code
npm run test:integration # 8 authored SDK-harness tests; requires dependencies/codegen
```

Current results: 155 offline checks passed (101 pure-core checks, 54 explicit
adapter/client test-double checks), generated files match their manifest, and
43 TypeScript files passed syntax transpilation. Real SDK typechecking and
integration tests are BLOCKED: dependency download failed with EAI_AGAIN, generated
Convex files are absent, and Vitest is not installed. No cloud runtime was started.
See `docs/VERIFICATION.md` and `evidence/` for the exact distinction.

## Source and platform references

Source: user-supplied `Pasted text(3).txt`, contractor section, and the preceding
entity/workflow export. The source's unknowns remain in the machine-readable manifest.

Platform implementation reference:
https://docs.convex.dev/components/authoring
https://docs.convex.dev/testing/convex-test
https://github.com/get-convex/templates/tree/main/template-component

The package is private and unpublished. It is not yet approved for production or
portfolio-wide reuse. Existing uploaded files and live systems were not modified.
