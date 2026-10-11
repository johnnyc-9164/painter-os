# Agent setup

## First session

Use Node 24+ and npm 11.16.0+ (the exact pinned package manager is in package.json), Python 3 and jq. Never confuse npm 11.16 with 11.6. Clone the repo and work on an isolated feature branch/worktree:

```sh
git fetch origin
git worktree add ../painter-agent -b agent/my-task origin/main
cd ../painter-agent
npm ci --ignore-scripts
npm run agent:doctor
npm run agent:check
```

Each worktree needs its own install and builds. Do not share node_modules or .next between worktrees. These scripts do not install providers, create cloud resources or require cloud secrets. The doctor checks local prerequisites; it does not prove cloud login.

Read [AGENTS.md](../../AGENTS.md), [architecture](../../ARCHITECTURE.md), the [freeze](../contracts/issue-2-freeze.md), your issue/contract and [quality gaps](../QUALITY_SCORE.md) before editing. Record owned paths in a [plan](../PLANS.md). Existing owners' branches remain theirs.

## Claude Code

Current Claude Code supports AGENTS.md directly (v2.1.277+). Start Claude at the repository root and check `/context` or `/memory` to confirm that root and relevant app instructions loaded. A CLAUDE.md or CLAUDE.local.md in an ancestor can suppress AGENTS loading under the default instruction setting; inspect that if rules are missing. Set Project instructions to read both files in `/config` when appropriate. Older clients can use a local CLAUDE.md containing `@AGENTS.md`; do not duplicate the rules. See the [official memory documentation](https://code.claude.com/docs/en/memory).

Do not run `/init` to overwrite existing governance. Claude Code itself is supplied by the user's account; this repository does not install or authenticate it.

## Run the app

```sh
npm run agent:dev
```

This starts the existing Next app with Webpack on a dynamically selected 127.0.0.1 port, fresh synthetic SQLite state and a private `.agent/runs/dev-*` directory. The terminal prints the actual URL and artifact path. Use Explore demo workspace or create a synthetic account. Provider environment files in the root or either app are rejected by filename without reading them: use a fresh worktree instead of moving/deleting another operator's configuration. Child environments exclude provider credentials. Ctrl-C stops the owned server; run data stays private and ignored until you delete that specific stopped run directory.

Installed Next docs were consulted for hostname, port, Webpack and environment-file behavior. Before later Next edits, read the relevant installed guide under node_modules/next/dist/docs as required by [web instructions](../../apps/web/AGENTS.md).

## Verification

```sh
npm run agent:verify
npx playwright install chromium
npm run agent:verify -- --browser
```

If a trusted system Chromium is already installed, select it explicitly without downloading another browser:

```sh
PAINTER_AGENT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run agent:verify -- --browser
```

The optional override must name an absolute, existing executable file. It is forwarded only to the browser gate, never the app server. The receipt records the resolved executable path and launched browser version; keep run artifacts private because paths can identify the local runner. The default remains Playwright's bundled Chromium. Both choices retain the sandbox, and an invalid override fails without falling back.

Run from a clean committed checkout. Stop development first; Next dev can regenerate tracked next-env declarations. Inspect that generated-only diff before restoring it; never discard another owner’s source edits.

The full command covers the root verify gates (types, lint, the same TS test files, marketing/Vercel tests, Convex tests and web build), Contractor OS verify:all, marketing build, compatibility, additional HTTP-runner/platform-render tests and three isolated HTTP suites, plus new harness checks. It invokes TS tests through Node’s supported `--import tsx` loader so the CLI’s optional Unix IPC server is not required. The existing npm test/verify commands remain intact. Next builds regenerate declaration/config scaffolding. The verifier captures the initially committed versions and restores only the installed Next’s exact declaration template or known allowJs/incremental/dev-type defaults, recording restored paths. An unexpected edit fails and is left for inspection. Python caches are suppressed. It writes each gate's logs and an exact-head/dirty-state JSON receipt in `.agent/runs/verify-*`, stops at failure and never retries silently. `--browser` adds a new sandbox-enabled smoke test with screenshots/video and navigation/mobile assertions. The lifecycle browser acceptance command also keeps the sandbox enabled and owns fresh synthetic state and private artifacts. Browser smoke is not the full business lifecycle. If Chromium or its sandbox cannot run, report that gap; do not disable the sandbox.

For bounded changes use targeted tests first. Run `agent:verify` for this setup change and when combined-system acceptance is needed; do not repeatedly run broad suites without new evidence requiring them. Existing stable CI job names stay unchanged. [Evidence procedure](../skills/painter-pr-evidence/SKILL.md) requires independent review and fresh remote-head checks before merge; no self-merge or production promotion is authorized by these commands.

## A useful first Claude task

Read AGENTS.md and the current issue. Run agent:doctor and agent:check. Identify one bounded gap from QUALITY_SCORE and the issue, reserve the files, reproduce it, implement the smallest repair, run affected checks and request distinct review. Keep cloud auth/email/store/deposit holds intact. Report exact head, commands, results and remaining limitations. Open a draft PR; do not merge or deploy production.


## Lifecycle browser acceptance

```sh
npm run build
PAINTER_AGENT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Unset `PAINTER_TEST_URL`: the lifecycle runner rejects operator URLs and starts its own production Next server on a dynamic 127.0.0.1 port, using the same secret-free environment and env-file rejection as agent:browser. The optional Chromium executable override follows the same validation and sandbox requirements. Video recording also requires Playwright's FFmpeg helper (`npx playwright install ffmpeg` when missing). A browser or video-helper failure is a verification gap; do not disable the sandbox or omit recording to obtain a pass.

The runner prints its private, ignored `.agent/runs/browser-acceptance-*` directory containing screenshots, video, server logs, synthetic database and pass/failure receipt with exact head, browser version/path and redacted server-failure routes. It stops its owned server and browser on completion or interruption. Keep artifacts private, especially issued synthetic portal links. Existing tracked historical evidence is retained; new runs do not write to `docs/evidence/browser`.

This preserves the actual demo login, lead creation/search/qualification, estimate creation/send, portal issuance, anonymous approval, project creation, 19-route navigation and mobile assertions. It does not prove payment processing, full financial lifecycle, cloud auth, provider email or production operation. A product assertion failure remains a failed receipt and requires a separately scoped product repair.

## Worktree setup and cleanup

From an existing checkout, create a new branch with its own dependencies and run the doctor:

```sh
npm run worktree:setup -- ../painter-task agent/my-task origin/main
```

The base defaults to the current `HEAD`; fetch separately when a fresh remote base is needed. Use Node 24+ and npm 11.16+. `--skip-install` creates only the checkout. Existing paths/branches are refused. Install or doctor failures retain the checkout for inspection. No environment files, secrets, dependencies or build directories are copied from another worktree.

Stop the target worktree's processes, then preview and execute cleanup:

```sh
npm run worktree:cleanup -- ../painter-task
npm run worktree:cleanup -- ../painter-task --execute
```

Cleanup targets one registered linked worktree, retains its branch and never uses force. It resolves the path (including symlinks) and refuses anything that is not a registered linked worktree, the invoking checkout, the primary checkout, a detached HEAD, the repository default branch (`origin/HEAD`, else `main`/`master`), a branch with no upstream or with commits not on its upstream (push first), locked worktrees, tracked edits, untracked files and ignored data outside `node_modules`, `.next` and `.turbo` caches. Archive private `.agent` receipts, databases and configuration outside the worktree first. It does not stop processes, delete branches, sweep other worktrees, merge PRs or deploy.
