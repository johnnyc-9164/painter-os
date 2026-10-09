import { WEBSITE_MEDIA_MAX_BYTES } from '@painter-os-bts/domain/company-website';
const limit = WEBSITE_MEDIA_MAX_BYTES;
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function unavailable(status: number) { return new Response(null,{status,headers}); }
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams;
  if ([...input.keys()].some(key => !['workspaceId','mediaId','revision'].includes(key)) || [...input.keys()].some(key => input.getAll(key).length !== 1)) return unavailable(400);
  const workspaceId=input.get('workspaceId'),mediaId=input.get('mediaId'),revision=input.get('revision');
  if (!workspaceId || !mediaId || workspaceId.length>1024 || mediaId.length>1024 || !revision || !/^[1-9]\d{0,14}$/.test(revision)) return unavailable(400);
  const configured=process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!configured) return unavailable(503);
  try {
    const origin=new URL(configured);
    if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash
      || (origin.protocol !== 'https:' && !(origin.protocol==='http:' && ['127.0.0.1','localhost'].includes(origin.hostname)))) return unavailable(503);
    if(origin.hostname.endsWith('.convex.cloud'))origin.hostname=origin.hostname.replace(/\.convex\.cloud$/,'.convex.site');
    const endpoint=new URL('/company-website-media',origin);
    endpoint.search=new URLSearchParams({workspaceId,mediaId,revision}).toString();
    const response=await fetch(endpoint,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok){await response.body?.cancel();return unavailable(response.status===404?404:502);}
    const type=response.headers.get('content-type')?.split(';')[0];
    if(!type || !['image/jpeg','image/png','image/webp'].includes(type) || Number(response.headers.get('content-length'))>limit){await response.body?.cancel();return unavailable(502);}
    const reader=response.body?.getReader();if(!reader)return unavailable(502);
    const chunks:Uint8Array[]=[];let size=0;
    try {while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>limit){await reader.cancel();return unavailable(502);}chunks.push(chunk.value);}}
    finally{reader.releaseLock();}
    if(size===0)return unavailable(502);
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return new Response(bytes,{headers:{...headers,'Content-Type':type,'Content-Length':String(size)}});
  }catch{return unavailable(502);}
}
