import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx, PaginationOptions } from 'convex/server';
import type { ComponentApi } from './component/_generated/component.js';
import type { MembershipResolver } from './client.js';
import type { DomainProperties, DomainRelations } from './shared/domainTypes.js';
import type { Blueprint } from './shared/model.js';
import { requireScope, type Permission } from './shared/port.js';
export type CreateRecord<B extends Blueprint>={identifier:string;requestKey:string;title?:string|null;properties:DomainProperties[B];relations?:DomainRelations[B]};
export type UpdateRecord<B extends Blueprint>={identifier:string;requestKey:string;expectedRevision:number;title?:string|null;properties?:DomainProperties[B];unsetProperties?:(keyof DomainProperties[B])[];relations?:DomainRelations[B];unsetRelations?:(keyof DomainRelations[B])[]};
/** Server-side wrapper. The parent application is responsible for selecting a verified membership. */
export class TypedContractorOS<D extends GenericDataModel> {
 constructor(private readonly component:ComponentApi,private readonly membership:MembershipResolver<D>){}
 private async scope(ctx:GenericQueryCtx<D>,permission:Permission){
  const identity=await ctx.auth.getUserIdentity();
  return requireScope(identity,permission,identity?await this.membership(ctx,identity):null);
 }
 readonly co_client={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_client.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_client.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_client'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_client.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_client'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_client.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_contact={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_contact.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_contact.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_contact'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_contact.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_contact'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_contact.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_lead={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_lead.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_lead.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_lead'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_lead.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_lead'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_lead.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_site_visit={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_site_visit.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_site_visit.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_site_visit'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_site_visit.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_site_visit'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_site_visit.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_scope={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_scope.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_scope.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_scope'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_scope.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_scope'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_scope.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_trade_spec={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_trade_spec.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_trade_spec.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_trade_spec'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_trade_spec.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_trade_spec'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_trade_spec.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_pricing_rule={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_pricing_rule.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_pricing_rule.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_pricing_rule'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_pricing_rule.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_pricing_rule'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_pricing_rule.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_proposal={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_proposal.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_proposal.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_proposal'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_proposal.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_proposal'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_proposal.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_bid={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_bid.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_bid.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_bid'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_bid.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_bid'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_bid.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_contract={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_contract.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_contract.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_contract'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_contract.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_contract'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_contract.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_job={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_job.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_job.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_job'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_job.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_job'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_job.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_subcontractor={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_subcontractor.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_subcontractor.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_subcontractor'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_subcontractor.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_subcontractor'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_subcontractor.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_change_order={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_change_order.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_change_order.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_change_order'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_change_order.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_change_order'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_change_order.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_invoice={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_invoice.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_invoice.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_invoice'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_invoice.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_invoice'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_invoice.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_payment={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_payment.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_payment.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_payment'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_payment.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_payment'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_payment.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_daily_report={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_daily_report.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_daily_report.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_daily_report'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_daily_report.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_daily_report'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_daily_report.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_campaign={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_campaign.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_campaign.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_campaign'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_campaign.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_campaign'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_campaign.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_outreach={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_outreach.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_outreach.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_outreach'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_outreach.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_outreach'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_outreach.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_automation_rule={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_automation_rule.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_automation_rule.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_automation_rule'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_automation_rule.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_automation_rule'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_automation_rule.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
 readonly co_document={
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_document.get,{tenantId:s.tenantId,identifier});},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.co_document.list,{tenantId:s.tenantId,paginationOpts});},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'co_document'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_document.create,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{}:{title:args.title}),...(args.relations===undefined?{}:{relations:args.relations})});
  },
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'co_document'>)=>{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.co_document.update,{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{}:{title:args.title}),...(args.properties===undefined?{}:{properties:args.properties}),...(args.unsetProperties===undefined?{}:{unsetProperties:args.unsetProperties}),
    ...(args.relations===undefined?{}:{relations:args.relations}),...(args.unsetRelations===undefined?{}:{unsetRelations:args.unsetRelations})});
  }
 };
}
