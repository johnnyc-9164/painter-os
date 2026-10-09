# Post-job review follow-up preparation

Bounded child issue #112 of #77. This slice adds internal follow-up tasks; #77's approval, opt-out, delivery, reminder and response lifecycle remains open.

## Ownership and behavior

The existing Painter task command remains the sole writer. No backend, engine, review aggregate, integration or schema is changed. The Reviews page shows preparation to owners/office admins only; frontend roles are display hints, while existing command authorization remains authoritative. Completed jobs must bind to a visible customer in the same tenant. Every eligible customer follows the same policy; sentiment, expected rating, payment value and unresolved-work notes do not select recipients.

The inline editor prepares an editable thank-you/review-link invitation and invites unresolved-work reporting without withholding the review. Missing contact is stated honestly; no recipient, company URL or actual delivery is invented. The task notes retain the edited text and stable source marker. The marker is untrusted suggestion-suppression metadata, never dispatch or approval authority. Existing review records and previously prepared tasks (including manually completed tasks) suppress suggestions. Completing a task records operational work only, never a sent message or received third-party review.

Before opening and saving, the panel refreshes the snapshot and rechecks job/customer identity, revisions, completed state, role and duplicate markers. Account/tenant changes remount the panel to clear its selected customer and draft. Refresh plus command is not atomic: two operators can still create duplicate tasks under separate request keys. This slice claims no global exactly-once behavior. Existing command intent keys preserve the same user's unchanged payload on uncertain retries; edited payloads are new intents. If the first write succeeds but its response is lost, refreshing may find the task and reject the now-stale proposal; the operator must inspect Tasks. No success reconciliation or external effect guarantee is claimed.

## Checks

- Seven domain tests cover roles/tenant isolation, job/customer binding, no sentiment gate, source revision changes, pending/completed suppression, draft validation and fresh snapshot before command.
- The existing task engine test confirms notes persistence, same-key replay, one stored task and explicit manual task completion without creating a review.
- Two actual React/shared-control static renderer tests cover factual job/customer output, missing-contact copy, no render-time writes, denied-role absence and empty state. All 22 form renderer tests pass.
- Web/domain TypeScript, scoped ESLint, agent doctor/check and production web build pass.
- Sandboxed installed Chromium 151.0.7922.173 loopback fixture checks the real production-built Reviews page at 1440px and 390px: editable draft, failed-save retention, stable unchanged retry request key, sole task.create payload, marker notes, refreshed suppression and account-change draft reset. Snapshot/command endpoints are fixture-intercepted; this is UI behavior evidence, not production auth/provider acceptance. Captures: /workspace/review-follow-up-evidence/desktop.png and mobile.png (local artifacts).

Design inherits the existing card, button, inline form, type and blue/white workspace styles. Impeccable context launcher was unavailable; source styles and the existing platform design record were read directly. No global style changes. The panel uses labeled textarea, loading/disabled states, inline alert/status and an inline draft instead of a new dialog.

No message, provider activation, posting, campaign, production cutover or paid call occurred. Exact-head CI and root independent review are required before merge.
