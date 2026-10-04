import type { MutationCtx, QueryCtx } from './_generated/server.js';
import { ConvexError } from 'convex/values';
import { boundedString, canonicalJson } from '../shared/port.js';
import { definition, validateRelations, type RelationInput } from '../shared/domain.js';
import type { Blueprint } from '../shared/model.js';
export function checkRead(tenantId:string) { boundedString(tenantId,'INVALID_TENANT',256); }
export function checkWrite(args:{tenantId:string;actorId:string;identifier:string;requestKey:string;title?:string|null}) {
 checkRead(args.tenantId);boundedString(args.actorId,'INVALID_ACTOR',2048);boundedString(args.identifier,'INVALID_IDENTIFIER');boundedString(args.requestKey,'INVALID_REQUEST_KEY',256);
 if(args.title!==undefined&&args.title!==null&&(typeof args.title!=='string'||args.title.length>512))throw new ConvexError('INVALID_TITLE');
}
export function checkPage(n:number) {if(!Number.isInteger(n)||n<1||n>100)throw new ConvexError('INVALID_PAGE_SIZE');}
export function checkRevision(n:number){if(!Number.isSafeInteger(n)||n<1)throw new ConvexError('INVALID_REVISION');}
/** Parent app authenticates. This checks that every local reference stays in tenant and target table. */
export async function checkLinks(ctx:QueryCtx,tenantId:string,blueprint:Blueprint,input:unknown):Promise<RelationInput> {
 const relations=validateRelations(blueprint,input), def=definition(blueprint);
 for(const [key,value] of Object.entries(relations)) {
  const table=def.relations[key]!.target;
  for(const valueId of value===null?[]:Array.isArray(value)?value:[value]) {
   const id=ctx.db.normalizeId(table,valueId);
   if(!id)throw new ConvexError('INVALID_RELATION_ID');
   const target=await ctx.db.get(id);
   // Same response for absent and foreign-tenant IDs to avoid an existence oracle.
   if(!target||target.tenantId!==tenantId)throw new ConvexError('RELATION_TARGET_MISSING');
  }
 }
 return relations;
}
export async function priorRequest(ctx:QueryCtx,tenantId:string,requestKey:string,signature:string) {
 const receipt=await ctx.db.query('domainRequests').withIndex('by_tenant_request',q=>q.eq('tenantId',tenantId).eq('requestKey',requestKey)).unique();
 if(receipt&&receipt.signature!==signature)throw new ConvexError('IDEMPOTENCY_KEY_CONFLICT');
 return receipt;
}
export async function appendEvent(ctx:MutationCtx,input:{tenantId:string;actorId:string;blueprint:Blueprint;identifier:string;requestKey:string;operation:'record.created'|'record.updated';before:unknown;after:unknown;at:number}) {
 return ctx.db.insert('domainEvents',{tenantId:input.tenantId,actorId:input.actorId,blueprint:input.blueprint,identifier:input.identifier,
  requestKey:input.requestKey,type:input.operation,beforeJson:input.before===null?null:canonicalJson(input.before),afterJson:canonicalJson(input.after),occurredAt:input.at});
}
