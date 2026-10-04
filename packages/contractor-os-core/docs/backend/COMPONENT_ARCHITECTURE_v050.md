# Contractor OS Component Architecture — v0.5.0

## Purpose

v0.5.0 hardens the existing contractor backend as a **Convex Component boundary** without changing the sourced contractor business semantics introduced through v0.4.0. The component owns its tables and domain mutations; the host application owns authentication, user/tenant selection, public API exposure, HTTP routes, secrets that belong to the app, and external side effects.

## Boundary contract

```text
client / React / Expo
        |
        v
host Convex app
  - ctx.auth
  - membership / tenant resolution
  - rate limiting / public API
  - external integrations
        |
        v
Contractor OS component
  - isolated tables
  - typed record API
  - transactional domain commands
  - invariants + optimistic revisions
  - immutable events
  - projections / scorecards
```

### Authentication

Component functions do not use `ctx.auth`. Host-side clients resolve the verified identity and membership, derive `tenantId` / `actorId`, and pass only trusted scope into component functions. A browser-supplied tenant, actor, role, or attestation flag is never authoritative.

### IDs

Inside the component, local relations use component `Id<"table">` values and validators. Across the Component API boundary Convex exposes those IDs as opaque strings. Host code must not attempt to validate a component ID with a host `v.id()` for a same-named table.

### Environment variables

The component declares one optional typed variable, `MODE = development | test | production`. It is diagnostic metadata only and is not used for authorization or business decisions. Component functions read it through generated `env` inside handlers.

### HTTP routes

There is intentionally no component `http.ts` in v0.5.0. Contractor OS currently needs authenticated application access, and component HTTP actions do not receive host `ctx.auth`. Authenticated webhooks or HTTP integrations should be mounted in the host app and call the component through the host clients.

### Function handles / callbacks

No host callback handle is persisted in v0.5.0. External email, SMS, payment, AI, Slack, and webhook side effects remain host-owned. Add a function-handle callback only when an explicit integration contract exists; do not make domain mutations depend on an invented provider callback.

### Pagination

Component list/history queries use `convex-helpers` `paginator`, not Convex's built-in reactive `.paginate()` directly. Host React surfaces that expose these lists should use the compatible helpers approach.

## New runtime metadata API

`meta.info` returns:

- component/package version
- schema compatibility version
- optional runtime mode
- auth and ID boundary declarations
- pagination implementation
- explicitly unconfigured HTTP/callback capabilities
- stable capability names

The host wrappers expose this as `ContractorOS.info()` and `ContractorBackend.componentInfo()`. This is intended for deployment diagnostics and compatibility checks, not feature authorization.

## Packaging modes

### Local component checkout

The normal development path is source + component-local codegen. `_generated` is deliberately ignored in git. Run:

```sh
npm install
npm run codegen
npm run typecheck
```

### Packaged/NPM component

A published/bundled component must include the generated component API artifacts and expose the component config, `ComponentApi`, client code, and test helper entry points. Before packaging:

```sh
npm run prepare:component
npm run check:packaged-component
npm run pack:dry-run
```

This repository remains `private: true`; v0.5.0 prepares and verifies the contract but does not publish it.

## Deliberate non-changes

- No new state machine was inferred from enum values.
- No new money policy or commercial workflow was invented.
- No HTTP route was added without a concrete contract.
- No integration callback or provider side effect was introduced.
- v0.4.0 data schema remains compatible; v0.5.0 is primarily a component/package boundary upgrade.
