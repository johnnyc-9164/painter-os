# Painter OS Convex component research — 2026-10-09

Tracking: [#72](https://github.com/johnnyc-9164/painter-os/issues/72), [#78](https://github.com/johnnyc-9164/painter-os/issues/78), [#94](https://github.com/johnnyc-9164/painter-os/issues/94), [#102](https://github.com/johnnyc-9164/painter-os/issues/102). Runtime and provider acceptance criteria remain open.

Official-source assessment only; no installs, accounts, credentials, provider activation or deployed component changes. Applied Convex expert skill guidance: typed host authorization, indexed bounded queries, registered object-form functions and actual installed/codegen proof. User's existing Better Auth/session authority overrides generic alternative-auth examples.

## Recommendation and actual packages

| Component | Current directory metadata | Fit |
|---|---|---|
| Rate Limiter | @convex-dev/rate-limiter 0.4.1 | Highest priority: shared server-enforced intake/actor/workspace/provider admission limits |
| Firecrawl | @firecrawl/firecrawl-convex 0.1.1 | Useful for bounded bid-source research and durable crawls with provenance; provider activation separate |
| Action Cache | @convex-dev/action-cache 0.3.1 | Optional read-only normalization/retrieval reuse after measured redundant calls |
| Workpool | @convex-dev/workpool 0.4.13 | Optional bounded independent bid-source ingestion; never second Pi conversation queue |

Versions are directory/source metadata, not Painter OS installed proof. Repo mounts currently Better Auth, Contractor OS, painting and AgentMail; these four components are not installed/mounted. Keep imports, singlewriters and existing email delivery budget intact until a reviewed mapping/replacement exists.

## Rate Limiter

Official supports transactional fixed-window/token-bucket counters, keys, burst capacity, reservations, sharding, return retry timing, reset/getValue and optional client hooks. The hook informs UI only; server limit call authorizes admission.
https://www.convex.dev/components/rate-limiter/llms.txt
https://www.convex.dev/components/rate-limiter/rate-limiter.md

Apply multiple independent limits:
- public intake: server-resolved public-site tenant plus trusted proxy/IP/session strategy and global ceiling; browser-selected tenant/IP is not trusted;
- authenticated operations: trusted actor + workspace;
- shared provider: account/connection-level ceiling across all tenants plus per-tenant fairness;
- Pi admission/paid tool request: same Convex admission boundary before dispatch, not duplicate Pi lifecycle.

Important: a limit inside a failed parent mutation rolls back. Throwing after debit cannot be claimed to count denied/failed abuse attempts. If the product requires counting rejected attempts, use a committed admission receipt/structured denial boundary or separately owned atomic gate and test actual transaction semantics. Action external effects cannot roll back when a later DB operation fails.

Rate limiting is not exact dollar spend accounting. Reserve conservative request/page/token allowance before dispatch, assign idempotent operation receipt, reconcile measured usage and retain uncertain reservations until outcome clarified. RateLimiter reserve:true is queue capacity reservation, not automatically a financial prepaid ledger. Avoid oversharding an exact global cap without evaluating algorithm guarantees and contention/fairness.

## Firecrawl component: real official package versus community alternative

The official vendor package is @firecrawl/firecrawl-convex, directory at /components/firecrawl/firecrawl-convex. Searching /components/firecrawl alone returns notfound. Community convex-firecrawl-scrape is a different package and should not be mistaken for this integration.
https://www.convex.dev/components/firecrawl/firecrawl-convex/llms.txt
https://github.com/firecrawl/firecrawl-convex

Supports scrape/map/search one-shot Convex actions over Firecrawlv2REST and durable crawl rows/pages with reactive queries, webhook delivery plus polling watchdog and terminal onComplete internal mutation. Firecrawl owns crawl progress, not Pi run/transcript. Pi can start an independently owned crawl and reference its ID/status without mirroring/requeueing it.

Host auth/ownership: components cannot see ctx.auth. Create host crawl→workspace/actor mapping before exposing get/list/page/cancel/delete/resume. Raw one-shot returns validated v.any, so normalize/validate bounded public-safe result contracts in host adapter. onComplete context is carried through unchanged, not trusted authority by itself; callback resolves persisted trusted ownership and current permission. Do not directly publish crawl text as CMS/business facts.

Security/cost: server-held FIRECRAWL_API_KEY; explicit webhook HMAC secret required by Painter policy even if upstream optional, per-crawl token also verified; URLs/origins/redirects/local addresses allowed only under reviewed policy. Bound pagecount, links, bytes and crawl depth and paid operations. Content untrusted: no instruction/tool escalation. Extract bid amount/deadline/source URL/fetchedAt with evidence; unknown or conflicting values remain unverified. Crawling neither proves eligibility nor creates actual bid submission/payment evidence.

Vendor docs record402credits exhausted and429rate limits; transient retries3times with Retry-After. Track retry charges and ambiguous start outcome. cancel may stop tracking/request provider cancellation but cannot guarantee already accepted remote work undone. Document/page1MB limits cause truncation/dropped whole JSON/screenshots and unstored counts; retain flags and disallow false complete evidence. ~250poll/status checks timeout terminalfailed; resume restarts tracking, not new unrestricted crawl.

Built-in maxAge cache may remove need for additional ActionCache at first. Upstream supplies convex-test registration, stubbedfetch fixtures and local mock Firecrawl server with signedwebhooks and pollmode, no credits. Do not copy demoanonymous flag into production.
https://github.com/firecrawl/firecrawl-convex#testing
https://github.com/firecrawl/firecrawl-convex#try-it-locally

Sourcepackage0.1.1 declares Convex peer^1.43.0 and helper dependency^0.1.122; repo observed Convex1.46.0/helpers0.1.124 compatible semver, but typedcomponentenv/mount/codegen/runtime compatibility remains actual-install verification. Current mount defineApp() lacks typedenv configuration; adapting it must preserve existing mounts/HTTP routes, auth and AgentMail hold.
https://github.com/firecrawl/firecrawl-convex/blob/main/package.json

No price promise: Firecrawl account/plan/credits plus Convex action/database/storage usage remain separately metered; current official introduction does not establish owner's plan quota. Existing researchconnector tool access is not Painter OS provider credential authorization.
https://docs.firecrawl.dev/introduction

## Action Cache

Wraps internal actions; key includes actionname+args; configurable TTL/nameversion, forcefetch, removal and dailycleanup. Cache only retrieval/normalized derivations. Include trusted tenant, source URL/query, parserversion, permission/connectionrevision and datafreshness policy in key. Check membership before serving cache. Don't include secretcredential as cacheargument/key, cache mutable write responses, approve effects using stale caches or equate cachehit with idempotency. Scrape maxAge already offers provider cache, and existing Convex reactivequery cache handles ordinary reads.
https://www.convex.dev/components/action-cache/llms.txt

## Workpool

Separate pool concurrency limits, retry/backoff/jitter, reactive workstatus and callback(success/failed/canceled). Retries appropriate only when idempotent; cancel prevents future starts/retries but does not stop currently running action. Default statusretention1day is not auditretention. Use for distinct background bidrefresh workloads if needed; don't enqueue each Pi step into it or wrap Firecrawl durablecrawl in competing retries. No Workflow/Agent mount needed for Pi-owned conversation.
https://www.convex.dev/components/workpool/llms.txt
https://www.convex.dev/components/workpool

## Other components: defer until concrete use case

RAG only if accepted searchable knowledgebase with source/permission provenance, not automatically for scraped bids. Aggregate/shardedcounter only if indexed paginated queries cannot provide measured dashboard scale. Migrations useful for actual data evolution; user says no realcompanydata yet, avoid invented migrationgate. Crons may help scheduled refresh if needed; don't duplicate same schedule in Pi/Cloudflare/Convex. BetterAuth and AgentMail are already present; don't replace identity/email authority. Convex Agent/Workflow remain alternative architecture, not companion transcript/lifecycle owners to Pi.

## Bounded issue sequence and acceptance

1. Shared admission contract and RateLimiter mount: host-resolved keys, global+tenantlimits, idempotencyreceipts and denialreturn. Independent concurrency/rollback/fairness tests, forgedtenant/IPdenial, no-doubledebitretry, committeddenialsemantics, no providercall when budgetdenied; preserve existingemailbudget and auth.
2. Firecrawl typedadapter/hostownership/localmock: allowlisted sourceURLs, bounded scrape output+provenance, durablecrawl mapping, signed/replayedwebhooktests, unauthorizedread/cancel/delete, credits402/429, polltimeout/truncated/unstored, restartlocalConvexcrawlprogress, duplicatecallback handling. Actualinstalledcomponent/anonymouslocaldeploy receipt; no paidprovider calls.
3. Bid-source ingestion projection: store unverified sourcerecords separately from actual businessagreements; dedupe sourceidentity/revision, typed parser+verificationstatus, review UI and freshness. Website content cannot grant writeauthorization.
4. Optional ActionCache/Workpool only after concrete measured repetition/concurrencyneed and overlapassessment. Test cachecross-tenantdenial/invalidation and queuedcancel/inflighttruth; reservebudgetbeforeexternaldispatch.
5. Separate activation/live issue: explicit provideraccount/key/budget, trusted webhookorigin/HMACsecret, deployment route review, source permission, exact-head independentreview, bounded live readonly scrape then boundedcrawl. No upgrades, secretsread or provideractivation authorized by research.

Skill extraction: reused convex-expert guidance and existing painter-pr-evidence exacthead process; no verified reusable implementationprocedure generated by research.
