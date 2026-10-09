import {NextRequest, NextResponse} from 'next/server';
import {localEnabled} from '@/lib/local-runtime';
import {requireOrigin, error, reply} from '@/lib/http';
import {websiteUpload, websiteUploadStatus, websiteMediaPage, websitePrivateImage} from '@/lib/company-website-server';
import {WEBSITE_MEDIA_MAX_BYTES} from '@painter-os-bts/domain/company-website';
import {websiteBytes, websiteText, websiteActorHeader} from '@/lib/company-website-http';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    if (localEnabled()) return reply({error: 'WEBSITE_UNAVAILABLE_IN_LOCAL_MODE'}, 503);
    const expectedActorId = websiteActorHeader(request);
    const bytes = await websiteBytes(request, WEBSITE_MEDIA_MAX_BYTES + 64 * 1024);
    let form: FormData;
    try {form = await new Request(request.url, {method: 'POST', headers: {'content-type': request.headers.get('content-type') || ''}, body: bytes}).formData();} catch {throw new Error('INVALID_WEBSITE_UPLOAD');}
    if ([...form.keys()].sort().join(',') !== 'file,requestKey,workspaceId') throw new Error('INVALID_WEBSITE_UPLOAD');
    const file = form.get('file'); if (!(file instanceof File) || !file.size || file.size > WEBSITE_MEDIA_MAX_BYTES) throw new Error('INVALID_WEBSITE_UPLOAD');
    return reply(await websiteUpload(websiteText(form.get('workspaceId')), websiteText(form.get('requestKey')), file, expectedActorId));
  } catch (reason) {return error(reason);}
}
export async function GET(request: NextRequest) {
  try {
    if (localEnabled()) return reply({error: 'WEBSITE_UNAVAILABLE_IN_LOCAL_MODE'}, 503);
    const query = request.nextUrl.searchParams, fields = [...query.keys()].sort().join(',');
    const workspaceId = websiteText(query.get('workspaceId'));
    if (fields === 'requestKey,workspaceId') return reply(await websiteUploadStatus(workspaceId, websiteText(query.get('requestKey')), websiteActorHeader(request)));
    if (fields === 'cursor,workspaceId') return reply(await websiteMediaPage(workspaceId, websiteText(query.get('cursor'), 2000), websiteActorHeader(request)));
    if (fields !== 'mediaId,revision,workspaceId' || !/^\d{1,15}$/.test(query.get('revision') || '')) throw new Error('INVALID_WEBSITE_REQUEST');
    const image = await websitePrivateImage(workspaceId, websiteText(query.get('mediaId')), Number(query.get('revision')));
    return new NextResponse(image.bytes, {headers: {'Content-Type': image.contentType, 'Content-Length': String(image.bytes.byteLength), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin'}});
  } catch (reason) {return error(reason);}
}
