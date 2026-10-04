import {NextRequest} from 'next/server';
import {localEnabled,acceptInviteLocal,COOKIE} from '@/lib/local-runtime';
import {authCloud} from '@/lib/convex-runtime';
import {requireOrigin,body,error,sessionReply} from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:NextRequest,ctx:{params:Promise<{token:string}>}){try{requireOrigin(request);const {token}=await ctx.params;const input=await body(request);if(!localEnabled())return await authCloud('acceptInvite',{token},request);return sessionReply(acceptInviteLocal(token,input,request.cookies.get(COOKIE)?.value));}catch(e){return error(e);}}
