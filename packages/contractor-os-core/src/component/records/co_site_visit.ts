// Generated for co_site_visit. Property rules are source-derived; envelope and safety controls are implementation policy.
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import { query, mutation } from '../_generated/server.js';
import schema from '../schema.js';
import { domainProperties, domainRelations } from '../domainValidators.js';
import { domainEnvelope } from '../domainTables.js';
import { boundedString, canonicalJson } from '../../shared/port.js';
import { validateProperties, validateRelations, applyPropertyPatch, definition } from '../../shared/domain.js';
import { checkRead, checkWrite, checkPage, checkRevision, checkLinks, priorRequest, appendEvent } from '../domainRuntime.js';
import { guardMaintenance } from '../../shared/businessPolicy.js';
const props=domainProperties.co_site_visit, rels=domainRelations.co_site_visit;
const document=v.object({...domainEnvelope,_id:v.id('co_site_visit'),_creationTime:v.number(),properties:props,relations:rels});
const receipt=v.object({id:v.id('co_site_visit'),revision:v.number(),eventId:v.id('domainEvents'),replayed:v.boolean()});
export const get=query({
 args:{tenantId:v.string(),identifier:v.string()},returns:v.union(document,v.null()),
 handler:async(ctx,args)=>{checkRead(args.tenantId);boundedString(args.identifier,'INVALID_IDENTIFIER');
  return ctx.db.query('co_site_visit').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();},
});
export const list=query({
 args:{tenantId:v.string(),paginationOpts:paginationOptsValidator},returns:v.object({page:v.array(document),isDone:v.boolean(),continueCursor:v.string()}),
 handler:async(ctx,args)=>{checkRead(args.tenantId);checkPage(args.paginationOpts.numItems);
  const page=await paginator(ctx.db,schema).query('co_site_visit').withIndex('by_tenant',q=>q.eq('tenantId',args.tenantId)).paginate(args.paginationOpts);
  return {page:page.page,isDone:page.isDone,continueCursor:page.continueCursor};},
});
/** Draft/data maintenance only. Workflow-managed outcomes and balances cannot be set here. */
export const create=mutation({
 args:{tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),title:v.optional(v.union(v.string(),v.null())),properties:props,relations:v.optional(rels)},returns:receipt,
 handler:async(ctx,args)=>{
  checkWrite(args);
  const properties=validateProperties('co_site_visit',args.properties), relations=args.relations??{};
  validateRelations('co_site_visit',relations);
  const signature=canonicalJson({operation:'create',blueprint:'co_site_visit',actorId:args.actorId,identifier:args.identifier,title:args.title??null,properties,relations});
  const previous=await priorRequest(ctx,args.tenantId,args.requestKey,signature);
  if(previous){const id=ctx.db.normalizeId('co_site_visit',previous.entityId);if(!id)throw new ConvexError('INVALID_RECEIPT');return {id,revision:previous.revision,eventId:previous.eventId,replayed:true};}
  const existing=await ctx.db.query('co_site_visit').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
  if(existing)throw new ConvexError('ENTITY_EXISTS');
  guardMaintenance('co_site_visit',null,properties,{},relations);
  await checkLinks(ctx,args.tenantId,'co_site_visit',relations);
  const now=Date.now(),after={identifier:args.identifier,title:args.title??null,properties,relations,revision:1};
  const eventId=await appendEvent(ctx,{tenantId:args.tenantId,actorId:args.actorId,blueprint:'co_site_visit',identifier:args.identifier,requestKey:args.requestKey,operation:'record.created',before:null,after,at:now});
  const id=await ctx.db.insert('co_site_visit',{tenantId:args.tenantId,...after,createdAt:now,updatedAt:now,lastEventId:eventId});
  await ctx.db.insert('domainRequests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,entityId:id,eventId,revision:1,createdAt:now});
  return {id,revision:1,eventId,replayed:false};
 },
});
export const update=mutation({
 args:{tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),expectedRevision:v.number(),title:v.optional(v.union(v.string(),v.null())),properties:v.optional(props),unsetProperties:v.optional(v.array(v.string())),relations:v.optional(rels),unsetRelations:v.optional(v.array(v.string()))},returns:receipt,
 handler:async(ctx,args)=>{
  checkWrite(args);checkRevision(args.expectedRevision);
  const signature=canonicalJson({operation:'update',blueprint:'co_site_visit',actorId:args.actorId,identifier:args.identifier,expectedRevision:args.expectedRevision,
   titleSet:args.title!==undefined,title:args.title??null,properties:args.properties??{},unsetProperties:args.unsetProperties??[],relations:args.relations??{},unsetRelations:args.unsetRelations??[]});
  const previous=await priorRequest(ctx,args.tenantId,args.requestKey,signature);
  if(previous){const id=ctx.db.normalizeId('co_site_visit',previous.entityId);if(!id)throw new ConvexError('INVALID_RECEIPT');return {id,revision:previous.revision,eventId:previous.eventId,replayed:true};}
  const existing=await ctx.db.query('co_site_visit').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
  if(!existing)throw new ConvexError('ENTITY_NOT_FOUND');
  if(existing.revision!==args.expectedRevision)throw new ConvexError('REVISION_CONFLICT');
  const properties=applyPropertyPatch('co_site_visit',existing.properties,args.properties??{},args.unsetProperties??[]);
  const relations={...existing.relations,...args.relations};
  const unset=args.unsetRelations??[];
  if(unset.length>100||new Set(unset).size!==unset.length)throw new ConvexError('INVALID_UNSET');
  for(const key of unset){
   if(!Object.hasOwn(definition('co_site_visit').relations,key))throw new ConvexError('UNKNOWN_RELATION');
   if(Object.hasOwn(args.relations??{},key))throw new ConvexError('AMBIGUOUS_PATCH');
   delete relations[key as keyof typeof relations];
  }
  await checkLinks(ctx,args.tenantId,'co_site_visit',relations);
  guardMaintenance('co_site_visit',existing.properties,properties,existing.relations,relations);
  const revision=existing.revision+1;if(!Number.isSafeInteger(revision))throw new ConvexError('REVISION_LIMIT');
  const now=Date.now(),after={identifier:args.identifier,title:args.title===undefined?existing.title:args.title,properties,relations,revision};
  const before={identifier:existing.identifier,title:existing.title,properties:existing.properties,relations:existing.relations,revision:existing.revision};
  const eventId=await appendEvent(ctx,{tenantId:args.tenantId,actorId:args.actorId,blueprint:'co_site_visit',identifier:args.identifier,requestKey:args.requestKey,operation:'record.updated',before,after,at:now});
  await ctx.db.patch(existing._id,{...after,updatedAt:now,lastEventId:eventId});
  await ctx.db.insert('domainRequests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,entityId:existing._id,eventId,revision,createdAt:now});
  return {id:existing._id,revision,eventId,replayed:false};
 },
});
