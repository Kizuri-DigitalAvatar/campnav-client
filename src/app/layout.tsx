import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DesktopNav } from "@/components/desktop-nav";

import ConvexClientProvider from "@/components/convex-client-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ClientLayout } from "@/components/client-layout";
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
  title: "CAMPNAV",
  description: "Your camping navigation companion",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CAMPNAV",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
            <AuthProvider>
              <div className="relative flex min-h-screen">
                {/* Responsive Navigation */}
                <DesktopNav />

                <div className="flex-1 flex flex-col">
                  <main className="flex-1 flex justify-center overflow-y-auto dot-grid">
                    <div className="w-full max-w-[400px] md:max-w-7xl px-4 py-4 md:pb-8">
                      {/* AuthGuard run on the client to gate access */}
                      <ClientLayout>
                        {children}
                      </ClientLayout>
                    </div>
                  </main>
                </div>
              </div>
            </AuthProvider>
          </ConvexClientProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
