import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import ConvexClientProvider from "@/components/convex-client-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nexa = localFont({
  src: [
    { path: "../../public/nexa/Nexa-ExtraLight.ttf", weight: "100 300", style: "normal" },
    { path: "../../public/nexa/Nexa-Heavy.ttf", weight: "400 900", style: "normal" },
  ],
  variable: "--font-nexa",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://campnav.app"),
  title: {
    default: "CAMPNAV — Camp operations in one place",
    template: "%s · CAMPNAV",
  },
  description:
    "CAMPNAV runs the whole camp: resident service requests, staff dispatch, meals, housekeeping, maintenance, HSE reporting and live occupancy — on one platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAMPNAV",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "CAMPNAV",
    title: "CAMPNAV — Camp operations in one place",
    description:
      "One platform for resident requests, staff dispatch, meals, maintenance, HSE and occupancy.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141821" },
  ],
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nexa.variable} antialiased selection:bg-primary/25`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <AuthProvider>{children}</AuthProvider>
          </ConvexClientProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
