"use client";

import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import Header from "@/components/page/header";
import Search from "@/components/page/search";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function RootLayout({ children }) {
    const { music } = useMusicProvider();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    return (
        <main>
            <Header />
            <div className="px-6 sm:hidden mb-4">
                <Search />
            </div>
            <div className={music && isDesktop ? "lg:pr-[360px]" : undefined}>
                {children}
            </div>
            <Player />
            <Footer />
        </main>
    )
}
