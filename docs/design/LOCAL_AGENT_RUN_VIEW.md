# Local agent run view

Issue 145 is a local read-only protocol fixture, not an authenticated production
agent product. The canonical display types belong to
`packages/domain/src/agent-run-view.ts`; Pi owns transcript/run/recovery and the
worker owns projection/validation. Shared UI owns presentation only. There are
no submission, approval, resume or effect-dispatch controls.

The existing platform visual contract remains the reference: blue action
#0052ff, ink #172033, cool canvas #f7f9fb, white panels and readable secondary
text. The fixture stylesheet is its scoped runtime adapter; shared
`packages/ui/src/styles/globals.css` remains the canonical Tailwind token and
component source. No shared global tokens change. Local fixture additions
are border #d9e2ee, secondary #edf2fb, muted text #52647c and error #a82435.
These map to semantic CSS variables consumed by shared Button/Card utilities.

The controlled shared AgentRunView places conversation beside tool activity
on desktop and stacks them below 1024px. Full text wraps, including long IDs
and outputs. The document owns natural scrolling; no chat auto-scroll forces
an operator away from earlier messages. Native details disclosures are used
only when a visible tool output exists. No dropdown, form, dialog, table,
selection or destructive behavior is introduced.

The fixture's restrained serif display heading contrasts with utility labels;
body/control type follows the existing system sans direction. Status always
has text, not just color. Shared Base UI Button and shadcn Card are used
without a duplicate widget system. Keyboard focus, global scrollbar styling,
forced colors and reduced motion are scoped to the local fixture.

Loading keeps the toolbar and minimum content area stable. Errors explain
refresh recovery. A connection gap requests a fresh snapshot; Refresh view
starts a new snapshot-based attachment rather than inventing a durable cursor.
Switching examples aborts the previous request and ignores its late result.
Empty, provisional, failed, recorded and uncertain states remain distinct.
A recorded tool result never claims an external effect succeeded. Any future
approval UI requires a separate trusted host contract and source review.

This isolated fixture reuses the maintained platform design context. It does
not introduce a new project design system or rewrite its DESIGN.md/UX contract.
