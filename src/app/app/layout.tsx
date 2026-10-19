import { DesktopNav } from "@/components/desktop-nav";
import { ClientLayout } from "@/components/client-layout";

/**
 * Shell for the signed-in product: side/bottom navigation, the centred
 * mobile-first column, and the auth guard. The marketing site at `/` sits in a
 * sibling route group and deliberately renders none of this.
 */
export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative flex min-h-screen">
            <DesktopNav />

            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 flex justify-center overflow-y-auto dot-grid">
                    <div className="w-full max-w-[400px] md:max-w-7xl px-4 pt-4 pb-[calc(var(--app-bottom,0px)+1rem)] md:pb-8">
                        <ClientLayout>{children}</ClientLayout>
                    </div>
                </main>
            </div>
        </div>
    );
}
