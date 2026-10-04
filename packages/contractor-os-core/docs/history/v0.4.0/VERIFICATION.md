# v0.4.0 verification

405 local tests pass (zero failures). They include real core logic, explicit
in-memory adapter/function doubles, 31 differential executions against the actual
jq CLI, all 68 supplied mirror paths, all 19 selected aggregation paths, migration
preflight, tenant isolation, command and financial regression tests.

Strict dependency-free TypeScript and the deterministic source-generator drift
check pass. Syntax transpilation is not SDK semantic typechecking.

The real SDK path was blocked in the v0.4 build environment. See the preserved v0.4
verification JSON and evidence/v040 for the original evidence.
