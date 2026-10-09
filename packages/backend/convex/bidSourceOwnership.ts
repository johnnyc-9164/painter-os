import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import type { DataModel, Id } from './runtime';
import { resolvePainterMembership } from './painter';
import { authComponent } from './auth';
import { canCommand } from '../../domain/src/engine';
import { bidSourceUrl } from '../bid-source-projection';
import type { BidSourcePolicy } from '../bid-source-contract';

type ReadCtx=GenericQueryCtx<DataModel>;
type WriteCtx=GenericMutationCtx<DataModel>;
function key(value:string){if(!/^[A-Za-z0-9_-]{1,128}$/.test(value))throw new Error('BID_SOURCE_INVALID_KEY');}
export async function requireBidSourceMember(ctx:ReadCtx,workspaceId:Id<'painterWorkspaces'>){
  const resolved=await resolvePainterMembership(ctx,workspaceId);
  if(!canCommand(resolved.actor,'bid.create'))throw new Error('BID_SOURCE_FORBIDDEN');
  return resolved;
}
export async function requireBidSourceIntent(ctx:ReadCtx,ownershipId:Id<'painterBidSourceOwnership'>){
  const row=await ctx.db.get(ownershipId);if(!row||row.deleted||row.componentCrawlId)throw new Error('BID_SOURCE_NOT_FOUND');
  const {actor}=await requireBidSourceMember(ctx,row.tenantId);if(actor.id!==row.creatorId)throw new Error('BID_SOURCE_FORBIDDEN');return row;
}
/** Private preparation only. Policy is supplied by trusted host configuration, never browser grants. */
export async function prepareBidSource(ctx:WriteCtx,args:{workspaceId:Id<'painterWorkspaces'>;operationKey:string;sourceUrl:string},policy:BidSourcePolicy){
  const {actor}=await requireBidSourceMember(ctx,args.workspaceId);key(args.operationKey);
  const sourceUrl=bidSourceUrl(args.sourceUrl,policy);if(!sourceUrl)throw new Error('BID_SOURCE_URL_REJECTED');
  const previous=await ctx.db.query('painterBidSourceOwnership').withIndex('by_tenant_operation',q=>q.eq('tenantId',args.workspaceId).eq('operationKey',args.operationKey)).unique();
  if(previous){if(previous.creatorId!==actor.id||previous.sourceUrl!==sourceUrl||previous.deleted)throw new Error('BID_SOURCE_OPERATION_CONFLICT');return previous._id;}
  return ctx.db.insert('painterBidSourceOwnership',{tenantId:args.workspaceId,creatorId:actor.id,operationKey:args.operationKey,sourceUrl,deleted:false});
}
/** Binding is private trusted-worker authority. It never derives ownership from provider callback context. */
export async function bindBidSource(ctx:WriteCtx,args:{ownershipId:Id<'painterBidSourceOwnership'>;componentCrawlId:string}){
  key(args.componentCrawlId);const row=await ctx.db.get(args.ownershipId);if(!row||row.deleted)throw new Error('BID_SOURCE_NOT_FOUND');
  await requireStoredCreator(ctx,row);
  if(row.componentCrawlId&&row.componentCrawlId!==args.componentCrawlId)throw new Error('BID_SOURCE_OPERATION_CONFLICT');
  const existing=await ctx.db.query('painterBidSourceOwnership').withIndex('by_component',q=>q.eq('componentCrawlId',args.componentCrawlId)).unique();
  if(existing&&existing._id!==row._id)throw new Error('BID_SOURCE_OPERATION_CONFLICT');
  await ctx.db.patch(row._id,{componentCrawlId:args.componentCrawlId});return null;
}
export async function requireOwnedBidSource(ctx:ReadCtx,args:{workspaceId:Id<'painterWorkspaces'>;componentCrawlId:string}){
  await requireBidSourceMember(ctx,args.workspaceId);key(args.componentCrawlId);
  const row=await ctx.db.query('painterBidSourceOwnership').withIndex('by_component',q=>q.eq('componentCrawlId',args.componentCrawlId)).unique();
  if(!row||row.deleted||row.tenantId!==args.workspaceId)throw new Error('BID_SOURCE_NOT_FOUND');
  return row;
}
export async function listOwnedBidSources(ctx:ReadCtx,workspaceId:Id<'painterWorkspaces'>){
  await requireBidSourceMember(ctx,workspaceId);
  // Hard bounded ownership window, never global component list/filter materialization.
  const rows=await ctx.db.query('painterBidSourceOwnership').withIndex('by_tenant',q=>q.eq('tenantId',workspaceId)).order('desc').take(26);
  if(rows.length>25)throw new Error('BID_SOURCE_WINDOW_EXCEEDED');
  return rows.filter(row=>!row.deleted&&row.componentCrawlId).map(row=>row.componentCrawlId!);
}
async function requireStoredCreator(ctx:ReadCtx,row:DataModel['painterBidSourceOwnership']['document']){
  const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',row.tenantId).eq('userId',row.creatorId)).unique();
  const user=await authComponent.getAnyUserById(ctx,row.creatorId);
  if(!member?.enabled||!user||!await ctx.db.get(row.tenantId)||!canCommand({id:row.creatorId,tenantId:String(row.tenantId),role:member.role,name:user.name,email:user.email},'bid.create'))throw new Error('BID_SOURCE_CREATOR_REVOKED');
}
/** Private completion receipt. Caller must already be a trusted SDK callback; no public registration. */
export async function acceptBidSourceCallback(ctx:WriteCtx,args:{componentCrawlId:string;digest:string}){
  key(args.componentCrawlId);if(!/^[a-f0-9]{64}$/.test(args.digest))throw new Error('BID_SOURCE_INVALID_DIGEST');
  const row=await ctx.db.query('painterBidSourceOwnership').withIndex('by_component',q=>q.eq('componentCrawlId',args.componentCrawlId)).unique();
  if(!row||row.deleted)throw new Error('BID_SOURCE_NOT_FOUND');await requireStoredCreator(ctx,row);
  if(row.callbackDigest){if(row.callbackDigest!==args.digest)throw new Error('BID_SOURCE_CALLBACK_CONFLICT');return {replayed:true};}
  await ctx.db.patch(row._id,{callbackDigest:args.digest});return {replayed:false};
}
export async function tombstoneBidSource(ctx:WriteCtx,args:{workspaceId:Id<'painterWorkspaces'>;componentCrawlId:string}){
  const row=await requireOwnedBidSource(ctx,args);await ctx.db.patch(row._id,{deleted:true});return null;
}
