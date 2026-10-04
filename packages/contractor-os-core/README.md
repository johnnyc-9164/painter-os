# v0.6.0: optional isolated trade components

Start with the [single product composition IR](model/product.composition.json) and [composition contract](docs/PRODUCT_COMPOSITION_IR.md). See [trade add-on architecture, installation and migration](docs/TRADE_COMPONENTS.md) and [fresh verification](docs/VERIFICATION_V060.md). The sections below describe the preserved shared-core baseline; old v0.5 verification statements are historical.

# Contractor OS — Convex Component backend v0.5.0

An upgrade of the existing backend: transactional contractor workflows plus a
source-aligned, tenant-authorized derived-data read API. No frontend and no
external sending, signing, charging, or provider integration.

**Verification:** 405 domain/core checks pass, including 31 comparisons to the actual jq CLI; the v0.5 component-boundary contract checker also passes. Full SDK typing, code generation, official convex-test execution and a real
Convex deployment remain unverified. The v0.5 dependency install attempt timed out in
this sandbox before codegen; v0.4 had previously hit registry EAI_AGAIN. This is runnable source for a development
integration, not a claim of a running or production-approved service.

## Included

| Area | v0.5.0 |
|---|---|
| Contractor domain | 20 tables, 244 typed business properties, 64 enum fields |
| Trade specifications | All 52 supplied fields, including nine trades |
| Relations | 45: 43 single-ID, two ID-array; all source relations optional |
| Source calculations | All 16 supplied contractor JQ formulas translated |
| Mirrors | 68 declared paths with tenant-safe lookups |
| Aggregates | 19 bounded projections with explicit path policy |
| Scorecards | 18 declarations; 22 prior-export predicates across eight cards; ten unconfigured |
| Business commands | All 14 prior workflow commands, union command endpoint and guards retained |
| Record API | 80 create/get/list/update methods with existing workflow-bypass protections |
| Derived API | `inspectRecord`, with argument and return validators |
| Migration | Read-only relation-shape preflight; no silent target selection |

The 12 agent/platform blueprints are listed separately in the model. They are NOT
installed as business tables, user authorization, credential storage, or an agent
execution service. Private source records are not included.

## v0.5.0 component-boundary upgrade

This release keeps the v0.4.0 contractor schema and business semantics, but hardens the project as an authored Convex Component. It adds typed optional component runtime metadata (`MODE`), `meta.info`, host metadata wrappers, explicit local-vs-packaged codegen rules, and a static component-contract check. See `docs/backend/COMPONENT_ARCHITECTURE_v050.md`.

The package deliberately does **not** add component HTTP routes or host callback handles yet. Authenticated HTTP surfaces and provider side effects remain in the host app until a concrete integration contract requires otherwise.

## Install into an existing application

Copy this entire `contractor-os-core` folder to
`YOUR_APP/components/contractor-os-core/`. Keep its `src/shared` and `model` folders.
Do not replace your existing app schema, auth provider, or component registrations.

In YOUR_APP:

```sh
npm install convex@^1.46.0 convex-helpers@^0.1.124
```

v0.5 targets Convex 1.46.x with `convex-helpers` 0.1.124; the peer range still accepts
Convex >=1.43 <2. Installation and dependency security audit could not be completed
in this sandbox, so validate the lockfile in your development environment.

Register alongside existing components in `YOUR_APP/convex/convex.config.ts`:

```ts
import { defineApp } from 'convex/server';
import contractorOs from '../components/contractor-os-core/src/component/convex.config';
const app = defineApp();
app.use(contractorOs, { env: { MODE: 'development' } });
export default app;
```

Use `examples/convex/backend.ts` as your host wrapper. When copying it into
`YOUR_APP/convex/backend.ts`, change its `../../src/` imports to
`../components/contractor-os-core/src/`. Merge the supplied membership-table
example only when appropriate for your existing identity system. Memberships
are server-managed; no public tenant/actor/permission arguments are accepted.
The new read method requires the same verified read permission as other reads.

Generate real component files on the intended DEVELOPMENT deployment:

```sh
npx convex dev --typecheck-components
```

No `_generated` files or substitute SDK typings are fabricated in this package.
The command above must complete before the component can be used in a host app.

## Read calculations, mirrors, aggregates and rule results

With the host example mounted as `convex/backend.ts`:

```ts
const snapshot = await client.query(api.backend.inspectRecord, {
  blueprint: 'co_job',
  identifier: 'job-001', // external/source identifier, not a local Convex ID
  asOf: Date.parse('2026-09-22T00:00:00Z'),
});

// snapshot.calculations.outstanding_balance: contract amount minus collected
// snapshot.mirrors.client_name: follows job.client in this tenant
// snapshot.aggregates.total_invoiced: explicit incoming co_invoice.job path
// snapshot.scorecards: advisory results from supplied predicates only
```

Omit `asOf` to use server execution time. Refresh the argument for time-only
updates; time passage alone does not make this a scheduled compliance monitor.
Every result records `evaluatedAt`. Missing/foreign targets are not exposed as
successful mirrors. Invalid formula inputs return a diagnostic, not a silent zero.

The server service is also available directly:

```ts
await backend.inspectRecord(ctx, 'co_trade_spec', 'spec-001', Date.now());
```

