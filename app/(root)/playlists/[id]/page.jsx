"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const next = useNextMusicProvider();
  const {
    playlists,
    setMusic,
    setPlayRequested,
    setPlaying,
    setPlayerOpen,
    setQueue,
    deletePlaylist,
    removeSongFromPlaylist,
    isLikedPlaylist,
    playlistBackendMissing,
    refreshPlaylists,
  } = useMusicProvider();

  const playlistId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const playlist = useMemo(
    () => playlists.find((item) => item.id === playlistId),
    [playlists, playlistId]
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (!user) return null;

  if (playlistBackendMissing) {
    return (
      <main className="min-h-screen py-10 px-6 md:px-20 lg:px-32">
        <h1 className="text-2xl font-semibold">Playlists are not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Run `supabase/playlists.sql` in your Supabase SQL editor, then reload this page.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" onClick={() => refreshPlaylists()}>
            Retry
          </Button>
          <Button variant="outline" asChild>
            <Link href="/playlists">Back to playlists</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="min-h-screen py-10 px-6 md:px-20 lg:px-32">
        <h1 className="text-2xl font-semibold">Playlist not found</h1>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/playlists">Back to playlists</Link>
        </Button>
      </main>
    );
  }

  const mapSongToQueue = (song) => ({
    id: song.id,
    name: song.name,
    image: [{ url: song.image }, { url: song.image }, { url: song.image }],
    artists: { primary: [{ name: song.artist }] },
    album: { name: playlist.name },
  });

  const playFromIndex = (startIndex = 0) => {
    if (playlist.songs.length === 0) return;
    const firstSong = playlist.songs[startIndex];
    if (!firstSong) return;
    const queuePayload = playlist.songs.slice(startIndex + 1).map((song) => ({
      id: song.id,
      name: song.name,
      image: [{ url: song.image }, { url: song.image }, { url: song.image }],
      artists: { primary: [{ name: song.artist }] },
      album: { name: playlist.name },
    }));

    setQueue(queuePayload);
    const nextSong = queuePayload[0] || null;
    if (nextSong) {
      next.setNextData({
        id: nextSong.id,
        name: nextSong.name,
        artist: nextSong.artists?.primary?.[0]?.name || "unknown",
        album: nextSong.album?.name || playlist.name,
        image: nextSong.image?.[1]?.url || nextSong.image?.[0]?.url,
      });
    } else {
      next.setNextData(null);
    }

    setMusic(firstSong.id);
    setPlayRequested(true);
    setPlaying(true);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setPlayerOpen(true);
    }
  };

  const handlePlayAll = () => playFromIndex(0);

  const handleDeleteWholePlaylist = () => {
    if (isLikedPlaylist?.(playlist.id)) {
      toast.error("Liked Songs playlist cannot be deleted");
      return;
    }
    const confirmed = window.confirm(
      `Delete "${playlist.name}" playlist?\n\nThis will remove the whole playlist and all songs inside it.`
    );
    if (!confirmed) return;
    deletePlaylist(playlist.id).then(({ error }) => {
      if (error) {
        toast.error(error.message || "Failed to delete playlist");
        return;
      }
      toast.success("Playlist deleted");
      router.replace("/playlists");
    });
  };

  const formatAddedDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen pb-28">
      <section className="px-6 md:px-20 lg:px-32 pt-8 pb-8 border-b border-border/40">
        <Button variant="ghost" className="-ml-3 mb-4" asChild>
          <Link href="/playlists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-end gap-5">
          <div
            className={`h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-md shadow-2xl flex items-center justify-center ${
              isLikedPlaylist?.(playlist.id) ? "bg-white" : "bg-secondary/70"
            }`}
          >
            {isLikedPlaylist?.(playlist.id) ? (
              <Heart className="h-12 w-12 fill-current text-blue-500" />
            ) : (
              <Play className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Playlist</p>
            <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight break-words">
              {playlist.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{playlist.songs.length} songs</p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-20 lg:px-32 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handlePlayAll} disabled={playlist.songs.length === 0} className="rounded-full">
            <Play className="mr-2 h-4 w-4 fill-current" />
            Play
          </Button>
          {!isLikedPlaylist?.(playlist.id) ? (
            <Button
              variant="destructive"
              onClick={handleDeleteWholePlaylist}
              className="gap-2 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
              Delete playlist
            </Button>
          ) : null}
        </div>

        {playlist.songs.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
            This playlist is empty. Add songs from any card with the playlist button.
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border/60 overflow-hidden">
            <div className="hidden md:grid grid-cols-[48px_minmax(0,1fr)_170px_80px] items-center gap-4 px-5 py-3 text-xs uppercase tracking-wide text-muted-foreground border-b border-border/60">
              <span>#</span>
              <span>Title</span>
              <span>Date Added</span>
              <span className="text-right">Actions</span>
            </div>
            <div>
              {playlist.songs.map((song, index) => (
                <div
                  key={song.id}
                  className="group grid grid-cols-[40px_minmax(0,1fr)_auto] md:grid-cols-[48px_minmax(0,1fr)_170px_80px] items-center gap-3 md:gap-4 px-3 md:px-5 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-secondary/35"
                >
                  <button
                    type="button"
                    className="text-muted-foreground text-sm text-left"
                    onClick={() => playFromIndex(index)}
                    title="Play from here"
                  >
                    {index + 1}
                  </button>

                  <button
                    type="button"
                    onClick={() => playFromIndex(index)}
                    className="flex items-center gap-3 min-w-0 text-left"
                    title={song.name}
                  >
                    <img
                      src={song.image}
                      alt={song.name}
                      className="h-10 w-10 rounded object-cover shrink-0 bg-secondary/70"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{song.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{song.artist}</p>
                    </div>
                  </button>

                  <span className="hidden md:block text-sm text-muted-foreground">
                    {formatAddedDate(song.addedAt)}
                  </span>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Remove song"
                      onClick={() =>
                        removeSongFromPlaylist(playlist.id, song.id).then(({ error }) => {
                          if (error) {
                            toast.error(error.message || "Failed to remove song");
                          } else {
                            toast.success("Removed from playlist");
                          }
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
