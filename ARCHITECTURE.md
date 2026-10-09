# Painter OS repository map

The [compatibility freeze](docs/contracts/issue-2-freeze.md) defines authority and cutover holds. This map navigates existing code; it does not replace that contract. The [four application model](docs/architecture/FOUR_APP_MODEL.md) records the owner's intended product/company marketing and admin boundaries, the current two-app source gap, and staged realization holds.

| Area | Owns | Inspect first |
| --- | --- | --- |
| apps/web | Authenticated operator UI, customer/invitation routes, explicit local/cloud adapters | [app instructions](apps/web/AGENTS.md), [runtime adapter](apps/web/src/lib/convex-runtime.ts) |
| apps/marketing | Separate public app, published content only | [split contract](docs/architecture/MARKETING_ADMIN_SPLIT.md), [public projection](packages/backend/published-articles.mjs) |
| packages/domain | Typed commands, money/lifecycle engine, synthetic seed | [contracts](packages/domain/src/contracts.ts), [engine](packages/domain/src/engine.ts) |
| packages/backend | Convex host, trusted memberships, official auth/provider mounts | [mounts](packages/backend/convex/convex.config.ts), [schema](packages/backend/convex/schema.ts) |
| packages/contractor-os-core | Preserved component authority and signed-evidence workflows | [component architecture](packages/contractor-os-core/docs/backend/COMPONENT_ARCHITECTURE_v050.md) |
| packages/ui | Shared Base UI/shadcn primitives | [package exports](packages/ui/package.json) |
| scripts / tests | Local acceptance, developer checks and reproducible evidence | [agent setup](docs/development/AGENT_SETUP.md) |

Literal source dependency checks enforce no application imports from shared packages, no backend/UI dependencies from the domain, no UI dependency from the backend, and no business/backend dependency from UI primitives. Marketing may import the typed published-articles boundary, not the admin app or private backend modules. Existing marketing projection tests remain necessary: an import rule does not prove authorization.

Cloud Better Auth and resolved memberships establish identity. Local SQLite is synthetic acceptance only. Each component retains its current writer. No mirror, store cutover or new deposit gate is introduced by developer tooling. Existing business behavior and URLs remain governed by the freeze.
