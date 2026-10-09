# Bid opportunity evidence foundation

Issue: https://github.com/johnnyc-9164/painter-os/issues/101

`packages/domain/src/bid-opportunities.ts` is a pure discovery-evidence contract and decision module. It does not store records, import an app runtime, call a provider, invoke a tool, create a customer, price work or submit a bid. Existing Painter bid commands remain the sole business writer; Contractor `co_bid` is untouched. No schema/engine/manifest/lock/export changes are required by this bounded slice.

## Ownership and typed boundary

The runtime decoder accepts only the explicitly supported observation, identity, revision, field and provenance keys. It validates bounded strings, HTTP(S) absolute source URLs without credentials, real calendar dates with known observation offsets, SHA-256-format hashes, supported source/kind enums and a quote or locator. Hashes and `official` labels are supplied provenance, not a claim that this module fetched, cryptographically verified or authenticated a source. Source instruction strings remain data and cannot establish tool/credential authority.

Each extracted title/scope/location/deadline carries its own source URL, observation time, hash, official/mirror label, extraction version and quote/locator. Evidence also retains the revision's source provenance. Decoder output is copied; classification never rewrites previous observations. The batch limit is 250 and field/string limits are enforced independently. Tenant staging and visibility are future trusted-host responsibilities; a public opportunity identity does not grant company access.

## Identity, replay and revisions

Exact identity is the delimiter-safe JSON tuple of issuer namespace, solicitation ID, lot and round. A distinct issuer/lot/round remains a distinct opportunity. Case, punctuation and spacing similarities produce only advisory matches, never an automatic merge.

An identical opportunity/source URL/content hash/extraction version is source replay even if observed later. Revision label/kind, extracted values and provenance must still agree; contradictory extraction for the same source becomes `extraction_conflict`, preserving the new evidence for review. New content or extraction versions become evidence revisions on the existing exact opportunity. Addenda, cancellations and expiry claims explicitly require operator review rather than creating a duplicate opportunity or changing business status.

Every intake decision returns `requiresOperatorReview: true`. No decision authorizes conversion, submission or a write. A later reviewed staging/conversion boundary must revalidate current evidence and route approved commands through the existing authoritative writer.

## Deadline behavior

Raw deadline text and provenance are always retained. Structured local time must be a valid explicit calendar/time; a date without a time is not silently promoted to midnight. Explicit offsets can normalize an instant. Named IANA zones are resolved using the installed runtime's `Intl` time-zone data and tested against matching candidate offsets around that local date; supported, unique matches normalize to UTC.

Missing date/zone, unknown offsets (`-00:00`), unresolved zone abbreviations, nonexistent DST local times, ambiguous DST folds, contradictory zone/offsets and conflicting deadline observations return `needs_review`. Half-hour transitions and date-line skips are covered. An explicit compatible offset can disambiguate a fold, but no offset is inferred from an ambiguous abbreviation. Unsupported runtime zones remain unresolved. Previous notice and addendum deadlines are not automatically superseded; the caller must retain and review their evidence.

Malformed structured dates/offsets are rejected by the decoder rather than guessed. Normalized UTC is a parsing result, not source authenticity, bid eligibility, expiry adjudication or operator approval.

## Verification and limits

Eleven meaningful fixtures cover exact identities/delimiter collisions, later-observation replay, revision/addendum/cancellation/expiry handling, conflicting extraction, advisory aliases, instruction strings/unsupported authority keys, malformed URLs/hashes/calendar dates, raw/provenance preservation, explicit zones/offsets, DST folds/gaps including Lord Howe, Samoa's skipped day, deadline conflicts and input bounds.

Pinned isolated npm install, domain types, focused tests, scoped lint, agent doctor/check and source diff checks are the authorized local checks. Exact-head CI and distinct root review remain separate receipts. No live source extraction, provider/browser activation, tenant staging or operator conversion is claimed.

Skill extraction reused [Painter PR evidence](../skills/painter-pr-evidence/SKILL.md). This pure source foundation adds no verified activation procedure requiring a new skill.
