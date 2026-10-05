# Auth email callback preparation

Scope: Refs #4 and #21. Better Auth remains the token, user and session owner. The additive `authEmailDelivery.ts` factory maps the SDK's user email and unchanged SDK URL to one typed delivery interface. Its default transport delegates to the existing AgentMail outbound-denied boundary. There is no client construction, credential lookup, provider API, queue, automatic retry, mailbox or webhook operation.

Production `auth.ts` and `http.ts` are unchanged: callbacks are not installed, `requireEmailVerification` remains false, and reset/verification endpoint configuration is not activated. Installing callbacks is material: the SDK creates a reset record before attempting delivery. Secure configuration, sender approval and explicit live activation remain held, as do deployed/live email acceptance and the broader auth criteria.

## Versioned source and failure semantics

Current [Better Auth email/password documentation](https://better-auth.com/docs/authentication/email-password) describes callbacks, but the inspected current docs display 1.7.7. Tests use the repository's exact pinned 1.6.17, its [memory adapter export](https://github.com/better-auth/better-auth/blob/v1.6.17/packages/better-auth/package.json), [verification implementation](https://github.com/better-auth/better-auth/blob/v1.6.17/packages/better-auth/src/api/routes/email-verification.ts), [reset implementation](https://github.com/better-auth/better-auth/blob/v1.6.17/packages/better-auth/src/api/routes/password.ts), and [context failure handling](https://github.com/better-auth/better-auth/blob/v1.6.17/packages/better-auth/src/context/create-context.ts).

In 1.6.17 `runInBackgroundOrAwait` catches/logs callback failures; endpoint `status: true` is an anti-enumeration response, not a delivery receipt. Our callback awaits and propagates delivery rejection to its caller, and the SDK test explicitly distinguishes this from endpoint status. No custom failure bypass, tokens, retry queue or exactly-once delivery claim is added. The existing [official AgentMail component](https://github.com/agentmail-to/convex/tree/46bde1a9132599760f425b55c9e29d5ba86ea7df) registration remains disabled; enabling it is outside this preparation.

## Checks and limits

- Native `tests/auth-email-preparation.test.ts` asserts prepared callbacks stay out of actual production configuration/routes.
- `packages/backend/tests/auth-email.test.ts` runs actual `better-auth/minimal` 1.6.17 with its official memory adapter and a mock delivery port: verification signed-link acceptance/corruption, reset record ownership/single-use replay, two recipients' isolation, unknown-recipient non-delivery, failure/no auto-resend, existing disabled errors and zero fetch.
- SDK tests are included by the existing `vitest.product.config.ts` backend test glob; no manifests, lockfile or CI config changes.
- Local native regression and diff checks are executable without dependencies. SDK execution and locked project type/build checks require fresh CI; local installation is prohibited by disk capacity. Memory-adapter acceptance does not prove deployed Convex adapter behavior or live mail delivery.

Skill extraction: reused [Painter PR evidence](../../skills/painter-pr-evidence/SKILL.md). Exact-head test/review/CI receipts belong on the PR. No new reusable procedure has been independently proved, so no additional skill is created.
