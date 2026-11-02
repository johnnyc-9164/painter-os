# Painter OS — dependency PR consolidation (2026-11-02)

## Scope

This branch consolidates the overlapping Dependabot updates from PRs
#221, #292, #293, #294, #295, #296, #297, #298, #299 and #300.
It **does not authorize a release, production Convex deployment, or a merge**.

| Component | Before | Consolidated |
| --- | --- | --- |
| Better Auth (web/backend/root toolchain) | 1.6.22 | 1.6.34 |
| @convex-dev/better-auth (web/backend/cloud-session) | ^0.12.5 (resolved 0.12.5) | 0.12.6 |
| Next.js (all Painter apps/shared Next consumers) | ^16.3.4 | ^16.4.3 |
| Zod | ^4.5.4 | ^4.6.7 |
| shadcn | ^4.21.0 | ^4.23.0 |
| image-size | 2.0.2 | 2.0.4 |
| body-parser / qs (transitive) | 2.3.0 / 6.16.0 | 2.4.0 / 6.17.1 |
| ip-address / fast-uri (transitive) | 10.7.3 / 3.1.8 | 10.7.5 / 3.1.9 |
| wrangler / miniflare | 4.149.0 / 5.20261006.1-alpha | 4.156.0 / 5.20261023.3-beta |
| vitest | 4.1.11 | 4.1.12 |

## Authentication compatibility and security boundary

The current published `@convex-dev/better-auth@0.12.6` peer range for
`better-auth` is `>=1.6.11 <1.7.0`. Upstream
[get-convex/better-auth#433](https://github.com/get-convex/better-auth/issues/433)
also records that the integration imports an OIDC plugin removed by Better Auth
1.7. **Do not force Better Auth 1.7.7 into this integration**: the former
PR #299 failed TypeScript at `packages/backend/convex/auth.ts:27` and
bundling can also fail. The root dev dependency pins the shared 1.6.34
version so the Convex plugin and app resolve the *same* Better Auth module;
the test at `tests/auth-dependency-compat.test.ts` prevents mixed versions.

**Open security debt (not resolved by this change):** Better Auth versions before
1.7.7 are affected by
[GHSA-965c-763c-88jm](https://github.com/advisories/GHSA-965c-763c-88jm),
a critical *conditional* Magic Link plus OAuth state mix-up. The inspected
`createAuth` uses email/password with the Convex plugin, no Magic Link,
no social or Generic OAuth provider, and outbound email remains disabled.
The regression test checks that this current source configuration is not
silently expanded to the advisory's vulnerable combination. This is a
*configuration boundary*, not a patched version or a claim that live
production and every future configuration are secure.

Before turning on Magic Link, social/Generic OAuth, OAuth Proxy, SSO or device
authorization, stop for a dedicated security review. The durable fix is a
compatible, tested Convex integration plus Better Auth >=1.7.7, coordinated
across the web/backend/session runtimes with real isolated auth smoke tests
and an owner-approved cutover. Do not silence incompatible plugin types,
rely on preview success as a production auth test, or change paid/provider
configuration from this PR.

A read-only `npm audit --omit=dev` run on this candidate initially reported
17 advisory entries (1 critical, 6 high, 6 moderate, 4 low), some transitive.
The audit has not been reduced to zero and may include dependency paths
whose vulnerable features are not enabled in Painter OS. Analyze actual
usage and take a separate scoped security remediation path for remaining
items rather than automatically applying potentially incompatible major
downgrades.

## Reproduction and validation

Run from a clean checkout using the repo-pinned npm 11.16.0:

```bash
npm ci --ignore-scripts --no-audit --no-fund
node --test tests/auth-dependency-compat.test.ts
npm run check-types
npm run lint
npm run agent:check
npm test
npm run test:convex
npm run build
npm run build:marketing
npm run build:company-site
npm run build:platform-admin
```

The isolated Sprite run on this branch before the final minor Vitest patch had
a verified green install, new dependency contract tests, TypeScript for all
workspaces, lint (0 errors, 2 fixture warnings), agent check, `npm test`,
201 Convex tests, agent-worker Wrangler dry-run/runtime tests, and all four
Next.js production builds. Hosted CI on the **exact final PR head** remains
the acceptance gate. Re-run install and focused tests after the Vitest patch.

No merge or production promotion is performed by this document or branch.
