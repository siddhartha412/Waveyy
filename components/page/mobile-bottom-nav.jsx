"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMusicProvider } from "@/hooks/use-context";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/playlists", label: "Playlists", icon: Library },
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
      <div className={`grid h-14 ${visibleItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/playlists" && pathname?.startsWith("/playlists/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
