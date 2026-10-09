# Four application model

Owner clarification, 2026-10-09: Painter OS has four intended applications: its product marketing site, its platform administration application, a painting company's marketing site, and that company's administration application. The last two repeat for each company. These are four product and deployment boundaries, not four copies of business logic or four databases per customer. This document records the target and the inspected source gap; it does not authorize deployment, domains, provider activation or a store cutover.

## Existing source and target boundaries

Inspected baseline: `99a7fcec` (main after PR #56). There are currently **two source applications**, not four independently deployed applications. Runtime deployment state requires separate exact-revision evidence.

| Intended application | Existing source surface | Target audience and authority | Remaining separation |
| --- | --- | --- | --- |
| Painter OS product marketing | `apps/marketing` root product landing | Anonymous visitors; product information and explicit admin CTA | Shares its application with company journal routes; dedicated product origin/build ownership remains to be realized and verified |
| Painter OS platform administration | `apps/web` `/platform` and `/api/platform` | Verified Better Auth identity plus enabled platform-owner grant | Read-only workspace inventory exists; it shares the company-admin application. Sites, health, access, activity and billing navigation does not establish implemented management or SaaS billing |
| Painting company marketing | `apps/marketing` `/site/[workspace]/[[...slug]]`; preserved equivalent route in `apps/web` | Anonymous visitors; only that company's published public content | Current journal projection is not a complete company website or verified custom-domain service; separate tenant-site application boundary remains to be realized |
| Painting company administration | `apps/web` dashboard/business routes | Better Auth identity plus enabled membership in the resolved company workspace and command-specific permissions | Existing operator app; its platform and compatibility-public routes still share the deployment. Multi-workspace selection and onboarding need explicit contracts and evidence |

The existing [marketing/admin split](MARKETING_ADMIN_SPLIT.md) describes the implemented two-app separation and compatibility URLs. This four-app target expands that model without deleting the existing routes. The original [system IR](../ir/system.ir.yaml) specifies multi-tenancy and server-derived authority; it is a target specification, not evidence that every surface is complete.

## Shared modules, separate authority

All four applications can share UI primitives, typed contracts and deployment-independent modules. Application entry points must not import one another's private runtime or session modules. Marketing receives public configuration and public-safe projections; it receives no deployment, session, signing or email credentials. Separate builds must demonstrate their actual dependency and environment boundaries, rather than relying on route groups.

Better Auth remains the sole cloud session/user authority. Company administration uses the existing server-resolved `painterMembers` / `painterWorkspaces` membership boundary. A browser-selected workspace, hostname or role is a candidate for resolution, never authorization. A company owner does not thereby become a Painter OS platform owner. Current platform access independently requires verified email and an enabled `platformOwners` grant; its bootstrap is a held trusted-operator procedure, not an onboarding button. Platform inventory currently exposes a fixed summary, not company snapshots. Any future support access or cross-company mutation needs a separately reviewed, scoped and audited policy; do not add implicit impersonation.

Company administration owns CMS article authoring and publishing through existing authenticated commands. Company marketing consumes the same authority's typed published-and-public article projection. Draft preview stays authenticated. There is no second company CMS store or automatic mirror. Product marketing currently uses source-owned product content; a future managed product CMS would need its own explicit aggregate ownership contract, not access to arbitrary company drafts. Preserve the Painter host, Contractor OS and painting component writers described in the [compatibility freeze](../contracts/issue-2-freeze.md).

## Tenant sites and domains

A shared company-site application can serve many companies from one codebase. Start with the existing explicit workspace path. Before introducing custom domains, define an authoritative hostname-to-workspace mapping with verified domain ownership, uniqueness, enable/disable state and an audited update boundary. Resolve normalized hosts on the server through that mapping. Unknown or unverified hosts must not select a default company's content; trusted proxy handling and canonical redirects need explicit contracts. No such custom-domain mapping is claimed implemented here.

Public content queries must bind to the resolved tenant and enforce published/public projection. Cache keys and invalidation must include tenant, canonical host, content identity and published revision so one company's content cannot appear on another site. An authenticated company-admin host mapping selects a workspace candidate only; membership must independently authorize every private read and command. Preserve token-scoped customer portals and invitation links on their verified existing origin until routing is explicitly changed.

## Scaling and staged realization

1. Establish one company's accepted end-to-end workflow on the existing authority: live verified login/invitations, tenant isolation, CMS publish-to-public read, preserved customer links, and the approved deposit policy. Record which checks are local, CI or live. Do not replace live gates with source claims.
2. Prepare four separately buildable application entry points by extracting the existing surfaces into shared modules and narrow app-owned composition. Keep the current two applications and URLs compatible during preparation. Review auth imports, public projection, environment allowlists and rollback independently before any routing change.
3. Propose canonical origins and deployment ownership for the four apps. A practical default is one product-marketing deployment, one platform-admin deployment, one shared tenant-marketing deployment, and one shared tenant-admin deployment. Each company gets an isolated workspace and site/admin identity, not a forked repository. Verify callbacks, trusted origins, host-only cookies, cross-origin behavior and old links before the owner authorizes cutover. Four app boundaries do not imply shared browser cookies.
4. Onboard additional companies through a reviewed workspace/membership/domain lifecycle. Current membership storage is tenant-scoped, but the web adapter rejects alternate workspace selection; explicit switching and company provisioning still need implementation and acceptance. Add query pagination, per-tenant resource limits, operational monitoring and recovery evidence according to measured load.
5. Consider individually deployed tenant frontends only when branding, compliance or isolation requirements justify the operational cost. They may share the existing backend if tenant authorization remains identical and verified. Separate tenant backends are a different isolation model requiring mappings, auth continuity, migrations and rollback approval; do not choose them merely because each company has its own site. Both options must retain one writer per aggregate and common reviewed code rather than diverging customer forks.

No subscription billing, tenant provisioning service, custom-domain automation or four-app production operation is asserted. These are bounded follow-on slices, each with its own implementation owner, independent review and exact-head evidence.

## Release holds and validation

Routing/domain and cookie cutover, live auth/email or provider activation, platform-owner bootstrap, historical-data/index release checks, and Painter/core/painting store migration remain separately held under their existing contracts. The owner's deposit-policy choice authorizes preparing that policy; it does not lift these unrelated holds. Existing root production build behavior and marketing's disabled main deployment must be inspected before proposing any merge that could trigger a deployment.

This change is documentation only: no scaffold, runtime command, schema, environment, provider setting or deployment configuration changes. Validate local Markdown targets and `git diff --check`; code tests cannot prove this target architecture. For each implementation slice, reuse [Painter PR evidence](../skills/painter-pr-evidence/SKILL.md), record the exact head and distinct reviewer, and report unresolved deployment gates. Source preparation rollback is reverting these documentation references; no data or production rollback occurs.
