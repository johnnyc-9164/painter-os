# Fourth-app and Pi Worker regular verification

Issue: https://github.com/johnnyc-9164/painter-os/issues/96. Prepared base: `5ea90fc96748079e35f1c21060ee3561dc60967c`. Branch: `fix/platform-worker-verification`.

The sequential local verifier retains all original 18 gates plus the two company-site gates in their existing relative order. It adds the independently built `platform-admin` app and that app's own bounded HTTP runner, and one complete `test:agent-worker` gate. The latter owns dry production/fixture builds plus actual Miniflare/workerd/SQLite tests; no extra Worker build is duplicated. CI retains stable check names, adds fourth-app build/HTTP to `build`, and retains `domain-tests`' root `npm test`, which includes the Worker suite after its prerequisite merges.

Filename-only local environment checks additionally cover platform-admin and Worker production/fixture directories, including `.dev.vars` and named Worker environments. They do not read, copy or delete values. Missing Worker directories are tolerated during preparation; missing app directories and other filesystem errors remain failures. Template example files remain permitted.

Prepared-source validation:

- Isolated pinned npm 11.16.0 install passed (710 packages); doctor and repository agent checks passed.
- `node --test tests/agent-platform-worker-gates.test.mjs tests/agent-company-site-gates.test.mjs tests/agent-harness.test.mjs`: 14 focused tests passed. These exercise the real 23-gate list, prior gate order, separate fourth-app HTTP command, exactly one complete Worker gate, optional browser preservation, stable CI command order and filename/credential exclusions.
- Actual `build:platform-admin` through the existing credential-excluding verification environment passed (Next 16.3.8 Webpack).
- Immediately following that build, `node scripts/run-platform-admin-http-acceptance.mjs` passed against the actual independently built fourth app: own routes, headers, redacted APIs, origin/action boundaries and absent company-admin routes. Existing web `/platform` acceptance is retained separately.
- The actual fourth-app build modified no tracked Next declaration/config artifacts; restoration was not broadened.
- `git diff --check`: passed.

The complete integrated Worker runtime suite and committed-head receipt await the prerequisite's coordinator merge. No source merge can claim an absent root Worker test script. Independent root review and exact-head remote CI remain pending. No manifest/lock, app runtime, provider deployment, domain or cloud resource changes are part of this gate repair. Local synthetic evidence does not establish production activation.

Rollback the scoped workflow/gate/environment helpers and tests together; no data migration. Skill extraction reused `docs/skills/painter-pr-evidence/SKILL.md`; no additional reusable procedure was required.
