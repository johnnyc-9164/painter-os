# CRM source linkage and resumable canonical contact migration (design)

Status: proposed design for review, issue #161 (child of #144). Source baseline `origin/main` 7c80a4776ad51ba7cca707eee6dac1bc42d277ec. Design only: no schema, Convex function, UI, dependency, provider, credential, dataset or cutover is created or authorized. The issue text and design comment are specification data; this document turns them into contracts for review. Types live in [crm-migration-contract.ts](../../packages/backend/crm-migration-contract.ts) (type-only, not imported by any runtime module).

Preserved boundaries: Better Auth is the user/session authority; `resolvePainterMembership` (packages/backend/convex/painter.ts) supplies trusted workspace context; `persistPainterState` (packages/backend/convex/painterStore.ts) is the sole Painter aggregate writer; the domain `applyCommand` engine owns `customer.create` / `customer.update`; Contractor OS and painting components are untouched. See [issue 2 freeze](../contracts/issue-2-freeze.md): no mirror, second writer or dual-write.

## 1. Tenant and source namespace

- A migration source namespace is a server-created private record: `{tenantId, namespaceId, provenance, label, mappingVersion, state}`. `tenantId` comes only from `resolvePainterMembership`; `namespaceId` is generated server-side (opaque, unguessable-not-required, never browser-supplied).
- `provenance` is exactly `manual_export_unverified` today. The operator `label` ("Jobber export, June") is display text. It is not a provider account, OAuth grant or live connection and never appears as verified anywhere in UI, audit or API.
- Every operation first resolves current Better Auth user and an enabled membership, then requires an explicit migration capability. Proposed capability: owner and office_admin only (matches existing write policy for contact data); customer and field roles are denied. The capability is a server role check in the new operations module, not a new role and not a browser claim. Any change to the role table is out of scope and needs the contracts owner.
- Browser-provided namespace ids, source labels, external ids, workspace candidates, actor ids, digests and idempotency keys are inputs to validation only. A namespace id is accepted only if a row exists for the resolved tenant.
- Future connector registration (verified provider, account validation, scopes, cursors) is a separate namespace provenance and a separate reviewed contract. Adding a provenance value never upgrades existing manual namespaces.

## 2. Private mapping key shape

Private table (proposed name `crmCustomerLinkages`, schema lease required, see plan):

| Field | Meaning |
| --- | --- |
| tenantId | resolved tenant |
| namespaceId | registered namespace |
| externalId | opaque string, byte-exact: case and leading zeros preserved, no trim/case-fold/numeric coercion; length 1..200, no control characters, rejected not normalized |
| linkageKey | `sha256hex(canonicalJSON([tenantId, namespaceId, externalId]))`, unique index |
| customerEntityId, linkedRevision | canonical customer and revision at last applied operation |
| lastPayloadDigest | digest of last applied normalized contact payload |
| origin | `created_by_operation` or `linked_existing` |
| operationId | operation that established the link |

