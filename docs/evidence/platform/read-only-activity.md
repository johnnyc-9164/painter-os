# Read-only platform access history

Issue: https://github.com/johnnyc-9164/painter-os/issues/66

The platform Activity screen reads the existing authoritative `platformOwnerAudit` records. It provides no new writer, bootstrap action, or access management controls. Better Auth session verification and the enabled platform grant are checked before any audit read, on every page.

`platformActivity.list` uses the built-in `by_creation_time` index in descending insertion order and bounded opaque Convex pagination (default HTTP page size 20, maximum 50, cursor maximum 4096 characters). Its explicit projection contains only `id`, `action`, `occurredAt`, `beforeEnabled`, and `afterEnabled`. User IDs, request keys, fingerprints, receipts, proof references and private tenant events are absent. Revoked access denies the next page.

The existing session bridge serves `/api/platform/activity`; responses are `private, no-store` and vary by Cookie. The strict client decoder rejects private extra fields. `/platform/activity` displays actual events, an empty state, pagination, denied/signed-out/loading states, and retry/first-page recovery for invalid or unavailable pages. The renderer is separately owned in `platform-activity.tsx`. Existing workspace inventory routes retain their pagination semantics.

Local preparation checks: isolated pinned npm 11.16 installation and agent doctor; full project type checks; ESLint; agent boundary/schema checks; full Convex suite and a transaction-budget regression covering 200 audit events plus 400 unrelated tenant records with an eight-document read limit; focused transport/decoder tests and automatic-JSX view tests. Exact commit and final verification results are recorded in the handoff receipt after commit. Next.js installed version route handler documentation was read before adding the endpoint.

These synthetic tests do not establish live verified-user platform access or bootstrap approval. No provider, domain, account or production setting was changed. No live bootstrap was invoked. No company-data audit is required: the user confirmed no company data exists. Independent review and exact-head CI remain coordinator responsibilities.

Skill extraction: reused `docs/skills/painter-pr-evidence/SKILL.md`; existing redacted read-only inventory/session/view testing procedure applies. No new skill was needed.
