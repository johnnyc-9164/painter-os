# STL-79 — company site validation receipt

**Run date:** 2026-11-02 UTC, Sprite `painter-os-dev`, isolated worktree `factory/STL-79-deploy-company-site-preview-then`; source base `8ae8405b3528e89e2fafead670666d6b964a062d`. The exact head of the associated evidence PR is recorded in GitHub after push.

| Gate | Command or source | Observed result |
| --- | --- | --- |
| Dependency install | `npm ci --ignore-scripts --no-audit --no-fund` | PASS; 875 packages installed in this worktree |
| Environment | `npm run agent:doctor` | PASS; Node `24.22.1`, npm `11.16.0`, no failures |
| Production app build | `npm run build:company-site` | PASS; Next 16 compiled, typechecked, generated 3 static routes; dynamic API/site routes present |
| Isolation and contract tests | `npm run test:company-site` | PASS, 3 tests / 0 failed |
| Production-build local HTTP acceptance | `npm run test:http:company-site` | PASS, 1 test / 0 failed, isolated local server |
| Agent checks | `npm run agent:check` | PASS, no failures |
| Existing production HTTP reachability | `curl -L --max-time 15 https://painter-os-company-site.vercel.app` | HTTP 200 at verification time (not proof of authenticated or business lifecycle) |
| Existing production deployment | Vercel `johnnyc/painter-os-company-site` | `READY`, `dpl_E7sNAYJVE3UtngmFkNtsE1aaWo7i`, branch `main` / source `8ae8405b3528e89e2fafead670666d6b964a062d` |
| New preview deployment at proposed evidence head | Vercel/GitHub CI | **Pending; not claimed ready** |
| Production promotion requested by STL-79 | Approval gate | **Not initiated; no production change** |

## Scope and interpretation

These checks prove that the independent company-site build and its synthetic published-journal HTTP boundary passed locally. They do not establish a new preview READY at the *PR head*, deployed Better Auth/Convex invitation/email delivery, or any production release authorization. No secrets, real tenant records or production writes were used. Keep STL-79 open until the approved preview's deployment URL and SHA are verified plus distinct review and CI gates completed.

Source pointers: [`docs/roadmap/LAUNCH_ROADMAP.md`](../../roadmap/LAUNCH_ROADMAP.md), [typed contract](../../../.factory/contracts/STL-79.json), [company-site tests](../../../tests/company-site.http.acceptance.mjs).
