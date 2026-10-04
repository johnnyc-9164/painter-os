/** Example wrappers to merge into your host; do not replace its existing auth model. */
import {v} from 'convex/values';
import {query,mutation} from './_generated/server.js';
import {components} from './_generated/api.js';
import type {DataModel} from './_generated/dataModel.js';
import {TypedContractorOS} from '../../src/domainClient.js';
import {domainProperties,domainRelations} from '../../src/component/domainValidators.js';
const os=new TypedContractorOS<DataModel>(components.contractorOs,async(ctx,identity)=>{
 const row=await ctx.db.query('contractorOsMemberships').withIndex('by_identity',q=>q.eq('tokenIdentifier',identity.tokenIdentifier)).unique();
 if(!row||!row.enabled)return null;
 // Example role mapping only. Existing memberships are never automatically granted write.
 return {tenantId:row.tenantId,permissions:row.role==='admin'?['read','write','import']:row.role==='operator'?['read','write']:['read']};
});
export const getClient=query({
 args:{identifier:v.string()},handler:(ctx,args)=>os.co_client.get(ctx,args.identifier),
});
export const createClient=mutation({
 args:{identifier:v.string(),requestKey:v.string(),title:v.optional(v.union(v.string(),v.null())),properties:domainProperties.co_client,relations:v.optional(domainRelations.co_client)},
 handler:(ctx,args)=>os.co_client.create(ctx,args),
});
export const updateClient=mutation({
 args:{identifier:v.string(),requestKey:v.string(),expectedRevision:v.number(),properties:domainProperties.co_client},
 handler:(ctx,args)=>os.co_client.update(ctx,args),
});
