# Product composition IR v1

`model/product.composition.json` is the single product declaration: foundation,
runtime components, host bindings, config packs, shadcn items, UI/backend operation
bindings, and design tokens. The compact example selects the shared core and all
nine optional trades. It contains no customer records, credentials, or live IDs.

## Validate and inspect

Run from this package directory with Python 3.10+; no extra Python dependencies:

```sh
python3 tools/validate_composition.py
python3 tools/validate_composition.py --plan
python3 -m unittest discover -s tests -p 'test_composition.py' -v
```

The first command exits 0 for a valid declaration and 1 with a diagnostic for an
invalid one. A different composition file may be supplied as a positional argument.
`--registry PATH` accepts a catalogue only if it passes this v1 source contract.
`--plan` prints deterministic JSON, with core before trades and explicit imports,
mounts, environment values and client-constructor argument order. Neither command
runs a scaffold, installs packages, writes generated code, provisions accounts,
changes a deployment, or invokes external tools. This is a bounded composition
contract and validator, not a factory/orchestrator or a running product.

## What each section means

- `product`: product identifier, display name and product version; independent of
  the exact release versions pinned for selected components
- `foundation`: the pinned `create-better-t-stack@3.44.2` `create-json` input.
  This profile is Next.js (`next`) + Convex with npm, no selected auth provider,
  no payments/addons/deployment, no install or git, directory conflicts rejected,
  analytics disabled, and `dryRun: true`. `projectName` must equal `product.id`.
  `auth: none` means authentication is still a host integration requirement;
  it never enables anonymous access to Contractor OS
- `host.membership`: the required authenticated host resolver. It must derive
  tenant, actor and permissions server-side, as shown in
  `examples/convex/backend.ts` and `examples/convex/trades.ts`. This symbolic
  declaration does not supply an auth provider, create memberships or prove a
  resolver implementation exists
- `components`: one core plus any subset of the nine real trade components.
  `ref` is a composition-local identifier; `component` selects the registry entry;
  `mount` names the Convex instance. Core accepts exactly `config.env.MODE`
  (`development`, `test`, or `production`); trades currently accept `{}` only.
  MODE is metadata, never authorization or a business-policy switch
- `dependsOn` and `bindings`: every trade names the selected core ref in both its
  dependency and `core` binding, and every client uses `host.membership`.
  Client construction is core `(component, membership)` or trade
  `(tradeComponent, coreComponent, membership)`. Bind to the intended core on the
  trusted server, never from browser-provided component names, tenant IDs or IDs
  from another Convex instance. See the existing host examples for real calls
- `configPacks`: source-backed interpretation/configuration contracts bundled with
  this release, not independent Convex components or editable runtime toggles.
  Every declared target must be present, applicable and covered exactly once
- `ui`: named official shadcn registry items and proposed views bound to real
  server-client operations. `contractorOverview` and `paintingEditor` name planned
  views, not generated screens. `componentRef` and every operation are validated;
  the host must still expose authenticated wrappers and argument/return validators
- `tokens`: declarative light/dark hex colors, typography in px, a base spacing
  unit and increasing multiplier scale, radii in px, motion duration/easing with
  system reduced-motion support, and the default theme. No CSS or UI is generated

### Existing runtime components

The registry contains `core` at `src/component` and `painting`, `plumbing`,
`roofing`, `garage_door`, `electrical`, `hvac`, `concrete`, `landscaping`, and
`drywall_framing` at `src/trades/{trade}/component`. They share this package release
version; they are independently mountable Convex components, not independently
published npm packages. The validator checks the component definitions, package
exports, client classes and selected client operations against files on disk.

To select painting only, retain core and painting, retain the five core config
packs, and set the trade-partition target to painting. Remove UI bindings to
unselected trades. A core-only product omits the trade-partition pack and all
trade UI bindings. Ref/mount names may be changed if every referring field is
updated. Multiple instances of one component are deliberately outside this v1
contract. Trades are dependencies of the host composition; the core does not
automatically discover, query, project or merge their isolated records.

### Existing config packs and explicit modes

| Pack | Mode | Meaning |
|---|---|---|
| schema | source_aligned | Existing supplied blueprint/supplement definitions |
| workflows | builtin_commands | Existing implemented workflow commands |
| business_policy | contractor_operations_v1 | Existing explicit operational policy |
| projections | component_explicit_paths_v1 | Existing bounded projection path policy |
| scorecards | advisory_supplied_predicates | Existing advisory rules, including missing-definition results |
| trade_partition | explicit_trade_fields_v1 | Existing `trades.ir.json` field partition for selected trades |

Pack versions pin the containing package release, not the historical source schema
version. Modes acknowledge the existing implementation; changing the JSON cannot
disable guards, alter calculation semantics or install new capabilities. A new
mode requires implementation, registry/validator changes and tests. This v1 does
not invent pricing values, missing scorecard predicates, dispatch modules, provider
integrations, automation executors or separate runtime components for config data.

### Foundation and shadcn provenance

The scaffold profile was checked on 2026-10-02 against immutable official
[CLI 3.44.2 metadata](https://registry.npmjs.org/create-better-t-stack/3.44.2),
[types 3.44.2](https://registry.npmjs.org/@better-t-stack%2Ftypes/3.44.2),
[JSON workflow docs](https://www.better-t-stack.dev/docs/cli/agent-workflows), and
[Convex compatibility rules](https://www.better-t-stack.dev/docs/cli/compatibility).
The CLI requires Node >=22.12.0. The plan contains a process argument array,
never unescaped shell text, and `execute: false`; its scaffold input also retains
`dryRun: true`. The pinned CLI was source-inspected, not executed for this work.
Its package pin does not lock all transitive dependencies.

The pinned Better-T-Stack
[template package](https://registry.npmjs.org/@better-t-stack%2Ftemplate-generator/3.44.2)
uses shadcn `base-lyra`, Base UI, shared `packages/ui`, component files at
`packages/ui/src/components`, and tokens at `packages/ui/src/styles/globals.css`.
This IR retains those conventions. These official registry JSON endpoints were
verified to identify `registry:ui` items:
[button](https://ui.shadcn.com/r/styles/base-lyra/button.json),
[card](https://ui.shadcn.com/r/styles/base-lyra/card.json),
[input](https://ui.shadcn.com/r/styles/base-lyra/input.json), and
[table](https://ui.shadcn.com/r/styles/base-lyra/table.json).
Button, card and input already ship in that foundation; a future implementation
should add only missing items. These URLs are live mutable content: this declaration
is not a content-hash lock or a claim that registry code was installed/tested.
Other items/styles require an explicit reviewed v1 contract extension.

## Boundaries and verification

Unknown keys, components, versions, modes, config values, registry items, backend
operations and refs fail closed. Missing/duplicate bindings, dependencies, mount
names and config coverage fail. Registry source files must stay inside this package.
Malformed token values, duplicate JSON keys and nonfinite JSON constants fail.
Ordering does not change the emitted plan.

The tests exercise all-trade, single-trade and core-only compositions; renamed
bindings; deterministic output; unavailable source/exports; invalid selections,
config, UI and tokens; and CLI error behavior. This validator does not prove a
Convex deployment, generated SDK types, a frontend implementation, auth integration,
token contrast/accessibility, or a migration of legacy core `co_trade_spec` data.
Those require their own implementation and verification evidence.
