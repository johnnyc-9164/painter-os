---
name: painter-pr-evidence
description: Prepare or verify an exact-head acceptance receipt for an authorized Painter OS repair PR after independent review, including refreshed evidence after integration.
---

# Painter PR evidence

Use for the bounded repair loop in `johnnyc-9164/painter-os` (repository ID `1404513225`). This skill assembles review evidence; it grants no implementation, external-write, merge or deployment authority. Follow the current task's owned files, coordinator/reviewer assignment and authorization window in the session ledger.

## Inputs and output

Inputs: verified repository and checkout, PR number, fresh base/head SHAs, owned-file scope, independent review verdict naming the exact head, affected test commands/results, and GitHub CI records for that head. Distinguish locally executed, CI-executed, pending and blocked checks.

Output: a receipt on the authorized PR or in the session ledger with repository, PR URL, base/head, changed files and behavior, reviewer identity/verdict, commands/results and CI URL, material limits and remaining holds. If publication is not authorized, prepare the receipt locally instead. Keep a broad issue open when only its bounded slice is complete.

## Procedure

1. Verify checkout origin, clean/owned working state and fresh remote refs. Read current instructions and claims. For read-only GitHub verification, use the explicit repository rather than ambient `gh` defaults:

   ```powershell
   gh api repos/johnnyc-9164/painter-os --jq .id
   git remote -v
   git status --short
   gh pr view <number> --repo johnnyc-9164/painter-os --json headRefOid,baseRefOid,statusCheckRollup
   ```

2. Match the independent verdict and affected test receipt to the PR's current full head SHA. A review or green run for an earlier SHA is historical evidence only. Pending checks are not passes. CI type/lint/build and local synthetic tests do not prove deployed Convex, live Better Auth/email or production readiness.
3. If main moved and integration is authorized, preserve the exclusive branch and other owners' work, inspect the new base's changes, then integrate it. Confirm the owned-file delta; unchanged files allow the reviewer to focus on integration rather than repeat the entire source review. Rerun combined affected regressions and obtain an exact-new-head verdict plus fresh CI. An unchanged patch still needs integration evidence.
4. Record failed checks and repairs accurately. For a loader/environment failure, isolate its cause and repair the narrow boundary instead of skipping the test. Stop after three attempts for a concrete failure in this loop; retain the last error and continue unaffected read-only/proposal work. Do not repeat a dependency install after disk exhaustion or alter credentials/provider settings to make checks pass.
5. Re-read the remote head and terminal checks at handoff. Publish/update only within existing task authorization. Hand the exact-head receipt to the coordinator; the implementation owner does not self-approve or merge. If a held prerequisite remains, name it without claiming the operation happened. Review scope is not deployment approval.

## Verified source receipt

[PR #16](https://github.com/johnnyc-9164/painter-os/pull/16) used this procedure after integrating payment repair main `19085fd4f88c5bd20fca633f7b4859bb398dc3c3`. Accepted head: `98589639d4b759b6c56352bf20f378aa40404967`. Independent reviewer: native `auth_status_review`. Four cancellation files stayed unchanged across integration; the reviewer independently accepted the new exact head.

```powershell
node --test --test-isolation=none tests/schedule-input.test.ts tests/ui-intent.test.ts tests/http-error.test.ts docs/contracts/compatibility.test.mjs
git diff --check origin/main
```

The combined command passed 19 tests. Strict standalone helper compilation passed with global TypeScript 7; it was reported separately from the locked full-project check. [Fresh CI run](https://github.com/johnnyc-9164/painter-os/actions/runs/37243441075) passed typecheck, lint, domain-tests, convex-tests and build at that head. Parent subsequently merged PR #16; implementation owner did not self-merge. Vercel preview was pending at handoff, and no live-cloud/browser acceptance or manual promotion was claimed. The command is a historical receipt for that source revision, not a substitute for choosing affected checks on a future PR.

## Native web validation and workspace JSX

Use this bounded procedure when a native-cloud web task has the installed project dependencies but a direct `tsx` renderer fails on shared workspace JSX. It does not authorize a dependency change, skipped check or security bypass.

1. Inspect the current app and existing `scripts/run-http-acceptance.mjs` pattern before inventing another harness. Prefer real built-page loopback HTTP assertions for server-rendered content, exact routes, headers, native links, API status and compatibility. Keep original assertions and role semantics; do not change an anchor into a button to satisfy a test.
2. A client state that requires a real operator/session may be unreachable in isolated anonymous HTTP. Cover that state separately with the installed Vitest/Vite automatic-JSX transform and the real shared UI components, as in `vitest.platform.config.ts`. Keep the state fixture in tests, not in a production auth bypass. Static render coverage does not prove browser events, layout, focus or live authorization.
3. Root `tsx` and shared-package JSX configuration may differ from Next's automatic transform. Preserve the actual failure, then choose the matching supported test runner rather than adding global React stubs, rewriting shared controls or silently dropping assertions. Pure transport/decoder tests can remain on the established Node import-loader entry point when the CLI's optional Unix IPC is blocked.
4. Keep isolated runners on 127.0.0.1 with whitelisted, secret-free environments, owned temporary directories, bounded readiness and cleanup, and no real provider configuration. Verify the runner's environment exclusions.
5. Record build exit 137 as an observed termination, not a proven out-of-memory diagnosis. A serialized bounded-heap retry may be appropriate; retain the original failure and stop at the task's retry limit. Do not disable Next TypeScript. If authorized CI supplies build/HTTP evidence instead, name that exact head and CI run separately.
6. Sandboxed browser failure remains a browser verification gap. Never add `--no-sandbox` or otherwise weaken security to produce a screenshot. Record scoped static audit results separately from pre-existing repository-wide findings.

The platform inventory slice records the exact branch, reviewer and command evidence in `docs/evidence/platform/read-only-inventory.md`. The recipe is reusable only within its stated read-only/local-fixture boundaries.
