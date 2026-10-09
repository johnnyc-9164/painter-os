export interface CompanyPage { title: string; content: string; publishedAt: string }
export interface CompanyPages { profile: CompanyPage; services: CompanyPage | null; contact: CompanyPage | null }
export type CompanyPagesResult = { state: 'ready'; pages: CompanyPages } | { state: 'unavailable' };
export const companyPageSlugs: Readonly<{ profile: 'company-profile'; services: 'company-services'; contact: 'company-contact' }>;
export function createCompanyPageReader(readArticles: (workspaceId: string, slug: string) => Promise<unknown>): (workspaceId: string) => Promise<CompanyPagesResult>;
export function readCompanyPages(url: string | undefined, workspaceId: string, missing: () => never): Promise<CompanyPagesResult>;
