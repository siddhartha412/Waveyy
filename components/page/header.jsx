"use client";

import Link from "next/link";
import Logo from "./logo";
import Search from "./search";
import { usePathname } from "next/navigation";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Home } from "lucide-react";

export default function Header({ sidebarOpen = true }) {
  const path = usePathname();
  const { playerOpen, music } = useMusicProvider();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isAuthPage = path === "/login" || path === "/signup";

  if (playerOpen && !isDesktop) return null;

  return (
    <header
      className={`sticky top-0 relative z-[120] border-b border-border/60 bg-secondary/20 backdrop-blur-[40px] saturate-[180%] px-4 py-3 sm:px-5 lg:h-[64px] lg:py-0 lg:flex lg:items-center rounded-b-2xl mx-4`}
    >
      <div className="flex w-full items-center gap-3 sm:grid sm:grid-cols-[auto_minmax(320px,620px)_auto] sm:items-center lg:flex lg:items-center lg:h-full">
        <div className="shrink-0 sm:justify-self-start">
          <Logo />
        </div>

        {!isAuthPage && (
          <div className="hidden w-full sm:block sm:justify-self-center">
            <div className="mx-auto flex w-full max-w-[640px] items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#333333] transition-all duration-200 ease-smooth"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <div className="relative min-w-0 flex-1 rounded-full border border-white/[0.06] bg-secondary/30 px-1">
                <Search />
                <div className="pointer-events-none absolute right-10 top-1/2 h-4 w-px -translate-y-1/2 bg-white/[0.08]" />
              </div>
            </div>
          </div>
        )}

      </div>

      {!isAuthPage && (
        <div className="mt-3 sm:hidden">
          <Search />
        </div>
      )}
    </header>
  );
}
