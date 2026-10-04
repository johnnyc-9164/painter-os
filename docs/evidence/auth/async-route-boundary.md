# Issue 4 asynchronous auth route boundary

Owner: native issue4_auth_owner. Base main: 335b5b501cc3c211149e518ed3e3d51d06fbd3c0.
Branch: repair/issue-4-auth-boundary. Worktree: painter-worktrees/issue-4-auth-status (reused only after PR11 merged).

Actual defect: /api/auth and /api/invites/[token] returned the cloud promise inside try without awaiting it. An asynchronous Better Auth/Convex rejection bypassed their catch/error mapper. Fix: await that existing promise in both route branches.

Executable actual-route tests use Node24 synchronous module hooks to substitute only Next response and local/cloud adapters. Actual route source and shared HTTP error helper execute. Cloud failures assert 401/403/503. Success preserves cookie response and path-supplied invite token; invalid origin/JSON reject before cloud calls.
Red: node --test --test-isolation=none tests/auth-route.test.ts before source fix: both route rejection cases failed, success passed.
Green: same command after fix: 4 passed. git diff --check passed.
No installs. Prior capacity blocker still prevents full local Next checks; CI required. Native Node emits existing web package module-type warning.

apps/web/AGENTS.md previously read. Installed Next route docs unavailable; official route guide consulted at https://nextjs.org/docs/app/api-reference/file-conventions/route. Existing Next signatures/response APIs unchanged.

No session, Better Auth, provider, membership, verification, invitation expiry/replay policy, cloud adapter, or configuration changes. Tests mock the cloud seam and do not prove live onboarding or email readiness. Keep broader Issue4 open. Revert the commit to roll back; no data effects. Independent review pending.
