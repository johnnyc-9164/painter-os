# Harness engineering audit

Source: [OpenAI, February 11, 2026](https://openai.com/index/harness-engineering/). This is an adaptation to Painter OS, not a claim that OpenAI's entire internal environment has been reproduced. Existing freeze/review rules take precedence over the article's throughput tradeoffs.

| Article capability | Painter OS implementation or explicit gap |
| --- | --- |
| Small instructions as a navigation map | Root AGENTS retains current rules and links setup, architecture, docs, plans and quality; 100-line ceiling enforced |
| Versioned knowledge and progressive disclosure | Current documentation index, core beliefs, product intent, schema inventory and owners/review dates; imported history preserved |
| Worktree-specific runnable app | agent:dev uses isolated checkout/build, auto loopback port and per-run synthetic data; provider env files rejected |
| Browser-visible UI and evidence | Existing lifecycle/browser scripts; new sandbox-enabled navigation/mobile smoke, screenshot/video artifacts; sandbox availability still must pass |
| Readable logs, metrics and traces | Local Next logs, startup timing, anonymous HTTP metrics and redacted request spans; full LogQL/PromQL and internal distributed traces remain missing |
| First-class plans and decisions | Plan template, active/completed folders and versioned debt ledger; issue/PR evidence remains authoritative |
| Enforced architecture | New literal import/export dependency checks (not a complete security/transitive-call analysis) plus existing tenant/public projection, money, component and compatibility tests |
| Remediation-friendly checks and taste | Errors point to typed seams; source size ceilings baseline existing large files rather than requiring unrelated refactors |
| Review/repair loop | Existing exact-head evidence skill and distinct reviewer; fail-fast combined verifier with per-gate receipts; cloud acceptance still separate |
| Agent autonomy through PR completion | Preparation, checks and receipts implemented; agent capabilities/auth depend on runner; no fabricated dispatch or self-approval |
| Continuous entropy cleanup | Scheduled read-only hygiene checks, current quality/debt documents; autonomous repair-PR agent not provisioned |
| Minimal blocking merge gates | Intentionally not adopted: Painter's independent review, money/auth rules and production holds remain in force |

A development harness is not a finished product. Do not mark cloud auth, onboarding, provider email, migration or real customer acceptance complete based on local tests. See [quality](../QUALITY_SCORE.md) and [debt](../exec-plans/tech-debt-tracker.md).
