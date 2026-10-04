import {NextRequest} from 'next/server';
import {localEnabled,portalLocal,portalCommandLocal} from '@/lib/local-runtime';
import {portalCloud,portalCommandCloud} from '@/lib/convex-runtime';
import {requireOrigin,body,error,reply} from '@/lib/http';
import type {Command} from '@painter-os-bts/domain/contracts';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Ctx={params:Promise<{token:string}>};
export async function GET(_:NextRequest,ctx:Ctx){try{const {token}=await ctx.params;return reply(localEnabled()?portalLocal(token):await portalCloud(token));}catch(e){return error(e);}}
export async function POST(request:NextRequest,ctx:Ctx){try{requireOrigin(request);const {token}=await ctx.params;const c=await body(request) as unknown as Command;return reply(localEnabled()?portalCommandLocal(token,c):await portalCommandCloud(token,c));}catch(e){return error(e);}}
