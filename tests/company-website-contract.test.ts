import assert from "node:assert/strict";
import test from "node:test";
import {
  decodePublicCompanyWebsite,
  emptyCompanyWebsiteContent,
  normalizeCompanyWebsiteContent,
} from "../packages/domain/src/company-website.ts";
test("website content keeps empty sections honest and rejects client-owned storage/public URL fields", () => {
  const content = emptyCompanyWebsiteContent("Actual company");
  assert.deepEqual(normalizeCompanyWebsiteContent(content), content);
  assert.throws(() =>
    normalizeCompanyWebsiteContent({ ...content, storageId: "private" }),
  );
  assert.throws(() =>
    normalizeCompanyWebsiteContent({
      ...content,
      hero: {
        ...content.hero,
        media: {
          mediaId: "media_1",
          alt: "A project",
          url: "https://private.example",
        },
      },
    }),
  );
});
test("pricing and authored ratings reject unusable amounts and claims", () => {
  const content = emptyCompanyWebsiteContent();
  for (const price of [
    { mode: "fixed", amountMinor: 0.1, currency: "USD" },
    { mode: "range", minMinor: 200, maxMinor: 100, currency: "USD" },
  ])
    assert.throws(() =>
      normalizeCompanyWebsiteContent({
        ...content,
        pricing: [{ id: "price", title: "Painting", description: "", price }],
      }),
    );
  assert.throws(() =>
    normalizeCompanyWebsiteContent({
      ...content,
      testimonials: [
        { id: "review", quote: "Good", attribution: "Author", verified: true },
      ],
    }),
  );
});
test("public snapshot accepts only complete publication-bound proxy media", () => {
  const content = {
    ...emptyCompanyWebsiteContent("Company"),
    logo: { mediaId: "media_1", alt: "Company logo" },
  };
  const media = {
    mediaId: "media_1",
    url: "/api/company-website-media?workspaceId=workspace_1&mediaId=media_1&revision=1",
    width: 10,
    height: 10,
    contentType: "image/png",
  };
  const value = {
    state: "published",
    website: {
      revision: 1,
      publishedAt: "2026-10-09T00:00:00.000Z",
      content,
      media: [media],
    },
  };
  assert.deepEqual(decodePublicCompanyWebsite(value), value);
  assert.throws(() =>
    decodePublicCompanyWebsite({
      ...value,
      website: { ...value.website, media: [] },
    }),
  );
  for (const url of [
    "https://private.example/storage",
    "/api/website/media?workspaceId=workspace_1&mediaId=media_1&revision=1",
    "/api/company-website-media?workspaceId=workspace_1&mediaId=media_1&revision=2",
  ])
    assert.throws(() =>
      decodePublicCompanyWebsite({
        ...value,
        website: { ...value.website, media: [{ ...media, url }] },
      }),
    );
});
