"use client";

import { ListMusic, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { decodeHTML } from "@/lib/decode-html";
import { cn } from "@/lib/utils";
import {
  getQueueSongArtist,
  getQueueSongId,
  getQueueSongImage,
  getQueueSongName,
  mapQueueSongToNextData,
} from "@/lib/queue-utils";

export default function QueueList({ compact = false, className = "" }) {
  const { queue, setQueue } = useMusicProvider();
  const next = useNextMusicProvider();

  const queueItems = (() => {
    const merged = [];
    const nextId = getQueueSongId(next?.nextData);

    if (nextId) {
      merged.push({ ...next.nextData, __isNext: true });
    }

    for (const item of queue || []) {
      const id = getQueueSongId(item);
      if (!id || id === nextId) continue;
      merged.push(item);
    }

    return merged;
  })();

  const removeFromQueue = (songId) => {
    if (!songId) return;

    let remaining = [];
    setQueue((prev) => {
      remaining = prev.filter((item) => getQueueSongId(item) !== songId);
      return remaining;
    });

    if (getQueueSongId(next?.nextData) === songId) {
      const replacement = remaining[0] || null;
      next.setNextData(replacement ? mapQueueSongToNextData(replacement) : null);
    } else if (!next?.nextData && remaining.length > 0) {
      next.setNextData(mapQueueSongToNextData(remaining[0]));
    }

    toast.success("Removed from queue");
  };

  const clearQueue = () => {
    setQueue([]);
    next.setNextData(null);
    toast.success("Queue cleared");
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 rounded-2xl border border-border/60 bg-secondary/20 p-4 sm:p-6",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ListMusic className="h-4 w-4 text-muted-foreground" />
          <h2 className="truncate text-sm font-semibold tracking-wide text-muted-foreground">Queue</h2>
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {queueItems.length}
          </span>
        </div>
        {queueItems.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={clearQueue}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      {queueItems.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground">
          Queue is empty. Use Add to Queue on any song card.
        </div>
      ) : (
        <div className={cn("mt-3 overflow-y-auto pr-1", compact ? "max-h-48" : "max-h-72")}>
          <div className="space-y-2">
            {queueItems.map((song, idx) => {
              const songId = getQueueSongId(song);
              const songName = decodeHTML(getQueueSongName(song));
              const artistName = decodeHTML(getQueueSongArtist(song));
              const image = getQueueSongImage(song);
              const isUpNext = Boolean(song?.__isNext && idx === 0);

              return (
                <div
                  key={`${songId}-${idx}`}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-2.5 py-2"
                >
                  {image ? (
                    <img src={image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-secondary/60" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {songName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {artistName}
                    </div>
                  </div>
                  {isUpNext ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Next
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromQueue(songId)}
                    title="Remove from queue"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
