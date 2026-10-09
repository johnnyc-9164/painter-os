import { readFileSync } from "node:fs";
import { describe, expect, it, vi, afterEach } from "vitest";
import { convexTest } from "convex-test";
import betterAuthTest from "@convex-dev/better-auth/test";
import { convexToJson, jsonToConvex } from "convex/values";
import schema from "../convex/schema";
import { api } from "../convex/runtime";
import {
  emptyCompanyWebsiteContent,
  WEBSITE_MEDIA_MAX_BYTES,
} from "../../domain/src/company-website";
import { inspectWebsiteRaster } from "../website-media-contract";
const modules = {
  "./_generated/test-root-marker.ts": () => Promise.resolve({}),
  "./companyWebsite.ts": () => import("../convex/companyWebsite"),
  "./websiteMedia.ts": () => import("../convex/websiteMedia"),
  "./websiteMediaUpload.ts": () => import("../convex/websiteMediaUpload"),
  "./http.ts": () => import("../convex/http"),
};
const png = () =>
  Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD9sAAAAASUVORK5CYII=",
    ),
    (c) => c.charCodeAt(0),
  ).buffer;
async function fixture() {
  vi.stubEnv("SITE_URL", "https://website.example.test");
  vi.stubEnv("BETTER_AUTH_SECRET", "synthetic-company-website-auth-secret");
  const t = convexTest(schema, modules);
  t.registerComponent("betterAuth", betterAuthTest.schema, {
    ...betterAuthTest.modules,
    "./component/adapter.ts": () =>
      import("../../../node_modules/@convex-dev/better-auth/src/component/adapter"),
    "./component/_generated/test-root-marker.ts": () => Promise.resolve({}),
  });
  const identity = await t.runInComponent("betterAuth", async (ctx) => {
    const userId = await ctx.db.insert("user", {
      name: "Company owner",
      email: "website@example.test",
      emailVerified: true,
      createdAt: 1,
      updatedAt: 1,
    });
    const sessionId = await ctx.db.insert("session", {
      userId,
      token: "website-session",
      expiresAt: Date.now() + 60000,
      createdAt: 1,
      updatedAt: 1,
    });
    return { userId, sessionId };
  });
  const owner = t.withIdentity({
    subject: identity.userId,
    sessionId: identity.sessionId,
  });
  const company = await t.run(async (ctx) => {
    const id = await ctx.db.insert("painterWorkspaces", {
      name: "Actual company",
      ownerId: identity.userId,
      createdAt: new Date().toISOString(),
      demo: false,
    });
    const member = await ctx.db.insert("painterMembers", {
      tenantId: id,
      userId: identity.userId,
      name: "Owner",
      email: "website@example.test",
      role: "owner",
      enabled: true,
    });
    return { id, member };
  });
  return { t, owner, company, ...identity };
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
describe("company-authored website authority and owned media", () => {
  it("defaults closed, publishes a saved immutable revision, preserves publication across draft edits and unpublishes", async () => {
    const { t, owner, company } = await fixture();
    expect(
      await t.query(api.companyWebsite.publicSnapshot, {
        workspaceId: company.id,
      }),
    ).toEqual({ state: "unavailable" });
    const content = emptyCompanyWebsiteContent("Actual company");
    expect(await owner.query(api.companyWebsite.current, {})).toEqual({
      revision: 0,
      draft: content,
      published: null,
    });
    const request = { expectedRevision: 0, requestKey: "save", content };
    await owner.mutation(api.companyWebsite.saveDraft, request);
    expect(
      (await owner.mutation(api.companyWebsite.saveDraft, request)).replayed,
    ).toBe(true);
    await owner.mutation(api.companyWebsite.publish, {
      expectedRevision: 1,
      requestKey: "publish",
    });
    await owner.mutation(api.companyWebsite.saveDraft, {
      expectedRevision: 2,
      requestKey: "draft",
      content: { ...content, companyName: "Private draft" },
    });
    const published = await t.query(api.companyWebsite.publicSnapshot, {
      workspaceId: company.id,
    });
    expect(published.website.content.companyName).toBe("Actual company");
    expect(published.website.revision).toBe(2);
    expect(JSON.stringify(published)).not.toMatch(
      /Private draft|updatedBy|storageId/,
    );
    await owner.mutation(api.companyWebsite.unpublish, {
      expectedRevision: 3,
      requestKey: "unpublish",
    });
    expect(
      await t.query(api.companyWebsite.publicSnapshot, {
        workspaceId: company.id,
      }),
    ).toEqual({ state: "unavailable" });
  });
  it("enforces actual Better Auth and current membership before writes/replays/preview", async () => {
    const { t, owner, company, userId, sessionId } = await fixture();
    await expect(t.query(api.companyWebsite.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    await expect(
      t
        .withIdentity({ subject: userId, sessionId: "fake" })
        .query(api.companyWebsite.preview, {}),
    ).rejects.toThrow("UNAUTHENTICATED");
    const request = {
      expectedRevision: 0,
      requestKey: "save",
      content: emptyCompanyWebsiteContent("Company"),
    };
    await owner.mutation(api.companyWebsite.saveDraft, request);
    await t.run((ctx) => ctx.db.patch(company.member, { enabled: false }));
    await expect(
      owner.mutation(api.companyWebsite.saveDraft, request),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
    await expect(owner.query(api.companyWebsite.preview, {})).rejects.toThrow(
      "WORKSPACE_MEMBERSHIP_REQUIRED",
    );
    await t.run((ctx) =>
      ctx.db.patch(company.member, { enabled: true, role: "crew_member" }),
    );
    await expect(owner.query(api.companyWebsite.current, {})).rejects.toThrow(
      "FORBIDDEN",
    );
    await t.runInComponent("betterAuth", (ctx) =>
      ctx.db.patch(sessionId, { expiresAt: 0 }),
    );
    await expect(owner.query(api.companyWebsite.current, {})).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });
  it("rejects stale revisions and public/arbitrary storage promotion", async () => {
    const { owner } = await fixture();
    const content = emptyCompanyWebsiteContent("Company");
    await owner.mutation(api.companyWebsite.saveDraft, {
      content,
      expectedRevision: 0,
      requestKey: "save",
    });
    await expect(
      owner.mutation(api.companyWebsite.publish, {
        expectedRevision: 0,
        requestKey: "publish",
      }),
    ).rejects.toThrow("REVISION_CONFLICT");
    await owner.mutation(api.companyWebsite.saveDraft, {
      content: {
        ...content,
        logo: { mediaId: "private_storage", alt: "Logo" },
      },
      expectedRevision: 1,
      requestKey: "fake-logo",
    });
    await expect(
      owner.mutation(api.companyWebsite.publish, {
        expectedRevision: 2,
        requestKey: "publish",
      }),
    ).rejects.toThrow("WEBSITE_MEDIA_UNAVAILABLE");
    await expect(
      owner.action(api.websiteMediaUpload.upload, {
        name: "logo.png",
        requestKey: "upload",
        bytes: png(),
        storageId: "forged",
      }),
    ).rejects.toThrow();
  });
  it("creates fresh server storage, returns private-safe receipts, and gates HTTP media on active publication", async () => {
    const { t, owner, company } = await fixture();
    const receipt = await owner.action(api.websiteMediaUpload.upload, {
      requestKey: "upload",
      name: "logo.png",
      bytes: png(),
    });
    expect(receipt.state).toBe("ready");
    expect(receipt.media.width).toBe(1);
    expect(JSON.stringify(receipt)).not.toMatch(/storageId|https:/);
    expect(
      await owner.action(api.websiteMediaUpload.upload, {
        requestKey: "upload",
        name: "logo.png",
        bytes: png(),
      }),
    ).toEqual(receipt);
    const page = await owner.query(api.websiteMedia.list, {
      paginationOpts: { numItems: 20, cursor: null },
    });
    expect(page.media).toHaveLength(1);
    const content = {
      ...emptyCompanyWebsiteContent("Company"),
      logo: { mediaId: receipt.media.mediaId, alt: "Company logo" },
    };
    await owner.mutation(api.companyWebsite.saveDraft, {
      content,
      expectedRevision: 0,
      requestKey: "save",
    });
    const url = `/company-website-media?workspaceId=${company.id}&mediaId=${receipt.media.mediaId}&revision=2`;
    expect((await t.fetch(url)).status).toBe(404);
    await owner.mutation(api.companyWebsite.publish, {
      expectedRevision: 1,
      requestKey: "publish",
    });
    const response = await t.fetch(url);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.arrayBuffer()).toEqual(png());
    await owner.mutation(api.companyWebsite.unpublish, {
      expectedRevision: 2,
      requestKey: "unpublish",
    });
    expect((await t.fetch(url)).status).toBe(404);
  });
  it("holds unknown uploads without a second writer and cleans staged revoked uploads", async () => {
    const { t, owner, company } = await fixture();
    const reservation = await owner.mutation(api.websiteMedia.reserve, {
      requestKey: "pending",
      name: "logo.png",
      size: png().byteLength,
      fingerprint: "trusted-test",
    });
    await owner.mutation(api.websiteMedia.quarantine, { id: reservation.id });
    expect(
      (await owner.query(api.websiteMedia.status, { requestKey: "pending" }))
        .state,
    ).toBe("reconciliation_required");
    expect(
      (
        await owner.mutation(api.websiteMedia.reserve, {
          requestKey: "pending",
          name: "logo.png",
          size: png().byteLength,
          fingerprint: "trusted-test",
        })
      ).leader,
    ).toBe(false);
    const staged = await owner.mutation(api.websiteMedia.reserve, {
      requestKey: "stage",
      name: "logo.png",
      size: png().byteLength,
      fingerprint: "trusted-stage",
    });
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob([png()], { type: "image/png" })),
    );
    await owner.mutation(api.websiteMedia.stage, {
      id: staged.id,
      storageId,
      width: 1,
      height: 1,
      contentType: "image/png",
    });
    await t.run((ctx) => ctx.db.patch(company.member, { enabled: false }));
    await expect(
      owner.mutation(api.websiteMedia.finalize, { id: staged.id }),
    ).rejects.toThrow("WORKSPACE_MEMBERSHIP_REQUIRED");
    await t.action(api.websiteMediaUpload.reconcile, { id: staged.id });
    const row = await t.query(api.websiteMedia.inspect, { id: staged.id });
    expect(row.state).toBe("deleted");
    expect(row.storageId).toBeUndefined();
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
  });
  it("round trips actual Convex binary serialization and accepts exactly 3MiB while rejecting above", async () => {
    const original = new Uint8Array(png());
    const padding = WEBSITE_MEDIA_MAX_BYTES - original.length - 12;
    const bytes = new Uint8Array(WEBSITE_MEDIA_MAX_BYTES);
    bytes.set(original.subarray(0, original.length - 12));
    const offset = original.length - 12;
    new DataView(bytes.buffer).setUint32(offset, padding);
    bytes.set(new TextEncoder().encode("tEXt"), offset + 4);
    bytes.set(original.subarray(original.length - 12), bytes.length - 12);
    const serialized = JSON.stringify(convexToJson({ bytes: bytes.buffer }));
    const restored = jsonToConvex(JSON.parse(serialized)) as {
      bytes: ArrayBuffer;
    };
    expect(restored.bytes.byteLength).toBe(WEBSITE_MEDIA_MAX_BYTES);
    expect(serialized.length).toBeLessThan(5 * 1024 * 1024);
    expect(inspectWebsiteRaster(restored.bytes).size).toBe(
      WEBSITE_MEDIA_MAX_BYTES,
    );
    const { owner } = await fixture();
    expect(
      (
        await owner.action(api.websiteMediaUpload.upload, {
          requestKey: "boundary",
          name: "boundary.png",
          bytes: restored.bytes,
        })
      ).state,
    ).toBe("ready");
    await expect(
      owner.action(api.websiteMediaUpload.upload, {
        requestKey: "over",
        name: "over.png",
        bytes: new ArrayBuffer(WEBSITE_MEDIA_MAX_BYTES + 1),
      }),
    ).rejects.toThrow("WEBSITE_MEDIA_SIZE");
  });
  it("admits one storage writer after a null-status retry even when the original is concurrent", async () => {
    const { t, owner } = await fixture();
    expect(
      await owner.query(api.websiteMedia.status, { requestKey: "concurrent" }),
    ).toBeNull();
    const args = { requestKey: "concurrent", name: "logo.png", bytes: png() };
    const results = await Promise.all([
      owner.action(api.websiteMediaUpload.upload, args),
      owner.action(api.websiteMediaUpload.upload, args),
    ]);
    expect(results.some((result) => result.state === "ready")).toBe(true);
    expect(
      await t.run(async (ctx) => ({
        receipts: (await ctx.db.query("painterWebsiteMedia").collect()).length,
        blobs: (await ctx.db.system.query("_storage").collect()).length,
      })),
    ).toEqual({ receipts: 1, blobs: 1 });
    await expect(
      owner.action(api.websiteMediaUpload.upload, {
        ...args,
        name: "changed.png",
      }),
    ).rejects.toThrow("IDEMPOTENCY_KEY_CONFLICT");
  });
  it("bounds tenant storage effects and permits office admin authoring", async () => {
    const { t, owner, company, userId } = await fixture();
    await t.run((ctx) =>
      ctx.db.patch(company.member, { role: "office_admin" }),
    );
    await owner.mutation(api.companyWebsite.saveDraft, {
      expectedRevision: 0,
      requestKey: "admin-save",
      content: emptyCompanyWebsiteContent("Company"),
    });
    await t.run(async (ctx) => {
      for (let i = 0; i < 200; i++)
        await ctx.db.insert("painterWebsiteMedia", {
          tenantId: company.id,
          actorId: userId,
          requestHash: `old-${i}`,
          fingerprint: "old",
          mediaId: `old_${i}`,
          name: "old.png",
          state: "deleted",
          size: 1,
          createdAt: 1,
          updatedAt: 1,
        });
    });
    await expect(
      owner.action(api.websiteMediaUpload.upload, {
        requestKey: "capacity",
        name: "logo.png",
        bytes: png(),
      }),
    ).rejects.toThrow("WEBSITE_MEDIA_CAPACITY");
    expect(
      await t.run((ctx) => ctx.db.system.query("_storage").collect()),
    ).toEqual([]);
  });
  it("checks supported raster headers and structural truncation without claiming pixel decoding", async () => {
    for (const extension of ["jpg", "webp"]) {
      const bytes = Uint8Array.from(
        readFileSync(
          new URL(
            `./fixtures/website-media/pixel.${extension}`,
            import.meta.url,
          ),
        ),
      ).buffer;
      expect(inspectWebsiteRaster(bytes).width).toBe(2);
      expect(() =>
        inspectWebsiteRaster(bytes.slice(0, bytes.byteLength - 1)),
      ).toThrow();
      const { owner } = await fixture();
      const receipt = await owner.action(api.websiteMediaUpload.upload, {
        requestKey: extension,
        name: "misleading.png",
        bytes,
      });
      expect(receipt.media.contentType).toBe(
        extension === "jpg" ? "image/jpeg" : "image/webp",
      );
    }
    const broken = new Uint8Array(png());
    new DataView(broken.buffer).setUint32(33, 0x7fffffff);
    expect(() => inspectWebsiteRaster(broken.buffer)).toThrow(
      "WEBSITE_MEDIA_TRUNCATED",
    );
  });
  it("cannot publish another tenant's media or promote existing private storage", async () => {
    const { t, owner, company, userId } = await fixture();
    const privateStorage = await t.run((ctx) =>
      ctx.storage.store(new Blob([png()], { type: "image/png" })),
    );
    const receipt = await owner.action(api.websiteMediaUpload.upload, {
      requestKey: "fresh",
      name: "logo.png",
      bytes: png(),
    });
    const owned = await t.run((ctx) =>
      ctx.db
        .query("painterWebsiteMedia")
        .withIndex("by_tenant_media", (q) =>
          q.eq("tenantId", company.id).eq("mediaId", receipt.media.mediaId),
        )
        .unique(),
    );
    expect(owned.storageId).not.toBe(privateStorage);
    const other = await t.run(async (ctx) => {
      const id = await ctx.db.insert("painterWorkspaces", {
        name: "Other",
        ownerId: userId,
        createdAt: "2026-10-09",
        demo: false,
      });
      await ctx.db.insert("painterMembers", {
        tenantId: id,
        userId,
        name: "Owner",
        email: "owner@example.test",
        role: "owner",
        enabled: true,
      });
      return id;
    });
    const content = {
      ...emptyCompanyWebsiteContent("Other"),
      logo: { mediaId: receipt.media.mediaId, alt: "Logo" },
    };
    await owner.mutation(api.companyWebsite.saveDraft, {
      workspaceId: other,
      expectedRevision: 0,
      requestKey: "save",
      content,
    });
    await expect(
      owner.mutation(api.companyWebsite.publish, {
        workspaceId: other,
        expectedRevision: 1,
        requestKey: "publish",
      }),
    ).rejects.toThrow("WEBSITE_MEDIA_UNAVAILABLE");
    await expect(
      owner.action(api.websiteMediaUpload.readPrivate, {
        workspaceId: other,
        mediaId: receipt.media.mediaId,
      }),
    ).rejects.toThrow("WEBSITE_MEDIA_UNAVAILABLE");
  });
  it("rejects SVG and truncated supported raster headers before any storage reservation", async () => {
    expect(() =>
      inspectWebsiteRaster(new TextEncoder().encode("<svg/>").buffer),
    ).toThrow();
    const bytes = png();
    expect(() =>
      inspectWebsiteRaster(bytes.slice(0, bytes.byteLength - 1)),
    ).toThrow();
    const { t, owner } = await fixture();
    await expect(
      owner.action(api.websiteMediaUpload.upload, {
        requestKey: "bad",
        name: "bad.png",
        bytes: bytes.slice(0, 20),
      }),
    ).rejects.toThrow();
    expect(
      await t.run((ctx) => ctx.db.query("painterWebsiteMedia").collect()),
    ).toEqual([]);
  });
});
