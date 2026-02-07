"use client";

import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import Header from "@/components/page/header";
import Search from "@/components/page/search";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
    const { music } = useMusicProvider();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    return (
        <main>
            <Header />
            {!isAuthPage && (
                <div className="px-6 sm:hidden mb-4">
                    <Search />
                </div>
            )}
            <div className={music && isDesktop && !isAuthPage ? "lg:pr-[360px]" : undefined}>
                {children}
            </div>
            {!isAuthPage && <Player />}
            <Footer />
        </main>
    )
}
