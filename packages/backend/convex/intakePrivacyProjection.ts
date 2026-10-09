import type {AuditEvent, CommandResult} from '../../domain/src/contracts';

/** Public-origin audit attribution never duplicates submitted or edited contact data. */
export function intakeAuditMetadata(event: AuditEvent, requestHash: string): Record<string, unknown> {
  return {
    schemaVersion: 1, action: event.type, requestHash,
    revision: typeof event.payload.revision === 'number' ? event.payload.revision : null,
    contactDataRedacted: true,
  };
}

/** Deletion preserves only the retry tombstone, not entity snapshots or free text. */
export function deletedIntakeCommandResult(): CommandResult {
  return {message: 'INTAKE_CONTACT_DELETED'};
}
