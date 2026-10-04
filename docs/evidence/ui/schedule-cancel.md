# Schedule cancellation form repair

Base: `335b5b501cc3c211149e518ed3e3d51d06fbd3c0`, after reviewed auth and retry/runtime repairs.

The existing `CommandForm.submit` applies date conversion to every `schedule.*` action. The cancellation confirmation has no fields, so `{}` attempts `new Date(String(undefined)).toISOString()` and throws `RangeError: Invalid time value` before dispatch. This prevents the existing Cancel action from reaching the server.

The form now calls an extracted normalizer that converts dates only for `schedule.create` and `schedule.reschedule`. Cancellation keeps `{}`. Local-to-UTC conversion and existing reversed/invalid date rejection remain unchanged; authorization and backend cancellation policy remain server-owned.

Regression evidence: extracting the original condition made the cancellation test fail with `Invalid time value`, while the other three tests passed. Restricting the two actions made all four tests pass. Combined command `node --test --test-isolation=none tests/schedule-input.test.ts tests/ui-intent.test.ts tests/http-error.test.ts` passes 15 tests. These are pure form-boundary regressions, not a mounted browser run. Independent exact-head review and full CI are recorded on the PR.

No dependency install attempted for this repair. The earlier worktree install failed on ENOSPC; bundled Next documentation remains unavailable. `apps/web/AGENTS.md` and the official [client-component guide](https://nextjs.org/docs/app/api-reference/directives/use-client) were reviewed. This patch introduces no Next API change.

The broader Issue #6 compositions, hooks, browser acceptance and other criteria remain open.
