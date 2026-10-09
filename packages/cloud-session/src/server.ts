import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

type Bridge = ReturnType<typeof convexBetterAuthNextJs>;
let bridge: Bridge | undefined;
/** Lazy: local Painter runtime never needs a Convex deployment or URL. */
export function getConvexBridge(): Bridge {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (!convexUrl || !convexSiteUrl) throw new Error('CONVEX_DEPLOYMENT_NOT_CONFIGURED');
  return bridge ??= convexBetterAuthNextJs({ convexUrl, convexSiteUrl });
}
export const handler = {
  GET: (request: Request) => getConvexBridge().handler.GET(request),
  POST: (request: Request) => getConvexBridge().handler.POST(request),
};
