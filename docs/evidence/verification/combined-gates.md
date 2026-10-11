# Combined verification suite coverage

Issue #48 adds two existing suites to `agent:verify`: the forms JSX tests run through `npm run test:forms`, and factory policy tests run through Node's test runner. Both share the verifier's existing fail-fast logs, sanitized environment and exact-head receipt. Neither suite belongs to the root `.test.ts` discovery. No product, dependency, credential or provider configuration changes are involved.

Targeted validation passed the existing 8 harness tests, 15 factory tests and 7 forms tests. The initial full verification attempt correctly stopped at doctor because system npm 11.9.0 is below the required 11.16.0. Reuse the previously installed pinned npm CLI for the full check:

```sh
PAINTER_AGENT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node /path/to/npm-11.16/bin/npm-cli.js run agent:verify -- --browser
```

The runtime receipt under `.agent/runs/verify-*` is the authority for the tested full head and every gate result. A pending run is not a pass. Browser checks remain local synthetic evidence; Vercel collaboration eligibility and live provider acceptance are separate prerequisites. Independent review and CI must name the final exact head before merge.

A later exact-head pass of the full command is recorded in [agent-readiness-browser-2026-10-11.md](agent-readiness-browser-2026-10-11.md).

Skill extraction reuses `docs/skills/painter-pr-evidence/SKILL.md`. This suite wiring adds no new reusable procedure requiring a separate skill.
