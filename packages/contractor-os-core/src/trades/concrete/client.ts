// Generated host-only client. Mount selection is trusted server configuration.
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx, PaginationOptions } from 'convex/server';
import type { ComponentApi } from './component/_generated/component.js';
import type { ComponentApi as CoreApi } from '../../component/_generated/component.js';
import type { MembershipResolver } from '../../client.js';
import type { TradeProperties, CoreReferences } from '../../shared/tradeTypes.js';
import { requireScope, type Permission } from '../../shared/port.js';
import { validateCoreReferences } from '../../shared/tradeValidation.js';
import { evaluateCalculation } from '../../shared/calculations.js';
type Props=TradeProperties['concrete'];
export class ConcreteClient<D extends GenericDataModel> {
 constructor(private readonly component:ComponentApi,private readonly core:CoreApi,private readonly membership:MembershipResolver<D>){}
 private async scope(ctx:GenericQueryCtx<D>,permission:Permission){const identity=await ctx.auth.getUserIdentity();return requireScope(identity,permission,identity?await this.membership(ctx,identity):null);}
 private async references(ctx:GenericQueryCtx<D>,tenantId:string,refs:CoreReferences){
  validateCoreReferences(refs);
  for(const [key,value] of Object.entries(refs))if(value!==null&&value!==undefined){
   const record=key==='scope'?await ctx.runQuery(this.core.records.co_scope.get,{tenantId,identifier:value}):await ctx.runQuery(this.core.records.co_pricing_rule.get,{tenantId,identifier:value});
   if(!record)throw new Error('CORE_REFERENCE_MISSING');
  }
 }
 async get(ctx:GenericQueryCtx<D>,identifier:string){const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.get,{tenantId:s.tenantId,identifier});}
 async list(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions){const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.list,{tenantId:s.tenantId,paginationOpts});}
 async create(ctx:GenericMutationCtx<D>,args:{identifier:string;requestKey:string;title?:string|null;properties:Props;coreReferences?:CoreReferences}){
  const s=await this.scope(ctx,'write');await this.references(ctx,s.tenantId,args.coreReferences??{});
  return ctx.runMutation(this.component.records.create,{...args,tenantId:s.tenantId,actorId:s.actorId});
 }
 async update(ctx:GenericMutationCtx<D>,args:{identifier:string;requestKey:string;expectedRevision:number;title?:string|null;properties?:Props;unsetProperties?:(keyof Props)[];coreReferences?:CoreReferences}){
  const s=await this.scope(ctx,'write');if(args.coreReferences!==undefined)await this.references(ctx,s.tenantId,args.coreReferences);
  return ctx.runMutation(this.component.records.update,{...args,tenantId:s.tenantId,actorId:s.actorId});
 }
 async calculations(ctx:GenericQueryCtx<D>,identifier:string){
  const row=await this.get(ctx,identifier);if(!row)return null;
  const props={...row.properties,trade:'concrete'};
  const warnings=['painting','roofing'].includes('concrete')&&props.measurement_unit!==undefined&&props.measurement_unit!=='sq_ft'?['SOURCE_FORMULA_ASSUMES_SQUARE_FEET']:[];
  return {warnings,estimated_gallons:evaluateCalculation('co_trade_spec','estimated_gallons',props,Date.now()),estimated_squares:evaluateCalculation('co_trade_spec','estimated_squares',props,Date.now())};
 }
}
