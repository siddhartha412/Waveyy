"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function PlaylistsPage() {
  const router = useRouter();
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    isLikedPlaylist,
    playlistBackendMissing,
    refreshPlaylists,
  } =
    useMusicProvider();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (!user) return null;

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

  const handleDelete = (playlist) => {
    if (isLikedPlaylist?.(playlist.id)) {
      toast.error("Liked Songs playlist cannot be deleted");
      return;
    }
    const confirmed = window.confirm(`Delete "${playlist.name}" playlist?`);
    if (!confirmed) return;
    deletePlaylist(playlist.id).then(({ error }) => {
      if (error) {
        toast.error(error.message || "Failed to delete playlist");
      } else {
        toast.success("Playlist deleted");
      }
    });
  };

  return (
    <main className="min-h-screen py-10 px-6 md:px-20 lg:px-32">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Playlists</h1>
          <p className="text-sm text-muted-foreground">Your personal music library.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New playlist
        </Button>
      </div>

      {playlistBackendMissing ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <span>
            Playlists database is not configured. Run `supabase/playlists.sql` in Supabase SQL
            editor.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-200 hover:bg-amber-500/20"
            onClick={() => refreshPlaylists()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {playlists.length === 0 ? (
          <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
            No playlists yet. Create one and add songs from home, search, artist or album pages.
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="rounded-xl border border-border/60 bg-secondary/20 p-4 hover:border-border"
            >
              <Link href={`/playlists/${playlist.id}`} className="block">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold">{playlist.name}</h2>
                  {isLikedPlaylist?.(playlist.id) ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                      <Heart className="h-3 w-3 fill-current" />
                      Liked
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {playlist.songs.length} songs
                  {isLikedPlaylist?.(playlist.id) ? " • your favorite tracks" : ""}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-end">
                {isLikedPlaylist?.(playlist.id) ? (
                  <p className="text-xs text-muted-foreground">System playlist</p>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(playlist)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
