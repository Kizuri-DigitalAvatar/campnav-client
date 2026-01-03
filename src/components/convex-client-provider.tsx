"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!convexUrl) {
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL is not set. Convex will not work."
      );
    }
    return <>{children}</>;
  }

  const convex = useMemo(() => new ConvexReactClient(convexUrl), []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
