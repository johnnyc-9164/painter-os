# Issue 5: production build preparation

The coordinator observed `CONVEX_DEPLOYMENT_NOT_CONFIGURED` in production and reported that Vercel's existing build only built Next.js. This patch adds a repository-controlled Vercel build command. Only exact `VERCEL_ENV=production` invokes the installed Convex CLI from `packages/backend`, passing `NEXT_PUBLIC_CONVEX_URL` to the fixed frontend build command. Preview/development retain `npm run build`; no preview backend is provisioned.

Supported syntax: [Convex Vercel hosting](https://docs.convex.dev/production/hosting/vercel) and [deploy CLI](https://docs.convex.dev/cli/reference/deploy). `npx --no-install` uses the installed dependency rather than downloading a fallback CLI. Process arguments are fixed, with `shell: false`; only Convex's documented `--cmd` receives a constant shell command.

CLI order is frontend `--cmd` with injected URL first, then Convex typecheck/codegen/bundle/push. This does not claim the backend is deployed before the frontend build. Key presence alone cannot prove the intended production target or readiness; the coordinator must verify its scope and deployment association without exposing its value.

Validation: `node --test --test-isolation=none tests/vercel-build.test.mjs` passed all six tests. The ordinary Node test runner was blocked by sandbox `spawn EPERM`; in-process execution passed. Tests mock process execution and use synthetic environment values. Root `npm test` also runs these tests in CI. No dependencies installed and no deployment executed. Full app checks are left to CI because task disk capacity prevented reliable local installs.

## Current main integration and reusable procedure

Reconciled main `73a3d24b53672ce86fbc94f731b54d4955b9b539`, including existing AgentMail registration. The `package.json` conflict was resolved by retaining current marketing checks and appending platform tests. Root `build` still builds only admin; `build:marketing` stays separate and current CI explicitly builds both applications. Deployment helper source/argv is unchanged. Component/auth ownership remains intact; mounting an email component is not live delivery evidence.

Reused `docs/skills/painter-pr-evidence/SKILL.md` for the exact-head integration/review/CI receipt. Skill extraction found this existing verified procedure sufficient; no new skill was created for a one-off deployment plan. Exact final head, independent reviewer verdict and fresh CI are recorded in the PR/coordinator handoff. Technical acceptance is distinct from configuration readiness and deployment authorization. Repository root/build-command precedence and admin output selection remain coordinator release gates alongside backend configuration.

Merge/release gate: coordinator must confirm required production backend secrets/configuration before merging this build change. Missing deploy key fails before process launch; CLI/configuration/build failure propagates without frontend-only fallback. The script does not provision secrets or validate remotely held backend secret readiness. Vercel's repository root must be the monorepo root for this configuration. Production merges then execute the documented backend/frontend deploy path; this evidence is preparation, not live deployment acceptance.
