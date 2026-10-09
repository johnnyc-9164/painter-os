# Pinned Pi subscription transport local verification — issue 119

This is an offline compatibility slice following issue 79 and the archived ChatGPT subscription research. It uses the installed MIT-licensed `@earendil-works/pi-ai@1.1.0` public Responses `stream`, injected `fetch`, `onPayload` and `onProviderStreamEvent` seams. No vendor source, OAuth flow, account/client registration, credential storage, provider account, production endpoint or business writer is changed. The production worker remains its existing always-503 adapter.

The OSS preview documentation supplies a **compatibility target**, not a commercial grant. Painter OS's remotely hosted commercial registration, applicable partner request requirements and real owner/account eligibility remain unconfirmed. The built-in `dynamic_agent_client` registration flow is neither imported nor executed. No plan label, token prefix, model bundle or caller-supplied connection string establishes commercial eligibility.

## Modular policy boundary

New `subscription-transport.ts` is unconnected to the production handler or conversation harness. It consumes caller scope separately from a trusted fixture binding, compares actor/workspace/connection IDs, refuses revoked bindings, and restricts selection to explicit account-model IDs. These are policy inputs, **not live Convex membership or signed capability proof**. The only positive mode is `fixtureOnly:true` with mandatory injected transport and a fixed synthetic bearer; there is no real credential parameter, global fetch fallback, OAuth resolver or activation switch. Future activation requires an actual trusted membership/connection/permission resolver rather than promoting fixture strings to authority.

Pi owns provider parsing and stream/message lifecycle. The policy does not create a second conversation runner, tool dispatcher, durable retry queue or business authority. Convex remains the business writer. This first scope forbids tools, tool results, images, reasoning and mid-conversation system updates; **every outcome has `toolsReady:false`**. It is deliberately narrower than the documented potential namespaced function/custom-tool route, which needs a separate reviewed implementation.

The policy checks the exact public Responses endpoint and POST method, validates `store:false`, `stream:true`, selected model and full explicit transcript, and converts the leading instruction message to an explicit developer message. A strict final body allowlist runs after Pi sampling parameters and any supplied `onPayload` override, then runs again on the actual serialized body immediately before injected fetch. Unsupported fields, hosted/native tools, previous-response/conversation/background state or omitted/replaced history fail before transport. Input history is bounded to 128 messages, 32,768 characters per message and 131,072 serialized characters; output deltas and final text are bounded to 32,768 UTF-8 bytes. Response bytes are capped at 262,144 before the vendor SSE/JSON parser, and at most 256 parsed provider events are admitted. These are local memory/compatibility limits, not provider financial quota enforcement.

Success requires observing the raw `response.completed` with completed status and an actual Pi terminal stop. Pi's normalized `done(length)` for `response.incomplete` is explicitly insufficient. Failed/incomplete/duplicate terminal events, abrupt EOF, tool calls and post-text failures never produce successful text or a tool-ready result. Partial text and raw provider diagnostics are discarded on failure. Structured safe outcomes distinguish quota pause, unavailable, ineligible, unsupported, incomplete and protocol failure.

Both Pi and its underlying OpenAI request retry paths are configured off. HTTP 429 makes one attempt and returns quota pause. HTTP 503 also makes **one attempt**, with an optional capped 30-second retry hint; the module does not sleep or implement backoff, and does not automatically retry. There is no API-key/provider fallback or automatic credit opt-in. A caller cannot turn late sampling options into retry/fetch/header credentials because the public override type exposes only body-related seams, and the fixed enforced transport fields follow those overrides.

## Actual installed SDK evidence

Ten focused Node tests execute the actual installed Pi HTTP/SSE path. They capture the real request body and synthetic Authorization header, reject any global fetch, and exercise:

- Exact endpoint, developer instructions and earlier user/assistant/current transcript retention.
- Separate binding mismatch, revoked connection, unselected model and unsupported endpoint/provider refusal.
- Last-minute sampling/model/onPayload body overrides, tool declarations and image/system-update refusal before fetch.
- Quota failure after text, incomplete/length and EOF, with no leaked partial text or provider diagnostic.
- HTTP 429/503/401/403/400 with exactly one request and no fallback.
- Completed and unfinished function calls, hosted-tool terminal output, conflicting terminal events and UTF-8 output bounds.
- Raw response byte/event limits and runtime refusal of out-of-contract credential/header override keys.

The tests directly demonstrate that unwrapped Pi reports incomplete max-output-token streams as `done(length)`, while the host policy returns `incomplete`. This is actual installed execution, beyond the inspected-source assessment in `/workspace/painter-pi-subscription-transport-research-2026-10-09.md`.

New `tests/subscription-transport.test.mjs` imports the TS source using Node 24's supported type stripping. It is already covered by the existing worker `node --test tests/*.test.mjs` command, so no package/test-runner/root dependency or lock changes are needed. Existing worker durable lifecycle tests and the production 503 test remain part of the same default gate.

## Separate activation holds

Live work still requires approved commercial client registration and applicable partner requirements, explicit owner plan-use consent and trusted account-model catalog, live trusted Painter membership/connection binding, protected rotating credential storage, refresh/revocation synchronization, current permission/budget checks, and separately approved bounded live read-only acceptance. Public anonymous owner-sponsored traffic remains an unresolved separate use case. Local fixed-token fixtures prove no live model acceptance, allowance, plan eligibility, token refresh or deploy readiness.

Skill extraction reuses `docs/skills/painter-pr-evidence/SKILL.md`: actual installed receipts remain distinct from source inspection and live activation. No new operating skill or authority was invented. Exact head, gate results and independent root acceptance follow below.

## Local verification receipt

Base main: `0476b39085d230058aba56ab8bdea3dabfcf5412`. Isolated checkout `/workspace/subscription-transport`, requested Git author Johnny Cage `<johnnyc@agentmail.to>`. Fresh pinned npm 11.16 `ci --ignore-scripts` and npm-invoked agent doctor passed. Ten focused installed-SDK tests, worker TypeScript, scoped source ESLint, agent check and diff check passed. The default worker gate passed 18 tests (production/fixture dry-run builds plus eight existing lifecycle/closed-production and ten transport tests); a subsequent immutable model-selection guard also passed the ten focused tests, and the exact-head default gate is rerun for the review receipt. No manifests, lock, test scripts, production handler, Convex schema, provider settings or vendor source changed. Dry-run builds/local Miniflare do not deploy. Root review and exact CI remain pending.

Exact source head `7248c25a61db9491b3d5b49f81a794af45d4f76e` default worker gate passed all **18 tests**, including both dry-run builds and production 503 checks. Main `266023ce9c1449699d77256db97bbbda8674e4b8` subsequently integrated normally; its four changed files concern backend auth origins only, with no worker/source/test/dependency overlap. The owned three-file implementation is unchanged; ten focused SDK tests plus worker types/lint/agent checks are reverified on the integration.
