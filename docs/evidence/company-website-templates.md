# Shared company website templates and public projection

Public renderer child #130 of expanded website builder #120. PR121's plain published-article convention remains paused and is not this feature's implementation. This slice supplies public templates and the shared preview renderer; authoritative save/publish/unpublish/media and dashboard editing are coordinated backend/editor tracks, not completed by this public PR alone.

## Source authority and reuse

Canonical `CompanyWebsiteContent`, `WebsiteMediaReference`, `WebsiteResolvedMedia` and public/private projections belong to the backend-owned pure domain contract. Public transport calls `companyWebsite:publicSnapshot` and passes the requested workspace into strict canonical decoding. Only a current published snapshot enters the public page. Draft metadata, unknown fields, wrong-workspace media, incomplete references and malformed projections fail closed. No private workspace name or company data fallback is published.

Studio, Editorial and Direct share `packages/ui/components/company-website` and the same authored content. Catalog labels are reused by the dashboard editor; switching template preserves fields. Existing shadcn/Base UI Button variants supply actual shared utility/focus behavior on native CTA anchors. Public app imports theme/utilities, scans the shared renderer/Button and maps semantic tokens inside the scoped company surface. No global preflight is introduced. Legacy cream/green journal and project-guide routes remain unchanged. The shared renderer imports canonical types only, never auth/backend/provider runtime or another app.

Authored content supports logo, hero/project/gallery photographs with ordered references and focal point, services, project stories, manually attributed testimonials, optional manually entered rating, fixed/from/range/descriptive informational prices, structured phone/email/address/service areas/hours, and existing published blog projections. Empty sections never invent values or claims. Text and alt content are escaped. Public unresolved media fails closed; private draft preview shows an explicit unavailable-photo notice and private-preview banner. These notices never authorize publication or media access.

The public raster proxy accepts only workspaceId/mediaId/revision, fixes the configured backend `/company-website-media` endpoint and asks the backend to recheck current publication association on every read. It forwards no credentials or arbitrary destination, disallows redirects, times out after 10 seconds, bounds reads to the canonical 3 MiB maximum, accepts only JPEG/PNG/WebP and emits only content metadata plus no-store/nosniff. It cannot publish a storage ID, job photo or draft asset. Backend MIME/magic-byte validation and tenant publication/media isolation are separate authoritative tests; this proxy does not replace them.

## Visual evidence

Benchmark read: actual `apps/marketing/DESIGN.md`, ProductLanding, product.css and imagery declarations. Design skill applied: Impeccable; context launcher was unavailable earlier in this session, so incumbent source/design context was read directly. The design brief records the three approved compositions. No product illustration or sample marketing claim is installed as default company content.

Actual production-built Next loopback fixtures render all three templates at 1440px desktop, 900px tablet and 390px mobile using sandboxed installed Chromium 151.0.7922.173. Synthetic content is visibly labeled and generated benchmark imagery is used only through the test fixture backend, never as live company defaults. HTTP fixtures exercise canonical public queries and the actual image proxy, not live Convex/auth/provider behavior.

First capture inspection found unlayered legacy anchor/header/article CSS leaking into the new surface; one batch fixed scoped foreground contrast, navigation geometry, article spacing and single-project image/story composition. The second/final matrix passed and all nine images were inspected. Browser checks measure shared CTA contrast >=4.5:1, visible keyboard focus, >=48px control height, no document overflow and unchanged legacy journal background/padding. Captures: `/workspace/company-website-template-evidence/{studio,editorial,direct}-{desktop,tablet,mobile}.png`. They precede final commits and correspond to their UI source; later canonical validator/base integration is not described as new exact-head screenshots. No third polish pass is claimed or planned.

## Validation and remaining gates

- Four shared React renderer tests plus existing form regressions (26 checks) cover identical authored fields in all templates, shared Button classes, escaped content, honest sparse content, required resolved media and private preview notices.
- Reader/proxy and canonical domain fixtures cover exact public query scope, projection/missing/transport errors, wrong-workspace media, fixed endpoint/parameters, redirect policy, size limits, header stripping and stale publication rejection.
- Real built Next HTTP checks cover all three published templates, sparse/unpublished/unknown/malformed states, blog/guide links, current/stale image reads and unchanged journal routes. Optional capture mode runs the nine browser inspections above.
- UI/company TypeScript, scoped lint, company build, existing journal HTTP/boundary checks and exact-head CI are review receipts, not production readiness. A narrowly reviewed AST type-only guard seam is required for the approved shared canonical type import; runtime/mixed/backend imports remain forbidden.

Root independent source/test/visual review and backend/editor integration remain required. This source slice does not prove real company data entered, production media uploaded, provider connected, domain routed, paid call made or four applications live. No domain/cookie/provider cutover occurred.
