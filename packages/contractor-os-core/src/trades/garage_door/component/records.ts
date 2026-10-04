// Generated from explicit contractor partition IR. Host owns authentication and core-reference checks.
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import { mutation, query } from './_generated/server.js';
import { properties, coreReferences, document, receipt } from './validators.js';
import schema from './schema.js';
import { boundedString, canonicalJson } from '../../../shared/port.js';
import { validateTrade, patchTrade, validateCoreReferences } from '../../../shared/tradeValidation.js';
const trade='garage_door' as const;
export const get=query({args:{tenantId:v.string(),identifier:v.string()},returns:v.union(document,v.null()),handler:async(ctx,args)=>{
 boundedString(args.tenantId,'INVALID_TENANT');boundedString(args.identifier,'INVALID_IDENTIFIER');
 return ctx.db.query('specs').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
}});
export const list=query({args:{tenantId:v.string(),paginationOpts:paginationOptsValidator},returns:v.object({page:v.array(document),isDone:v.boolean(),continueCursor:v.string()}),handler:async(ctx,args)=>{
 boundedString(args.tenantId,'INVALID_TENANT');const n=args.paginationOpts.numItems;
 if(!Number.isInteger(n)||n<1||n>100)throw new ConvexError('INVALID_PAGE_SIZE');
 const p=await paginator(ctx.db,schema).query('specs').withIndex('by_tenant',q=>q.eq('tenantId',args.tenantId)).paginate(args.paginationOpts);
 return {page:p.page,isDone:p.isDone,continueCursor:p.continueCursor};
}});
const write={tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),title:v.optional(v.union(v.string(),v.null()))};
function check(args:{tenantId:string;actorId:string;identifier:string;requestKey:string;title?:string|null}){
 for(const key of ['tenantId','actorId','identifier','requestKey'] as const)boundedString(args[key],`INVALID_${key}`,key==='actorId'?2048:key==='identifier'?512:256);
 if(args.title!==undefined&&args.title!==null&&args.title.length>512)throw new ConvexError('INVALID_TITLE');
}
export const create=mutation({args:{...write,properties,coreReferences:v.optional(coreReferences)},returns:receipt,handler:async(ctx,args)=>{
 check(args);const props=validateTrade(trade,args.properties),refs=validateCoreReferences(args.coreReferences??{});
 const signature=canonicalJson({operation:'create',...args});
 const prior=await ctx.db.query('requests').withIndex('by_tenant_request',q=>q.eq('tenantId',args.tenantId).eq('requestKey',args.requestKey)).unique();
 if(prior){if(prior.signature!==signature)throw new ConvexError('IDEMPOTENCY_KEY_CONFLICT');return {id:prior.id,revision:prior.revision,replayed:true};}
 const existing=await ctx.db.query('specs').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
 if(existing)throw new ConvexError('RECORD_EXISTS');
 const at=Date.now(),row={tenantId:args.tenantId,identifier:args.identifier,title:args.title??null,properties:props,coreReferences:refs,revision:1,createdAt:at,updatedAt:at};
 const id=await ctx.db.insert('specs',row);
 await ctx.db.insert('events',{tenantId:args.tenantId,actorId:args.actorId,identifier:args.identifier,requestKey:args.requestKey,operation:'create',beforeJson:null,afterJson:canonicalJson(row),occurredAt:at});
 await ctx.db.insert('requests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,id,revision:1});
 return {id,revision:1,replayed:false};
}});
export const update=mutation({args:{...write,expectedRevision:v.number(),properties:v.optional(properties),unsetProperties:v.optional(v.array(v.string())),coreReferences:v.optional(coreReferences)},returns:receipt,handler:async(ctx,args)=>{
 check(args);if(!Number.isSafeInteger(args.expectedRevision)||args.expectedRevision<1)throw new ConvexError('INVALID_REVISION');
 const signature=canonicalJson({operation:'update',...args});
 const prior=await ctx.db.query('requests').withIndex('by_tenant_request',q=>q.eq('tenantId',args.tenantId).eq('requestKey',args.requestKey)).unique();
 if(prior){if(prior.signature!==signature)throw new ConvexError('IDEMPOTENCY_KEY_CONFLICT');return {id:prior.id,revision:prior.revision,replayed:true};}
 const row=await ctx.db.query('specs').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
 if(!row)throw new ConvexError('RECORD_NOT_FOUND');if(row.revision!==args.expectedRevision)throw new ConvexError('REVISION_CONFLICT');
 const next={tenantId:row.tenantId,identifier:row.identifier,title:args.title===undefined?row.title:args.title,properties:patchTrade(trade,row.properties,args.properties??{},args.unsetProperties??[]),coreReferences:args.coreReferences===undefined?row.coreReferences:validateCoreReferences(args.coreReferences),revision:row.revision+1,createdAt:row.createdAt,updatedAt:Date.now()};
 await ctx.db.replace(row._id,next);
 await ctx.db.insert('events',{tenantId:args.tenantId,actorId:args.actorId,identifier:args.identifier,requestKey:args.requestKey,operation:'update',beforeJson:canonicalJson(row),afterJson:canonicalJson(next),occurredAt:next.updatedAt});
 await ctx.db.insert('requests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,id:row._id,revision:next.revision});
 return {id:row._id,revision:next.revision,replayed:false};
}});
