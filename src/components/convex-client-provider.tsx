"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convex = useMemo(() => {
    if (!convexUrl) return null;
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!convexUrl) {
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Convex will not work."
      );
    }
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convex!}>
      {/* Keeps query subscriptions warm for 5 min after a page unmounts,
          so navigating back renders instantly from cache (still live) */}
      <ConvexQueryCacheProvider expiration={300_000} maxIdleEntries={150}>
        {children}
      </ConvexQueryCacheProvider>
    </ConvexProvider>
  );
}
