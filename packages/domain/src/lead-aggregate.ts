import type { Entity } from './contracts';
/** Host-generated immutable namespace; editable source text is not provenance. */
export const PUBLIC_INTAKE_LEAD_ID_PREFIX = 'intake-lead:';

const contactFields = ['name', 'email', 'phone', 'address', 'source', 'notes'] as const;

/** Existing CRM normalization. Public ingress must apply its smaller bounds first. */
export function normalizeLeadContact(input: Record<string, unknown>): Record<string, unknown> {
  const contact: Record<string, unknown> = {};
  for (const key of contactFields) {
    if (input[key] === undefined) continue;
    const value = input[key];
    if (typeof value !== 'string' || (key === 'name' && !value.trim()) || value.length > 100000) {
      throw new Error(`INVALID_STRING:${key}`);
    }
    contact[key] = value.trim();
  }
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email))) throw new Error('INVALID_EMAIL');
  if (contact.name) contact.title = contact.name;
  return contact;
}

/** Constructs the canonical lead aggregate; IDs and customer linkage come from its host. */
export function createLeadAggregate(args: {
  id: string; tenantId: string; now: string; input: Record<string, unknown>; customerId?: string | null;
}): Entity {
  for (const key of Object.keys(args.input)) {
    if (!(contactFields as readonly string[]).includes(key)) throw new Error(`UNKNOWN_FIELD:${key}`);
  }
  if (typeof args.input.name !== 'string' || !args.input.name.trim() || args.input.name.length > 100000) throw new Error('INVALID_STRING:name');
  const contact = normalizeLeadContact(args.input);
  const title = String(contact.title ?? contact.name ?? 'lead');
  return {
    id: args.id, type: 'lead', tenantId: args.tenantId, revision: 1, createdAt: args.now, updatedAt: args.now,
    data: {title, name: title, ...contact, customerId: args.customerId ?? null, status: 'new'},
  };
}
