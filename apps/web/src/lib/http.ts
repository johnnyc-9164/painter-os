import {mapHttpError} from './http-error';
import { NextRequest,NextResponse } from 'next/server';
import { COOKIE,actorFor } from './local-runtime';
export function requireOrigin(request:NextRequest){const origin=request.headers.get('origin');if(!origin)throw new Error('INVALID_ORIGIN');const expected=process.env.PAINTER_APP_URL;if(expected?origin!==new URL(expected).origin:new URL(origin).host!==request.headers.get('host'))throw new Error('INVALID_ORIGIN');if(request.headers.get('sec-fetch-site')==='cross-site')throw new Error('INVALID_ORIGIN');}
export async function body(request:NextRequest){if(Number(request.headers.get('content-length')||0)>1024*1024)throw new Error('PAYLOAD_TOO_LARGE');const text=await request.text();if(text.length>1024*1024)throw new Error('PAYLOAD_TOO_LARGE');let value;try{value=JSON.parse(text);}catch{throw new Error('INVALID_JSON');}if(!value||Array.isArray(value)||typeof value!=='object')throw new Error('INVALID_JSON');return value as Record<string,unknown>;}
export const actor=(r:NextRequest)=>actorFor(r.cookies.get(COOKIE)?.value);
export function reply(value:unknown,status=200){return NextResponse.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function error(e:unknown){const {error:code,status}=mapHttpError(e);return reply({error:code},status);}
export function sessionReply(result:{token?:string;actor?:unknown}){const response=reply({actor:result.actor||null});response.cookies.set(COOKIE,result.token||'',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'&&process.env.PAINTER_COOKIE_SECURE!=='false',path:'/',maxAge:result.token?7*86400:0});return response;}
