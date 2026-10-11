# Stagehand and Clef browser research record — 2026-10-11

Tracking: [issue #103](https://github.com/johnnyc-9164/painter-os/issues/103) (Linear STL-39). Issue text: "Archive the official Stagehand/Clef browser research record in docs/research, clarifying runtime/compatibility limits and keeping rollbacks isolated."

This is a docs-only index record. It summarizes the detailed read-only research in [JEV_CLEF_BROWSER_2026_10_09.md](JEV_CLEF_BROWSER_2026_10_09.md) (tracked by [issue #94](https://github.com/johnnyc-9164/painter-os/issues/94)) and does not add new claims. No installs, provider or model calls, browser sessions, credentials or account changes were made.

## Status

- Research is recorded. Runtime compatibility, calibration and deployed acceptance remain open.
- No released npm version or public SDK export is established. The detailed record says not to infer one from PR descriptions.
- Platform readiness is not established until an installed runtime and separately authorized deployed acceptance are evidenced.

## Sources cited by the detailed record

- Jev explanation: https://www.langchain.com/blog/building-a-harness-with-jev
- Browserbase Jev explanation: https://www.browserbase.com/blog/what-is-jev
- Stagehand PRs: https://github.com/browserbase/stagehand/pull/2951, https://github.com/browserbase/stagehand/pull/2952, https://github.com/browserbase/stagehand/pull/2953
- Stagehand experimental decisions namespace (draft as inspected): https://github.com/browserbase/stagehand/pull/3103
- Stagehand overlap performance proposal (draft as inspected): https://github.com/browserbase/stagehand/pull/2993/changes
- Clef provider seam: https://github.com/browserbase/stagehand/pull/3102
- Cloudflare Clef changelog: https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/
- Cloudflare Clef model page: https://developers.cloudflare.com/workers-ai/models/clef/
- TypeSafe Jev/System One announcement: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- browser-use open-source quickstart: https://docs.browser-use.com/open-source/quickstart and https://docs.browser-use.com/

## Runtime and compatibility limits

- Jev is selection and control inside an existing browser tool. It does not replace the planner, company approval authority or tool execution policy.
- Constrained output prevents out-of-schema identifiers. It does not prevent choosing the wrong valid control or performing a destructive action.
- Jev's decision thresholds (including the 0.7 acceptance threshold described in the Browserbase blog) are experimental, in-sample tuned rules. They are not general safety guarantees and must not be copied as a Painter OS production threshold.
- The Stagehand experimental decisions API differs between PR3103 (`experimentalDecisions` namespace) and the original PR2953 env-gated implementation. Adoption requires a pinned released package or an explicitly reviewed upstream commit, plus proof of installed exports and protocol compatibility.
- Stagehand's extension, protocol and browser plumbing is not automatically a Worker-compatible SDK. Cloudflare Browser Run/CDP support and the exact pinned Stagehand runtime require installed proof.
- Clef (Cloudflare Workers AI) documents a 64-question cap, restricted identifiers and a 65,536-token context. Long state may truncate, so a critical candidate must not be silently dropped. The Workers AI binding returns answers directly; the REST API wraps the result.
- The PR3102 live TypeSafe conformance result is author-reported. Cloudflare and Perplexity paths were tested only against documented formats without credentials. The OpenAI preview path returned a key error and is not an approved Painter OS implementation path.
- The browser-use open-source agent is a separate Python agent loop. Importing a Python agent into a JS Worker is not valid compatibility proof and would duplicate agent ownership. Any such use would need an explicit separate service with its own trust and lifecycle boundaries.

## Evidence and cost caveats

- Browserbase reports an early Act median of 1.97s to 0.46s. This is not an end-to-end task or independent benchmark.
- PR2953 reports 39/40 vs 35/40 breadth and 3.19s to 0.77s, with in-sample threshold tuning and incomplete decision-token metadata. These are author-reported and not reproduced here.
- TypeSafe's large multipliers are acknowledged as high-end and model-team biased. They must not be applied to Painter OS browser runs.
- The $0.042/M input price from Jev source is not Clef pricing. Clef's documented input price is $0.24/M tokens. Browser runtime, accessibility capture, candidate passes, fallback calls, retries, Browser Run duration and failed tasks all remain cost components.

## Rollback and isolation requirements

- Clef and Jev selection must sit behind a provider-neutral adapter that requires trusted tenant, run and session context, a fresh snapshot revision, an action allowlist and current approval policy.
- Low-confidence or invalid selections must fall back to the normal LLM path or stop. They must never pick a default, and low-confidence fallback must not automatically grant risky calls.
- Any OpenAI fallback remains subject to the public partner commercial subscription restrictions in the existing research. Clef activation needs separate budget and provider authorization, with no hidden fallback billing.
- Selection must be validated against the same snapshot and current origin before execution. A changed node must reacquire state rather than click a stale selector.
- Real Clef calibration (held-out tasks, false-accept and none accuracy, task success, p50/p95 time, full cost, replay and cancel behavior) stays separate from implementation tests.
- Independent exact-head review is required before merge.

## Recommended next evidence (from the detailed record)

- Local browser fixture covering duplicate identical controls, rich-text and iframe fields, scrolling, absent targets, stale revisions, a malicious page prompt, hidden or disabled elements, and a form submit that requires approval.
- Deterministic wire-envelope tests for the TypeSafe and Clef formats, including 64-question splitting, invalid identifier aliasing, invalid probabilities, timeout and 429/503 breaker behavior.
- A pinned browser adapter and decision codec version exercised against a real local browser fixture. Stubbed transport alone is not browser acceptance.

No newly verified implementation procedure resulted from this record.
