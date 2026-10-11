/** Real cloud adapter. No imports initialize a deployment; callers select PAINTER_RUNTIME=convex. */
import { createHmac, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@painter-os-bts/backend/convex/runtime';
import type { Command } from '@painter-os-bts/domain/contracts';
import { getConvexBridge } from './auth-server';
import { mapHttpError } from './http-error';
async function linkToken(command:Command){if(!command.requestKey||command.requestKey.length>200)throw new Error('INVALID_REQUEST_KEY');const secret=process.env.PAINTER_LINK_SECRET;if(!secret||secret.length<32)throw new Error('LINK_SIGNING_NOT_CONFIGURED');const user=await getConvexBridge().fetchAuthQuery(api.auth.getCurrentUser,{});if(!user)throw new Error('UNAUTHENTICATED');return createHmac('sha256',secret).update(JSON.stringify([user._id,command.action,command.requestKey])).digest('hex');}
const hash = (token: string) => createHash('sha256').update(token).digest('hex');
function publicClient() { const url=process.env.NEXT_PUBLIC_CONVEX_URL;if(!url)throw new Error('CONVEX_DEPLOYMENT_NOT_CONFIGURED');return new ConvexHttpClient(url); }
export async function snapshotCloud(request?: NextRequest) {
 const bridge=getConvexBridge();
 const user=await bridge.fetchAuthQuery(api.auth.getCurrentUser,{});
 if(!user)return {session:null};
 const memberships=await bridge.fetchAuthQuery(api.painter.workspaces,{});
 if(!memberships.length)await bridge.fetchAuthMutation(api.painter.createWorkspace,{name:`${user.name}'s workspace`,onlyIfNone:true});
 if(request?.nextUrl.searchParams.has('workspaceId'))throw new Error('WORKSPACE_SELECTION_NOT_SUPPORTED');
 const snapshot=await bridge.fetchAuthQuery(api.painter.snapshot,{});
 const members=['owner','office_admin'].includes(snapshot.actor.role)?await bridge.fetchAuthQuery(api.painter.members,{}):undefined;return {...snapshot,runtime:{...snapshot.runtime,kind:'convex' as const},members,session:snapshot.actor};
}
export async function commandCloud(command: Command) {
 const bridge=getConvexBridge();
 if(command.action==='estimate.portal') {
  const token=await linkToken(command);const result=await bridge.fetchAuthMutation(api.painter.createPortal,{estimateId:command.entityId,tokenHash:hash(token),expectedRevision:command.expectedRevision});
  return {...result,portalUrl:`/p/${token}`};
 }
 if(command.action==='member.invite') {
  const token=await linkToken(command);const result=await bridge.fetchAuthMutation(api.painter.createInvite,{email:command.input.email,role:command.input.role,tokenHash:hash(token)});
  return {...result,inviteUrl:`/i/${token}`};
 }
 const translated=command.action==='member.role'?{...command,input:{userId:command.input.memberId,role:command.input.role}}:command;
 try{return await bridge.fetchAuthMutation(api.painter.command,{command:translated});}catch(e){throw await restoreUnauthenticated(bridge,e);}
}
/** Convex redacts thrown messages to "Server Error" in deployed environments, hiding the backend UNAUTHENTICATED code. Only a message carrying no application code is probed; a real session keeps its original error and mapping. */
async function restoreUnauthenticated(bridge:ReturnType<typeof getConvexBridge>,e:unknown){
 if(!(e instanceof Error)||mapHttpError(e).error!=='INTERNAL_ERROR')return e;
 try{if(!await bridge.fetchAuthQuery(api.auth.getCurrentUser,{}))return new Error('UNAUTHENTICATED');}catch{/* keep the original failure */}
 return e;
}
/** /api/auth JSON compatibility. Real Better Auth HTTP receives cookie + origin headers. */
export async function authCloud(action: string, data: Record<string, unknown>, request: NextRequest): Promise<NextResponse> {
 const origin=request.headers.get('origin');
 if(action!=='session'&&(!origin||(process.env.PAINTER_APP_URL?origin!==new URL(process.env.PAINTER_APP_URL).origin:new URL(origin).host!==request.headers.get('host'))))return NextResponse.json({error:'INVALID_ORIGIN'},{status:403});
 const routes:Record<string,string>={login:'sign-in/email',signin:'sign-in/email',signup:'sign-up/email',register:'sign-up/email',logout:'sign-out',session:'get-session'};
 if(action==='demo') {
  if(process.env.PAINTER_ALLOW_DEMO!=='true')return NextResponse.json({error:'DEMO_DISABLED'},{status:403});
  const workspace=await getConvexBridge().fetchAuthMutation(api.painter.createWorkspace,{name:'Painter OS demo',demo:true});
  return NextResponse.json({workspace,session:(await snapshotCloud()).session});
 }
 if(action==='acceptInvite')return NextResponse.json(await getConvexBridge().fetchAuthMutation(api.painter.acceptInvite,{token:data.token}));
 const path=routes[action];if(!path)return NextResponse.json({error:'UNKNOWN_AUTH_ACTION'},{status:400});
 const url=new URL(request.url);url.pathname=`/api/auth/${path}`;url.search='';
 const headers=new Headers(request.headers);headers.delete('content-length');headers.set('content-type','application/json');
 const payload=path==='sign-up/email'?{email:data.email,password:data.password,name:data.name}:path==='sign-in/email'?{email:data.email,password:data.password}:{};
 const upstreamRequest=new Request(url,{method:action==='session'?'GET':'POST',headers,...(action==='session'?{}:{body:JSON.stringify(payload)})});
 const upstream=await getConvexBridge().handler[action==='session'?'GET':'POST'](upstreamRequest);
 const body=await upstream.json();
 const response=NextResponse.json(upstream.ok?{...body,session:body.user??body.session??null}:body,{status:upstream.status});
 for(const cookie of upstream.headers.getSetCookie())response.headers.append('set-cookie',cookie);
 return response;
}
export async function portalCloud(token:string) {return publicClient().query(api.painter.portalView,{token});}
export async function portalCommandCloud(token:string,command: {action:string;requestKey:string;input?:Record<string,unknown>}) {
 const action=command.action.replace(/^estimate\./,'');
 if(!['approve','reject','requestChanges'].includes(action))throw new Error('FORBIDDEN');
 return publicClient().mutation(api.painter.portalCommand,{token,action,requestKey:command.requestKey,...(command.input?.notes!==undefined?{notes:command.input.notes}:{})});
}
