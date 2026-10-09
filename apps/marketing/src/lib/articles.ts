import { readPublishedArticles as readPublic, readJournalArticles as readJournal } from '@painter-os-bts/public-content';

export function readPublishedArticles(workspaceId: string, slug?: string) {
  return readPublic(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId, slug);
}

export function readJournalArticles(workspaceId: string, slug: string | undefined, missing: () => never) {
  return readJournal(process.env.NEXT_PUBLIC_CONVEX_URL, workspaceId, slug, missing);
}
