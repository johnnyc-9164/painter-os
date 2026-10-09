# Company-site public deployment boundary

Issue: https://github.com/johnnyc-9164/painter-os/issues/65

`apps/company-site` is an additive independently buildable public company journal app. Its current company route is `/site/[workspace]/[[...slug]]`; its root explains how to open a company-provided journal link, without inventing company identities or exposing a workspace directory. Existing product marketing and company journal URLs remain unchanged.

`packages/public-content` owns the shared read-only Convex transport and applies the existing backend published-article DTO decoder. Admin remains the sole content writer. Neither public app receives a session, link secret, deployment key, draft API, or business snapshot. Workspace selection identifies a public query, never establishes private authority. Journal rendering stays dynamic to prevent shared tenant response caching.

Unknown workspace errors become 404 only through the backend's typed public-workspace error; unknown articles and invalid slug paths are 404. Configuration/transport failures remain unavailable errors. The projection discards unknown/private fields and renders content as React text.

Build locally: `npm run build:company-site`. Deploy as a separate Vercel project with root `apps/company-site`; its build invokes only this Next app, not the root production backend build. Main Git deployment is explicitly held, matching existing public-app policy, until deployed acceptance is authorized and recorded. No existing production project, domain, cookie or auth callback is changed.

This slice establishes a source deployment boundary. It does not implement company profiles, services, lead forms, verified hostname routing, company onboarding, custom domains, or all four production applications. Those remain separate acceptance criteria.

Installed Next 16.3.8 guides reviewed: dynamic route segments, `notFound`, and error boundaries under `node_modules/next/dist/docs/01-app/03-api-reference/`. Reused `docs/skills/painter-pr-evidence/SKILL.md`; exact-head check and review receipts will be supplied with the PR rather than claiming production acceptance.

Local validation: pinned npm 11.16 isolated install; agent doctor/check; full repository types/lint; 3 transport/boundary tests; 6 existing marketing tests; 46 backend tests; independent company-site production build; real loopback built-page HTTP acceptance (two companies, escaped content, stripped private fields, four 404 cases and security headers). Product-marketing build also rerun for shared-reader compatibility. HTTP acceptance uses a test-only local Convex-protocol fixture and proves built routing/rendering, not live deployed backend acceptance. Run it after build with `npm run test:http:company-site`.
