# Quality and verification scope

Reviewed 2026-10-07 against main 6cd31b871188c02602a81b2a40bef61b570a65a3 and this harness branch. Grades describe evidence coverage, not production safety. Fresh execution receipts belong to the reviewed head; historical README/release reports are not current receipts.

| Area | Coverage grade | Existing evidence / remaining gap |
| --- | --- | --- |
| Domain / money / lifecycle | Automated coverage | Root/domain tests; no real-customer acceptance inferred |
| Convex host / tenant projection | Automated coverage | convex-test suites; live deployment/session/storage requires separate verification |
| Original core / trade components | Automated coverage | verify:all and composition validators; no real-data store cutover |
| Public/admin separation | Automated coverage | Separate builds, published DTO and marketing boundary tests; new import check; routing/cookie cutover held |
| Auth / invitation / email | Live acceptance missing | Local auth is synthetic; verified cloud login/invitations/delivery cannot be inferred from unit tests |
| UI | Partial | Existing HTTP/browser acceptance and new smoke command; browser execution environment may block sandbox |
| Agent setup / knowledge | New harness pending exact-head receipts | Doctor, isolated dev, docs/schema/dependency checks and combined verifier added |
| Observability / performance | Partial local | Startup/HTTP timings and logs; no full distributed trace stack or production budgets |
| SaaS billing / onboarding | Future scope | Individually deployed model first; subscriptions not implied by invoice/payment recording |

An agent that executes a gate should attach its receipt and report failures accurately. Update grades after meaningful evidence changes, not merely after adding a script. [Debt](exec-plans/tech-debt-tracker.md) holds remaining work and decision ownership.
