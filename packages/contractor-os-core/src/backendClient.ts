/** Host-only service. Membership is resolved on the server for every invocation. */
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx, PaginationOptions } from 'convex/server';
import type { ComponentApi } from './component/_generated/component.js';
import type { MembershipResolver } from './client.js';
import { requireScope, type Permission } from './shared/port.js';
import type { Blueprint } from './shared/model.js';
import type { RecordProjection } from './shared/projections.js';
import type { BusinessArgs, BusinessResult } from './shared/businessTypes.js';
export type { BusinessArgs, BusinessResult, CommandInputs, CommandName, Attestation, RevisionPrecondition } from './shared/businessTypes.js';
export class ContractorBackend<D extends GenericDataModel> {
    constructor(private readonly component: ComponentApi, private readonly membership: MembershipResolver<D>) { }
    private async scope(ctx: GenericQueryCtx<D>, permission: Permission) {
        const identity = await ctx.auth.getUserIdentity();
        const member = identity ? await this.membership(ctx, identity) : null;
        return { ...requireScope(identity, permission, member), mayAttest: member?.permissions.includes('attest') ?? false };
    }
    async componentInfo(ctx: GenericQueryCtx<D>) { await this.scope(ctx, 'read'); return ctx.runQuery(this.component.meta.info, {}); }
    async execute(ctx: GenericMutationCtx<D>, args: BusinessArgs): Promise<BusinessResult> {
        const scope = await this.scope(ctx, 'write');
        // Do not spread args: malicious JavaScript callers can include untyped tenant/actor/role fields.
        return ctx.runMutation(this.component.workflows.execute, {
            tenantId: scope.tenantId, actorId: scope.actorId, mayAttest: scope.mayAttest,
            requestKey: args.requestKey, command: args.command,
            ...(args.expected === undefined ? {} : { expected: args.expected }), ...(args.evidence === undefined ? {} : { evidence: args.evidence }),
        });
    }
    async history(ctx: GenericQueryCtx<D>, paginationOpts: PaginationOptions) { const s = await this.scope(ctx, 'read'); return ctx.runQuery(this.component.operations.history, { tenantId: s.tenantId, paginationOpts }); }
    async jobFinancials(ctx: GenericQueryCtx<D>, identifier: string) { const s = await this.scope(ctx, 'read'); return ctx.runQuery(this.component.operations.jobFinancials, { tenantId: s.tenantId, identifier }); }
    async invoiceBalance(ctx: GenericQueryCtx<D>, identifier: string) { const s = await this.scope(ctx, 'read'); return ctx.runQuery(this.component.operations.invoiceBalance, { tenantId: s.tenantId, identifier }); }
    async listJobs(ctx: GenericQueryCtx<D>, paginationOpts: PaginationOptions) { const s = await this.scope(ctx, 'read'); return ctx.runQuery(this.component.operations.listJobs, { tenantId: s.tenantId, paginationOpts }); }
    async listLeads(ctx: GenericQueryCtx<D>, paginationOpts: PaginationOptions) { const s = await this.scope(ctx, 'read'); return ctx.runQuery(this.component.operations.listLeads, { tenantId: s.tenantId, paginationOpts }); }
    async inspectRecord(ctx: GenericQueryCtx<D>, blueprint: Blueprint, identifier: string, asOf?: number): Promise<RecordProjection | null> {
        const s = await this.scope(ctx, 'read');
        return ctx.runQuery(this.component.projections.get, { tenantId: s.tenantId, blueprint, identifier,
            ...(asOf === undefined ? {} : { asOf }) });
    }
}
