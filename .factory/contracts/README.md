# Factory contracts for the launch roadmap

One contract per issue in [docs/roadmap/LAUNCH_ROADMAP.md](../../docs/roadmap/LAUNCH_ROADMAP.md). Each file uses the format `.github/factory/contract.mjs` validates (`version`, `issue` = GitHub issue number, `goal`, `successConditions`, `nonGoals`, `stopConditions`, `allowedPaths`, `forbiddenPaths`, `requiredEvidence`, `riskClass`) plus advisory fields (`linearIssue`, `branch`, `requiredChecks`, `testRequirements`, `envSecretNames`, `humanApprovalGates`, `dependsOn`, `blocks`, `phase`, `size`, `ownerType`, `factoryEligible`). The guard hashes the whole file, so advisory fields are bound too.

These files are **proposals, not approvals**. Nothing here authorizes a run.

## How an agent picks one up

1. Check `dependsOn` issues are Done in Linear. If not, stop.
2. Confirm Johnny (maintainer) committed the approval record `.github/factory/approved-contracts/<issue>.json` on `main` as `{ "contract": <this file's JSON>, "attempt": "<id>" }`. No approval → no run.
3. Branch from `main` as `factory/STL-XXX-slug` (the `branch` field).
4. Copy the contract unchanged: `cp .factory/contracts/STL-XXX.json .factory/contract.json` and commit it.
5. Change only files matching `allowedPaths`; never touch `forbiddenPaths` (`.github/**`, `scripts/**`, `docs/contracts/**` are always forbidden). Backend/auth paths require `riskClass: high`.
6. Hit a `stopConditions` item or a `humanApprovalGates` step? Stop and report — do not widen scope, deploy to production, change prod env vars, run migrations or touch billing/DNS.
7. Open the PR with trailers in the body:
   ```
   Factory-Contract-Hash: <node .github/factory/contract.mjs hash .factory/contract.json>
   Factory-Attempt: <attempt id from the approval record>
   ```
8. Attach `requiredEvidence` and get every `requiredChecks` job green on the head SHA. Never merge your own PR.

`factoryEligible: false` (STL-104, STL-123) means the core change lives in guard-protected paths or GitHub settings; a maintainer does it on a normal branch, and the contract only scopes the supporting docs/tests.

Env and secret needs are listed **by name only**. Never read, print or commit their values.
