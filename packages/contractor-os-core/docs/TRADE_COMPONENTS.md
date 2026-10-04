# Contractor trade add-ons — 0.6.0

## What is implemented

The existing `contractorOs` component remains the shared core for clients, contacts,
leads, scopes, pricing, proposals, contracts, jobs, invoices, payments and workflows.
Nine optional, independently mounted components own trade specifications:
painting, plumbing, roofing, garage_door, electrical, hvac, concrete, landscaping,
and drywall_framing. Each owns its own specs, requests and append-only events.
They do not duplicate the shared billing, CRM, authorization or workflow engines.

`model/trades.ir.json` is the explicit partition of the supplied 52 trade fields.
`tools/generate_domain.py` also invokes `tools/generate_trades.py`; `--check` validates
source-definition fidelity and deterministic output. This is a contractor-specific
compiler, not the generic raw-Port-export compiler described in the supplied skill.
The input is a summary plus prior transcription; no raw Port export was supplied.

Every source property stays optional. Fixed component identity narrows optional
`trade` to one literal; omitted trade is derived for calculations. Shared fields
include measurement, permit and materials fields. `fixture_count` belongs to
plumbing and electrical. `ceiling_height_ft` belongs to drywall and painting
(the latter preserves existing implementation behavior). `surface_condition` is
allocated to painting based on existing compatibility tests; its source applicability
is unspecified. These allocation decisions are labeled in the IR. No mandatory
field, positive quantity constraint, unit conversion or new business workflow is inferred.

## Installation and usage

Install the shared core and only the add-ons needed by the product:

```ts
import { defineApp } from 'convex/server';
import core from '@johnny/contractor-os-core/convex.config';
import painting from '@johnny/contractor-os-core/trades/painting/convex.config';
const app = defineApp();
app.use(core);
app.use(painting);
export default app;
```

Each add-on exposes `convex.config`, `client`, `validators`, and `test` package paths.
For example `PaintingClient(components.contractorPainting, components.contractorOs,
membershipResolver)` binds two trusted server-selected component instances.
`examples/convex/trades.ts` is a host-authenticated painting endpoint example.
The full example installs all nine solely for verification; products can select fewer.

The host resolves identity and verified membership. Browsers cannot choose tenants,
actors or roles. Do not directly remount raw component functions or accept untrusted
mount selection. The host client checks every supplied core reference against the
bound core instance and tenant before writes. A raw component call is a trusted-server
interface: string validation alone does not establish reference existence.

`coreReferences.scope` and `.pricing_rule` are stable external identifiers, not
Convex IDs. They belong to the single core instance bound in the client. There is no
cross-component `v.id` assumption. Returned component IDs remain opaque strings;
identical encodings in different mounts do not imply the same record.

Create/update use tenant-scoped idempotency keys, revision preconditions, bounded
component-safe pagination and transactional events. Update property changes are
patches; `unsetProperties` removes allowed fields. Supplying `coreReferences` replaces
the entire reference object, while omission preserves it. Do not send `{}` unless
clearing all references is intended. No external side effects are triggered.

`calculations()` derives the mounted trade and evaluates the existing source formulas.
Non-square-foot painting/roofing inputs retain `SOURCE_FORMULA_ASSUMES_SQUARE_FEET`.
Missing scorecard predicates remain unresolved in the shared source model. No new
trade scorecard rule or independent workflow is invented. Core legacy mirrors do
not automatically traverse these new components; host composition must resolve
external references explicitly. This release adds storage isolation and a client
contract, not automatic cross-component projection parity.

## Compatibility and migration

This is additive at the shared core schema: the original `co_trade_spec` table,
CRUD and local relations remain available only as a legacy compatibility surface.
They are not dual-written or automatically synchronized. New applications should
use the trade clients; existing applications must choose a controlled cutover.

Before a migration (none is run by this package):

1. Export and back up legacy specs, events and dependent relations.
2. Assign each record using an explicit valid `properties.trade`. Missing/unknown
   trades require review. Reject mixed fields using `validateTrade`; quarantine them
   with the original snapshot rather than dropping fields silently.
3. Translate core-local `scope`/`pricing_rule` IDs to external identifiers from the
   same core instance and tenant. Confirm targets through the host client. Never
   copy old local IDs as if they were external identifiers.
4. Import into the selected new component with reproducible request keys. Preserve
   legacy IDs and audit history in the migration record kept by the operator.
   New component IDs, revision counters and event histories are distinct; this
   release does not forge or transplant legacy events.
5. Compare record counts and all property values. Update consumers and host links.
   Legacy `co_scope.trade_spec` is a core-local link and cannot point to new storage.
   Resolve new specs through explicit host routing until a separately planned
   cross-component link model is implemented.
6. Stop legacy writes for migrated records, switch readers once validated, and keep
   the backup for rollback. Do not delete legacy state or enforce destructive schema
   changes as part of installing 0.6.0.

Mixed/missing-trade records remain readable in the compatibility store. Rollback
switches routing back to that store only after reconciling post-cutover writes;
it is not an automatic data rollback. No database, provisioned cloud service,
published package or remote repository was changed in this work.

## Validation

`npm run verify:all` covers generated drift, core tests, SDK tests, full TypeScript,
syntax and packaged component contracts. `tools/validate_local.sh` runs genuine
Convex CLI generation for all ten components and disposable local backend smoke
checks. Supply the official local backend binary via `CONVEX_LOCAL_BINARY`.
The script binds only 127.0.0.1, disables the backend beacon, uses synthetic data,
and destroys its temporary database on exit. It never connects to production.
See `docs/VERIFICATION_V060.md` for recorded results and remaining limitations.
