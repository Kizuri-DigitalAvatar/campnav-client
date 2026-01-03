import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";

import ConvexClientProvider from "@/components/convex-client-provider";
import { ClientLayout } from "@/components/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CAMPNAV",
  description: "Your camping navigation companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 flex justify-center">
                <div className="w-full max-w-[400px] px-4 pt-4 pb-20 md:pb-8">
                  {/* AuthProvider + AuthGuard run on the client to gate access */}
                  <ClientLayout>
                    {children}
                  </ClientLayout>
                </div>
              </main>

            </div>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
