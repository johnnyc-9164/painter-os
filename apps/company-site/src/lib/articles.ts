import { readPublishedArticles as readPublic, readJournalArticles as readJournal, readJournalArticlePage as readPage } from '@painter-os-bts/public-content';

export function readPublishedArticles(workspaceId: string, slug?: string) {
  return readPublic(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId, slug);
}

export function readJournalArticles(workspaceId: string, slug: string | undefined, missing: () => never) {
  return readJournal(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId, slug, missing);
}

export function readJournalArticlePage(workspaceId: string, cursor: string | null, missing: () => never) {
  return readPage(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId, cursor, missing);
}
