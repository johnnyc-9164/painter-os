# Issue 4 HTTP error status slice

Owner: native issue4_auth_owner. Worktree: painter-worktrees/issue-4-auth-status.
Initial verified head: e683b000b8a069397f0099f8a354b01514b46d66.
Repository: johnnyc-9164/painter-os. Issue 4 inspected; no claim comments.

Before: Convex wrapper prefixes matched CONVEX before the application error, yielding HTTP 400 for UNAUTHENTICATED and FORBIDDEN.
After: a pure typed mapper selects a complete application error line, yielding 401/403. Missing backend configuration remains 503. Metadata/prose cannot impersonate an authentication error. Existing status policy is retained.

Red: node --test --test-isolation=none tests/http-error.test.ts: 3 regression tests failed against the extracted original mapper (CONVEX/400).
Green: same command after repair: 5 tests passed.
Initial node --test invocation blocked by sandbox child-process EPERM; isolation=none resolved it.
Dependency installation npm ci --ignore-scripts --no-audit --no-fund stopped with ENOSPC. Removed only this worktree's empty partial node_modules. Full type/lint/build and deployed auth acceptance were not run.

apps/web/AGENTS.md read. Installed Next docs were unavailable (no dependencies and no cached Next package); consulted official https://nextjs.org/docs/app/api-reference/file-conventions/route as fallback. No Next API, route signature, session, membership, provider, config, or authorization checks changed. Only existing http.error delegates pure mapping.

Independent review pending. This scoped fix does not complete Issue 4 or prove cloud verification delivery readiness. Rollback: revert the commit; no data migration.

Independent review found untrusted UNKNOWN_FIELD colon detail could influence status. Repair classifies only the code before colon while preserving detail. Added direct/wrapped regressions for auth/config/conflict-looking field names; final focused suite: 6 passed. Reviewer re-review pending.
