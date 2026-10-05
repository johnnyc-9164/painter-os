# Marketing build isolation — Issue 18

Base: `9af3b4b8acea729230894f020eb0eb724ea5069c`. Owned scope: `apps/marketing/vercel.json`, marketing boundary regressions, this receipt. Refs #18; broader deployment acceptance remains open.

The coordinator observed the failed marketing build at `/vercel/path0/apps/marketing`: the marketing workspace reported missing `build:vercel` while the inherited root admin configuration selected `npm run build:vercel`. This is coordinator-supplied provider evidence, not a locally reproduced Vercel deployment.

The app configuration selects `npm run build` (the existing marketing `next build --webpack`), `.next`, and `npm --prefix ../.. ci --no-audit --no-fund` using the repository lock. Correct provider Root Directory `apps/marketing` and access to workspace files outside that directory are prerequisites. Root/admin configuration and scripts are unchanged.

Official references: [project-root build/install/output overrides](https://vercel.com/docs/project-configuration/vercel-json), [per-app monorepo roots](https://vercel.com/docs/monorepos), [Git deployment branch controls](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled). `git.deploymentEnabled` contains only `main: false`; unspecified branches retain the documented enabled default. No enabled wildcard can override the main hold. This controls Git-triggered deployments only: manual CLI/REST production deployment is still possible and requires the coordinator's explicit target/authorization gate. This repair does not authorize production environment writes or deployment promotion.

Local validation: `node --test tests/marketing-boundary.test.mjs` — 6/6 PASS. The new process regression executes the actual configured npm build against a copy of the actual workspace package, with a fake Next executable and a forbidden backend sentinel while root admin configuration exists and `VERCEL_ENV=production`. It confirms the command reaches marketing Next build arguments without invoking the backend sentinel. It does not emulate Vercel configuration selection or execute a real Next build. Branch assertions cover main disabled and two unspecified branches enabled. Initial missing-app-config regression was RED (ENOENT); fixture npm user/global config files were separated before the GREEN run. No dependency install or credentials/config copies occurred.

Pending acceptance: exact-head independent review, fresh CI with both real app builds, and coordinator inspection of the marketing preview log showing root-lock npm ci and local marketing Next build with no backend deploy. No deployment was initiated by this owner.

Post-run skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; the existing procedure covers this exact-head receipt, so no duplicate skill was created.
