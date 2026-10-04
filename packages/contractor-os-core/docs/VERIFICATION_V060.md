# Verification — 0.6.0 (2026-10-02)

## Environment and tools

- Node v24.19.0; npm 11.9.0; TypeScript 5.8.3
- Actual Convex CLI 1.46.0; convex-helpers 0.1.124; convex-test 0.0.59
- Official local backend release: precompiled-2026-09-28-5c7cb5b
- No production/shared deployment, cloud account, remote repository, published package,
  external side effect or real-data migration was used
- Local backend bound to 127.0.0.1; generated disposable credentials stayed local
  and are excluded from the artifact. Beacon disabled. CLI CI=1 with VERCEL unset
  disables Sentry via its installed official initSentry implementation

## Passed gates

| Gate | Exact command / evidence | Result |
|---|---|---|
| Original behavior baseline | `npm test`; baseline-tests.log | 405 passed before edits |
| Final core/source/IR behavior | `npm test` via `npm run verify:all` | 411 passed |
| Deterministic code generation | `npm run check:generated` (includes trade generator) | 20 core entities, nine trades, 52 trade source fields; no drift |
| Full TypeScript | `npm run typecheck` | Passed, real generated ComponentApi bindings |
| Official SDK tests | `npm run test:integration` | 41 passed across five suites |
| Syntax | `npm run check:syntax` | 168 TypeScript implementation files; no errors |
| Component/package contract | `npm run check:packaged-component` | 75 files across core + nine trade trees; generated files present |
| Package inclusion | `npm pack --dry-run --ignore-scripts --json --cache /tmp/contractor-npm-cache` | All 60 public export targets included |
| Packed consumer compile | Actual `npm pack`, extracted into fresh consumer; `tsc --noEmit -p /tmp/contractor-package-consumer/tsconfig.json` | Host importing core + painting config, client and validators through package exports passed |
| Actual Convex CLI install | `convex dev --once --typecheck enable --typecheck-components` | All ten components installed on disposable local backend |
| Actual component codegen | `convex codegen --component-dir <dir> --typecheck enable` for core and each of nine trade directories | All ten passed |
| Full host codegen after targeted generation | Same `convex dev --once ...` | Passed |
| Actual runtime smoke | `convex run --component <name> records:create/get ...` for all nine trades | Synthetic records created/read |
| Actual invalid mixed fields | Painting create containing `roof_type` | Explicit ArgumentValidationError, expected extra field |
| Actual tenant separation | Read-only inline indexed query for synthetic-b | Zero records asserted |
| Product composition | `npm run check:composition` | Validated pinned foundation, components/config/bindings, shadcn declarations and tokens; 20 tests passed |

The complete local CLI procedure is `tools/validate_local.sh`. Logs are in
`evidence/v060/final-local-cli-asserted.log`; this is a real local backend gate,
not a static check or a test double. Host-auth and reference scenarios are official
convex-test integration tests, not live production tests.

SDK scenarios include all nine field boundaries, fixed trade mismatch (pure checks),
independent same-trade mounts, tenant isolation, anonymous/viewer/spoofed-context
rejection, valid/wrong-table/foreign-tenant/wrong-instance/missing core references,
idempotency/replay/key conflicts, revisions, ambiguous patches/unsets, immutable
event counts, multi-page component-safe pagination and long verified identities.
Source calculations retain default semantics and non-square-foot warnings.

## Review and corrections

Independent review identified and the implementation fixed:
- missing calculation evaluation-time argument
- actor length mismatch against the existing shared-core authentication contract
- dropped source-formula unit warning

All three now have SDK regression tests. The reviewer found no remaining
substantive runtime/security/source-fidelity blocker. Two evidence weaknesses were
also corrected: negative CLI assertions now require the specific validator error,
and a separate host is compiled from the actual packed package.

A pre-existing shared-business TypeScript inference issue was fixed with an explicit
RelationInput return annotation; behavior is unchanged and the baseline suite remains green.

## Setup failures, honestly retained

- Initial dependency install could not write the default npm cache; a writable /tmp
  cache resolved it
- Unconfigured ordinary component codegen correctly exited because no deployment
  was selected. No generated files were fabricated
- Anonymous automatic local setup stalled in port selection and exhausted a Node
  heap. The official backend with explicit loopback binding resolved local setup
- Initial explicit CLI typecheck lacked per-component tsconfig files. These are now
  checked in/generated, and final CLI typechecking is enabled and passes
- Unexpected CLI Sentry egress was denied. No permission was assumed; the final run
  uses the supported CI-mode opt-out, with the backend beacon also disabled
- Syntax-only transpilation initially tried to emit generated .d.ts declarations;
  the syntax scanner now skips these, while semantic tsc still checks declarations
- A test initially assumed component IDs had globally distinct encodings. The SDK
  correctly permits equal encodings across independent stores; the corrected test
  asserts independent data, not accidental ID representation

Earlier evidence directories belong to older versions. The v060 logs supersede
those historical validation claims.

## Limits / not performed

- No production deployment, external authentication provider, UI/browser end-to-end
  flow, payment/messaging action, or real historical-data migration was exercised
- A fresh package consumer was compiled with core + one trade. It was not published
  to npm or deployed from a registry-installed package
- Existing legacy mirrors and local scope.trade_spec links do not automatically
  resolve new trade stores. Cross-component migration/routing is explicitly documented
- Source scorecard predicates and raw Port workflow rules remain missing; no invented
  executable rules are included
- Product composition/foundation/shadcn/design-token declarations are validated and
  planned only; this deliverable does not run a UI scaffolder or generic app factory
