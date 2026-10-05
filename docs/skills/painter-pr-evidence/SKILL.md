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
