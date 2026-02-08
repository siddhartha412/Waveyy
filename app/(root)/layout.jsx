"use client";

import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import Header from "@/components/page/header";
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
            <div className={music && isDesktop && !isAuthPage ? "lg:pr-[360px]" : undefined}>
                {children}
            </div>
            <Player />
            <Footer />
        </main>
    )
}
