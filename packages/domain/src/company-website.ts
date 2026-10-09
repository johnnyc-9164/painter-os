/** Canonical company-authored website content. No storage IDs or private CRM data. */
export const WEBSITE_CURRENCIES = [
  "USD",
  "CAD",
  "GBP",
  "EUR",
  "AUD",
  "NZD",
] as const;
export type CompanyWebsiteTemplate = "studio" | "editorial" | "direct";
export interface WebsiteMediaReference {
  mediaId: string;
  alt: string;
  focalPoint?: { x: number; y: number };
}
export interface WebsiteResolvedMedia {
  mediaId: string;
  url: string;
  width: number;
  height: number;
  contentType: "image/png" | "image/jpeg" | "image/webp";
}
export type WebsitePrice =
  | {
      mode: "from" | "fixed";
      amountMinor: number;
      currency: string;
      unit?: string;
      qualifier?: string;
    }
  | {
      mode: "range";
      minMinor: number;
      maxMinor: number;
      currency: string;
      unit?: string;
      qualifier?: string;
    }
  | { mode: "descriptive"; label: string };
export interface CompanyWebsiteContent {
  template: CompanyWebsiteTemplate;
  companyName: string;
  tagline: string;
  hero: { heading: string; summary: string; media?: WebsiteMediaReference };
  logo?: WebsiteMediaReference;
  gallery: WebsiteMediaReference[];
  services: { id: string; title: string; description: string }[];
  projects: {
    id: string;
    title: string;
    summary: string;
    media: WebsiteMediaReference[];
  }[];
  /** Manually authored testimonials; this is not verification evidence. */
  testimonials: {
    id: string;
    quote: string;
    attribution: string;
    rating?: number;
  }[];
  pricing: {
    id: string;
    title: string;
    description: string;
    price: WebsitePrice;
  }[];
  contacts: {
    phone?: string;
    email?: string;
    address?: {
      lines: string[];
      city?: string;
      region?: string;
      postalCode?: string;
      country?: string;
    };
    serviceAreas: string[];
    hours: { id: string; label: string; value: string }[];
  };
  blogEnabled: boolean;
}
export interface CompanyWebsiteState {
  revision: number;
  draft: CompanyWebsiteContent;
  published: { revision: number; publishedAt: string } | null;
}
export interface CompanyWebsiteWriteResult {
  revision: number;
  publishedRevision: number | null;
  replayed: boolean;
}
export interface CompanyWebsitePreview {
  revision: number;
  content: CompanyWebsiteContent;
  media: WebsiteResolvedMedia[];
}
export interface PublishedCompanyWebsite extends CompanyWebsitePreview {
  publishedAt: string;
}
export type PublicCompanyWebsiteResult =
  | { state: "published"; website: PublishedCompanyWebsite }
  | { state: "unavailable" };
export const WEBSITE_MEDIA_MAX_BYTES = 3 * 1024 * 1024;
export interface WebsiteMediaDetails {
  mediaId: string;
  name: string;
  width: number;
  height: number;
  contentType: WebsiteResolvedMedia["contentType"];
  size: number;
  createdAt: string;
}
export type WebsiteMediaReceipt =
  | { state: "ready"; media: WebsiteMediaDetails }
  | {
      state:
        | "uploading"
        | "staged"
        | "cleanup_pending"
        | "deleted"
        | "reconciliation_required";
      mediaId: string;
    };
export interface WebsiteMediaPage {
  media: WebsiteMediaDetails[];
  cursor: string | null;
  done: boolean;
}
export function emptyCompanyWebsiteContent(
  companyName = "",
): CompanyWebsiteContent {
  return {
    template: "studio",
    companyName,
    tagline: "",
    hero: { heading: "", summary: "" },
    gallery: [],
    services: [],
    projects: [],
    testimonials: [],
    pricing: [],
    contacts: { serviceAreas: [], hours: [] },
    blogEnabled: false,
  };
}

