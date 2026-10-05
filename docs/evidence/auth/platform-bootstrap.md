# Prepared platform-owner boundary

No live privilege was granted. Account identity and login remain unverified for the confirmed email `mplsjohnnycage@makeithappenentllc.com`. No authorized live identity query is exposed in this execution environment. A workspace owner is not a platform owner.

`platformAccess.bootstrap` and `revoke` are internal deployment-operator mutations, not public signup, first-user or email lookup grants. Bootstrap resolves an immutable Better Auth user ID using the existing official `authComponent.getAnyUserById`, requires exact confirmed email and existing `emailVerified:true`, then atomically writes a singleton and append-only request receipt. Nothing changes Better Auth users, tokens, sessions or verification. Public `current` returns only a Boolean for the current SDK-authenticated verified user. Workspace memberships are untouched.

Before ANY live internal invocation, the trusted deployment operator must externally verify identity proof and an explicit approval receipt bound to actual deployment, immutable target ID and approved commit. The stored reference strings are audit links, not proof validation or caller authority. Internal function visibility plus trusted deployment-operator access is the execution trust boundary. Neither caller-provided operator IDs nor verified flags are accepted. Revocation uses this same operator boundary. Disabled singleton history is retained; exact bootstrap replay after revocation returns disabled and cannot regrant. Recovery or additional platform owners require separate reviewed authorization and code.

## Verification and remaining inputs

Tests use the actual published `@convex-dev/better-auth@0.12.5` schema and adapter with synthetic component users/sessions, not a mocked identity resolver. Sources: [published client](https://unpkg.com/@convex-dev/better-auth@0.12.5/src/client/create-client.ts), [published schema](https://unpkg.com/@convex-dev/better-auth@0.12.5/src/component/schema.ts). The test helper's node_modules glob is supplemented with the actual installed adapter module and a root marker, preserving official implementations.

CI execution of these tests and full type/build checks is pending publication; no local dependency installation. Main's independently accepted [HTTP run](https://github.com/johnnyc-9164/painter-os/actions/runs/37252047214) at `6744b2a0a63acf2442f6a9690fc58bc09dcef702` passed 52 actual local Next HTTP checks; it proves fresh local core workflow and legacy `/site`, not browser, live cloud auth, separate marketing, email delivery or this new bootstrap.

Live readiness still requires the actual Better Auth account ID, existing verified-email/identity proof, operator approval receipt, matching admin origin/SITE_URL/trusted origin and frontend Convex URL pair. Secret values are not read here. Email delivery callbacks remain uninstalled and provider transport disabled. This PR prepares a server authority seam; it does not add a platform management UI or claim owner login ready.

Skill extraction reused [Painter PR evidence](../../skills/painter-pr-evidence/SKILL.md); exact head, independent verdict and terminal CI receipt belong in the PR handoff. No new skill, service, package, queue, deploy or activation.
