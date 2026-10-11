# CRM coexistence and migration mapping plan

Status: planning only (issue #144, follow-up to #142; durable contact linkage is designed separately for #161 in `docs/design/CRM_MIGRATION_LINKAGE.md`). This document changes no runtime, activates no provider, stores no credentials and assumes no company inventory. No customer has chosen a CRM, so start-fresh remains valid and no provider-specific one-click migration may be advertised. The CRM path in the product stays "Not connected".

## Evidence and verification limits

Provider facts below come only from the issue text (#144 comment, #161, #142) and the official URLs those issues cite. At authoring time the cited pages could not be fetched from this environment (DNS failure), so each fact is "as reported in the issues, not independently re-verified here". Anything not in the issues is marked **unverified** and must be checked against the provider before it is relied on. Re-verify on selection, because plans and permissions change.

## Source-of-truth rules

| Aggregate | Default owner while coexisting | Painter OS holds |
| --- | --- | --- |
| Contacts/customers | Existing CRM until a reviewed plan says otherwise | Reviewed customer copies created through the canonical `customer.create`/update writer |
| Active jobs, estimates, billing, history | Existing CRM | Nothing imported as authority; manual re-entry only if staff choose |
| Payments, deposits, approvals, reviews | Existing CRM | Never imported as verified status; at most labelled "reported by source export" |
| Files/photos | Existing CRM | Nothing until a typed file mapping and privacy review exist |
| Tags/custom fields | Existing CRM | Nothing until a typed mapping exists |

Rules:
1. One authoritative writer per aggregate. Painter OS customer data is written only through the existing command engine and `persistPainterState`; no second CRM store, no automatic mirroring, no independent upsert.
2. Edits are not synchronized in either direction. The UI must list which fields staff update manually in both systems.
3. A source-of-truth decision is a reviewed migration plan, not a routing or cutover switch. Cutover, rollback and exclusion acceptance are a later explicit customer decision.
4. Workspace and membership authority is resolved server-side from Better Auth identity and enabled membership; browser source labels, external IDs and role claims grant nothing.
5. Manual uploads are labelled `manual_export` / unverified provenance, never a verified provider account or live connection.
6. Imported paid/deposit/approval/review values never create verified business authority or fabricated contract/payment evidence.

## Per-provider facts (only the providers named in the issues)

| Provider | Reported export/connector facts | Source | Status |
| --- | --- | --- | --- |
| Jobber | Client export depends on admin role and plan; exports may be split across files. Other entity exports (jobs, quotes, invoices) not stated in the issues. | https://help.getjobber.com/en/articles/export-client-information/ | Issue-cited; other entities unverified |
| PaintScout | Contacts, then Filter, then Export CSV. Estimate/proposal/job export not stated. | https://help.paintscout.com/support/contacts-and-companies/contacts-and-companies/how-to-export-your-contact-list | Issue-cited; non-contact export unverified |
| HubSpot | Export requires the Export permission; properties and associations are selected at export; headers may be localized; Record IDs and associations may be included. | https://knowledge.hubspot.com/import-and-export/export-records | Issue-cited; API scopes for a connector unverified |
| Housecall Pro | API availability depends on the MAX plan; this does not establish that a generic customer CSV needs the API or that CSV export is available on any plan. | https://help.housecallpro.com/en/articles/8505035-api-overview | Issue-cited; CSV export plan rules unverified |
| ServiceTitan | Developer access and scopes are separately gated; endpoint-specific export eligibility needs verification before implementation. | https://help.servicetitan.com/docs/get-started-with-api-dev-portal-v2 | Issue-cited; export eligibility unverified |

Consequences: no universal header set can be assumed; mapping stays explicit per file. Each provider connector needs provider-specific registration, scope and plan verification if ever selected. Rate limits, pagination, webhooks and ID formats are unverified for every provider.

## Entity mapping beyond contacts

Each entity needs its own typed mapping, an exclusion inventory and independent review before any import. None is implemented.

| Entity | Proposed Painter OS target | Key mapping questions | Default |
| --- | --- | --- | --- |
| Contacts/customers | Canonical customer (via #161 linkage) | Full vs split name; billing vs service address; household duplicates; opaque external ID preserved with case and leading zeros | Reviewed copies, per-row operator approval |
| Properties/service addresses | Existing property representation if one exists (confirm in the domain package) | Many properties per customer; same address under multiple contacts; never auto-merge | Excluded until mapped |
| Jobs | Reference-only first (read-only history), not live jobs | Status vocabulary differs by provider; scheduling and crew links; completed vs active; link to customer via external ID | CRM owns; excluded |
| Estimates/quotes | Reference-only; no approved/accepted state imported as authority | Line items, taxes, versions, approval status, signed documents | CRM owns; excluded |
| Invoices/payments/deposits | Not imported as financial authority | Any import is at most a labelled historical note | Excluded |
| Files/photos/documents | Tenant-private storage via existing file path, only after privacy review | Size limits, provider URL expiry, consent, linking to customer/job by external ID | Excluded; manual |
| Tags/custom fields | Typed, allow-listed fields only | Free-form tag semantics, localized names (HubSpot), custom property types | Excluded |
| Associations (company/contact/deal etc.) | Explicit link records, after both ends are linked | Orphans, many-to-many, association labels | Excluded |
| Notes/activity history | Not imported by default | Private data; authorship cannot be attributed to a Painter OS user | Excluded; manual |

Each mapping record carries: mapping version, source namespace, external ID, payload digest, target entity and revision, decision (skip, link existing with expected revision, create) and audit actor.

## What remains manual

- Choosing the CRM, obtaining an admin/export-permission user and producing the export in the provider UI.
- Reviewing duplicate/household matches and approving each customer create or link.
- Re-entering or re-creating active jobs, estimates, files, notes and tags in Painter OS if wanted.
- Keeping the two systems consistent after import (no sync): updating addresses, phone and email in both.
- Accepting exclusions, cutover timing and rollback.
- Provider developer-account registration, app approval and credential issuance.

## Resumability and rollback (design requirements)

- Operations have stable idempotency keys and states planned/approved/applied/denied/unknown; unknown outcomes reconcile by canonical receipt before replay. Detailed contracts belong to `docs/design/CRM_MIGRATION_LINKAGE.md` (#161).
- Partial failure leaves applied rows intact and listed; resume skips applied and re-plans only unknown/denied.
- Contact rollback is a per-customer operator action through the canonical writer (no bulk delete implied); the linkage record keeps the decision so a link can be marked superseded. A future connector rollback includes explicit disconnect and credential revocation (provider mechanics unverified).
- Future connectors additionally need provider-verified cursors/high-water marks, tombstones, periodic reconciliation, read-only scope and tenant-bound registration.

## Ordered milestones

1. M0 Merge this plan; owner decides whether any real CRM/dataset will be chosen (no work past M3 otherwise).
2. M1 Review and accept the #161 source/linkage/operation/checkpoint contracts and the schema/file lease.
3. M2 Host implementation of contact linkage with real-host authorization, two-tenant and concurrency tests (depends on #159 for bounded state reads).
4. M3 Coexistence/migration-review UI: Not connected, source of truth per aggregate, manual-update list; preserve existing customer form and account-reset behavior.
5. M4 Typed read-only mappings, one entity at a time (properties, then jobs/estimates reference, files, tags), each with exclusion inventory and privacy review.
6. M5 Only if a customer selects a provider: provider-specific verification of plan, scopes and export rules; connector registration design; read-only connector with cursors and reconciliation.
7. M6 Customer-approved cutover and rollback plan; independent review against the exact head.

## Proposed follow-up issues

1. Verify provider export/API facts live for the selected CRM (plan, permission, scope, rate limits) with dated evidence. Blocked on a customer choosing a CRM.
2. Property/service-address model and household duplicate semantics mapping (design).
3. Typed read-only job and estimate reference mapping with status vocabulary table and exclusion inventory (design).
4. File and photo import privacy and storage review (design).
5. Tags/custom fields and associations allow-list mapping (design).
6. Coexistence UI: source-of-truth table and manual-update checklist (after #161 host acceptance).
7. Connector registration, read-only scope, cursor/tombstone and disconnect design (only after provider selection).
8. Rollback and cutover runbook template for customer-approved migration.

Not authorized by this document: provider credentials or accounts, connector code, schema changes, imports, production cutover.
