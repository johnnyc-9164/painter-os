import { v } from 'convex/values';
import { internalMutationGeneric, type MutationBuilder } from 'convex/server';
import { mutation } from './runtime';
import type { DataModel } from './runtime';
import { requireBidSourceMember, acceptBidSourceCallback } from './bidSourceOwnership';
const internalMutation=internalMutationGeneric as MutationBuilder<DataModel,'internal'>;
/** No SDK instance, component mount or activation toggle exists in the production adapter. */
export const availability=mutation({args:{workspaceId:v.id('painterWorkspaces')},returns:v.object({enabled:v.literal(false),reason:v.literal('provider_not_authorized')}),handler:async(ctx,args)=>{
  await requireBidSourceMember(ctx,args.workspaceId);
  return {enabled:false as const,reason:'provider_not_authorized' as const};
}});
/** Unmounted trusted SDK completion callback. No callback-context tenant, actor or role authority. */
export const complete=internalMutation({args:{crawlId:v.string(),jobId:v.optional(v.string()),status:v.union(v.literal('completed'),v.literal('failed'),v.literal('cancelled')),pageCount:v.number(),unstored:v.optional(v.number()),error:v.optional(v.string()),context:v.optional(v.object({operationKey:v.string()}))},returns:v.null(),handler:async(ctx,args)=>{
  if(!Number.isSafeInteger(args.pageCount)||args.pageCount<0||args.pageCount>100000||args.unstored!==undefined&&(!Number.isSafeInteger(args.unstored)||args.unstored<0||args.unstored>100000)||args.jobId!==undefined&&args.jobId.length>128||args.error!==undefined&&args.error.length>4096||args.context!==undefined&&args.context.operationKey.length>128)throw new Error('BID_SOURCE_CALLBACK_INVALID');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([args.crawlId,args.status,args.pageCount,args.unstored??null])))),b=>b.toString(16).padStart(2,'0')).join('');
  await acceptBidSourceCallback(ctx,{componentCrawlId:args.crawlId,digest});return null;
}});
