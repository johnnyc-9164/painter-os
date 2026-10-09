import type {GenericMutationCtx} from 'convex/server';
import type {DataModel, Id} from './runtime';
import type {Command, Role} from '../../domain/src/contracts';

/** Reads the same provenance/aggregate that deletion and promotion update, so OCC
 * serializes a competing staff command with purge. No browser role grants authority. */
export async function intakeCommandContext(ctx: GenericMutationCtx<DataModel>, tenantId: Id<'painterWorkspaces'>, command: Command, replaying: boolean, role: Role) {
  if (!command.entityId || !command.action.startsWith('lead.')) return null;
  const receipt = await ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_entity', q=>q.eq('tenantId',tenantId).eq('leadEntityId',command.entityId!)).unique();
  if (receipt && ['deletion_pending', 'deleted'].includes(receipt.state) && !replaying) throw new Error('INTAKE_CONTACT_DELETED');
  if (receipt && (command.action === 'lead.qualify' || (command.action === 'lead.update' && command.input?.customerId)) && !['owner', 'office_admin'].includes(role)) throw new Error('INTAKE_RETENTION_TRANSFER_FORBIDDEN');
  return receipt;
}
