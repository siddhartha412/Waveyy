"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { getSongsById } from "@/lib/fetch";
import { decodeHTML } from "@/lib/decode-html";
import {
  Play,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Repeat,
  Repeat1,
  MonitorPlay,
  X,
} from "lucide-react";
import { IoPause } from "react-icons/io5";

const formatTime = (time) => {
  if (!time || isNaN(time) || time === Infinity || time < 0) return "0:00";
  try {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  } catch {
    return "0:00";
  }
};

export default function MiniPlayer({ open = true }) {
  const {
    music,
    setMusic,
    history,
    setHistory,
    queue,
    setQueue,
    audioRef,
    playing,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    setAudioURL,
    setPlayRequested,
    shuffleEnabled,
  } = useMusicProvider();
  const next = useNextMusicProvider();

  const [data, setData] = useState(null);
  const [isLooping, setIsLooping] = useState(false);

  useEffect(() => {
    if (!music) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getSongsById(music);
        const json = await res.json();
        const s = json?.data?.[0] || null;
        if (!cancelled) setData(s);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [music]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      setPlayRequested(false);
      audio.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = e[0];
    setCurrentTime(e[0]);
  };

  const handlePrevious = () => {
    if (audioRef.current.currentTime > 5) {
      audioRef.current.currentTime = 0;
    } else if (history.length > 0) {
      const prevId = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setMusic(prevId);
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = () => {
    const pick = (items) => {
      if (!items || items.length === 0) return null;
      return shuffleEnabled
        ? items[Math.floor(Math.random() * items.length)]
        : items[0];
    };

    const consumeQueue = (id) => {
      if (!queue || queue.length === 0) return;
      const remaining = queue.filter((s) => s.id !== id);
      setQueue(remaining);
      const c = pick(remaining);
      if (c) {
        next.setNextData({
          id: c.id,
          name: c.name,
          artist: c.artists?.primary?.[0]?.name || "unknown",
          album: c.album?.name || "unknown",
          image: c.image?.[1]?.url || c.image?.[0]?.url,
        });
      } else {
        next.setNextData(null);
      }
    };

    if (next?.nextData?.id) {
      const nid = next.nextData.id;
      setHistory((p) => (p[p.length - 1] === music ? p : [...p, music].slice(-50)));
      setPlaying(true);
      setPlayRequested(true);
      setMusic(nid);
      consumeQueue(nid);
      return;
    }

    if (queue && queue.length > 0) {
      const s = pick(queue);
      if (!s) return;
      setHistory((p) => (p[p.length - 1] === music ? p : [...p, music].slice(-50)));
      setPlaying(true);
      setPlayRequested(true);
      setMusic(s.id);
      consumeQueue(s.id);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setMusic(null);
    setCurrentTime(0);
    setDuration(0);
    setAudioURL("");
    setPlayRequested(false);
    localStorage.removeItem("last-played");
  };

  const handleToggleLoop = () => {
    setIsLooping((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.loop = next;
      return next;
    });
  };

  const handleOpenTv = async () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    try {
      await root.requestFullscreen();
    } catch {}
  };

  if (!music) return null;

  const songImg = data?.image?.[1]?.url || data?.image?.[0]?.url;
  const songName = data ? decodeHTML(data.name || "") : "";
  const songArtist = data
    ? decodeHTML(data.artists?.primary?.[0]?.name || "unknown")
    : "";

  if (!open) {
    return (
      <div className="px-2 pb-2">
        <div className="flex flex-col items-center gap-2">
          {songImg ? (
            <img
              src={songImg}
              alt=""
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <Skeleton className="h-9 w-9 rounded-lg" />
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlayPause}
            className="h-8 w-8 rounded-full hover:bg-secondary/70"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <IoPause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pb-2">
      <div className="rounded-xl bg-secondary/50 p-2.5 w-full">
        <div className="flex items-center gap-2.5">
          {songImg ? (
            <img
              src={songImg}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">
              {songName || "Unknown"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {songArtist}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevious}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime -= 10;
            }}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Rewind className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="default"
            onClick={togglePlayPause}
            className="h-9 w-9 rounded-full bg-foreground text-background hover:scale-105 transition-transform"
          >
            {playing ? (
              <IoPause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-current" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime += 10;
            }}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <FastForward className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-2 px-0.5">
          <Slider
            thumbClassName="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-primary"
            trackClassName="h-[2px] group-hover:h-1 transition-all"
            onValueChange={handleSeek}
            value={[currentTime]}
            max={duration || 100}
            className="w-full group cursor-pointer"
          />
        </div>

        <div className="mt-1 flex items-center justify-between px-0.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleToggleLoop}
              className={`h-6 w-6 ${isLooping ? "text-primary" : "text-muted-foreground"}`}
            >
              {isLooping ? (
                <Repeat1 className="h-3 w-3" />
              ) : (
                <Repeat className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleOpenTv}
              className="h-6 w-6 text-muted-foreground"
              title="Full Screen Mode"
            >
              <MonitorPlay className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
