# Company-site default verification gates

Issue: https://github.com/johnnyc-9164/painter-os/issues/81. Base: `b307d731d7be05ff92ec546b5aad1a7c9e2f25c0`. Branch: `fix/company-site-verification`.

The default local verifier now builds company-site and runs its existing real-built-page HTTP acceptance. Its actual gate list lives in `scripts/agent-verification-gates.mjs`, shared with focused tests. The runner remains sequential, stops on failure, and records the existing exact-head receipt. CI adds the same build and HTTP commands within the existing stable `build` check; all existing checks remain. Company-site builds before its HTTP gate. Browser verification remains optional.

The existing environment filename scanner now includes company-site, preventing local Next environment files from entering the new build without reading or modifying their contents. The same credential-excluding verification environment remains authoritative. HTTP acceptance reuses its bounded loopback-only app/backend fixture and existing cleanup. No cloud projects, providers, domains, app runtime, package manifest or lockfile are changed.

Executed local validation on the prepared source:

- Isolated `npm ci --ignore-scripts` with npm 11.16.0 passed (707 packages).
- Pinned npm `agent:doctor` and `agent:check` passed.
- `node --test tests/agent-company-site-gates.test.mjs tests/agent-harness.test.mjs`: 11 tests passed. Tests exercise the real gate list, default inclusion/order, unchanged optional browser path, stable CI build command order, and company-site filename exclusion without credential-property reads.
- `npm run build:company-site` through `verificationEnvironment()` and `assertNoEnvFiles()`: production Webpack build passed with Next 16.3.8.
- Immediately following that build, `npm run test:http:company-site` through the same credential-excluding environment: the existing actual built-page HTTP fixture passed, including workspace separation, escaped content, private-field exclusion, security header and safe 404s.
- The actual build made no tracked company-site Next declaration/config changes; no restoration expansion is needed.
- `git diff --check`: passed.

Exact committed-head targeted execution and fresh remote CI receipts accompany the PR. Full combined verifier execution is separate evidence; these local checks do not claim it or production deployment readiness. Distinct root review is pending. Rollback workflow/gate/helper/test source together; there is no data migration.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; the existing procedure covers exact-head evidence and integration refresh, so no new reusable skill is required.

Setup correction: an initial npm install was accidentally started in the coordinator checkout, then interrupted with SIGINT. It made no source/manifest/lock changes; isolated installation and all scoped validation occurred in the new worktree. Coordinator was informed that its dependency installation might need refresh.
