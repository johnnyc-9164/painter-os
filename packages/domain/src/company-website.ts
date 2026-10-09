/** Canonical company-authored website content. No storage IDs or private CRM data. */
export type CompanyWebsiteTemplate = 'studio' | 'editorial' | 'direct';
export interface WebsiteMediaReference { mediaId: string; alt: string; focalPoint?: { x: number; y: number } }
export interface WebsiteResolvedMedia { mediaId: string; url: string; width: number; height: number; contentType: 'image/png' | 'image/jpeg' | 'image/webp' }
export type WebsitePrice = { mode: 'from' | 'fixed'; amountMinor: number; currency: string; unit?: string; qualifier?: string } | { mode: 'range'; minMinor: number; maxMinor: number; currency: string; unit?: string; qualifier?: string } | { mode: 'descriptive'; label: string };
export interface CompanyWebsiteContent {
  template: CompanyWebsiteTemplate;
  companyName: string;
  tagline: string;
  hero: { heading: string; summary: string; media?: WebsiteMediaReference };
  logo?: WebsiteMediaReference;
  gallery: WebsiteMediaReference[];
  services: { id: string; title: string; description: string }[];
  projects: { id: string; title: string; summary: string; media: WebsiteMediaReference[] }[];
  /** Manually authored testimonials; this is not verification evidence. */
  testimonials: { id: string; quote: string; attribution: string; rating?: number }[];
  pricing: { id: string; title: string; description: string; price: WebsitePrice }[];
  contacts: { phone?: string; email?: string; address?: { lines: string[]; city?: string; region?: string; postalCode?: string; country?: string }; serviceAreas: string[]; hours: { id: string; label: string; value: string }[] };
  blogEnabled: boolean;
}
export interface CompanyWebsiteState { revision: number; draft: CompanyWebsiteContent; published: { revision: number; publishedAt: string } | null }
export interface CompanyWebsiteWriteResult { revision: number; publishedRevision: number | null; replayed: boolean }
export interface CompanyWebsitePreview { revision: number; content: CompanyWebsiteContent; media: WebsiteResolvedMedia[] }
export interface PublishedCompanyWebsite extends CompanyWebsitePreview { publishedAt: string }
export type PublicCompanyWebsiteResult = { state: 'published'; website: PublishedCompanyWebsite } | { state: 'unavailable' };
export const WEBSITE_MEDIA_MAX_BYTES = 3 * 1024 * 1024;
export interface WebsiteMediaDetails { mediaId: string; name: string; width: number; height: number; contentType: WebsiteResolvedMedia['contentType']; size: number; createdAt: string }
export type WebsiteMediaReceipt = { state: 'ready'; media: WebsiteMediaDetails } | { state: 'uploading' | 'staged' | 'cleanup_pending' | 'deleted' | 'reconciliation_required'; mediaId: string };
export interface WebsiteMediaPage { media: WebsiteMediaDetails[]; cursor: string | null; done: boolean }
export function emptyCompanyWebsiteContent(companyName = ''): CompanyWebsiteContent {
  return { template: 'studio', companyName, tagline: '', hero: { heading: '', summary: '' }, gallery: [], services: [], projects: [], testimonials: [], pricing: [], contacts: { serviceAreas: [], hours: [] }, blogEnabled: false };
}