type Obj = Record<string, unknown>;
function object(
  value: unknown,
  required: string[],
  optional: string[] = [],
): Obj {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid website object");
  const result = value as Obj;
  if (
    Object.keys(result).some(
      (key) => !required.includes(key) && !optional.includes(key),
    ) ||
    required.some((key) => !(key in result))
  )
    throw new Error("Invalid website fields");
  return result;
}
function text(value: unknown, max = 1000): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new Error("Invalid website text");
  return value.trim();
}
function number(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error("Invalid website number");
  return value;
}
function integer(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const n = number(value, min, max);
  if (!Number.isSafeInteger(n)) throw new Error("Invalid website integer");
  return n;
}
function list<T>(
  value: unknown,
  max: number,
  decode: (value: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid website list");
  return value.map(decode);
}
function id(value: unknown): string {
  const result = text(value, 100);
  if (!/^[a-zA-Z0-9_-]+$/.test(result)) throw new Error("Invalid website ID");
  return result;
}
function identified<T extends { id: string }>(
  value: unknown,
  max: number,
  decode: (value: unknown) => T,
): T[] {
  const result = list(value, max, decode);
  if (new Set(result.map((item) => item.id)).size !== result.length)
    throw new Error("Duplicate website ID");
  return result;
}
function optionalText(value: unknown, max = 1000): string | undefined {
  return value === undefined ? undefined : text(value, max) || undefined;
}
function reference(value: unknown): WebsiteMediaReference {
  const o = object(value, ["mediaId", "alt"], ["focalPoint"]);
  const alt = text(o.alt, 300);
  if (!alt) throw new Error("Media requires alt text");
  const result: WebsiteMediaReference = { mediaId: id(o.mediaId), alt };
  if (o.focalPoint !== undefined) {
    const p = object(o.focalPoint, ["x", "y"]);
    result.focalPoint = { x: number(p.x, 0, 1), y: number(p.y, 0, 1) };
  }
  return result;
}
function price(value: unknown): WebsitePrice {
  const base = object(
    value,
    ["mode"],
    [
      "amountMinor",
      "minMinor",
      "maxMinor",
      "currency",
      "unit",
      "qualifier",
      "label",
    ],
  );
  if (base.mode === "descriptive") {
    const o = object(value, ["mode", "label"]);
    const label = text(o.label, 300);
    if (!label) throw new Error("Pricing requires description");
    return { mode: "descriptive", label };
  }
  if (base.mode !== "from" && base.mode !== "fixed" && base.mode !== "range")
    throw new Error("Invalid pricing mode");
  const fields =
    base.mode === "range" ? ["minMinor", "maxMinor"] : ["amountMinor"];
  const o = object(
    value,
    ["mode", "currency", ...fields],
    ["unit", "qualifier"],
  );
  const currency = text(o.currency, 3);
  if (
    !/^[A-Z]{3}$/.test(currency) ||
    !(WEBSITE_CURRENCIES as readonly string[]).includes(currency)
  )
    throw new Error("Invalid pricing currency");
  const common = {
    currency,
    ...(optionalText(o.unit, 100) ? { unit: optionalText(o.unit, 100) } : {}),
    ...(optionalText(o.qualifier, 300)
      ? { qualifier: optionalText(o.qualifier, 300) }
      : {}),
  };
  if (base.mode === "range") {
    const minMinor = integer(o.minMinor, 0, 1e12),
      maxMinor = integer(o.maxMinor, minMinor, 1e12);
    return { mode: "range", minMinor, maxMinor, ...common };
  }
  return {
    mode: base.mode,
    amountMinor: integer(o.amountMinor, 0, 1e12),
    ...common,
  };
}
export function normalizeCompanyWebsiteContent(
  value: unknown,
): CompanyWebsiteContent {
  const o = object(
    value,
    [
      "template",
      "companyName",
      "tagline",
      "hero",
      "gallery",
      "services",
      "projects",
      "testimonials",
      "pricing",
      "contacts",
      "blogEnabled",
    ],
    ["logo"],
  );
  if (
    o.template !== "studio" &&
    o.template !== "editorial" &&
    o.template !== "direct"
  )
    throw new Error("Invalid website template");
  if (typeof o.blogEnabled !== "boolean")
    throw new Error("Invalid blog setting");
  const hero = object(o.hero, ["heading", "summary"], ["media"]);
  const contacts = object(
    o.contacts,
    ["serviceAreas", "hours"],
    ["phone", "email", "address"],
  );
  const phone = optionalText(contacts.phone, 80),
    email = optionalText(contacts.email, 254);
  if (phone && !/^[+0-9().\s-]+$/.test(phone)) throw new Error("Invalid phone");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Invalid email");
  const contactResult: CompanyWebsiteContent["contacts"] = {
    serviceAreas: list(contacts.serviceAreas, 30, (x) => text(x, 120)),
    hours: identified(contacts.hours, 14, (x) => {
      const a = object(x, ["id", "label", "value"]);
      return {
        id: id(a.id),
        label: text(a.label, 100),
        value: text(a.value, 200),
      };
    }),
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };
  if (contacts.address !== undefined) {
    const a = object(
      contacts.address,
      ["lines"],
      ["city", "region", "postalCode", "country"],
    );
    contactResult.address = {
      lines: list(a.lines, 3, (x) => text(x, 200)).filter(Boolean),
    };
    for (const key of ["city", "region", "postalCode", "country"] as const) {
      const v = optionalText(a[key], 100);
      if (v) contactResult.address[key] = v;
    }
    if (
      !contactResult.address.lines.length &&
      Object.keys(contactResult.address).length === 1
    )
      delete contactResult.address;
  }
  const result: CompanyWebsiteContent = {
    template: o.template,
    companyName: text(o.companyName, 200),
    tagline: text(o.tagline, 300),
    hero: {
      heading: text(hero.heading, 300),
      summary: text(hero.summary, 2000),
      ...(hero.media !== undefined ? { media: reference(hero.media) } : {}),
    },
    ...(o.logo !== undefined ? { logo: reference(o.logo) } : {}),
    gallery: list(o.gallery, 24, reference),
    services: identified(o.services, 12, (x) => {
      const a = object(x, ["id", "title", "description"]);
      return {
        id: id(a.id),
        title: text(a.title, 200),
        description: text(a.description, 2000),
      };
    }),
    projects: identified(o.projects, 12, (x) => {
      const a = object(x, ["id", "title", "summary", "media"]);
      return {
        id: id(a.id),
        title: text(a.title, 200),
        summary: text(a.summary, 2000),
        media: list(a.media, 6, reference),
      };
    }),
    testimonials: identified(o.testimonials, 20, (x) => {
      const a = object(x, ["id", "quote", "attribution"], ["rating"]);
      return {
        id: id(a.id),
        quote: text(a.quote, 2000),
        attribution: text(a.attribution, 200),
        ...(a.rating !== undefined ? { rating: integer(a.rating, 1, 5) } : {}),
      };
    }),
    pricing: identified(o.pricing, 12, (x) => {
      const a = object(x, ["id", "title", "description", "price"]);
      return {
        id: id(a.id),
        title: text(a.title, 200),
        description: text(a.description, 1000),
        price: price(a.price),
      };
    }),
    contacts: contactResult,
    blogEnabled: o.blogEnabled,
  };
  if (
    websiteMediaReferences(result).length > 50 ||
    new TextEncoder().encode(JSON.stringify(result)).byteLength > 128 * 1024
  )
    throw new Error("Website content exceeds limit");
  return result;
}
export function websiteMediaReferences(
  content: CompanyWebsiteContent,
): WebsiteMediaReference[] {
  return [
    ...(content.logo ? [content.logo] : []),
    ...(content.hero.media ? [content.hero.media] : []),
    ...content.gallery,
    ...content.projects.flatMap((project) => project.media),
  ];
}
export function decodePublicCompanyWebsite(
  value: unknown,
  expectedWorkspaceId?: string,
): PublicCompanyWebsiteResult {
  const o = object(value, ["state"], ["website"]);
  if (o.state === "unavailable") {
    object(value, ["state"]);
    return { state: "unavailable" };
  }
  if (o.state !== "published") throw new Error("Invalid public website state");
  const w = object(o.website, ["revision", "publishedAt", "content", "media"]);
  const revision = integer(w.revision, 1);
  const content = normalizeCompanyWebsiteContent(w.content);
  const refs = new Set(websiteMediaReferences(content).map((r) => r.mediaId));
  let mediaWorkspaceId: string | undefined;
  const media = list<WebsiteResolvedMedia>(w.media, 50, (x) => {
    const m = object(x, ["mediaId", "url", "width", "height", "contentType"]);
    const mediaId = id(m.mediaId);
    if (!refs.has(mediaId)) throw new Error("Unexpected website media");
    const url = text(m.url, 1000);
    if (!url.startsWith("/api/company-website-media?"))
      throw new Error("Unsafe website media URL");
    const parsed = new URL(url, "https://website.invalid");
    const params = parsed.searchParams;
    const workspaceId = params.get("workspaceId");
    if (
      parsed.hash ||
      parsed.pathname !== "/api/company-website-media" ||
      url !== `${parsed.pathname}?${params}` ||
      (expectedWorkspaceId && workspaceId !== expectedWorkspaceId) ||
      (mediaWorkspaceId && workspaceId !== mediaWorkspaceId)
    )
      throw new Error("Invalid website media association");
    mediaWorkspaceId = workspaceId ?? undefined;
    if (
      [...params.keys()].sort().join(",") !== "mediaId,revision,workspaceId" ||
      params.get("mediaId") !== mediaId ||
      params.get("revision") !== String(revision) ||
      !params.get("workspaceId")
    )
      throw new Error("Invalid website media URL");
    if (
      m.contentType !== "image/png" &&
      m.contentType !== "image/jpeg" &&
      m.contentType !== "image/webp"
    )
      throw new Error("Invalid website media type");
    return {
      mediaId,
      url,
      width: integer(m.width, 1, 10000),
      height: integer(m.height, 1, 10000),
      contentType: m.contentType,
    };
  });
  if (
    new Set(media.map((m) => m.mediaId)).size !== media.length ||
    [...refs].some((ref) => !media.some((m) => m.mediaId === ref))
  )
    throw new Error("Incomplete website media");
  const publishedAt = text(w.publishedAt, 40);
  if (!Number.isFinite(Date.parse(publishedAt)))
    throw new Error("Invalid publication time");
  return {
    state: "published",
    website: { revision, publishedAt, content, media },
  };
}
export function decodeCompanyWebsiteState(value: unknown): CompanyWebsiteState {
  const o = object(value, ["revision", "draft", "published"]);
  let published: CompanyWebsiteState["published"] = null;
  if (o.published !== null) {
    const p = object(o.published, ["revision", "publishedAt"]);
    const publishedAt = text(p.publishedAt, 40);
    if (!Number.isFinite(Date.parse(publishedAt)))
      throw new Error("Invalid publication time");
    published = { revision: integer(p.revision, 1), publishedAt };
  }
  return {
    revision: integer(o.revision),
    draft: normalizeCompanyWebsiteContent(o.draft),
    published,
  };
}
export function decodeCompanyWebsitePreview(
  value: unknown,
): CompanyWebsitePreview {
  const o = object(value, ["revision", "content", "media"]);
  const revision = integer(o.revision);
  const content = normalizeCompanyWebsiteContent(o.content);
  const refs = new Set(websiteMediaReferences(content).map((r) => r.mediaId));
  const media = list<WebsiteResolvedMedia>(o.media, 50, (x) => {
    const m = object(x, ["mediaId", "url", "width", "height", "contentType"]);
    const mediaId = id(m.mediaId),
      url = text(m.url, 1000);
    if (!refs.has(mediaId) || !url.startsWith("/api/website/media?"))
      throw new Error("Invalid private preview media");
    const parsed = new URL(url, "https://website.invalid");
    const p = parsed.searchParams;
    if (
      parsed.hash ||
      parsed.pathname !== "/api/website/media" ||
      url !== `${parsed.pathname}?${p}`
    )
      throw new Error("Invalid preview URL");
    if (
      [...p.keys()].sort().join(",") !== "mediaId,revision,workspaceId" ||
      p.get("mediaId") !== mediaId ||
      p.get("revision") !== String(revision) ||
      !p.get("workspaceId")
    )
      throw new Error("Invalid preview URL");
    if (
      m.contentType !== "image/png" &&
      m.contentType !== "image/jpeg" &&
      m.contentType !== "image/webp"
    )
      throw new Error("Invalid media type");
    return {
      mediaId,
      url,
      width: integer(m.width, 1, 10000),
      height: integer(m.height, 1, 10000),
      contentType: m.contentType,
    };
  });
  if (new Set(media.map((m) => m.mediaId)).size !== media.length)
    throw new Error("Duplicate preview media");
  return { revision, content, media };
}
function mediaDetails(value: unknown): WebsiteMediaDetails {
  const o = object(value, [
    "mediaId",
    "name",
    "width",
    "height",
    "contentType",
    "size",
    "createdAt",
  ]);
  if (
    o.contentType !== "image/png" &&
    o.contentType !== "image/jpeg" &&
    o.contentType !== "image/webp"
  )
    throw new Error("Invalid media type");
  const createdAt = text(o.createdAt, 40);
  if (!Number.isFinite(Date.parse(createdAt)))
    throw new Error("Invalid media time");
  return {
    mediaId: id(o.mediaId),
    name: text(o.name, 200),
    width: integer(o.width, 1, 10000),
    height: integer(o.height, 1, 10000),
    contentType: o.contentType,
    size: integer(o.size, 1, WEBSITE_MEDIA_MAX_BYTES),
    createdAt,
  };
}
export function decodeWebsiteMediaReceipt(
  value: unknown,
): WebsiteMediaReceipt | null {
  if (value === null) return null;
  const o = object(value, ["state"], ["media", "mediaId"]);
  if (o.state === "ready") {
    object(value, ["state", "media"]);
    return { state: "ready", media: mediaDetails(o.media) };
  }
  if (
    o.state !== "uploading" &&
    o.state !== "staged" &&
    o.state !== "cleanup_pending" &&
    o.state !== "deleted" &&
    o.state !== "reconciliation_required"
  )
    throw new Error("Invalid upload receipt");
  object(value, ["state", "mediaId"]);
  return { state: o.state, mediaId: id(o.mediaId) };
}
export function decodeWebsiteMediaPage(value: unknown): WebsiteMediaPage {
  const o = object(value, ["media", "cursor", "done"]);
  if (typeof o.done !== "boolean") throw new Error("Invalid media page");
  return {
    media: list(o.media, 50, mediaDetails),
    cursor: o.cursor === null ? null : text(o.cursor, 2000),
    done: o.done,
  };
}

/** Drafts may contain empty in-progress section rows; publishing must be usable. */
export function validateCompanyWebsitePublication(
  value: unknown,
): CompanyWebsiteContent {
  const content = normalizeCompanyWebsiteContent(value);
  if (!content.companyName) throw new Error("WEBSITE_COMPANY_NAME_REQUIRED");
  if (
    content.services.some((item) => !item.title) ||
    content.projects.some((item) => !item.title) ||
    content.pricing.some((item) => !item.title) ||
    content.testimonials.some((item) => !item.quote || !item.attribution) ||
    content.contacts.hours.some((item) => !item.label || !item.value)
  )
    throw new Error("WEBSITE_INCOMPLETE_SECTION");
  return content;
}
