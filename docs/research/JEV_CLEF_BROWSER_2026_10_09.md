# Jev browser automation and Clef compatibility — 2026-10-09

Tracking: [issue #94](https://github.com/johnnyc-9164/painter-os/issues/94). Runtime compatibility, calibration and deployed acceptance remain open.

Read-only primary-source research. No installs, model/provider calls, browser sessions, credentials or account changes.

## Actual integration identified

The LangChain article points to Kyle Jeong of Browserbase. The concrete integration is Browserbase Stagehand browser primitives, not demonstrated integration in the distinct Python browser-use/browser-use project. Browserbase's own explanation describes retrofitting its Act/Observe/Extract primitives with Jev. No primary browser-use/browser-use Jev integration was located by targeted search; absence of search results is not proof none exists.

https://www.langchain.com/blog/building-a-harness-with-jev
https://www.browserbase.com/blog/what-is-jev
https://github.com/browserbase/stagehand/pull/2951
https://github.com/browserbase/stagehand/pull/2952
https://github.com/browserbase/stagehand/pull/2953

## What Jev does in the real browser pipeline

1. Capture a hybrid accessibility outline with editable-node flags, including contenteditable/iframe context. Build small per-action views, not screenshots fed to a generic agent.
2. Classify instruction intent: action family, key/chord, scroll scope, mouse button/toggle end state and quoted-value identity. This initial decision can happen before DOM capture/settle completes.
3. Ground arguments in code. Quoted strings/variables become exact spans; unquoted text may require a tiny argument-only generative model call whose output must be a span of instruction. Jev cannot invent free-form text arguments.
4. Construct candidate IDs from actual current nodes and enrich descriptions with ancestors/headings/card rows/table row+column/position/iframe context. Pre-rank/shard large sets within limits.
5. Ask best candidate and strict candidate-with-none questions. The original library describes none veto above0.9, uneasy hold while next tier tries, twin vote merging, ambiguity stopping instead of guessing. Blog describes0.7 acceptance threshold: these are experimental tuned decision rules, not general safety guarantees.
6. Use selected real candidate to call existing deterministic Stagehand action execution. Fill readback and native-select selected checks verify outcomes; no-effect/page-state checks determine whether to refresh/retry or defer.
7. On ambiguity, unsupported family, low confidence, malformed answer, provider outage or failed verification, fall back to the normal LLM pipeline with shortlist context. Reject unsafe actions independently.

This is selection/control inside an existing browser tool. It does not replace the Pi planner, existing company approval authority, or tool execution policy. Constrained output prevents out-of-schema identifiers; it does NOT prevent choosing the wrong valid button or performing a destructive action.

## Source status and package caveat

PR2952 library shows merged status and source code/comments; PR stack topology and latest provider/namespace layers remain experimental. PR3103 public experimentalDecisions namespace proposal is DRAFT as inspected. PR2993 overlap performance proposal also DRAFT. Do not infer a released npm version/public SDK export from PR descriptions.

PR3103 proposes:
- experimentalDecisions configuration with provider/apiKey/accountId;
- stagehand.experimentalDecisions.act/observe/extract in TS, corresponding Python/Go methods;
- removal of earlier STAGEHAND_EXPERIMENTAL_DECISIONS env bridge.
This differs from original PR2953 env-gated implementation. Before adopting, pin exact released package/version or explicitly reviewed upstream commit and prove installed exports/protocol compatibility.
https://github.com/browserbase/stagehand/pull/3103
https://github.com/browserbase/stagehand/pull/2993/changes

## Clef can use the same selection architecture, with qualifications

PR3102 already adds a provider seam including Cloudflare Clef/clef-flash. It encodes SystemOne state/questions, targets Workers AI account run endpoint, unwraps REST result envelope, aliases restricted IDs/text state, splits provider question caps, handles one-option choice locally because Clef requires more options, validates returned answer identifiers/types/probabilities and shares timeout/Retry-After/circuit breaker logic.

Crucially PR author reports LIVE TypeSafe conformance passing, Cloudflare/Perplexity only documented-format tests without credentials, OpenAI preview key403. Its OpenAI codec is based on a preview user's recording without public schema: not an approved Painter OS implementation path. Thresholds tuned on Jev need a separate Clef calibration/eval pass.
https://github.com/browserbase/stagehand/pull/3102

Official Cloudflare documents Clef SystemOne compatibility and env.AI.run("@cf/cloudflare/clef", {model:"clef",state,questions}). Binding returns answers directly; REST wraps result. Clef questions cap64 and restricted IDs; context65,536 tokens, long state may truncate, multimodal extensions differ from original Jev text states. Don't silently truncate a critical candidate or approval context. Current model page lists$0.24/M input tokens.
https://developers.cloudflare.com/changelog/post/2026-10-01-clef-workers-ai/
https://developers.cloudflare.com/workers-ai/models/clef/

## Costs and evidence

Browserbase blog reports early Act median1.97s→0.46s (~4.3x), not end-to-end task or independent production benchmark. PR2953 reports breadth40tasks39/40 vs35/40,3.19s→0.77s, with explicit in-sample threshold tuning, unpublished breadth/report scripts and incomplete decision-token metadata. These results are author-reported and not reproduced here.

TypeSafe marketing reports broad classifier200x/400x or workflow193.6x/444.6x gains, but acknowledges gains high-end/model-team bias and different reasoning modes. Do not apply those to Painter OS browser runs. Input pricing $0.042/M from Jev source is not Clef pricing. Browser runtime wait, AX capture, candidate passes/sharding, fallback generative calls, retries, Cloudflare Browser Run duration and failed tasks all remain cost components.
https://typesafe.ai/blog/introducing-system-one-models-and-jev

## Workers Browser Run / Pi fit

Pi remains durable planner/transcript owner; a bounded browser tool captures state, calls Clef selection adapter, executes approved action via existing Browser Run API, verifies result and returns receipt. Stagehand's extension/protocol/browser plumbing is not automatically a Worker-compatible SDK; Cloudflare Browser Run/CDP support and exact pinned Stagehand runtime require installed proof.

The separate browser-use open-source agent quickstart uses Python3.12 examples and its own Agent/model/browser loop; Cloud SDK offers Python/TS managed runs. Importing Python agent into JS Worker is not valid compatibility proof and can duplicate agent ownership. If later selected, deploy it as explicit separate compute/service with trust/lifecycle boundaries; current evidence favors borrowing Stagehand closed-candidate technique rather than casually installing another agent.
https://docs.browser-use.com/open-source/quickstart
https://docs.browser-use.com/

## Bounded issue implementation and fixture criteria

- Own a provider-neutral browser candidate-selection adapter; require trusted tenant/run/session, fresh snapshot revision, action allowlist and current approval policy. No generic classifier approval bypass.
- Local browser fixture with two identical buttons, rich-text/iframe fields, scrolling, absent target, stale DOM revision, malicious page prompt, hidden/disabled element, and form submit requiring approval.
- Deterministic SystemOne fixture tests TypeSafe and Clef wire envelopes,64cap splitting, invalid ID alias, nan/out-of-range/missing probabilities, none veto/lowconfidence/ambiguous tie, timeout429/503breaker, supported singleoption behavior. Invalid answer escalates/stops; never picks default.
- Validate execution target still belongs to same snapshot/current origin; changed node reacquires state, rather than clicking stale selector. Verify readback/real effect and capture bounded receipt.
- Test argument grounding, placeholder/redaction including short secrets and errors, origin/redirect/SSRF restrictions, cross-tenant session denial, approval expiry/revocation, cancellation and timeout-after-accepted effect reconciliation. Low-confidence fallback cannot automatically grant risky calls.
- Pin actual Browser Run/browser adapter and decision codec version, run a real local browser fixture through selection and deterministic execution. Stubbed transport alone is not browser acceptance. No live paid calls required for this fixture slice.
- Keep real Clef calibration separate: held-out representative tasks, falseaccept/none accuracy, task success, p50/p95 end-to-end time, all provider/browser/fallback costs, replay/cancel behavior. Do not copy Jev0.7 as production threshold.
- Public partner commercial subscription restrictions remain unchanged for any OpenAI fallback. Clef activation has separate budget/provider authorization; no hidden fallback billing.
- Independent exact-head review before merge; platform readiness remains open until actual installed runtime and separately authorized deployed acceptance are evidenced.

No newly verified implementation procedure resulted from source research.
