"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMusicProvider } from "@/hooks/use-context";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Your Library", icon: Library },
  { href: "/create", label: "Create", icon: Plus },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const musicState = useMusicProvider() ?? {};
  const playerOpen = Boolean(musicState?.playerOpen);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) return null;
  if (playerOpen) return null;
  const visibleItems = user ? items : items.filter((item) => item.href === "/");

  return (
    <nav className="waveyy-mobile-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md">
      <div className={`grid h-16 ${visibleItems.length === 1 ? "grid-cols-1" : `grid-cols-${visibleItems.length}`}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/search" && pathname?.startsWith("/search")) ||
            (item.href === "/library" && pathname?.startsWith("/library")) ||
            (item.href === "/create" && pathname?.startsWith("/create"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active ? "text-blue-500" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
