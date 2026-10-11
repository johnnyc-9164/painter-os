/**
 * Design-only contract for issue #161 (see docs/design/CRM_MIGRATION_LINKAGE.md).
 * Types and two frozen constants only: no Convex, auth, domain or UI imports and no runtime wiring.
 * Nothing here grants authority; the trusted host derives tenant, actor, namespace, digests and keys.
 */
export const CRM_MIGRATION_MAPPING_VERSION = 1 as const;
export const CRM_MIGRATION_LIMITS = {operationsPerBatch: 25, externalIdMaxLength: 200, sessionOperationsMax: 5000} as const;

/** Server-registered namespace. Only manual_export exists; provider kinds require a separate verified registration. */
export type SourceProvenance = 'manual_export_unverified';
export interface SourceNamespace {
  tenantId: string;           // resolved server-side from Better Auth + enabled membership
  namespaceId: string;        // opaque server-generated id, never a provider claim
  provenance: SourceProvenance;
  label: string;              // operator text, display only, not an account assertion
  mappingVersion: typeof CRM_MIGRATION_MAPPING_VERSION;
  state: 'active' | 'retired';
}

/** Opaque, byte-exact: case and leading zeros preserved. Never a row number, email, phone or name. */
export type ExternalCustomerId = string;
/** sha256 hex over canonical JSON [tenantId, namespaceId, externalId]. */
export type LinkageKey = string;
/** sha256 hex of the canonical normalized contact payload. */
export type PayloadDigest = string;

export interface CustomerLinkage {
  tenantId: string; namespaceId: string; externalId: ExternalCustomerId; linkageKey: LinkageKey;
  customerEntityId: string; linkedRevision: number; lastPayloadDigest: PayloadDigest;
  origin: 'created_by_operation' | 'linked_existing'; operationId: string;
}

export type OperationState = 'planned' | 'approved' | 'applied' | 'denied' | 'unknown';
export const OPERATION_TRANSITIONS: Readonly<Record<OperationState, readonly OperationState[]>> = {
  planned: ['approved', 'denied'],
  approved: ['applied', 'denied', 'unknown'],
  unknown: ['applied', 'denied'],   // only via canonical receipt reconciliation
  applied: [], denied: [],
};

export type DuplicateDecision =
  | {kind: 'none'}
  | {kind: 'replay_update_candidate'; linkedCustomerEntityId: string}
  | {kind: 'blocked_conflicting_source_id'}
  | {kind: 'possible_household_match'; targets: readonly {entityId: string; revision: number; basis: readonly ('email' | 'phone' | 'name_address')[]}[]};

export type OperatorChoice =
  | {kind: 'skip'}
  | {kind: 'link_existing'; targetEntityId: string; expectedRevision: number}
  | {kind: 'create_new_reviewed'};

export type DenialReason =
  | 'membership_revoked' | 'capability_missing' | 'namespace_mismatch' | 'mapping_version_mismatch'
  | 'payload_digest_mismatch' | 'stale_target_revision' | 'linkage_conflict' | 'conflicting_source_id'
  | 'household_choice_required' | 'bounded_read_unavailable';

/** Persisted metadata: no raw provider diagnostics and no contact dump. */
export interface MigrationOperation {
  operationId: string; sessionId: string; tenantId: string; namespaceId: string; mappingVersion: number;
  idempotencyKey: string;          // stable per (session, ordinal, linkageKey or reviewed-copy ordinal)
  linkageKey: LinkageKey | null;   // null: ordinary reviewed copy without a source ID
  payloadDigest: PayloadDigest; state: OperationState; denialReason?: DenialReason;
  decision?: OperatorChoice; decidedBy?: string; targetEntityId?: string; resultRevision?: number;
  canonicalReceiptKey?: string;    // exact-key receipt in the existing painterReceipts authority
}

export interface MigrationCheckpoint {
  sessionId: string; tenantId: string; namespaceId: string; mappingVersion: number;
  nextOrdinal: number; counts: Readonly<Record<OperationState, number>>; actorUserId: string;
  status: 'open' | 'paused_membership_revoked' | 'completed' | 'abandoned';
  sourceOfTruthAck: readonly ('active_jobs' | 'estimates' | 'billing' | 'history')[];
}

/** Shape of the single commit; implementation must perform all five writes in one Convex mutation. */
export interface MigrationCommitSet {
  customerDelta: {command: 'customer.create' | 'customer.update'; expectedRevision?: number};
  linkage: CustomerLinkage; receipt: {requestKey: string}; audit: {eventType: string}; checkpoint: MigrationCheckpoint;
}
