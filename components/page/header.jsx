"use client";

import Logo from "./logo";
import { Button } from "../ui/button";
import Search from "./search";
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMusicProvider } from "@/hooks/use-context";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import AuthActions from "./auth-actions";

export default function Header() {
  const path = usePathname();
  const { playerOpen, music } = useMusicProvider();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isAuthPage = path === "/login" || path === "/signup";

  if (playerOpen && !isDesktop) return null;

  return (
    <header
      className={`border-b border-border/60 px-5 py-5 md:px-20 lg:px-32 ${
        music && isDesktop && !isAuthPage ? "lg:pr-[360px]" : ""
      }`}
    >
      <div className="flex w-full items-center gap-3">
        <div className="shrink-0">
          <Logo />
        </div>

        <div className="hidden sm:flex flex-1 items-center justify-end gap-3">
          <div className="w-full max-w-md">
            <Search />
          </div>
          {path !== "/" && (
            <Button className="h-10 px-3" variant="outline" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Link>
            </Button>
          )}
        </div>

        {path !== "/" && (
          <Button className="rounded-full sm:hidden h-8 px-3" variant="outline" asChild>
            <Link href="/" className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        )}

        <div className="ml-auto">
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
