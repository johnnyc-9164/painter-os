# Fourth-app and Pi Worker regular verification

Issue: https://github.com/johnnyc-9164/painter-os/issues/96. Prepared base: `5ea90fc96748079e35f1c21060ee3561dc60967c`. Branch: `fix/platform-worker-verification`.

The sequential local verifier retains all original 18 gates plus the two company-site gates in their existing relative order. It adds the independently built `platform-admin` app and that app's own bounded HTTP runner, and one complete `test:agent-worker` gate. The latter owns dry production/fixture builds plus actual Miniflare/workerd/SQLite tests; no extra Worker build is duplicated. CI retains stable check names, adds fourth-app build/HTTP to `build`, and retains `domain-tests`' root `npm test`, which includes the Worker suite after its prerequisite merges.

Filename-only local environment checks additionally cover platform-admin and Worker production/fixture directories, including `.dev.vars` and named Worker environments. They do not read, copy or delete values. Missing Worker directories are tolerated during preparation; missing app directories and other filesystem errors remain failures. Template example files remain permitted.

Installed Wrangler source confirms `getGlobalConfigPath()` prefers an existing legacy `os.homedir()/.wrangler` directory over XDG (wrangler-dist/cli.js lines 25103 and auth descriptor 134446); `WRANGLER_LOG_PATH` is supported at line 69676. Before the Worker child starts, a metadata-only `lstat` preflight refuses an existing legacy config path without reading, moving or deleting its contents. Operators with that path need an isolated runner. Only the Worker gate receives private `XDG_CONFIG_HOME`, `WRANGLER_LOG_PATH` and disabled metrics; HOME/USERPROFILE are never overridden. This avoids silently falling back to operator credentials; synthetic path tests preserve their contents and record a blocked-gate receipt.

Prepared-source validation:

- Isolated pinned npm 11.16.0 install passed (710 packages); doctor and repository agent checks passed.
- `node --test tests/agent-platform-worker-gates.test.mjs tests/agent-company-site-gates.test.mjs tests/agent-harness.test.mjs`: 16 focused tests passed. These exercise the real 23-gate list, prior gate order, separate fourth-app HTTP command, exactly one complete Worker gate, optional browser preservation, stable CI command order and filename/credential exclusions.
- Actual `build:platform-admin` through the existing credential-excluding verification environment passed (Next 16.3.8 Webpack).
- Immediately following that build, `node scripts/run-platform-admin-http-acceptance.mjs` passed against the actual independently built fourth app: own routes, headers, redacted APIs, origin/action boundaries and absent company-admin routes. Existing web `/platform` acceptance is retained separately.
- The actual fourth-app build modified no tracked Next declaration/config artifacts; restoration was not broadened.
- `git diff --check`: passed.

Pi prerequisite main `e815dd16e0fe7f92f5b70798a984caf3742cd204` was integrated through a normal merge. Isolated dependency refresh passed with 869 packages. The actual complete Worker gate passed: both Wrangler 4.149.0 dry builds and all eight Miniflare/workerd/SQLite runtime tests. It used the approved private XDG/log paths after a clean metadata-only legacy-config preflight; no model credentials or live Cloudflare calls were supplied. A final committed-head receipt accompanies the PR. Independent root review and exact-head remote CI remain pending. No manifest/lock, app runtime, provider deployment, domain or cloud resource changes are part of this gate repair. Local synthetic evidence does not establish production activation.

Rollback the scoped workflow/gate/environment helpers and tests together; no data migration. Skill extraction reused `docs/skills/painter-pr-evidence/SKILL.md`; no additional reusable procedure was required.
