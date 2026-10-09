import {NextRequest} from 'next/server';
import {localEnabled} from '@/lib/local-runtime';
import {requireOrigin, error, reply} from '@/lib/http';
import {websiteRead, websiteWrite} from '@/lib/company-website-server';
import {normalizeCompanyWebsiteContent} from '@painter-os-bts/domain/company-website';
import {websiteText, websiteBytes, websiteActorHeader} from '@/lib/company-website-http';
import type {WebsiteEditorWrite} from '@/lib/company-website-http';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    if (localEnabled()) return reply({error: 'WEBSITE_UNAVAILABLE_IN_LOCAL_MODE'}, 503);
    if ([...request.nextUrl.searchParams.keys()].join(',') !== 'workspaceId') throw new Error('INVALID_WEBSITE_REQUEST');
    return reply(await websiteRead(websiteText(request.nextUrl.searchParams.get('workspaceId')), websiteActorHeader(request)));
  } catch (reason) {return error(reason);}
}
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    if (localEnabled()) return reply({error: 'WEBSITE_UNAVAILABLE_IN_LOCAL_MODE'}, 503);
    const expectedActorId = websiteActorHeader(request);
    let input: unknown;
    try {input = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(await websiteBytes(request, 256 * 1024)));}
    catch (reason) {if (reason instanceof Error && reason.message === 'PAYLOAD_TOO_LARGE') throw reason; throw new Error('INVALID_WEBSITE_REQUEST');}
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('INVALID_WEBSITE_REQUEST');
    const value = input as Record<string, unknown>;
    const fields = value.action === 'saveDraft' ? ['workspaceId', 'action', 'expectedRevision', 'requestKey', 'content'] : ['workspaceId', 'action', 'expectedRevision', 'requestKey'];
    if (Object.keys(value).sort().join(',') !== fields.sort().join(',') || !['saveDraft', 'publish', 'unpublish'].includes(String(value.action)) || !Number.isSafeInteger(value.expectedRevision) || Number(value.expectedRevision) < 0) throw new Error('INVALID_WEBSITE_REQUEST');
    const workspaceId = websiteText(value.workspaceId), requestKey = websiteText(value.requestKey), expectedRevision = value.expectedRevision as number;
    let content;
    if (value.action === 'saveDraft') {try {content = normalizeCompanyWebsiteContent(value.content);} catch {throw new Error('INVALID_WEBSITE_CONTENT');}}
    const command: WebsiteEditorWrite = value.action === 'saveDraft' ? {action: 'saveDraft', expectedRevision, requestKey, content: content!} : {action: value.action as 'publish' | 'unpublish', expectedRevision, requestKey};
    return reply(await websiteWrite(workspaceId, command, expectedActorId));
  } catch (reason) {return error(reason);}
}