`ContractorBackend` obtains tenant and actor from the host membership resolver.
Callers cannot choose a tenant by adding arbitrary fields to these arguments.

## Source semantics and deliberate distinctions

The supplied schema is a detailed Markdown transcription, not raw Port API JSON.
Required contractor property flags, array element schemas and ten scorecards'
predicates are still absent. Missing rule sets report `definition_missing`, not a
passing grade. Untested levels are not assigned a Port tier.

All 16 formula strings are preserved in the model; production code executes only
whitelisted TypeScript translations, never arbitrary JQ/JavaScript strings.
`effective_rate` preserves the source's markup arithmetic despite its margin name.
Painting/roofing measurement formulas preserve the square-foot assumption and warn
on other units. Source formulas do not create prices, invoices or material orders.

Unfiltered source aggregates include all statuses: no hidden removal of draft or
voided invoices, or pending outreach. The source job balance is **contract minus
collected**. `jobFinancials.billedReceivable` is **billed minus collected**, while
`remainingContractBalance` is **contract minus collected**. The old
`outstandingBalance` API alias still means billed receivable for compatibility.

The 19 aggregates use `component_explicit_paths_v1`, not Port's default all-path
traversal. Each result exposes its selected path. These read snapshots cap work
at 50 related records per path and 64 document reads overall; capped or unresolved
results return `status: "incomplete", value: null`, never a partial definitive sum.
Large datasets need a separate pagination/materialization implementation.

`docs/SOURCE_GAPS.md` lists every known fidelity boundary, including exact JQ UTC
whole-second date parsing and the difference between rule titles and predicates.

## Existing transactional workflows

Lead creation, site-visit scheduling, lead advancement, scope/proposal creation,
attested bid submission/award, contract-signing attestation, job/invoice creation,
payment recording, lifecycle transitions, subcontractor assignment and daily
reports are retained. Each business command runs within one mutation with revision
preconditions, accepted event writes, state effects and request receipts.

The inherited billing policy is USD, integer-cents arithmetic, no overpayment or
overbilling, and one operational job per contract. Generic record writes cannot
bypass signed-contract or payment controls. Human attestations are assertions with
evidence references, not independent signature/bank verification. The source
scorecards cannot grant business-command authority. Prior details remain in
`docs/history/v0.3.0/README.md` and `docs/backend/MIGRATION.md`.

## Upgrade preflight for v0.2/v0.3 data

Previously, unspecified single relations could contain arrays. The new schema
rejects those. Inspect a LOCAL export before enabling stricter validation:

```sh
npm run build:core
node tools/check_v040_migration.mjs local-table-export.json relation-report.json
```

Input format is a table-to-rows object, for example:

```json
{"co_contact":[{"identifier":"contact-001","relations":{"client":["existing-local-id"]}}]}
```

The tool proposes normalization for zero/one-distinct-target arrays, but applies
nothing. Multiple targets require an explicit choice. It never overwrites the
input or an existing report. Exit 0 means relation shapes passed, 1 means findings,
2 means invalid input/execution failure. It does not check target existence,
tenancy or full-record validity and is not a live migration command.

Back up and review the report, apply a separately reviewed migration, then validate
on a DEVELOPMENT deployment. Private Port source records are not automatically
promoted into operational records or treated as evidence of signed/paid outcomes.

## Verify the source package

Prerequisites: Node 22+, Python 3 and jq on PATH. `npm install` installs TypeScript
and the SDK/test dependencies where npm is reachable. No API key is required for
core tests or the local migration report.

```sh
npm install
npm test                  # core + explicit adapter doubles + jq comparisons
npm run check:generated   # our deterministic model generator, NOT Convex codegen
npm run check:syntax      # syntax only, not SDK semantic typing
npm run check:component   # component boundary/static package contract
npm run verify:sdk        # real development codegen + SDK typecheck + convex-test
```

The last command is not verified here. Twenty-five official SDK-harness tests are
authored, including four new projection tests; none ran. A real deployment still
needs manual smoke, isolation, concurrency, migration and resource-limit checks.
Do not treat the 405 local tests as evidence of successful deployment.

## Local source vs packaged component

For a local component checkout, `_generated` is produced by Convex codegen and is intentionally gitignored. For an NPM/bundled component, generated component API artifacts must be present in the package. Before packaging, run `npm run prepare:component`, `npm run check:packaged-component`, then `npm run pack:dry-run`. This repository remains private and is not published by this upgrade.

## Important files

`src/component/projections.ts` registers the new read. `projectionStore.ts` contains
indexed, table-specific database lookups. `projectionValidators.ts` validates
requests/results. `src/shared/calculations.ts`, `projections.ts`, `scorecards.ts`
and `migration.ts` contain the executable core. The model and both deterministic
generators preserve source provenance and identify implementation policies.

## References and persistence

https://docs.convex.dev/components/authoring
https://docs.convex.dev/testing/convex-test
https://docs.port.io/context-lake/data-model/setup-blueprint/properties/aggregation-property/

This is private, unpublished source. No live data, provider service, deployment,
Founder OS state or ontology was changed. The commit packet distinguishes local
execution evidence from production acceptance. Library event-write receipts, when
present, do not mean the code package was saved to the persistent project library.
