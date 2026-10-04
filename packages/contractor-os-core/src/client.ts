import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx, PaginationOptions } from 'convex/server';
import type { UserIdentity } from 'convex/server';
import type { ComponentApi } from './component/_generated/component.js';
import { requireScope, validateWorkflowInput, type Membership, type Permission } from './shared/port.js';
import type { Blueprint } from './shared/model.js';
import type { WorkflowInputs } from './shared/workflowTypes.js';

export { BLUEPRINTS } from './shared/model.js';
export type { Blueprint, WorkflowInputs, Membership };
export { validateWorkflowInput };

export type MembershipResolver<D extends GenericDataModel> = (
  ctx: GenericQueryCtx<D>, identity: UserIdentity,
) => Promise<Membership | null>;

/** Runs in the host app. Never send browser-supplied tenantId/roles into this resolver. */
export class ContractorOS<D extends GenericDataModel> {
  constructor(private readonly component: ComponentApi, private readonly membership: MembershipResolver<D>) {}
  private async scope(ctx: GenericQueryCtx<D>, permission: Permission) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return requireScope(null, permission, null);
    return requireScope(identity, permission, await this.membership(ctx, identity));
  }
  async info(ctx: GenericQueryCtx<D>) {
    await this.scope(ctx, 'read');
    return ctx.runQuery(this.component.meta.info, {});
  }
  async get(ctx: GenericQueryCtx<D>, args: { blueprint: Blueprint; identifier: string }) {
    const scope = await this.scope(ctx, 'read');
    return ctx.runQuery(this.component.entities.get, { tenantId: scope.tenantId, blueprint: args.blueprint, identifier: args.identifier });
  }
  async list(ctx: GenericQueryCtx<D>, args: { blueprint: Blueprint; paginationOpts: PaginationOptions }) {
    const scope = await this.scope(ctx, 'read');
    return ctx.runQuery(this.component.entities.list, { tenantId: scope.tenantId, blueprint: args.blueprint, paginationOpts: args.paginationOpts });
  }
  async relations(ctx: GenericQueryCtx<D>, args: { blueprint: Blueprint; identifier: string }) {
    const scope = await this.scope(ctx, 'read');
    return ctx.runQuery(this.component.entities.relations, { tenantId: scope.tenantId, blueprint: args.blueprint, identifier: args.identifier });
  }
  async history(ctx: GenericQueryCtx<D>, args: { paginationOpts: PaginationOptions }) {
    const scope = await this.scope(ctx, 'read');
    return ctx.runQuery(this.component.entities.history, { tenantId: scope.tenantId, paginationOpts: args.paginationOpts });
  }
  async importBatch(ctx: GenericMutationCtx<D>, args: { source: string; requestKey: string; recordsJson: string }) {
    const scope = await this.scope(ctx, 'import');
    return ctx.runMutation(this.component.entities.importBatch, {
      tenantId: scope.tenantId, actorId: scope.actorId,
      source: args.source, requestKey: args.requestKey, recordsJson: args.recordsJson,
    });
  }
  validateInput<K extends keyof WorkflowInputs>(name: K, args: WorkflowInputs[K]) {
    return validateWorkflowInput(name, args);
  }
}
