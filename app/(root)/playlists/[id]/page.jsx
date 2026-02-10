"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import SongCard from "@/components/cards/song";
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

  const handlePlayAll = () => {
    if (playlist.songs.length === 0) return;
    const firstSong = playlist.songs[0];
    const queuePayload = playlist.songs.slice(1).map((song) => ({
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
    router.push(`/${firstSong.id}`, { scroll: false });
  };

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

  return (
    <main className="min-h-screen py-10 px-6 md:px-20 lg:px-32">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" className="mb-3 -ml-3" asChild>
            <Link href="/playlists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            {playlist.name}
            {isLikedPlaylist?.(playlist.id) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-300">
                <Heart className="h-3 w-3 fill-current" />
                Liked
              </span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">{playlist.songs.length} songs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePlayAll} disabled={playlist.songs.length === 0}>
            <Play className="mr-2 h-4 w-4 fill-current" />
            Play playlist
          </Button>
          {!isLikedPlaylist?.(playlist.id) ? (
            <Button
              variant="destructive"
              onClick={handleDeleteWholePlaylist}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete playlist
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {playlist.songs.length === 0 ? (
          <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
            This playlist is empty. Add songs from any card with the playlist button.
          </div>
        ) : (
          playlist.songs.map((song) => (
            <div key={song.id}>
              <SongCard id={song.id} title={song.name} image={song.image} artist={song.artist} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground hover:text-destructive"
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
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
