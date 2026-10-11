# Agent readiness: exact-head browser verification receipt (2026-10-11)

Issue #44. Local synthetic evidence only: no provider/cloud auth, live email, payment or production operation is implied.

## Result

`npm run agent:verify -- --browser` **passed all 24 gates** at commit `52c96bbbd3f06d26937f560b19e1e312089b6bfc` (receipt `head` equals that SHA, `dirty: false`, `status: passed`). That commit is `origin/main` `7c80a47` plus one harness repair (below). Later commits on the evidence branch change documentation only.

Environment: Node 24.21.0, npm 11.16.0, Chromium 141.0.7390.37 (preinstalled sandboxed build; no browser download), Linux, unprivileged user.

Gates passed: doctor, agent-check, agent-tests, typecheck, lint, domain-tests, node-tests, forms-tests, factory-tests, convex-tests, worker-local-runtime, web-build, compatibility, platform-render, contractor-component, marketing-build, company-site-build, platform-admin-build, http, marketing-http, company-site-http, platform-admin-http, platform-http, browser.

Browser smoke receipt: `status: passed`, `sandbox: true`, scope "demo login, navigation, mobile layout; not cloud auth or full financial lifecycle", no page errors, no 5xx failures. Screenshots (`before.png`, `after-mobile.png`), video and `requests.jsonl` were produced under the run's private `.agent/runs/browser-*` directory. Raw `.agent/runs` stay ignored and private by repository convention; this summary is the retained record. The separate lifecycle command (`npm run test:browser`) was not run.

## Failed attempts, kept for accuracy

1. **convex-tests failed (twice, in `agent:verify` only).** `packages/backend/tests/auth-email-production.test.ts` "explicit HTTP verification remains held..." received 429 instead of 403. Cause: the verifier gives every gate `NODE_ENV=production`, which enables Better Auth's rate limiter. `npm run test:convex` (176/176, run twice) and main's CI both pass without that variable. Repair in commit `52c96bb`: `testGateEnvironment` in `scripts/agent-common.mjs` sets `NODE_ENV=test` for the `convex-tests` gate only, with a unit test; build and HTTP gates keep production. No test was skipped or edited.
2. **browser failed as root.** Chromium refused to start with the sandbox enabled ("Running as root without --no-sandbox is not supported"). The sandbox was not disabled; the run was repeated as uid 1000, where the sandbox works.
3. **browser failed on video.** The verifier's allowlisted environment drops `PLAYWRIGHT_BROWSERS_PATH`, so Playwright looked for FFmpeg in `~/.cache/ms-playwright`. Linking that directory to the preinstalled browsers fixed it (runner setup, no repository change).
4. **One run hit ENOSPC** (disk full) and another needed generated `next-env.d.ts`/`tsconfig.json` restored and file ownership repaired after the interrupted build. Neither is a product result; no dependency reinstall was repeated.

## Reproduce

```sh
npm ci --ignore-scripts && npm run agent:doctor
PAINTER_AGENT_CHROMIUM_EXECUTABLE=/path/to/chrome npm run agent:verify -- --browser
```

Run as a non-root user from a clean committed checkout. Remaining limits: cloud login/invitation/email, payments, the full lifecycle browser acceptance and independent review of the exact head are separate. CI for the final PR head is the authority for remote checks.
