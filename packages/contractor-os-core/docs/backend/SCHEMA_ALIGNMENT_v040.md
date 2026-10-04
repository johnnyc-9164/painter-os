# v0.4.0 schema alignment and implementation record

## Scope
Upgrade the existing conversation-uploaded v0.3.0 Contractor OS component, not a
new app, database, or company integration. Owning scope is
`project_contractor_os_extraction`. Preserve the original source ZIP and preserve
all existing business command and authorization boundaries. No live import,
deployment, production configuration, account changes, or outbound side effects.

## Source authority
The latest user message supplies a more detailed 32-blueprint Markdown
transcription. Twenty are contractor blueprints. Twelve describe Port agent,
platform, and identity facilities; these are not automatically adopted as host
authentication, credential storage, or an agent runtime.

The source directly supplies contractor trade fields, 45 relation cardinalities,
68 mirror paths, 16 JQ formulas, 19 aggregation definitions and 18 scorecard names.
The older export supplies executable predicates for eight of those scorecards
(22 rules). Predicate results here identify that older source snapshot. They are
advisory and never approval/authorization signals.

The source does not show contractor required-property arrays, three array item
schemas, all enum-color maps, or ten scorecards' predicates. Several _team
formulas are prose and refer to properties absent from its shown property table.
It is not represented as a byte-for-byte Port API JSON export.

## Implementation decisions (not recovered Port rules)
- Continue optional contractor-property storage and explicit command prerequisites.
- Enforce `many=false` as one component-local ID or null; omitted remains optional.
  Two `many=true` relations use ID arrays. No target is guessed during migration.
- Translate only the 16 whitelisted formulas; source strings are never executed.
- Use an explicit `asOf` epoch for reproducible reads. The query default is its
  server execution time. Time passage alone is not a subscription invalidation;
  callers must request a fresh `asOf` to refresh deadline/expiry-only changes.
- Follow declared single-relation mirror paths, checking tenant and target identity.
- Apply source aggregate functions and filters over explicit component paths.
  These paths are an implementation policy and are NOT Port's default traversal
  of all possible paths. Preserve all source statuses when a filter is absent.
- Bound a snapshot to 50 related records per path and 64 document reads overall.
  Report `incomplete` and null instead of a partial total. Large-portfolio
  aggregation requires a separate paginated/materialized design.
- Do not invent a Port tier for levels without predicates; mark them `untested`.
- Keep USD/cents business mutation policy unchanged. Source display calculations
  do not alter financial state, contract signatures, compliance authority, or orders.

## Execution and tests
1. Re-run v0.3.0: 189 checks passed.
2. Add failing relation/trade tests, then tighten schema/generator/validators.
3. Add failing formula tests, implement translations, compare 31 cases to actual jq.
4. Add failing scorecard and projection tests; implement pure read functions.
5. Add failing adapter/auth tests; wire typed component queries and host service.
6. Test all 68 mirror paths and all 19 explicit aggregate paths.
7. Add failing migration preflight and balance-label tests; implement both.
8. Run complete local suite, strict core TypeScript, syntax and drift checks.
9. Attempt dependency install and SDK checks; report environmental failures explicitly.

## New/changed interfaces
- `evaluateCalculation(blueprint, name, properties, nowMs)` returns value/status/issue.
- `projectRecord(record, reader, nowMs)` builds a bounded, tenant-scoped read snapshot.
- `evaluateScorecards(blueprint, properties)` evaluates known predicates only.
- `ContractorBackend.inspectRecord(ctx, blueprint, identifier, asOf?)` resolves
  membership before calling component `projections.get`.
- `api.backend.inspectRecord` is the supplied parent-app wrapper.
- `auditLegacyRelations(tableToRows)` returns a read-only shape report and proposals.
- `jobFinancials` now adds `billedReceivable` and `remainingContractBalance` while
  preserving the existing `outstandingBalance` alias for billed receivables.

## Review boundaries
SDK semantic typing, real code generation, actual backend execution, transactions,
concurrency, resource limits, dependency integrity/audit and production behavior
remain unverified. Local database doubles and syntax transpilation cannot prove
any of those. See current `docs/verification.json` for observed results.
