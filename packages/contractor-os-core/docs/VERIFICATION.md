# v0.5.0 verification

The v0.5.0 upgrade preserves the v0.4.0 data schema/business semantics and hardens the
Convex Component boundary.

## Verified locally

- 405/405 domain/core tests pass.
- Deterministic generated-model drift check passes.
- Component-boundary static contract check passes across 39 component TypeScript files.
- Syntax scan covers 69 TypeScript files with zero syntax errors.
- The package can be assembled by `npm pack --dry-run`; the dry-run contains 85 files.
- Existing jq differential coverage remains 31 cases across all 16 translated formulas.

## Deliberately not claimed

- `_generated` component/app SDK files are absent in this source checkout.
- `npm run check:packaged-component` correctly fails until real component codegen has run.
- Full SDK semantic typecheck is blocked by missing installed SDK/test dependencies and
  missing generated files.
- The v0.5 `npm install` attempt timed out in this sandbox, so `convex codegen`, the 25
  authored `convex-test` integration tests, and a real Convex deployment were not run.
- No production deployment, live migration, dependency security audit, or publication occurred.

The static checker warning about missing `_generated` files is expected for local source
before codegen. It becomes an error under `npm run check:packaged-component`, preventing
a source-only package from being mislabeled as a ready-to-publish Convex Component.

See `evidence/v050/` and `docs/backend/COMPONENT_ARCHITECTURE_v050.md`.
