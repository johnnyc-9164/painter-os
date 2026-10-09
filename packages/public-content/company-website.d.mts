import type { PublicCompanyWebsiteResult } from '@painter-os-bts/domain/company-website';
export function createCompanyWebsiteReader(query: (args: {workspaceId: string}) => Promise<unknown>): (workspaceId: string) => Promise<PublicCompanyWebsiteResult>;
export function readCompanyWebsite(url: string | undefined, workspaceId: string): Promise<PublicCompanyWebsiteResult>;
