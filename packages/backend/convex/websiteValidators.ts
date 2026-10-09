/** Convex transport bindings; canonical semantic validation remains domain-owned. */
import { v, type Infer } from "convex/values";
import type {
  CompanyWebsiteContent,
  WebsiteResolvedMedia,
  WebsiteMediaReceipt,
  WebsiteMediaDetails,
} from "../../domain/src/company-website";
const mediaReference = v.object({
  mediaId: v.string(),
  alt: v.string(),
  focalPoint: v.optional(v.object({ x: v.number(), y: v.number() })),
});
const price = v.union(
  v.object({
    mode: v.union(v.literal("from"), v.literal("fixed")),
    amountMinor: v.number(),
    currency: v.string(),
    unit: v.optional(v.string()),
    qualifier: v.optional(v.string()),
  }),
  v.object({
    mode: v.literal("range"),
    minMinor: v.number(),
    maxMinor: v.number(),
    currency: v.string(),
    unit: v.optional(v.string()),
    qualifier: v.optional(v.string()),
  }),
  v.object({ mode: v.literal("descriptive"), label: v.string() }),
);
export const websiteContentValidator = v.object({
  template: v.union(
    v.literal("studio"),
    v.literal("editorial"),
    v.literal("direct"),
  ),
  companyName: v.string(),
  tagline: v.string(),
  hero: v.object({
    heading: v.string(),
    summary: v.string(),
    media: v.optional(mediaReference),
  }),
  logo: v.optional(mediaReference),
  gallery: v.array(mediaReference),
  services: v.array(
    v.object({ id: v.string(), title: v.string(), description: v.string() }),
  ),
  projects: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      summary: v.string(),
      media: v.array(mediaReference),
    }),
  ),
  testimonials: v.array(
    v.object({
      id: v.string(),
      quote: v.string(),
      attribution: v.string(),
      rating: v.optional(v.number()),
    }),
  ),
  pricing: v.array(
    v.object({
      id: v.string(),
      title: v.string(),
      description: v.string(),
      price,
    }),
  ),
  contacts: v.object({
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(
      v.object({
        lines: v.array(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),
    serviceAreas: v.array(v.string()),
    hours: v.array(
      v.object({ id: v.string(), label: v.string(), value: v.string() }),
    ),
  }),
  blogEnabled: v.boolean(),
});
export const resolvedMediaValidator = v.object({
  mediaId: v.string(),
  url: v.string(),
  width: v.number(),
  height: v.number(),
  contentType: v.union(
    v.literal("image/png"),
    v.literal("image/jpeg"),
    v.literal("image/webp"),
  ),
});
export const mediaDetailsValidator = v.object({
  mediaId: v.string(),
  name: v.string(),
  width: v.number(),
  height: v.number(),
  contentType: v.union(
    v.literal("image/png"),
    v.literal("image/jpeg"),
    v.literal("image/webp"),
  ),
  size: v.number(),
  createdAt: v.string(),
});
export const mediaReceiptValidator = v.union(
  v.object({ state: v.literal("ready"), media: mediaDetailsValidator }),
  v.object({
    state: v.union(
      v.literal("uploading"),
      v.literal("staged"),
      v.literal("cleanup_pending"),
      v.literal("deleted"),
      v.literal("reconciliation_required"),
    ),
    mediaId: v.string(),
  }),
);
export const websitePreviewValidator = v.object({
  revision: v.number(),
  content: websiteContentValidator,
  media: v.array(resolvedMediaValidator),
});
export const websiteStateValidator = v.object({
  revision: v.number(),
  draft: websiteContentValidator,
  published: v.union(
    v.null(),
    v.object({ revision: v.number(), publishedAt: v.string() }),
  ),
});
export const websiteWriteValidator = v.object({
  revision: v.number(),
  publishedRevision: v.union(v.number(), v.null()),
  replayed: v.boolean(),
});
export const publicWebsiteValidator = v.union(
  v.object({ state: v.literal("unavailable") }),
  v.object({
    state: v.literal("published"),
    website: v.object({
      revision: v.number(),
      publishedAt: v.string(),
      content: websiteContentValidator,
      media: v.array(resolvedMediaValidator),
    }),
  }),
);
export const websiteMediaFields = {
  tenantId: v.id("painterWorkspaces"),
  actorId: v.string(),
  requestHash: v.string(),
  fingerprint: v.string(),
  mediaId: v.string(),
  name: v.string(),
  state: v.union(
    v.literal("uploading"),
    v.literal("staged"),
    v.literal("ready"),
    v.literal("cleanup_pending"),
    v.literal("deleted"),
    v.literal("reconciliation_required"),
  ),
  storageId: v.optional(v.id("_storage")),
  contentType: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  size: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const websiteMediaRowValidator = v.object({
  ...websiteMediaFields,
  _id: v.id("painterWebsiteMedia"),
  _creationTime: v.number(),
});

type Assert<T extends true> = T;
export type WebsiteContentTransportCheck = Assert<
  Infer<typeof websiteContentValidator> extends CompanyWebsiteContent
    ? true
    : false
>;
export type WebsiteMediaTransportCheck = Assert<
  Infer<typeof resolvedMediaValidator> extends WebsiteResolvedMedia
    ? true
    : false
>;
export type WebsiteReceiptTransportCheck = Assert<
  Infer<typeof mediaReceiptValidator> extends WebsiteMediaReceipt ? true : false
>;
export type WebsiteDetailsTransportCheck = Assert<
  Infer<typeof mediaDetailsValidator> extends WebsiteMediaDetails ? true : false
>;
