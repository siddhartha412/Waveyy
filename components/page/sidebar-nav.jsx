"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Library,
  Plus,
} from "lucide-react";
import { useMusicProvider } from "@/hooks/use-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import UserPanel from "./user-panel";
import MiniPlayer from "@/components/player/mini-player";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/playlists", label: "Playlists", icon: Library },
];

export default function SidebarNav({ open = true, onToggle = () => {} }) {
  const pathname = usePathname();
  const { playlists, createPlaylist, isLikedPlaylist, music } = useMusicProvider();
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

  const visibleNavItems = user
    ? navItems
    : navItems.filter((item) => item.href === "/");
  const getPlaylistImages = (playlist) => {
    if (!Array.isArray(playlist?.songs)) return [];
    return playlist.songs
      .map((song) => song?.image)
      .filter(Boolean)
      .slice(0, 4);
  };

  const renderPlaylistThumb = (playlist) => {
    if (isLikedPlaylist?.(playlist.id)) {
      return (
        <div className="h-full w-full bg-white flex items-center justify-center">
          <Heart className="h-4 w-4 fill-current text-blue-500" />
        </div>
      );
    }

    const images = getPlaylistImages(playlist);
    if (images.length === 0) {
      return <Library className="h-4 w-4 text-muted-foreground" />;
    }

    if (images.length === 1) {
      return (
        <img
          src={images[0]}
          alt={playlist.name}
          className="h-full w-full object-cover"
        />
      );
    }

    const tile = (index) => images[index] || images[images.length - 1];
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[1px] bg-background/40">
        {[0, 1, 2, 3].map((index) => (
          <img
            key={`${playlist.id}-thumb-${index}`}
            src={tile(index)}
            alt=""
            className="h-full w-full object-cover"
          />
        ))}
      </div>
    );
  };

  return (
    <aside
      className={`waveyy-sidebar hidden lg:flex fixed left-0 top-[84px] z-[95] h-[calc(100vh-100px)] rounded-2xl m-2 flex-col border border-border/60 bg-secondary/20 backdrop-blur-[40px] saturate-[180%] transition-[width] duration-300 ease-smooth ${
        open ? "w-[250px]" : "w-[66px]"
      }`}
    >
      <div className={`py-5 ${open ? "px-4" : "px-2"}`}>
        <div
          className={`flex items-center ${open ? "justify-between" : "justify-center"}`}
        >
          {open ? (
            <h2 className="text-base font-semibold tracking-tight">Library</h2>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg hover:bg-secondary/70"
            onClick={onToggle}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className={open ? "px-2.5" : "px-1.5"}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/playlists" && pathname?.startsWith("/playlists/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200 ease-smooth ${
                open ? "gap-2.5 justify-start" : "justify-center"
              } ${
                active
                  ? "bg-secondary/80 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              title={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {open ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </div>
      {user ? (
        <>
          <div
            className={`mt-3 flex items-center ${open ? "justify-between px-4" : "justify-center px-2"}`}
          >
            {open ? (
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Your Playlists
              </p>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-md hover:bg-secondary/70"
              onClick={handleCreate}
              title="Create playlist"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div
            className={`mt-1.5 flex-1 overflow-y-auto pb-2 ${open ? "px-2.5" : "px-1.5"}`}
          >
            {playlists.length === 0 ? (
              open ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  No playlists yet
                </p>
              ) : null
            ) : (
              playlists.map((playlist) => {
                const href = `/playlists/${playlist.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={playlist.id}
                    href={href}
                    className={`mb-0.5 block rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200 ease-smooth ${
                      active
                        ? "bg-secondary/80 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                    title={playlist.name}
                  >
                    {open ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-secondary/70 flex items-center justify-center">
                          {renderPlaylistThumb(playlist)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px]">
                            {playlist.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {playlist.songs.length} songs
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`mx-auto h-2 w-2 rounded-full ${
                          isLikedPlaylist?.(playlist.id)
                            ? "bg-red-500"
                            : "bg-muted-foreground/50"
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
        <div className="flex-1" />
      )}
      <div className="mt-auto">
        <MiniPlayer open={open} />
        <UserPanel open={open} />
      </div>
    </aside>
  );
}
