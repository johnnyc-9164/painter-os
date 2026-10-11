# Documentation index

Start with [agent setup](development/AGENT_SETUP.md) and the [repository map](../ARCHITECTURE.md). Follow the current issue and source; archived reports describe their tested revision only.

| Question | Source |
| --- | --- |
| What must remain compatible? | [Issue 2 freeze](contracts/issue-2-freeze.md) |
| What is public versus private? | [Marketing/admin split](architecture/MARKETING_ADMIN_SPLIT.md) |
| What should this product become? | [Product intent](product-specs/index.md), preserved [IR](ir/system.ir.yaml) |
| How do agents work and verify? | [Setup](development/AGENT_SETUP.md), [plans](PLANS.md), [evidence procedure](skills/painter-pr-evidence/SKILL.md) |
| What is proven or missing? | [Quality score](QUALITY_SCORE.md), [harness audit](development/HARNESS_AUDIT.md), [technical debt](exec-plans/tech-debt-tracker.md) |
| Where are logs and timing probes? | [Local observability](development/OBSERVABILITY.md) |
| What tables exist? | [Generated host schema](generated/schema.md) and [component source](../packages/contractor-os-core/src/component/schema.ts) |
| What are the design rules? | [Core beliefs](design-docs/core-beliefs.md), [Artisan reference](references/ARTISAN_CORE.md), [marketing design](../apps/marketing/DESIGN.md) |
| Which IR compositions and hooks exist, and what is missing? | [IR-to-component inventory](design/IR_COMPONENT_INVENTORY.md) (issues #6, #188); inventory only, not implementation approval |
| What currently holds production cutover? | [Dated release holds](evidence/current-release-holds-2026-10-09.md), [Vercel quota research](research/VERCEL_QUOTA_2026_10_09.md); source evidence is separate from live rollout |
| What are the browser automation research limits? | [Stagehand/Clef research record](research/STAGEHAND_CLEF_RESEARCH_RECORD_2026_10_11.md) (issue #103); detailed source in [Jev/Clef research](research/JEV_CLEF_BROWSER_2026_10_09.md) |
| What is the archived Pi durability and Convex component research? | [Convex Pi research](research/CONVEX_PI_2026_10_09.md), [Convex components research](research/CONVEX_COMPONENTS_2026_10_09.md); tracking records, not implementation or activation approval |
| What is the archived ChatGPT subscription eligibility research? | [ChatGPT subscription research](research/CHATGPT_SUBSCRIPTION_2026_10_09.md); source assessment only, no live eligibility or OAuth activation |
| What is the proposed CRM source-linkage and contact migration design? | [CRM migration linkage](design/CRM_MIGRATION_LINKAGE.md), [plan](exec-plans/active/crm-migration-linkage.md); design only (issue #161), no runtime |
| What is the scoped Zapier Platform SDK integration plan? | [Zapier Platform scope](design/ZAPIER_PLATFORM_SCOPE.md) (issue #76); assessment only, Zapier claims unverified, no installation or account approval |
| Should Cloudflare Artifacts back agent drafts? | [Cloudflare Artifacts evaluation](research/CLOUDFLARE_ARTIFACTS_EVALUATION_2026_10_11.md) (issue #91); exploratory defer recommendation, not installation approval; earlier [source assessment](research/CLOUDFLARE_ARTIFACTS_2026_10_09.md) |
| How might a painter's existing CRM coexist with Painter OS? | [CRM coexistence plan](design/CRM_COEXISTENCE_PLAN.md); planning only (issue #144) |
| How is cloud deployment configured? | [Deployment guide](CONVEX_DEPLOYMENT.md); requires separate live acceptance |

`docs/harness.json` records owners/review dates for the current agent entry points. `agent:check` validates their links, freshness, schema inventory and source dependency rules. Historical evidence and imported documentation are not silently re-dated or rewritten. The weekly hygiene workflow reports debt/check failures; a human or assigned agent reviews proposed repairs.
