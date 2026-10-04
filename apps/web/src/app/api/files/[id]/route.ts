import {NextRequest,NextResponse} from 'next/server';
import {localEnabled,fileLocal} from '@/lib/local-runtime';
import {getConvexBridge} from '@/lib/auth-server';
import {api} from '@painter-os-bts/backend/convex/runtime';
import {actor,error} from '@/lib/http';
export const runtime='nodejs';
export async function GET(request:NextRequest,ctx:{params:Promise<{id:string}>}){try{const {id}=await ctx.params;if(!localEnabled()){const url=await getConvexBridge().fetchAuthQuery(api.painter.fileUrl,{fileId:id});if(!url)throw new Error('FILE_NOT_FOUND');return NextResponse.redirect(url);}const {bytes,entity}=fileLocal(actor(request),id);const name=String(entity.data.name).replace(/[^a-zA-Z0-9._ -]/g,'_');return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':String(entity.data.contentType),'Content-Disposition':`${String(entity.data.contentType).startsWith('image/')?'inline':'attachment'}; filename="${name}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}catch(e){return error(e);}}
