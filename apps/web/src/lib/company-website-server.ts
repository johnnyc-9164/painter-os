import {decodePublishedArticlePage} from '@painter-os-bts/backend/published-articles.mjs';
import {api} from '@painter-os-bts/backend/convex/runtime';
import {getConvexBridge} from '@painter-os-bts/cloud-session/server';
import {decodeCompanyWebsiteState, decodeCompanyWebsitePreview, decodeWebsiteMediaPage, decodeWebsiteMediaReceipt, type CompanyWebsiteWriteResult} from '@painter-os-bts/domain/company-website';
import type {WebsiteEditorWrite} from './company-website-http';

async function websiteSession(expectedActorId?: string) {
  const bridge = getConvexBridge();
  const user = await bridge.fetchAuthQuery(api.auth.getCurrentUser, {});
  if (!user || (expectedActorId !== undefined && (typeof user._id !== 'string' || user._id !== expectedActorId))) throw new Error('UNAUTHENTICATED');
  return bridge;
}
/** Backend queries independently resolve current enabled membership and owner/office role. */
export async function websiteRead(workspaceId: string, expectedActorId: string, expectedRevision?: number) {
  const bridge = await websiteSession(expectedActorId);
  const state = decodeCompanyWebsiteState(await bridge.fetchAuthQuery(api.companyWebsite.current, {workspaceId}));
  if (expectedRevision !== undefined && state.revision !== expectedRevision) throw new Error('REVISION_CONFLICT');
  const preview = decodeCompanyWebsitePreview(await bridge.fetchAuthQuery(api.companyWebsite.preview, {workspaceId, expectedRevision: state.revision}));
  const mediaPage = decodeWebsiteMediaPage(await bridge.fetchAuthQuery(api.websiteMedia.list, {workspaceId, paginationOpts: {numItems: 50, cursor: null}}));
  const blogPage = decodePublishedArticlePage(await bridge.fetchAuthQuery(api.painter.articlesPage, {workspaceId, cursor: null, limit: 10}));
  return {state, preview, mediaPage, blogPage};
}
export async function websiteWrite(workspaceId: string, input: WebsiteEditorWrite, expectedActorId: string) {
  const bridge = await websiteSession(expectedActorId);
  const {action, ...args} = input;
  const functions = {saveDraft: api.companyWebsite.saveDraft, publish: api.companyWebsite.publish, unpublish: api.companyWebsite.unpublish};
  const result = await bridge.fetchAuthMutation(functions[action], {...args, workspaceId}) as CompanyWebsiteWriteResult;
  if (!result || !Number.isSafeInteger(result.revision) || result.revision < 1 || typeof result.replayed !== 'boolean' || (result.publishedRevision !== null && !Number.isSafeInteger(result.publishedRevision))) throw new Error('INVALID_WEBSITE_RESPONSE');
  // Another writer cannot silently replace this action's confirmed version in the reply.
  return websiteRead(workspaceId, expectedActorId, result.revision);
}
export async function websiteUpload(workspaceId: string, requestKey: string, file: File, expectedActorId: string) {
  const bridge = await websiteSession(expectedActorId);
  return decodeWebsiteMediaReceipt(await bridge.fetchAuthAction(api.websiteMediaUpload.upload, {workspaceId, requestKey, name: file.name, bytes: await file.arrayBuffer()}));
}
export async function websiteUploadStatus(workspaceId: string, requestKey: string, expectedActorId: string) {
  const bridge = await websiteSession(expectedActorId);
  return decodeWebsiteMediaReceipt(await bridge.fetchAuthQuery(api.websiteMedia.status, {workspaceId, requestKey}));
}
export async function websiteMediaPage(workspaceId: string, cursor: string, expectedActorId: string) {
  const bridge = await websiteSession(expectedActorId);
  return decodeWebsiteMediaPage(await bridge.fetchAuthQuery(api.websiteMedia.list, {workspaceId, paginationOpts: {numItems: 50, cursor}}));
}
export async function websitePrivateImage(workspaceId: string, mediaId: string, revision: number) {
  const bridge = await websiteSession();
  const result = await bridge.fetchAuthAction(api.websiteMediaUpload.readPrivate, {workspaceId, mediaId, expectedRevision: revision});
  if (!result || !(result.bytes instanceof ArrayBuffer) || result.bytes.byteLength > 3 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(result.contentType)) throw new Error('INVALID_WEBSITE_MEDIA');
  return result as {bytes: ArrayBuffer; contentType: string};
}