Rules:
- Uniqueness: one index `by_linkage_key` plus `(tenantId, customerEntityId, namespaceId)` lookup. A customer may carry links from several namespaces; a (namespace, externalId) maps to exactly one customer. Two tenants or two namespaces reusing the same external ID produce different linkage keys and never collide.
- Never derive identity from CSV row number, email, phone or name. A row without a real source ID cannot be durably linked; it stays on the existing ordinary reviewed customer-copy workflow (individual `customer.create`, per #142), with no linkage row and no cross-file resume promise.
- Linkage rows are private host data: not part of snapshot/entity projection, not readable by customer roles, not sent to marketing. Reading is by exact `by_linkage_key` index only.

## 3. Operation states, idempotency and digests

States: `planned -> approved -> applied | denied | unknown`; `unknown -> applied | denied` only by reconciliation (table `OPERATION_TRANSITIONS`). `applied` and `denied` are terminal. No state skips approval: planned rows never write customers.

- `payloadDigest`: sha256 of canonical JSON of the normalized contact fields the operator reviewed (name, email, phone, billing/service address as mapped, plus mappingVersion). Server recomputes it from the submitted payload; a caller digest is only compared, never trusted.
- `idempotencyKey`: server-derived `sha256hex([sessionId, ordinal, linkageKey ?? 'copy'])`; this becomes the canonical command `requestKey` so the existing `painterReceipts` (tenant, requestKey, fingerprint) exact-key lookup provides replay protection. Caller keys are validated for format only and cannot select tenant, actor or digest. The domain receipt fingerprint already rejects same key with different input (`IDEMPOTENCY_KEY_CONFLICT`); the operation record additionally rejects same key with different `payloadDigest` (`payload_digest_mismatch`).
- Replay of an `applied` operation with the same digest returns the stored result with no new write. Same key, different digest: denied, nothing written.
- Session and operation rows are bound to `mappingVersion` and `namespaceId` at creation. Resuming with a different mapping version or namespace is denied (`mapping_version_mismatch`, `namespace_mismatch`); a new mapping version requires a new session.
- Stored metadata: ids, states, digests, denial reason codes, counts, receipt key. No raw provider/parse diagnostics, no exported rows, no contact fields beyond what the canonical customer already holds.

## 4. Transaction boundary through the sole writer

One authorized apply mutation (proposed `crmMigrationOperations.apply`) performs, in a single Convex transaction:

1. Resolve membership and capability; load session, operation and namespace; verify state is `approved`, mapping version and namespace match, recompute digest.
2. Read the linkage by exact key; read the target customer entity and current receipt by exact key (bounded reads only, see section 9).
3. Build the command: `customer.create`, or `customer.update` with `expectedRevision` for a linked/selected target, run through the existing domain `applyCommand` with the resolved `Actor` and the derived `requestKey`.
4. Call `persistPainterState` with the before/after state delta. This is the only customer write.
5. In the same mutation write: linkage row (insert or patch with revision/digest), operation state `applied` with result revision and `canonicalReceiptKey`, an audit event (type `crm.migration.applied`, payload ids/digests/decision only), and the checkpoint advance.

Convex mutations are atomic: any throw rolls back all five. Consequently a committed operation always has customer delta, linkage, receipt, audit and checkpoint together; there is no "linked but not created" state. No direct `painterEntities` insert, no second customer table, no separate upsert path, no scheduled follow-up completing half a write.

`unknown` can only arise when the caller did not observe the result (timeout/network) or when a future out-of-transaction step is added; the apply transaction itself never leaves partial rows. Reconciliation (section 6) queries the canonical receipt, never replays blindly.

Command extension: existing `customer.create`/`customer.update` should suffice. If the engine cannot express a field (for example split billing/service address), that extension belongs to the domain/contracts/engine owner, must be justified in its own issue first, and this design does not change it.

## 5. Conflicts and household handling

Decision matrix evaluated server-side from current canonical state (the browser preview is advisory):

| Situation | Result |
| --- | --- |
| No linkage, no similar customer | `none`: create allowed after approval |
| Exact linkage exists, digest equal | idempotent replay candidate: skip as already applied |
| Exact linkage exists, digest differs | `replay_update_candidate`: operator-reviewed update with `expectedRevision`; never an automatic overwrite |
| Same source ID twice in one session, identical payload | one planned operation |
| Same source ID, contradictory facts | `blocked_conflicting_source_id`: both denied-pending, manual review, neither applied |
| Email, phone or name+address similarity | `possible_household_match`: possible match only, never identity |

For household matches the operator must choose one: `skip`; `link_existing` to an operator-selected target with its `expectedRevision`; or `create_new_reviewed`. The choice, selecting user and target revision are recorded on the operation and in the audit event. Linking into an existing customer does not overwrite fields unless the operator also approves an explicit update diff. No automatic merge of people, no combination of billing and service addresses, no deletion of the other candidate. A stale target revision denies (`stale_target_revision`) and sends the row back to `planned` as a new operation with a new ordinal (the denied row stays for audit).

Candidate lookup must be bounded: use an indexed/bounded read of target candidates (see #159); if a bounded exact-key read is unavailable, the operation is denied with `bounded_read_unavailable` rather than scanning or truncating history.

## 6. Checkpoints, partial completion and resume

Session/checkpoint record: `{sessionId, tenantId, namespaceId, mappingVersion, actorUserId, nextOrdinal, counts by state, status, sourceOfTruthAck}`. Batches are bounded (`CRM_MIGRATION_LIMITS.operationsPerBatch`, 25) and the checkpoint advances inside each apply transaction.

- Partial completion: restart reads the checkpoint and continues at `nextOrdinal`; `applied` rows are never redone.
- Unknown outcome: reconcile first. Look up the canonical receipt by exact (tenant, derived requestKey). Found with equal fingerprint: mark `applied` (record revision, link if missing is impossible because linkage commits atomically; a missing link with a present receipt is an integrity alarm and blocks the session). Not found: mark `denied`/re-plan per operator decision; a replay under the same operation id is allowed only after reconciliation found no receipt. Never invent a new operation to retry an unknown one.
- Revoked membership or identity: every resume re-resolves the live session and enabled membership. If revoked, the apply is denied, the session moves to `paused_membership_revoked` and no data is written. A different authorized member may start a new session; they cannot silently inherit the prior actor's approvals (approvals are bound to `decidedBy` and are re-confirmed).
- Session close: `completed` or `abandoned` is terminal. Abandon leaves applied customers and linkages in place (they are canonical copies); no automatic rollback or deletion. Rollback of applied rows is an explicit, separately reviewed per-customer operation not designed here.
- Future connector only (out of scope now): provider-verified cursors/high-water marks, tombstones, periodic reconciliation and explicit disconnect behavior need their own contract.

## 7. Coexistence UX rules

- Default statement shown before any session starts and recorded as `sourceOfTruthAck`: the existing CRM remains the source of truth for active jobs, estimates, billing and history; Painter OS holds reviewed contact copies; edits are NOT synchronized in either direction, and staff update fields manually in both places.
- Each migrated field or aggregate shows an owner label (existing CRM vs Painter OS). Contacts are the only aggregate with a mapping today.
- Jobs, estimates, files, tags/custom fields, associations and history require separate typed mappings and an exclusion inventory the customer accepts. Until then the UI lists them as "not migrated".
- Imported paid/deposit/approved/reviewed statuses are never mapped to Painter payments, deposits, estimate approvals or review records; they are not even stored as authoritative fields. Any note-only retention is a later reviewed decision.
- Manual exports show "manual export, unverified"; no "connected", "synced", "verified account" or provider logo wording. No one-click migration claim; start-fresh remains a valid option.
- Source-of-truth acknowledgement is a recorded reviewed plan, not a runtime routing switch. Production cutover, rollback and exclusion acceptance are later explicit customer decisions.
- Preserve the existing customer form and account-reset behavior; migration UI is a separate module with a small WorkspaceSetup seam after host acceptance.

## 8. Test matrix

Real host authorization means the actual Better Auth component test harness (see packages/backend/tests/bid-source-ownership.test.ts: `betterAuthTest`, real session rows, `withIdentity`, `painterMembers` rows), not mocked actors.

| # | Case | Expected |
| --- | --- | --- |
| 1 | anonymous, foreign tenant, disabled member, customer role, missing capability | denied before any read of linkage or write |
| 2 | two tenants reuse same external ID | two linkage keys, two customers, no cross read |
| 3 | one tenant, two namespaces reuse same external ID | independent linkages |
| 4 | leading-zero / mixed-case IDs `007`, `007 `, `A1`, `a1` | all distinct; no coercion |
| 5 | exact replay, same key and digest | one customer, one receipt, identical result, no second event |
| 6 | altered payload, same key | `payload_digest_mismatch`, no write |
| 7 | concurrent linkage of same ID | exactly one linkage and one customer; loser denied or replayed, never two customers |
| 8 | household ambiguity (email, phone, name+address) | `possible_household_match`, no identity claim; each of skip / link / create_new works and is audited |
| 9 | conflicting source IDs (same ID, different facts) | blocked, nothing applied |
| 10 | stale target revision on link/update | `stale_target_revision`, no write |
| 11 | partial resume after N applied | continues at checkpoint; applied not redone |
| 12 | unknown reconciliation | receipt present -> applied; absent -> explicit replan; never a new operation |
| 13 | membership disabled / session revoked mid-session | paused, no writes; new session needs fresh approval |
| 14 | fault injection after linkage write | whole transaction rolled back: no customer, link, receipt, audit or checkpoint |
| 15 | namespace/mapping version mismatch on resume | denied |
| 16 | metadata audit | no raw diagnostics or contact dump in operation, audit or logs |
| 17 | imported paid/approved status columns | ignored; no payment/estimate/review aggregate |
| 18 | unbounded history | bounded read unavailable -> deny; no scan |

Evidence honesty: `convex-test` runs functions against an in-memory mock with serialized transactions. It proves logic, authorization, atomic rollback and sequential/serialized races, but it does NOT prove real OCC retry behavior, write-conflict timing, index performance or scale. Concurrency claims (case 7) therefore require, in addition, evidence from a real local Convex backend and later the deployed deployment with parallel calls and observed OCC retries, recorded against an exact head. Until that exists, reports must say "serialized in convex-test" and make no scale or production claim. This design is itself unexecuted: nothing here has been run beyond type checks.

## 9. Dependencies and risks

- #159 (bounded state reads): `loadPainterState` currently collects the whole tenant. Implementation needs exact-key target/receipt/candidate reads before it can be safe; the migration must not reuse the full-tenant loader per row or truncate.
- `painterEntities` queries for candidate search have no email/phone index; candidate search requires either an additive index (lease, owner approval) or an operator-selected target only.
- Risk: duplicate linkage race; mitigated by unique `by_linkage_key` read-then-write inside one transaction (Convex OCC conflicts on the read set) and by the receipt exact-key check. Needs the real-OCC evidence above.
- Rollback of the design: remove the new files; no runtime effect. Rollback of a later implementation: additive tables only, feature unmounted, applied customers remain ordinary customers.

## 10. Acceptance mapping (#161)

1. Namespace/membership/capability/provenance: sections 1, 7.
2. Private mapping, ID fidelity, no invented identity: section 2.
3. Sole writer transaction, #159: sections 4, 9.
4. Replay candidate, conflicts, household choices, audit: section 5.
5. Versioned sessions, states, idempotency/digest, unknown reconciliation, checkpoints, revocation, no raw diagnostics: sections 3, 6.
6. Coexistence UX: section 7.
7. Test matrix and convex-test vs OCC distinction: section 8.
