# Company website templates

The company website builder must match the quality of the actual Painter OS product marketing site, while representing only content the company authors. Source benchmark: `apps/marketing/DESIGN.md`, `ProductLanding`, `product.css` and its owned image declarations. The benchmark's spacious 1200px composition, strong 41–62px display type, deliberate photo placement, open content grids, clear CTA hierarchy and responsive geometry are the floor. Its product illustrations and sample business claims are not company assets or endorsements.

## Three compositions

**Studio** uses a confident blue/white split hero with a real company project photograph, open service columns, an offset project story and a navy contact close. A text-led hero remains complete when no image is supplied. Project imagery and owner-authored testimonials provide evidence rather than fabricated counters.

**Editorial** uses warm ivory and deep olive, an immersive owned project photograph, spacious editorial typography, a varied project gallery and quiet testimonial passages. Informational pricing and contact sections follow the work. Its composition changes the pacing, not the company's actual content.

**Direct** uses navy/white and a restrained ochre accent. Contact utilities and the actual phone are prominent when provided. Services and author-supplied pricing are practical and legible; project evidence precedes a service-area/contact close. No availability, booking or quote promise is inferred.

All three share one canonical company content contract, renderer and authenticated editor. Switching templates changes composition and preserves every authored field and ordered media reference. No generic service, company name, address, phone, logo, review or price is filled into public content. Preview fixtures are visibly labeled synthetic and never saved as live company defaults.

## Authority and publishing

Canonical content and lifecycle types belong to `packages/domain/src/company-website.ts`, owned by the backend track. One website configuration aggregate stores revision-safe private drafts and explicit published snapshots. Saving edits does not mutate the published snapshot. Preview is authenticated and renders the same shared public component against the authorized draft projection; publishing and unpublishing require existing trusted company CMS authority.

The existing article CMS remains the sole blog writer. Website blog controls enable a bounded projection/link to existing published articles, never replicate article storage or editing. Dedicated tenant-owned website media supports ordered logos and project photographs. Private job photos, storage IDs and unauthenticated draft media are never substituted. Only reviewed publication-bound public image URLs enter public renderer props.

Authored testimonials are manual quotations with attribution. No verified badge, fetched rating, CRM-derived review or proof of third-party receipt is inferred. Prices are informational authored values with fixed/from/range mode, currency, units and any qualifier; no automatic estimate or pricing calculation. Contact fields are structured, optional and rendered without a collector or external send.

## Reuse and visual ownership

The pure renderer lives in `packages/ui`, imports canonical domain types and existing shadcn/Base UI primitives, and never imports app, authentication, provider or private-runtime modules. Both dashboard preview and company app consume it. Semantic tokens and utility source scanning are explicit at the public app boundary; scoped company CSS carries template expression. Legacy journal/project guide layout and behavior remain unchanged. Shared global preflight is not introduced into those routes as a side effect.

## Empty and failure states

Unpublished company websites are unavailable publicly. Draft setup shows clear missing-field guidance. Missing imagery uses a text-led composition; missing reviews/pricing/service sections are omitted honestly; missing phone means no phone action. Invalid projections, unknown templates and unsafe media fail closed. Owner text is escaped, never executed as HTML or CSS. Public navigation exposes only authored or existing available destinations.

## Acceptance

Review all three actual production-built templates at desktop/tablet/mobile widths with real labeled fixture content, including sparse content and long text. Verify keyboard focus, link destinations, responsive overflow, color contrast and the shared Button's computed semantic styles. Source/render tests must exercise canonical DTOs, publication boundaries, no invented missing values and template switching with identical content. Existing journal and guide HTTP checks remain regression gates. Private preview, save/publish/unpublish and tenant media isolation are separately tested through authoritative backend/editor tracks. Four source applications do not imply four live applications; domain and provider activation remain held.
