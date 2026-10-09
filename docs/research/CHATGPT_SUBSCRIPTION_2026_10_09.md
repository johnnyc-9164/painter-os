# Painter OS ChatGPT-subscription integration research — 2026-10-09

Tracking: [issue #79](https://github.com/johnnyc-9164/painter-os/issues/79). Research readiness criteria remain open; this record does not complete implementation or live eligibility.

Read-only official-source assessment. No registration/application, OAuth exchange, credential access, provider activation, or account settings changes performed.

## Conclusion

A supported Sign in with ChatGPT plan-usage path now exists for participating commercial apps. It is not universally available: commercial registration is currently selected partners/waitlist. Painter OS's remotely hosted Vercel/Cloudflare product cannot assume eligibility or use the open-source/local dynamic-registration flow as a substitute.

Personal owner-initiated admin agents fit the documented user-consented, on-behalf-of-user model, conditional on commercial acceptance and actual granted inference permissions. No reviewed source authorizes pooling an owner's subscription for anonymous public visitors or other customers. That public lead-chatbot arrangement is unresolved, not established as categorically prohibited by this research: ask the partner program to explicitly confirm a sponsored/anonymous use case before designing or enabling it.

## Official findings and sources

1. Updated Help Center explicitly includes Go, Plus and Pro subscribers in participating commercial apps. Sign-in and use-of-plan consent are separate. Usage counts toward ChatGPT Work/Codex included allowances; app weekly cap does not add quota. Credits require explicit opt-in; no automatic paid fallback. Infrastructure/app subscriptions may still cost money.
https://help.openai.com/en/articles/20001542-using-your-chatgpt-plan-in-other-apps-and-sites

2. Commercial client ID access is selected partners; interest form is a waitlist/application, not proof of approval.
https://developers.openai.com/siwc/request-client-id
https://openai.com/form/sign-in-with-chatgpt-interest/
No form was submitted.

3. Developer OSS plan-usage overview explicitly says these docs apply to open-source and locally hosted apps; paid OR remotely hosted apps should complete commercial interest form. Making repository public alone would not establish hosted Painter OS entitlement. The OSS client registration binds user and selected workspace, with stable host IDs per environment.
https://developers.openai.com/siwc/token-sharing-open-source

4. Identity scopes do not authorize inference. OpenAI sign-in should be linked as a consented provider connection to existing trusted Painter OS membership/Better Auth, not silently replace existing business auth. OpenAI sub/email are not company tenant IDs.
https://developers.openai.com/siwc/quickstart
https://developers.openai.com/siwc/token-sharing-open-source/sign-in

5. Publicly documented OSS inference endpoint is POST https://api.openai.com/v1/responses with OAuth access token as Bearer, not ChatGPT backend-api. Official Python OpenAI SDK example passes that token through api_key; this is supported for the documented authorized flow, not a permission to repurpose arbitrary Codex tokens. GET /v1/models returns account-specific catalog with models/slug/display_name/visibility. This differs from assumptions about a general API-key catalog.
https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference

6. Preview requirements: store:false, stream:true, explicit input context; success only after response.completed. response.failed can arrive AFTER text deltas, including usage-limit failures. HTTP previous_response_id/conversation/background and max_output_tokens are unsupported. Hosted MCP/connectors, tool_search, image generation, file search, Code Interpreter and native computer use unsupported. Client-executed namespaced function/custom tools can support local MCP separately. Therefore Pi's current OpenAI Responses adapter requires an exact-wire compatibility audit: no assumption it already works with subscription requests. Zapier MCP should run in trusted app tool execution, not unsupported hosted Responses MCP.
https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

7. OSS documented access lifetime one hour; refresh token 30 days rotating with fresh lifetime. Persist replacement access/refresh pair atomically; synchronize refresh ownership across resumed workers. Published commercial partner flow may have additional confidential-client requirements, which cannot be inferred by copying OSS host registration or scopes.
https://developers.openai.com/siwc/token-sharing-open-source/token-reference

8. Handle missing plan-use consent by disabling inference while retaining valid sign-in. Usage exhausted -> pause, unavailable -> bounded backoff, unsupported capability -> fix body, ineligible -> explain not retry repeatedly. No immediate push notification of disconnect: request/refresh failure must stop invalid token use. Do not auto-switch to separately billed API, use someone else's connection, or enable credits.
https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery

The quickstart still names Plus/Pro whereas the newer Help Center names Go/Plus/Pro; use newer explicit consumer availability statement and verify actual partner/user eligibility at activation, not hard-code entitlement from plan label alone.

## Ready-to-build issue criteria

A. Commercial eligibility/application preparation (not submission): prepare Painter OS product, actual Vercel origins, privacy/data handling, scoped admin use case, Pi/Cloudflare runtime design, owner-consented quota, public sponsored-chatbot question, retention, revocation and cost controls. Obtain approved commercial client ID + registered redirect/origin configuration and written applicable integration requirements before live OAuth. Owner must explicitly authorize any application submission.

B. Offline subscription-provider contracts: distinguish not_registered, disconnected, identity_only, plan_authorized, quota_paused, unavailable, unsupported and completed/failed stream outcomes. Bind connection to trusted actor/workspace; no public owner token route. No API-key fallback, credit setting changes, leaked credentials, copied Codex auth files or backend-api URLs. Tests use local fixtures without inference charges.

C. Actual Pi transport compatibility spike: pinned runtime/SDK, local deterministic Responses SSE/model-list fixtures; verify store:false/stream:true/full context, no unsupported fields/tools, terminal completion, post-delta failure, account-specific model selection, namespaced/custom app tools, retry/error classification, token rotation race and resumed run reauthorization. A generic api_key parameter accepting a string does not prove wire compatibility.

D. Approved own-admin live acceptance: selected owner explicitly connects ChatGPT under authorized commercial flow and consents plan usage. Verify account binding, quota pause, revocation, no unauthorized fallback, bounded read-only request, completion and own usage receipt. Provider connection cannot establish company membership or grant extra business permissions.

E. Anonymous website chatbot: keep separate blocked acceptance criterion until partner program confirms owner-sponsored public traffic is supported. If not confirmed, preserve subscription-only instruction: build bounded deterministic FAQ/lead intake or authenticated bring-your-own approved plan flow; do not silently bill API or pool credentials. Each option's UX should state actual capability.

F. Production readiness: commercial acceptance, protected storage, compliant SDK request behavior, revocation and refresh tests, live owner-bound proof, approved budgets and public-chatbot funding decision must be evidence-backed. Infrastructure remains separately metered; subscription inference does not make Cloudflare, Vercel, Zapier or agent operations free.

No implementation procedure was validated; this research creates readiness requirements only.

