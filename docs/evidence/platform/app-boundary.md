# Independent platform administration app

Issue: https://github.com/johnnyc-9164/painter-os/issues/82

`apps/platform-admin` is the fourth independently buildable Next.js app. It retains `/platform/*` and the bounded `/api/platform/*` read endpoints on its own origin, redirects its root to `/platform`, and provides no contractor dashboard, portal, invitation, snapshot, command, signup or provisioning routes. Its Vercel configuration performs a frontend-only build and disables main Git deployment. Existing web routes remain compatibility surfaces; no routing or production cookie cutover occurred.

The canonical platform components, strict client decoder, read HTTP adapter, bridge-backed read service and CSS are owned by `packages/platform-admin-ui` (`@painter-os-bts/platform`). Existing web modules re-export those owners. The existing lazy Better Auth Next.js bridge moved unchanged to `packages/cloud-session`; web's `auth-server.ts` re-exports it. Better Auth and the existing verified platform grant remain the only identity/permission authorities. No tenant writer, membership resolver, local runtime, command adapter, signup, billing, provider or bootstrap implementation is imported into the independent app.

The new app's narrow JSON auth adapter allows only login and logout, bounds request bodies, verifies same-origin requests and forwards trusted session cookies. Raw endpoints expose only sign-in, sign-out, get-session and the existing Convex token protocol. Other account/provider endpoints are absent. Errors are redacted and responses are private/no-store. `PLATFORM_APP_URL`, when supplied, is the expected canonical request origin; otherwise browser-facing Host is used because Next loopback request URLs can contain the internal localhost name. No forwarding header establishes platform authority.

Contractor navigation is absent by default on the independent app. `NEXT_PUBLIC_CONTRACTOR_APP_URL` may explicitly supply a validated HTTP(S) origin for navigation only. Legacy web views retain their relative `/dashboard` links. This setting shares neither sessions nor permissions across origins.

The backend still has `trustedOrigins: [SITE_URL]`. A second Vercel origin therefore needs separately reviewed trusted-origin/callback and host-cookie validation before live sign-in. No cross-origin SSO, cookie-domain widening, automatic verified identity or initial platform bootstrap is claimed. No provider or production configuration changed.

## Verification

An isolated pinned npm install and doctor passed. Lock changes add only new workspace metadata; existing dependency versions stay unchanged. Installed Next.js 16.3.8 route documentation was read. Full type checks, lint, boundary/schema checks, ordinary repository tests and actual Convex tests pass. New auth tests cover origin/action/body rejection, cookie propagation, logout, redacted failures, unsupported raw endpoints, and optional contractor navigation. Existing platform HTTP/strict-decoder/automatic-JSX renderer tests remain compatible through the shims.

Both the independent app and existing web production builds pass. The independent app's actual loopback HTTP acceptance validates its own routes, headers, no-store/redacted unavailable responses, origin/action boundaries and absent tenant routes. Existing web HTTP acceptance passes in local and unconfigured modes, preserving its contractor and platform URLs. These tests use whitelisted secret-free environments and own temporary directories; no live Convex account or verified operator grant is fabricated.

Initial HTTP assertions revealed Next's additional RSC Vary tokens and internal loopback URL hostname. The Cookie assertion now checks the token, and a dedicated Host-versus-canonical-origin regression covers the origin fix. The final rebuilt app passes the actual HTTP suite. Exact head, independent review and CI results are recorded in the PR/handoff receipt, not inferred from these local checks.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; its existing independent app, shared JSX and isolated HTTP procedure covers this slice. No new skill or deployment authorization was added.
