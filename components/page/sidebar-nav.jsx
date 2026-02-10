"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Heart, Home, Library, Plus } from "lucide-react";
import { useMusicProvider } from "@/hooks/use-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/playlists", label: "Playlists", icon: Library },
];

export default function SidebarNav({ open = true, onToggle = () => {} }) {
  const pathname = usePathname();
  const { playlists, createPlaylist, isLikedPlaylist } = useMusicProvider();
  const { user } = useAuth();

  const handleCreate = () => {
    const name = window.prompt("Playlist name");
    if (name === null) return;
    createPlaylist(name).then(({ error }) => {
      if (error) {
        toast.error(error.message || "Failed to create playlist");
      } else {
        toast.success("Playlist created");
      }
    });
  };

  const visibleNavItems = user ? navItems : navItems.filter((item) => item.href === "/");

  return (
    <aside
      className={`waveyy-sidebar hidden lg:flex fixed left-0 top-0 z-[95] h-screen flex-col border-r border-border/60 bg-background/95 backdrop-blur-md transition-[width] duration-200 ${
        open ? "w-[250px]" : "w-[66px]"
      }`}
    >
      <div className={`py-6 ${open ? "px-5" : "px-2"}`}>
        <div className={`flex items-center ${open ? "justify-between" : "justify-center"}`}>
          {open ? <h2 className="text-lg font-semibold">Library</h2> : null}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onToggle}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className={open ? "px-3" : "px-2"}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/playlists" && pathname?.startsWith("/playlists/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                open ? "gap-3 justify-start" : "justify-center"
              } ${
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
              {open ? item.label : null}
            </Link>
          );
        })}
      </div>
      {user ? (
        <>
          <div className={`mt-4 flex items-center ${open ? "justify-between px-5" : "justify-center px-2"}`}>
            {open ? (
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Playlists</p>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCreate}
              title="Create playlist"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className={`mt-2 flex-1 overflow-y-auto pb-5 ${open ? "px-3" : "px-2"}`}>
            {playlists.length === 0 ? (
              open ? <p className="px-2 py-2 text-xs text-muted-foreground">No playlists yet</p> : null
            ) : (
              playlists.map((playlist) => {
                const href = `/playlists/${playlist.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={playlist.id}
                    href={href}
                    className={`mb-1 block rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                    title={playlist.name}
                  >
                    {open ? (
                      <>
                        <div className="truncate flex items-center gap-1.5">
                          {isLikedPlaylist?.(playlist.id) ? (
                            <Heart className="h-3.5 w-3.5 fill-current text-red-500" />
                          ) : null}
                          <span className="truncate">{playlist.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{playlist.songs.length} songs</div>
                      </>
                    ) : (
                      <div
                        className={`mx-auto h-2 w-2 rounded-full ${
                          isLikedPlaylist?.(playlist.id) ? "bg-red-500" : "bg-muted-foreground/50"
                        }`}
                      />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="mt-auto px-4 pb-5 text-xs text-muted-foreground">
          {open ? "Login to use playlists" : null}
        </div>
      )}
    </aside>
  );
}
