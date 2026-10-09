import { decodePublishedArticles } from '@painter-os-bts/backend/published-articles.mjs';
import { readJournalArticles } from './index.mjs';

/** Reserved ordinary article slugs, not a separate CMS or private workspace projection. */
export const companyPageSlugs = Object.freeze({ profile: 'company-profile', services: 'company-services', contact: 'company-contact' });

function validPublication(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, date] = value.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toISOString().slice(0, 10) === value.slice(0, 10);
}

/** Reader must use the existing anonymous published-article query. No draft storage is read. */
export function createCompanyPageReader(readArticles) {
  return async workspaceId => {
    if (typeof workspaceId !== 'string' || !workspaceId.trim() || workspaceId.length > 1024) throw new Error('INVALID_COMPANY_WORKSPACE');
    const entries = await Promise.all(Object.entries(companyPageSlugs).map(async ([section, slug]) => {
      const rows = decodePublishedArticles(await readArticles(workspaceId, slug));
      if (rows.length > 1 || rows.some(row => row.slug !== slug || !row.title.trim() || !row.content.trim() || row.id.length > 1024 || row.title.length > 100000 || row.content.length > 100000 || row.publishedAt.length > 128 || !validPublication(row.publishedAt))) throw new Error('INVALID_COMPANY_PAGE');
      return [section, rows[0] ? { title: rows[0].title, content: rows[0].content, publishedAt: rows[0].publishedAt } : null];
    }));
    const pages = Object.fromEntries(entries);
    return pages.profile ? { state: 'ready', pages } : { state: 'unavailable' };
  };
}

export async function readCompanyPages(url, workspaceId, missing) {
  return createCompanyPageReader((workspace, slug) => readJournalArticles(url, workspace, slug, missing))(workspaceId);
}
