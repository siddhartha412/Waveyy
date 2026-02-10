"use client";

import { ListPlus, Music2, Plus } from "lucide-react";
import { useMusicProvider } from "@/hooks/use-context";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function AddToPlaylistButton({ song, className = "" }) {
  const {
    playlists,
    createPlaylist,
    addSongToPlaylist,
    isLikedPlaylist,
  } = useMusicProvider();
  const { user } = useAuth();

  if (!user) return null;
  const selectablePlaylists = playlists.filter((playlist) => !isLikedPlaylist?.(playlist.id));

  const addToPlaylist = (playlistId) => {
    const selected = playlists.find((playlist) => playlist.id === playlistId);
    addSongToPlaylist(playlistId, song).then(({ error }) => {
      if (error) {
        toast.error(error.message || "Failed to add song to playlist");
        return;
      }
      toast.success(`Added to ${selected?.name || "playlist"}`);
    });
  };

  const createAndAdd = () => {
    const name = window.prompt("Playlist name");
    if (name === null) return;
    createPlaylist(name).then(({ data: playlist, error }) => {
      if (error || !playlist) {
        toast.error(error?.message || "Failed to create playlist");
        return;
      }
      addSongToPlaylist(playlist.id, song).then(({ error: addError }) => {
        if (addError) {
          toast.error(addError.message || "Failed to add song to playlist");
          return;
        }
        toast.success(`Added to ${playlist.name}`);
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className={`h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60 ${className}`}
          onClick={(event) => event.stopPropagation()}
          title="Add to playlist"
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
        {selectablePlaylists.length === 0 ? (
          <DropdownMenuItem onClick={createAndAdd} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create playlist
          </DropdownMenuItem>
        ) : (
          <>
            {selectablePlaylists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onClick={() => addToPlaylist(playlist.id)}
                className="cursor-pointer"
              >
                <Music2 className="mr-2 h-4 w-4" />
                <span className="truncate">{playlist.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={createAndAdd} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New playlist
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
