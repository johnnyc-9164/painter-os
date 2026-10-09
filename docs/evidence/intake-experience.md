# Intake settings and project guidance

Issue #99 extends the existing company-admin and company-site surfaces. The administrator configures only the canonical intake policy from PR #89; visitors use its enabled public projection for deterministic advice. No visitor contacts, public lead mutation, model dispatch, subscription authorization, or calendar booking is added. The broader lead-chat and booking issue #78 stays open.

## Authority and transport

`/api/intake` reads and configures through the shared cloud-session bridge. The browser supplies a workspace candidate from its current snapshot; canonical backend membership independently authorizes every read/save and permits only owners/office administrators. POST requires the existing same-origin check, strict bounded input, expected revision, and a stable retry key. Responses are decoded strictly to reject private metadata. Local mode reports unavailable rather than initializing a cloud bridge or creating a second policy writer.

The settings panel preserves edits on transport failure or revision conflict. Uncertain outcomes reuse their intent key; changing the candidate, revision, or settings creates a new intent. Explicit reload replaces the draft with saved policy. The public site reads only `intakeConfig:publicPolicy` through a neutral public-content module; unavailable policies render no questionnaire. The separate `/estimate-request/[workspace]` route avoids journal-slug collisions.

## Design and verification scope

Applied the Impeccable skill. Its cloud skill has no local launcher in this environment; context loading failed and the required fallback was disclosed. Existing marketing/platform design documents and incumbent admin/company-site styles supplied the visual authority; no PRODUCT.md exists. This is an Operate extension, preserving blue administrative controls and the company's existing cream/forest journal style. The craft-floor reference was read before UI edits. No branding or company performance claims were invented.

The settings use a single readable form with native checkbox groups, clear loading/permission/local/error states, stable revision feedback, and explicit save/reload controls. The public guide asks four project questions, keeps answers in component memory, moves keyboard focus when questions change, and explains that no request has been sent and no appointment is booked. It has no name/email/phone fields, persistence, or submission endpoint.

Tests cover actual route origin/permission/revision responses with a controlled transport seam, strict public/private DTO decoding, rendered role/local/loading states, existing canonical Better Auth membership tests, and questionnaire outcomes. Browser fixtures exercise built apps on loopback: settings cloud responses are explicitly mocked because no live owner session is used; public content comes from a secret-free local Convex-protocol fixture. Neither proves deployed cloud authentication. Desktop/mobile screenshots and retry/conflict/advisory/disabled flows are recorded against the final exact head. Initial browser readiness used an admin-specific probe for the public app and was corrected to its actual root route; the failed receipt is retained.

The render suite has a Node wrapper under `tests/*.test.mjs`, so the existing agent/node verification gate executes it. Reuse `docs/skills/painter-pr-evidence/SKILL.md`; no new procedure is established. Revert the scoped UI/transport modules to roll back source; no schema, data, provider, or production routing cutover occurred. Independent review and exact-head CI remain required before merging.

Independent review correction: the save confirmation says “Project guidance is enabled.” It describes the saved policy, without promising that a held company-site deployment is live. This final copy-only delta updates the browser assertion and does not change layout, inputs, authority, or transport. Browser/visual receipts at `8e4c269a0f373f297960882dd4aec6d1031f55f5` precede this correction and are historical, rather than exact-final-head acceptance. Focused transport/render checks and fresh CI cover the final head; no third browser/polish round was run.
