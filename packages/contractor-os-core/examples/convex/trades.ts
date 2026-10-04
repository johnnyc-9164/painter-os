/** Optional painting add-on example. Browser callers never supply tenant or actor. */
import {v} from 'convex/values';
import {query,mutation} from './_generated/server.js';
import {components} from './_generated/api.js';
import type {DataModel} from './_generated/dataModel.js';
import {PaintingClient} from '../../src/trades/painting/client.js';
import {properties,coreReferences} from '../../src/trades/painting/component/validators.js';
const client=new PaintingClient<DataModel>(components.contractorPainting,components.contractorOs,async(ctx,identity)=>{
 const row=await ctx.db.query('contractorOsMemberships').withIndex('by_identity',q=>q.eq('tokenIdentifier',identity.tokenIdentifier)).unique();
 if(!row||!row.enabled)return null;
 return {tenantId:row.tenantId,permissions:row.role==='viewer'?['read']:['read','write']};
});
const receipt=v.object({id:v.string(),revision:v.number(),replayed:v.boolean()});
export const createPainting=mutation({args:{identifier:v.string(),requestKey:v.string(),properties,coreReferences:v.optional(coreReferences)},returns:receipt,handler:(ctx,args)=>client.create(ctx,args)});
export const updatePainting=mutation({args:{identifier:v.string(),requestKey:v.string(),expectedRevision:v.number(),properties:v.optional(properties),coreReferences:v.optional(coreReferences)},returns:receipt,handler:(ctx,args)=>client.update(ctx,args)});
export const getPainting=query({args:{identifier:v.string()},returns:v.union(v.object({_id:v.string(),_creationTime:v.number(),tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()}),v.null()),handler:(ctx,args)=>client.get(ctx,args.identifier)});
