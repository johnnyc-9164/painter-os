# 0.6.0 changes

- Added nine isolated trade-spec component schemas, typed validators, CRUD functions,
  request receipts and immutable events, with a single deterministic template source
- Added per-trade host clients, optional installation exports and SDK test registration
- Added explicit source-preserving trade applicability IR; shared fields and ambiguous
  allocation are recorded rather than silently promoted to source facts
- Preserved the common core and legacy APIs, with migration/cutover notes and no dual writes
- Added new trade and composition verification; generated all ComponentApi types using
  the real Convex CLI against a disposable local backend
- Added component-local TypeScript project configs so CLI `--typecheck enable` is a
  real gate, and broadened the package checker to every component
- Fixed one pre-existing TypeScript inference issue in shared business.ts by giving
  contactRelations its existing RelationInput return contract (no behavior change)
- Updated syntax checker to omit declaration-only .d.ts files after genuine codegen;
  they are still covered by semantic type checking
- Updated package/runtime/lockfile version to 0.6.0; shared core schema stays 0.4.0

See PRODUCT_COMPOSITION_IR.md for the product declaration extension and
VERIFICATION_V060.md for exact results, failed setup attempts and limitations.
