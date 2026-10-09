# Painter onboarding — issue 142

The active product entry is PainterApp through `[[...path]]`; the older SignUpForm/SignInForm components have no importing route and `/dashboard` redirects to `/overview`. CompanyOnboarding already retains a successful signup while initial provisioning retries, and `/api/workspaces` calls the existing `onlyIfNone` writer: enabled existing membership takes precedence. This slice leaves that authority unchanged, separates personal identity/company wording, routes successful signup to setup, and makes setup resumable from navigation. Skip does not delete actual saved records.

Three starting paths reuse shared UI controls: fresh customer/inquiry/team guidance; bounded customer CSV; keep the current CRM, explicitly Not connected. Preview is session memory, cleared on route/account/workspace changes, with file-clear control. Changing path inside setup retains the selected CSV. Quoted commas/newlines, BOM, CRLF, split names, explicit field mapping and ignored columns are supported. Limits are 128 KB, 100 rows, 30 columns, 1,000 characters per cell; input exceeding limits is rejected without truncation. Name/email/phone/address are the only mapped command inputs. Household/shared-contact matches are possible matches, skipped with manual Customers review guidance; no automatic merge or overwrite.

Every ready row opens the existing customer.create approval form after a fresh scope/capability/match check; actual submit uses the same existing command writer and intent-key retry behavior. Successful saves increment per-preview progress; partial successes remain saved, other rows remain local. Unknown save outcomes must be reconciled in Customers before opening a new intent. There is no atomic duplicate or actor guard added to the command contract: UI checks cannot prove a session has not changed between preflight and dispatch. Confirmed 401/403 preflight/refresh clears private imported form and scope; transient network failure retains retryable intent. Async generation/unmount guards prevent a delayed check/file read reopening old drafts.

Invitation `/join` is account-only through the existing BetterAuth cloud auth endpoint, followed by the original bounded same-origin `/i/token` link. No snapshot/provisioning/acceptance is performed by that page, and email verification remains required by existing server invitation authority. LocalAuth signup creates a synthetic workspace itself, so local account-only signup is explicitly held and the page returns testers to the existing local invitation form. Cloud invitation acceptance uses current verified session and no redundant password prompt; local synthetic invitation fields remain. No provider or verification delivery activation occurs.

## Research grounding and later migration

No source CRM or company inventory was supplied. Official-source research conducted by the separate researcher supports customer CSV first:

- [Jobber client export](https://help.getjobber.com/en/articles/export-client-information/): admin/select-plan access, contact/property/custom fields; OAuth/app review is a later integration boundary.
- [PaintScout contact export](https://help.paintscout.com/support/contacts-and-companies/contacts-and-companies/how-to-export-your-contact-list): Contacts → Filter → Export CSV; no verified generic public API claim.
- [HubSpot record export](https://knowledge.hubspot.com/import-and-export/export-records): Export permission, selectable/localized properties and associations; split names need mapping.
- [Housecall Pro API overview](https://help.housecallpro.com/en/articles/8505035-api-overview): API is MAX-plan/admin-key gated; this does not mean generic CSV needs API access.
- [ServiceTitan API setup](https://help.servicetitan.com/docs/get-started-with-api-dev-portal-v2): credentials/app key/tenant and provider-access boundaries; no verified complete one-click customer migration.

Follow-up #144 reserves provider-specific read-only integration/full migration planning: external IDs, jobs/estimates/files/associations, checkpoints/reconciliation, source-of-truth and rollback. Active jobs/estimates/billing/history stay in the existing CRM; copied customer changes do not sync. Source paid/deposit/approval/review/consent statuses establish no Painter authority. No network/SDK/OAuth/credential/provider registration was added.

## Validation

Focused tests cover parser limits/quotes/mapping/possible matches/split names, bounded invitation return, existing retry-safe provisioning and cloud/local invitation rendering. The existing default forms gate includes these new component tests. Local production web build and scoped browser exercise actual signup/setup, customer form write/progress, late preflight completion, 401/403 private-form clearing, cookie-account switch before submit, mobile fit, and local account-only hold. Browser data is explicitly synthetic; local cloud-auth behavior, production membership concurrency, email delivery and full CRM migration are not proven.

Exact head and artifact receipts are recorded in the PR. Skill extraction reuses docs/skills/painter-pr-evidence/SKILL.md; no new reusable procedure is needed.
