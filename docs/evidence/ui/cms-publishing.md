# CMS mutation-to-public-query acceptance

Issue #18, baseline `73a3d24b53672ce86fbc94f731b54d4955b9b539`. The previous `published-articles.test.ts` seeded published/draft/private rows directly. It verified projection filtering but did not establish the create/update/publish mutation path.

`cms-publishing.test.ts` uses the existing convex-test database/index/transaction harness and the auth-boundary mock pattern from `painter.test.ts`. Authenticated synthetic identities map to mock Better Auth user IDs; the real host resolves roles and enabled tenant membership from `painterMembers`. Browser role input is not authority. Article creation, editing, publishing and replay call `painter.command`, exercising the existing domain engine and persistence, before anonymous reads call `painter.articles`.

Four acceptance cases cover: real author/edit/publish with exact receipt replay and no duplicate effects; tenant isolation and draft/private/internal-field exclusion; denied unauthenticated/nonmember/crew/foreign-workspace writes without entity/event/receipt effects; disabled membership rejection before receipt replay. Membership and private/internal-field fixtures are inserted directly and identified as fixtures, not live onboarding or a new private-authoring flow.

Configured command: `npm run test:convex` (the existing glob discovers the additive test). No dependencies installed locally because prior workspace installations exhausted disk. Local execution of the Convex fixture is blocked by absent dependencies; exact-head GitHub CI must execute it before acceptance. Static inspection and whitespace checks are separate from executed tests. This adds tests/evidence only; no runtime, auth/provider, CMS authority, API, routing, origin or deployment change.

This is synthetic backend acceptance, not mounted UI authoring, real Better Auth login, production data, provider delivery or deployed cross-origin/cookie cutover acceptance. Issue #18 remains open for those gates.

Initial CI run `37247351317` actually executed all four new cases: three passed; the denial no-effects case failed because its baseline preceded the second workspace fixture's legitimate `workspace.create` event. The repair places all membership/workspace fixtures before the baseline capture and preserves every denial and full entity/event/receipt equality assertion. No runtime failure was inferred or changed. Fresh exact-head CI is required after this fixture-order repair.

Post-run extraction: reused `docs/skills/painter-pr-evidence/SKILL.md` for exact-head receipts. No new skill was created because this run applies the existing procedure; the new test fixture is coverage, not a separate reusable workflow.
