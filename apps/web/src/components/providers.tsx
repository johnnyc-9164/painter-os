"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { Toaster } from "@painter-os-bts/ui/components/sonner";
import { ConvexReactClient } from "convex/react";

import { authClient } from "@/lib/auth-client";


import { ThemeProvider } from "./theme-provider";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export default function Providers({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {convex ? <ConvexBetterAuthProvider client={convex} authClient={authClient} initialToken={initialToken}>
        {children}
      </ConvexBetterAuthProvider> : children}
      <Toaster richColors />
    </ThemeProvider>
  );
}
