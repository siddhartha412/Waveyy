"use client";

import { useEffect, useRef, useState } from "react";
import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import Header from "@/components/page/header";
import SidebarNav from "@/components/page/sidebar-nav";
import MobileBottomNav from "@/components/page/mobile-bottom-nav";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function RootLayout({ children }) {
    const { music } = useMusicProvider();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const pathname = usePathname();
    const isAuthPage = pathname === "/login" || pathname === "/signup";
    const handledAuthErrorRef = useRef(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const sidebarPadding = sidebarOpen ? "lg:pl-[282px]" : "lg:pl-[98px]";
    const rightPlayerPadding = music && isDesktop ? "lg:pr-[360px]" : "";

    useEffect(() => {
        if (handledAuthErrorRef.current) return;
        if (typeof window === "undefined") return;

        const parseError = () => {
            const fromSearch = new URLSearchParams(window.location.search);
            const hashRaw = window.location.hash?.startsWith("#")
                ? window.location.hash.slice(1)
                : window.location.hash || "";
            const fromHash = new URLSearchParams(hashRaw);

            const errorCode =
                fromSearch.get("error_code") ||
                fromHash.get("error_code") ||
                "";
            const errorDescription =
                fromSearch.get("error_description") ||
                fromHash.get("error_description") ||
                "";
            const errorValue = fromSearch.get("error") || fromHash.get("error");

            if (!errorCode && !errorValue) return null;
            return { errorCode, errorDescription };
        };

        const parsed = parseError();
        if (!parsed) return;

        handledAuthErrorRef.current = true;

        if (parsed.errorCode === "identity_already_exists") {
            toast.error("This account is already linked to another user.");
        } else {
            toast.error(parsed.errorDescription || "Authentication failed");
        }

        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
    }, []);

    return (
        <main>
            {!isAuthPage && (
                <SidebarNav open={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
            )}
            <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
            <div
                className={
                    !isAuthPage
                        ? `${rightPlayerPadding} ${sidebarPadding} pb-24 lg:pb-0`
                        : undefined
                }
            >
                {children}
            </div>
            <MobileBottomNav />
            <Player />
            <Footer sidebarOpen={sidebarOpen} />
        </main>
    )
}
