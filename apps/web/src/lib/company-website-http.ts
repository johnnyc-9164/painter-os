import {decodePublishedArticlePage, type PublishedArticleSummary} from '@painter-os-bts/backend/published-articles.mjs';
import {decodeCompanyWebsiteState, decodeCompanyWebsitePreview, decodeWebsiteMediaPage, decodeWebsiteMediaReceipt, normalizeCompanyWebsiteContent, type CompanyWebsiteContent, type CompanyWebsiteState, type CompanyWebsitePreview, type WebsiteMediaDetails, type WebsiteMediaReceipt, type WebsiteMediaPage} from '@painter-os-bts/domain/company-website';
export interface WebsiteEditorData {state: CompanyWebsiteState; preview: CompanyWebsitePreview; media: WebsiteMediaDetails[]; mediaCursor: string | null; blog: PublishedArticleSummary[]}
export type WebsiteEditorWrite = {action: 'saveDraft'; expectedRevision: number; requestKey: string; content: CompanyWebsiteContent} | {action: 'publish' | 'unpublish'; expectedRevision: number; requestKey: string};
export interface WebsiteEditorTransport {
  load(workspaceId: string, signal: AbortSignal): Promise<WebsiteEditorData>;
  write(workspaceId: string, input: WebsiteEditorWrite, signal: AbortSignal): Promise<WebsiteEditorData>;
  upload(workspaceId: string, file: File, requestKey: string, signal: AbortSignal): Promise<WebsiteMediaReceipt | null>;
  uploadStatus(workspaceId: string, requestKey: string, signal: AbortSignal): Promise<WebsiteMediaReceipt | null>;
  mediaPage(workspaceId: string, cursor: string, signal: AbortSignal): Promise<WebsiteMediaPage>;
}
export function decodeWebsiteEditorData(value: unknown): WebsiteEditorData {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'blogPage,mediaPage,preview,state') throw new Error('INVALID_WEBSITE_RESPONSE');
  const raw = value as Record<string, unknown>;
  const blogPage = decodePublishedArticlePage(raw.blogPage);
  const state = decodeCompanyWebsiteState(raw.state), preview = decodeCompanyWebsitePreview(raw.preview), page = decodeWebsiteMediaPage(raw.mediaPage);
  if (state.revision !== preview.revision || JSON.stringify(state.draft) !== JSON.stringify(preview.content)) throw new Error('INVALID_WEBSITE_RESPONSE');
  return {state, preview, media: page.media, mediaCursor: page.cursor, blog: blogPage.page};
}
/** Private same-origin transport. A lost response never confirms a write. */
export class WebsiteTransportError extends Error {
  constructor(public readonly kind: 'signed_out' | 'denied' | 'conflict' | 'unavailable' | 'unknown' | 'invalid_response', message: string) {
    super(message);
    this.name = 'WebsiteTransportError';
  }
}

export function createWebsiteEditorTransport(actorId: string): WebsiteEditorTransport {
const identity = {'x-painter-website-actor': actorId};
return {
  load(workspaceId, signal) {return websiteRequest(`/api/website?workspaceId=${encodeURIComponent(workspaceId)}`, decodeWebsiteEditorData, {signal, headers: identity});},
  write(workspaceId, input, signal) {
    let content: CompanyWebsiteContent | undefined;
    if (input.action === 'saveDraft') {
      try {content = normalizeCompanyWebsiteContent(JSON.parse(JSON.stringify(input.content)));}
      catch {throw new WebsiteTransportError('invalid_response', 'Check your website entries. Keep text and photo lists within the allowed limits, use valid contact details, and choose a rating from 1 to 5.');}
    }
    return websiteRequest('/api/website', decodeWebsiteEditorData, {method: 'POST', signal, headers: {...identity, 'Content-Type': 'application/json'}, body: JSON.stringify({...input, ...(content ? {content} : {}), workspaceId})});
  },
  upload(workspaceId, file, requestKey, signal) {const body = new FormData(); body.set('file', file); body.set('workspaceId', workspaceId); body.set('requestKey', requestKey); return websiteRequest('/api/website/media', decodeWebsiteMediaReceipt, {method: 'POST', body, signal, headers: identity});},
  uploadStatus(workspaceId, requestKey, signal) {return websiteRequest(`/api/website/media?workspaceId=${encodeURIComponent(workspaceId)}&requestKey=${encodeURIComponent(requestKey)}`, decodeWebsiteMediaReceipt, {signal, headers: identity});},
  mediaPage(workspaceId, cursor, signal) {return websiteRequest(`/api/website/media?workspaceId=${encodeURIComponent(workspaceId)}&cursor=${encodeURIComponent(cursor)}`, decodeWebsiteMediaPage, {signal, headers: identity});},
};
}

export async function websiteRequest<T>(
  path: string,
  decode: (value: unknown) => T,
  init: RequestInit = {},
  send: typeof fetch = fetch,
): Promise<T> {
  if (!/^\/api\/website(?:\?|\/media(?:\?|$)|$)/.test(path)) throw new WebsiteTransportError('denied', 'The website request is unavailable.');
  let response: Response;
  try { response = await send(path, {...init, credentials: 'same-origin', cache: 'no-store'}); }
  catch { throw new WebsiteTransportError('unknown', 'The result could not be confirmed. Retry the same action or reload saved settings.'); }
  if (!response.ok) {
    if (response.status === 401) throw new WebsiteTransportError('signed_out', 'Sign in again to manage your website.');
    if (response.status === 403) throw new WebsiteTransportError('denied', 'Your current workspace role does not allow this action.');
    if (response.status === 409) throw new WebsiteTransportError('conflict', 'The website changed. Keep your edits and reload the saved version before publishing.');
    if (response.status === 503) throw new WebsiteTransportError('unavailable', 'Website editing is unavailable. Your changes have not been confirmed.');
    throw new WebsiteTransportError('unknown', 'The action was not confirmed. Check your entries, retry the same action or reload saved settings.');
  }
  try {
    const text = await response.text();
    if (text.length > 1024 * 1024) throw new Error('RESPONSE_SIZE');
    return decode(JSON.parse(text));
  } catch {
    throw new WebsiteTransportError('invalid_response', 'The saved result could not be read. Retry the same action or reload saved settings.');
  }
}

export function websiteText(value: unknown, max = 200): string {
  if (typeof value !== 'string' || !value || value.length > max || /[\u0000-\u001f]/.test(value)) throw new Error('INVALID_WEBSITE_REQUEST');
  return value;
}
export async function websiteBytes(request: Request, maximum: number): Promise<ArrayBuffer> {
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new Error('PAYLOAD_TOO_LARGE');
  const reader = request.body?.getReader(); if (!reader) throw new Error('INVALID_WEBSITE_REQUEST');
  const chunks: Uint8Array[] = []; let size = 0;
  try {while (true) {const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > maximum) {await reader.cancel(); throw new Error('PAYLOAD_TOO_LARGE');} chunks.push(next.value);}}
  finally {reader.releaseLock();}
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
  return bytes.buffer;
}

export function websiteActorHeader(request: Request): string {
  try {return websiteText(request.headers.get('x-painter-website-actor'));}
  catch {throw new Error('UNAUTHENTICATED');}
}
