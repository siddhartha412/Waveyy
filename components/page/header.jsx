"use client";

import { useState } from "react";
import Logo from "./logo";
import Search from "./search";
import { usePathname } from "next/navigation";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import AuthActions from "./auth-actions";

export default function Header({ sidebarOpen = true }) {
  const path = usePathname();
  const { playerOpen, music } = useMusicProvider();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isAuthPage = path === "/login" || path === "/signup";
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  if (playerOpen && !isDesktop) return null;

  return (
    <header
      className={`border-b border-border/60 px-5 py-5 md:px-20 lg:px-32 ${
        !isAuthPage ? (sidebarOpen ? "lg:pl-[282px]" : "lg:pl-[98px]") : ""
      } ${
        music && isDesktop && !isAuthPage ? "lg:pr-[360px]" : ""
      }`}
    >
      <div className="flex w-full items-center gap-3">
        {(isAuthPage || !isDesktop || sidebarOpen) ? (
          <div className="shrink-0">
            <Logo />
          </div>
        ) : null}

        <div className="hidden sm:flex min-w-0 flex-1 items-center justify-end gap-3">
          <div className="w-full max-w-[520px]">
            <Search />
          </div>
        </div>

        {!isAuthPage && (
          <div className="ml-auto">
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
