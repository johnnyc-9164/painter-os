# Painter OS platform visual contract

## Purpose and approved direction

A deployment operator reviews a redacted workspace inventory and their own platform permission. The existing blue/white Painter OS platform reference designs establish a quiet white navigation rail, pale cool canvas, bold heading, blue links, legible tables and explicit availability notices. This is a read-only administration surface, not a revenue dashboard. No chart or aggregate number is fabricated.

## Canonical ownership and tokens

The established brand and type tokens in `apps/web/src/index.css` and shared Tailwind theme in `packages/ui/src/styles/globals.css` remain authoritative. The scoped `platform.css` adapter uses `--foreground`, `--background`, `--primary`, `--primary-foreground`, `--secondary` and existing sans type. Its local additions are readable secondary text #586b84, divider #d9e2ee, white panels and 8px panel radius. Blue primary #0052ff, dark ink #172033 and cool canvas #f7f9fb are inherited, not redefined.

Existing shared Base UI Button, Input, Label and Card are reused unchanged. No shared table component exists, so the platform inventory owns one semantic native table. Navigation always uses native Next Link anchors, never button roles. There are no dropdowns, selection/bulk actions, dialogs, notifications or date-entry controls in this slice.

## Layout and hierarchy

The desktop navigation rail is 246px; main content is capped at 1440px. A two-column overview becomes one column on small screens. At 760px the rail becomes a horizontally scrollable, labeled navigation list. Workspace names and IDs wrap; the table alone scrolls horizontally. White panels use restrained borders, no decorative chart, imagery or animation. Heading scale is 27–38px; normal explanatory copy is 14px, with 12px inventory labels and secondary copy.

## Interaction and accessibility

A visible-on-focus skip link leads to main content. Every navigation item has text and current-page semantics. Loading, signed-out, denied, unavailable, empty, invalid and not-found states have distinct copy. Login remains in the platform flow and uses the existing same-origin Better Auth endpoint. Passwords are masked by default, support password managers and can be shown with a labeled toggle. Form errors are inline and connected to the inputs; duplicate submit is disabled. Reduced-motion and forced-colors rules preserve operability.

## Verification limits

Source and static renderer tests are separate from browser inspection. Installed automatic-JSX rendering tests cover real shared controls and all gate states. Built loopback HTTP checks cover explicit routes, no-fallthrough, headers and unavailable APIs. Native sandboxed Chromium could not launch because its Unix socket was denied; no sandbox flag was disabled. Browser interaction, narrow-viewport visuals and real production-owner sign-in remain release checks, not claims of this source slice.
