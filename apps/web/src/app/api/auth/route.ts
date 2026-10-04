import {NextRequest} from 'next/server';
import {localEnabled,localAuth,COOKIE} from '@/lib/local-runtime';
import {authCloud} from '@/lib/convex-runtime';
import {requireOrigin,body,error,sessionReply} from '@/lib/http';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{requireOrigin(request);const data=await body(request);if(!localEnabled())return await authCloud(String(data.action),data,request);return sessionReply(localAuth(String(data.action),data,request.cookies.get(COOKIE)?.value));}catch(e){return error(e);}}
