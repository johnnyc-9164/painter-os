# Built Next loopback HTTP acceptance

Refs #4 and #6. `scripts/run-http-acceptance.mjs` runs the existing `tests/http.acceptance.mjs` against the actual already-built admin Next application. It resolves the installed Next CLI from `apps/web` and starts it directly with Node and a fixed loopback hostname, without an npm/cmd shell. Port selection is ephemeral. Startup polls the real unauthenticated snapshot response (401 with `error: UNAUTHENTICATED`) for at most 60 seconds; the harness has a 120-second deadline and failure propagates. First actual CI correctly started Next but timed out before the harness: the runner had mistakenly expected 200/session-null instead of this actual route contract. That readiness assumption was repaired without weakening auth or changing the route.

Each run creates one fresh `painter-http-*` directory under `RUNNER_TEMP` or `os.tmpdir`. Child environment is assembled from an explicit small list of noncredential OS variables plus fixed local runtime/demo/cookie flags and loopback app/test URLs. It does not copy provider/cloud/session/link credentials or URLs. Real local SQLite and file uploads live only in the fresh `PAINTER_DATA_DIR`. Exit/error/interruption paths terminate only the owned harness/server processes, then recursively remove only the task-created directory after verifying its resolved absolute parent and prefix. No production datastore, deployment, mailbox or provider is used.

The harness exercises the existing auth/business/tenant/portal/upload and legacy `/site` HTTP flow. It does not validate browser interaction, live Better Auth/Convex, email delivery, or the separately deployed marketing app. Both apps build before the coordinator-owned CI hook; that does not make the legacy `/site` assertions separate-marketing acceptance.

Coordinator hook after the existing two build steps, with no secrets:

```yaml
      - run: node scripts/run-http-acceptance.mjs
```

Implementation owner does not edit root manifests, locks or workflow. Coordinator owns that one workflow edit on the isolated branch. Actual full-harness CI execution is required before acceptance; local dependencies/build are absent and no install is authorized. Native four tests cover loopback/environment boundary, actual child failure/timeout/termination, real HTTP readiness and owned-directory cleanup preserving unrelated data. Run locally with `node --test --test-isolation=none tests/http-runner.test.mjs`; script syntax and diff checks also run without dependencies.

Read current official [Next CLI guide](https://nextjs.org/docs/app/api-reference/cli/next) for `start`, hostname and port flags. Current online docs identify 16.3.8; installed-package behavior is verified by exact-head CI using the repository lock, not claimed from this source guide. No Next application behavior changes.

Skill extraction: reused [Painter PR evidence](../../skills/painter-pr-evidence/SKILL.md), retaining exact-head local/actual CI/independent review receipts on the PR. A new skill is not yet justified until the real run is verified. Broad auth/UI/live criteria remain open.
