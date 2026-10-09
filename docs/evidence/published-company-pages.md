# Published company pages — phase 1

Issue #120 adds owner-authored company pages at `/company/[workspace]`, `/company/[workspace]/services` and `/company/[workspace]/contact`. This is a small public presentation slice, not richer structured CMS completion, domain activation or four live apps.

## Existing authority

The existing authenticated Content Studio article commands remain the sole writer. Authors with existing settings authority (owner/office admin) create ordinary articles, edit their text and explicitly publish them. No new config store, workspace metadata publication, backend command, table, role or migration is introduced. Public reads use the existing `painter:articles` query, which checks actual workspace existence and returns only published/public article projections. The new reader checks exact reserved slug, singleton, bounded title/body and valid projection shapes; invalid responses fail closed.

## Authoring convention

Create ordinary Content Studio articles with these exact slugs:

- `company-profile`: required company introduction. Its title and body supply the public profile page. No private workspace name is substituted.
- `company-services`: optional owner-authored services title/body.
- `company-contact`: optional owner-authored contact information title/body.

Publish each page explicitly. These are ordinary published articles and may also appear in the existing company journal. No silent journal filtering, content conversion, relocation or authoring migration occurs. The existing CMS only allows draft edits; this phase does not add a published-article revision workflow or structured service cards. Use existing lifecycle rules rather than expecting this renderer to change them.

Missing profile produces unavailable/404. Missing optional pages have no navigation link and their route returns 404. Unknown workspaces use the existing public not-found boundary; malformed DTOs are errors rather than guessed content. Owner text renders as escaped plain text, preserving line breaks. HTML, Markdown and URL-like strings confer no script/link/tool authority. No contact form, email collection, lead creation, automatic outreach, default services, review claims or location is added.

The navigation preserves the existing `/site/[workspace]` journal and `/estimate-request/[workspace]` project guide CTA. A disabled/missing guide remains unavailable under its existing contract. New page styles inherit the incumbent cream/green company-site typography, separators, links and focus treatment; no global design replacement.

## Verification

Four pure reader tests cover scoped exact slugs, private-field omission, missing/unpublished projections, optional pages, malformed/duplicate/wrong-slug/blank/oversized content and transport failure. Actual production-built Next loopback HTTP fixture checks cover published profiles/services/contact, escaping, no private data, required/optional/unknown-route 404s, malformed DTO 500, preserved journal inclusion and guide behavior. The backend is an explicit local public-query fixture, not live Convex/provider data; existing backend publication tests remain authority evidence.

Desktop 1440px and mobile 390px captures use the actual built Next company page and installed sandboxed Chromium, with synthetic content clearly labeled fixture-only. The HTTP test optionally captures through `PAINTER_COMPANY_CAPTURE_DIR`; local artifacts are `/workspace/company-pages-evidence/desktop.png` and `mobile.png`. Captures precede the final commit and correspond to its UI source; no exact-commit production capture is claimed.

Type checks, scoped lint, existing company/journal boundary and HTTP regressions, agent checks and production company-site build are required alongside fresh exact-head CI and independent root review. No provider activation, paid calls, secrets, actual company content or production domain/cookie cutover occurred.
