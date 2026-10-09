# Consented public lead ingress preparation

Issue [#110](https://github.com/johnnyc-9164/painter-os/issues/110), a backend-only slice of #78. No contact UI, outbound message, provider/model dispatch or appointment booking is added. Public project guidance v1 remains unchanged.

## Authority and one writer

Contact submission requires a separate company policy, missing/disabled by default. Current Better Auth identity and enabled membership authorize owner/office-admin configuration; browser user/role fields never supply authority. Enablement requires explicit acknowledgement of the fixed retention disclosure and company-owned consent text. The new public policy projects only its company name, policy revisions, consent text and disclosure.

The specialized public mutation validates bounded name/contact/project fields and explicit consent to the current contact and guidance revisions. It re-resolves both enabled policies and the actual workspace. The existing installed RateLimiter component debits deployment-global and tenant capacity inside the same host transaction, including direct Convex calls. Structured denials commit applicable debits; business-write failures roll the transaction back.

Authenticated `lead.create` and anonymous creation share the pure canonical lead builder and extracted `painterStore` aggregate writer. The public path reads only indexed policy/receipt/aggregate records; it never loads an authenticated tenant snapshot or invokes a generic command under a fabricated role. IDs derive from host-computed, tenant-bound SHA-256 receipt references, with an indexed collision check. The initial lead remains `new`; it creates no customer, qualification or appointment.

## Retry and proof

The host normalizes fields in a strict fixed order before cryptographic hashing. Neither client digests nor fingerprint overrides are transport fields. The domain fingerprint transform is a trusted invocation option only; ordinary manual command behavior remains compatible.

Public responses contain only a state and opaque reference, or a bounded denial. Submission receipts store hashes, policy/consent timestamps and aggregate linkage, never contact/answers/raw retry keys. Exact retry or status lookup can reconcile an unknown transport outcome after policy closure without re-admitting a lead. An altered request conflicts. Deleted references remain tombstones and cannot recreate contacts. A future UI must generate request keys with 32 cryptographically random bytes; accepted key shape is not evidence of caller entropy.

Staff command receipts touching public-origin leads use tenant-bound hashed addresses and hashed canonical fingerprints. Their results preserve normal replay until deletion; provenance links allow bounded tombstone replacement without a tenant-wide receipt scan. Audit events for these leads project explicit metadata from inception and never copy names, contacts, answers or raw request keys.

## Retention and scope

“Unprocessed” means every public-origin lead without a verified, audited customer transfer. New, contacted, lost and edited records all retain the original 30-day deadline; editing/contacting/closing does not extend it. Owner/office-admin qualification or linkage must resolve an actual same-tenant customer and record trusted actor/action/linkage provenance. A caller-declared reference alone cannot establish preservation. Converted customer/lead records transfer to company-managed CRM retention and remain intact; deletion returns `converted_preserved` rather than claiming their erasure.

Per-request internal scheduled expiry and a bounded internal recovery sweep recheck the same canonical lead/provenance/customer records as staff writes. Owner deletion immediately removes the unconverted lead and marks `deletion_pending` in that transaction. Internal workers paginate indexed audit rows and process at most 25 linked receipts per step, replacing entity/result copies with redacted tombstones. Only after these phases finish does proof report `deleted`. Racing qualification/expiry rechecks the committed retention state; inconsistent unverified conversion stops cleanup.

Cleanup covers the public lead aggregate, its public receipt/provenance, linked command receipts and indexed lead audits. The next-action queue excludes the immutable public lead ID namespace, even when its editable source text changes, so it cannot automatically copy a visitor name into an unrelated task/receipt/audit. Manual CRM text copies, exports, backups and infrastructure logs are outside this automatic cleanup. No blanket database/export erasure claim is made. Pre-existing manual CRM records and converted customer/job/invoice records are not automatically deleted. No historical company-data inventory is fabricated.

## Local verification and limits

Isolated worktree `/workspace/public-lead-ingress`, pinned npm 11.16.0 and Node 24.19.0. Convex Expert and Reviewer guidance applied with the repository's Better Auth and hand-authored runtime binding authority. Existing Painter PR evidence skill reused; no new procedure was justified.

Local checks cover actual Better Auth and RateLimiter components; default-closed opt-in, current/revoked membership, strict consent/revisions, guidance v1 compatibility, direct tenant/global quota, same-key concurrency, 200 unrelated entities with a 60-document read budget, closed-policy proof, conflicting retries, owner-only deletion, 32 linked command receipts across bounded cleanup phases, private database redaction assertions, retry tombstones, original deadlines, converted records, validated customer linkage and both qualification/expiry transaction orders. Queue tests and an actual authenticated snapshot/approved task fixture verify no automatic visitor-name copy even after source edits.

Convex-test serializes top-level transactions: concurrent fixtures and both operation orders verify invariants in that emulator; source OCC reads/writes remain subject to independent review and deployed acceptance. Its JavaScript timer cannot represent the full 30-day delay, so expiry tests set the fixture clock to the stored deadline before draining actual scheduled functions. No live provider, cloud identity, public UI or production acceptance is claimed.

The existing main workflow automatically deploys Convex after merge. Default-closed contact policy prevents this prepared backend from enabling collection. This work does not call cloud policy enablement or activate a company contact UI. Company website production cutover and existing release/provider gates remain separate.

The first local lifecycle runner stopped before tests with ENOSPC. A prohibited `rm -rf` command was rejected automatically; a scoped Git clean dry run and cleanup removed only dependency/build caches from this owner's already merged worktrees, preserving their source and browser evidence. The initial expiry timer assertion and a test callback returning a nonserializable assertion object were repaired; neither was skipped. Exact-head command results and fresh CI belong in the PR/coordinator handoff.
