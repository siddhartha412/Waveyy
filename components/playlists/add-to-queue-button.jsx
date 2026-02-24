"use client";

import { ListMusic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import {
  getQueueSongId,
  mapQueueSongToNextData,
  normalizeQueueSong,
} from "@/lib/queue-utils";

export default function AddToQueueButton({ song, className = "" }) {
  const { setQueue, music } = useMusicProvider();
  const next = useNextMusicProvider();

  const handleClick = (event) => {
    event.stopPropagation();

    const normalizedSong = normalizeQueueSong(song);
    if (!normalizedSong) {
      toast.error("Could not add this song to queue");
      return;
    }

    const songId = getQueueSongId(normalizedSong);
    const currentSongId = String(music || "");
    let alreadyQueued = false;
    let nextQueue = [];

    setQueue((prev) => {
      if (prev.some((item) => getQueueSongId(item) === songId)) {
        alreadyQueued = true;
        nextQueue = prev;
        return prev;
      }
      nextQueue = [...prev, normalizedSong];
      return nextQueue;
    });

    if (!next?.nextData) {
      const candidate = nextQueue.find((item) => getQueueSongId(item) !== currentSongId);
      if (candidate) {
        next.setNextData(mapQueueSongToNextData(candidate));
      }
    }

    if (alreadyQueued) {
      toast.message("Song already in queue");
      return;
    }

    toast.success("Added to queue");
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      className={`h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60 ${className}`}
      onClick={handleClick}
      title="Add to queue"
    >
      <ListMusic className="h-4 w-4" />
    </Button>
  );
}
