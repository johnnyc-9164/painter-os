# Read-only platform inventory slice

## Source and scope

Base: `21f60d171f806d567ae17a7c995a47049b852071` in `johnnyc-9164/painter-os` (repository ID 1404513225). The native copy was reconciled through the authorized GitHub connector and all 643 Git blob hashes matched before implementation. Source edits are isolated from the acquired baseline and other marketing/CI work.

An explicit `/platform` subtree adds overview, dedicated sign-in, redacted workspace inventory/detail, access status and honest unavailable sections for sites/health/activity/billing. This is a fourth product surface inside the existing admin app, not a claim of four independently deployed apps. Unknown platform pages and API paths cannot fall through to contractor UI.

The existing Better Auth session bridge is reused, without tenant snapshot/workspace bootstrap during platform sign-in. The existing capability check is extracted without changing bootstrap/revoke behavior. Every backend read rechecks the actual session, verified user and enabled grant. The inventory is fixed to painterWorkspaces, paginated 1–50 records (UI 20), and projects only id/name/createdAt/demo. Detail uses the same authorization and projection. No user/member/customer/financial/private ownership fields are returned.

No schema, dependency, lockfile, shared control, tenant operations/CMS/portal/invite route, credential, provider setting, verification flag, live grant, impersonation or billing action is changed. SaaS counts and unconnected information are unavailable rather than fabricated. The existing public article route is linked only from an authorized workspace summary; custom domain ownership is not implied.

## Locally executed evidence

- Standalone full project typecheck and lint pass.
- All 39 Convex tests pass, including actual published Better Auth component/session fixtures. Platform tests cover anonymous and ordinary tenant-owner denial; revoked or unverified users, missing/expired sessions and nonexistent subject users; redacted 3/3/1 cursor pages; bounded arguments; empty and missing workspaces; and unchanged current-capability semantics.
- Transport tests preserve 401/403/400/404/503/200 distinctions, private no-store responses, bounded input and redacted backend failure. Decoder rejects malformed and extra-field responses. Unknown native opaque-cursor rejection stays a sanitized unavailable response; a first-page reset recovers the inventory without treating every database error as invalid input. Signed JWT claim issuance remains the existing Better Auth trust boundary; synthetic missing-user denial is not a claim that the SDK independently compares session.userId with subject.
- Automatic-JSX tests render the real Base UI/shared components across loading, signed-out, denied, unavailable, empty, inventory and detail states. All 51 root Node-loader tests pass, including the three transport tests, two UI/decoder entry-point tests and runner-isolation test. The UI entry point invokes the three installed-Vitest render tests explicitly. Marketing boundary (6), deployment helper (6), HTTP runner isolation (4) and compatibility (4) tests also pass. Static render tests are not browser acceptance.
- Scoped platform strict design audit reports zero findings. Whole-repository audit reports 18 pre-existing findings in untouched tenant/shared-control files; none were silently repaired or claimed resolved.

## Limits, failed checks and outstanding acceptance

The original root npm test command hits the native restriction on tsx's optional Unix IPC; the established supported Node import-loader entry point runs the same test files. Three production builds compiled the web bundle, then exited 137 during Next TypeScript (two 512 MiB runs, then one serialized 384 MiB run). The operating system did not expose a definitive reason. Local retries stopped; no type check was skipped.

Consequently the new built-HTTP harness is prepared for CI execution, not claimed locally passed. It covers nine explicit platform pages, API unavailable/no-store/read-only states, unknown namespace 404s and contractor-route preservation in local and unconfigured modes. It reuses the existing lifecycle cleanup helper and verifies secret/configuration exclusion. The existing HTTP harness appends the local platform checks only after all 52 unchanged contractor assertions; the platform suite logs its own check count and propagates failure. The standalone unconfigured-mode runner is prepared but is not wired to CI in this slice.

Sandboxed Chromium launch (`chromiumSandbox: true`) failed at an OS-disallowed Unix socket. No sandbox-disabling flag or alternate bypass was used. Browser interactions, responsive screenshots, actual Better Auth sign-in against the deployed service and a real authorized-owner view remain unverified. No live owner was granted; that prerequisite stays held on verified identity and audited operator authorization.

## Acceptance and skill extraction

Implementation-owner evidence is not independent acceptance. The draft PR's exact immutable head, independent review and terminal CI/build/HTTP receipt must be attached before merge. Root coordinator owns merge and deployment decisions.

Reused `docs/skills/painter-pr-evidence/SKILL.md` and appended the verified native JSX/HTTP selection procedure there. It preserves real assertions, distinguishes source/fixture/HTTP/browser evidence and retains bounded failure and security constraints. No new runtime dependency or service was introduced. This evidence document is the session ledger for this bounded slice.
