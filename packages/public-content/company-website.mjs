import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { decodePublicCompanyWebsite } from '@painter-os-bts/domain/company-website';
const reference = makeFunctionReference('companyWebsite:publicSnapshot');
export function createCompanyWebsiteReader(query) {
  return async workspaceId => {
    if (typeof workspaceId !== 'string' || !workspaceId.trim() || workspaceId.length > 1024) throw new Error('INVALID_COMPANY_WORKSPACE');
    return decodePublicCompanyWebsite(await query({workspaceId}), workspaceId);
  };
}
export async function readCompanyWebsite(url, workspaceId) {
  if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
  return createCompanyWebsiteReader(args => new ConvexHttpClient(url).query(reference, args))(workspaceId);
}
