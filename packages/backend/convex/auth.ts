import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";

import { components } from "./runtime";
import type { DataModel } from "./runtime";
import { query } from "./runtime";
import authConfig from "./auth.config";



export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
  const siteUrl=process.env.SITE_URL;
  const secret=process.env.BETTER_AUTH_SECRET;
  if(!siteUrl||!secret)throw new Error("AUTH_BACKEND_NOT_CONFIGURED");
  return betterAuth({
    secret,
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
    ],
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});
