# Painter OS product landing

## Purpose and reference

Public product introduction for painting contractors. The supplied owner reference is the visual authority: blue/white split hero with a painter and brush edge, overlapping dashboard, a spacious four-column/two-row feature grid, residential house/van story, and navy closing CTA. This marketing surface is independent of the authenticated Artisan Core workspace and existing contractor journals.

## Visual language

- Ink `#0d172a`, primary blue `#0867e8`, navy `#0c2944`, muted text `#586576`, pale blue `#edf5ff`, border `#dce5ef`.
- Runtime token owner: `.product-landing` in `src/app/product.css`; every new product selector is scoped or carries the `product-` namespace. Existing journal styles remain untouched.
- Display: bold Arial/Helvetica sans-serif, tightly tracked 41–62px hero and 27–42px section headings. Body: normal sans-serif 13–16px. Small decorative dashboard text is hidden from assistive technology; its visible caption explains the example data.
- Layout: maximum 1200px content, open feature grid rather than boxed cards, restrained rounded blue controls, two local photo assets with reserved dimensions. At 760px and below the hero stacks, the grid becomes two columns and the story becomes one column.
- Motion: only control hover/pressed feedback; reduced-motion removes transitions. No animated counters or fabricated social proof.

## Reuse and behavior

Navigation CTAs reuse `buttonVariants` from `@painter-os-bts/ui/components/button` on native anchors. They retain link semantics and visible keyboard focus. No new UI library or dependency resolution is introduced. Shared UI source remains unchanged.

Feature content is owned by the typed `product/content.ts` list and describes implemented capabilities. The sample workspace is a separate, noninteractive server component; it does not read sessions, tenant projections, snapshots, admin state, or providers. Its numbers are illustrative data, not product results. The two generated scenes are decorative and do not claim a customer endorsement or real company.

The optional admin destination uses the existing `publicAdminOrigin` validator at build time. Without a configured origin, CTAs navigate to explanatory sections. No fabricated login, trial, payment, booking, video, or signup flow is created. Deployment disclosures live in a native keyboard-operable details element.

## Verification and held gates

The actual production HTTP harness checks content, all eight features, link destinations and roles, both image payloads, actual image optimization, headers, no auth cookies, and six absent admin/portal routes. A separate build checks a configured nonsecret synthetic admin origin without contacting that destination.

Browser comparison is a release gate. Native Chromium's sandbox limitation and cloud browser `ERR_BLOCKED_BY_CLIENT` for loopback prevent a real visual/keyboard/overflow pass in this environment. Source geometry and HTTP success do not substitute for that pass. No claim of exact pixel match, deployed visual acceptance, or production readiness is permitted until desktop, tablet, and mobile screenshots of the exact head are reviewed.

## Product site pages (issue 124)

The incumbent photo/dashboard landing remains the visual benchmark. Product, workflow, resources and workspace-options routes use the same blue/white/navy tokens, typography and shared native-link button variants. Interior pages use an editorial heading, useful section contents, open reading rows and two practical guide links; they do not repeat the landing hero or fabricate product results. Navigation wraps at tablet widths and remains visible on narrow screens. Product-specific Tailwind semantic color mappings resolve shared default button/focus classes against existing product tokens; no shared global reset or journal token rewrite is introduced.

MARKETING_SITE_URL accepts only the observed existing marketing Vercel HTTPS origin. Without it, product routes omit canonical metadata and use noindex. Tenant journals retain their routes and crawler behavior; the static product sitemap does not enumerate tenant records. No prices, contact address, testimonials or provider activation are inferred.
