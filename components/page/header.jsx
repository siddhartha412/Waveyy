"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import Search from "./search";
import { usePathname } from "next/navigation";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import AuthActions from "./auth-actions";
import { Home } from "lucide-react";

export default function Header({ sidebarOpen = true }) {
  const path = usePathname();
  const { playerOpen, music } = useMusicProvider();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmUp = useMediaQuery("(min-width: 640px)");
  const isAuthPage = path === "/login" || path === "/signup";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  if (playerOpen && !isDesktop) return null;

  return (
    <header
      className={`sticky top-0 relative z-[120] border-b border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.04)] px-4 py-3 sm:px-5`}
      style={{
        backgroundImage: isSmUp
          ? "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.62) 50%, rgba(0,0,0,0.78) 100%), linear-gradient(90deg, rgba(18,18,22,0.52) 0%, var(--waveyy-nav-tint, rgb(24,24,28)) 50%, rgba(18,18,22,0.52) 100%)"
          : "none",
      }}
    >
      <div className="flex w-full items-center gap-3 sm:grid sm:grid-cols-[auto_minmax(320px,620px)_auto] sm:items-center">
        <div className="shrink-0 sm:justify-self-start">
          <Logo />
        </div>

        {!isAuthPage && (
          <div className="hidden w-full sm:block sm:justify-self-center">
            <div className="mx-auto flex w-full max-w-[640px] items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#333333] transition-colors"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <div className="relative min-w-0 flex-1 rounded-full border border-border/60 bg-secondary/35 px-1">
                <Search />
                <div className="pointer-events-none absolute right-11 top-1/2 h-5 w-px -translate-y-1/2 bg-border/70" />
              </div>
            </div>
          </div>
        )}

        {!isAuthPage && (
          <div className="ml-auto shrink-0 sm:ml-0 sm:justify-self-end">
            <AuthActions onMenuOpenChange={setIsAccountMenuOpen} />
          </div>
        )}
      </div>

      {!isAuthPage && (
        <div className={`mt-3 sm:hidden ${isAccountMenuOpen ? "hidden" : "block"}`}>
          <Search />
        </div>
      )}
    </header>
  );
}
