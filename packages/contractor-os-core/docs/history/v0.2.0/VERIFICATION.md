# Verification — 0.2.0

| Check | Result | Evidence / limit |
|---|---|---|
| Dependency-free core TypeScript | PASS | npm test invokes tsc -p tsconfig.core.json with strict settings |
| Offline test suite | PASS: 155 | 101 pure-core checks and 54 explicitly mocked adapter/client checks |
| New core tests initially failed | CONFIRMED | evidence/v020-red.log: 52 passed, 22 failed |
| New record API tests initially failed | CONFIRMED | evidence/v020-domain-adapter-red.log: 74 passed, 34 failed |
| Deferred-key preservation regression | FIXED AND VERIFIED | evidence/v020-security-red.log then v020-tests.log |
| Source generator drift | PASS | python3 tools/generate_domain.py --check |
| TS syntax transpilation | PASS: 43 files | Syntax only, not SDK-backed semantic typechecking |
| Source record conversion | PASS: 6/6 source snapshots preserved | 27 known values, 20 reported null omissions, 35 deferred values |
| Relation completeness in supplied batch | INCOMPLETE | 2 occurrences referencing 1 absent contact; live state not queried |
| SDK-backed TypeScript | BLOCKED | convex/convex-helpers and genuine generated files absent |
| SDK convex-test suite | 8 AUTHORED; 0 EXECUTED | Vitest absent; evidence/v020-sdk-tests.log |
| Actual Convex runtime/codegen | NOT RUN | No local or cloud deployment created |
| Real concurrent transactions | NOT VERIFIED | Offline doubles do not emulate Convex OCC or rollback guarantees |
| Dependency vulnerability audit | NOT RUN | Dependency installation unavailable |
| Production readiness / reuse approval | NOT ESTABLISHED | Missing source rules and runtime gates remain |

Network attempt: npm view convex version failed with EAI_AGAIN resolving registry.npmjs.org.
Tests do not fabricate credentials, SDK modules, generated APIs, or deployment success.
The package contains test-only mocks transparently labeled as such; the runtime code
imports the real libraries and will require them to run.
