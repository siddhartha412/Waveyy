"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  FastForward,
  Play,
  Repeat,
  Repeat1,
  Rewind,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { Slider } from "../ui/slider";
import { getSongsById, getSongsSuggestions } from "@/lib/fetch";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";
import { IoPause } from "react-icons/io5";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import FullPlayer from "@/components/player/full-player";
import SidebarPlayer from "@/components/player/sidebar-player";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Player() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [isLooping, setIsLooping] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const {
    music,
    setMusic,
    current,
    setCurrent,
    history,
    setHistory,
    queue,
    setQueue,
    playerOpen,
    setPlayerOpen,
    playRequested,
    setPlayRequested,
    audioRef,
    playing,
    setPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    audioURL,
    setAudioURL,
  } = useMusicProvider();
  const next = useNextMusicProvider();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSong = async () => {
    if (!music) return;
    try {
      const get = await getSongsById(music);
      const res = await get.json();
      if (res.data?.[0]) {
        setData(res.data[0]);
        const urls = res.data[0].downloadUrl;
        setAudioURL(urls[2]?.url || urls[1]?.url || urls[0]?.url || "");
      }
    } catch (e) {
      console.error("Failed to fetch song", e);
    }
  };

  const getRecommendations = async (songId) => {
    try {
      const res = await getSongsSuggestions(songId);
      const suggestions = await res.json();
      if (suggestions && suggestions.data.length > 0) {
        const filtered = suggestions.data.filter(
          (s) => s.id !== songId && !history.includes(s.id)
        );
        const finalData = filtered.length > 0 ? filtered : suggestions.data;
        setQueue(finalData);
        let d = finalData[0];
        next.setNextData({
          id: d.id,
          name: d.name,
          artist: d.artists.primary[0]?.name || "unknown",
          album: d.album?.name || "unknown",
          image: d.image[1].url,
        });
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      localStorage.setItem("p", "false");
    } else {
      audioRef.current
        .play()
        .catch(() => setPlaying(false));
      localStorage.setItem("p", "true");
    }
    setPlaying(!playing);
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
    if (next?.nextData?.id) {
      setMusic(next.nextData.id);
    } else {
      if (queue && queue.length > 0) {
        const nextSong = queue[0];
        setMusic(nextSong.id);
        const remaining = queue.slice(1);
        setQueue(remaining);
        if (remaining[0]) {
          next.setNextData({
            id: remaining[0].id,
            name: remaining[0].name,
            artist: remaining[0].artists?.primary?.[0]?.name || "unknown",
            album: remaining[0].album?.name || "unknown",
            image: remaining[0].image?.[1]?.url || remaining[0].image?.[0]?.url,
          });
        }
      } else {
        toast.error("No next song available");
      }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = e[0];
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  useEffect(() => {
    if (music) {
      getSong();
      getRecommendations(music);

      // Sync initial state from provider
      if (current && Math.abs(current - currentTime) > 1) {
        if (audioRef.current) audioRef.current.currentTime = parseFloat(current);
      }

      setPlaying(localStorage.getItem("p") !== "false");

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 0);
          setCurrent(audioRef.current.currentTime);
          if ("mediaSession" in navigator) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audioRef.current.duration || 0,
                playbackRate: audioRef.current.playbackRate || 1,
                position: audioRef.current.currentTime || 0,
              });
            } catch {
              // ignore if unsupported
            }
          }
        }
      };

      const handleEnded = () => {
        if (!isLooping) handleNext();
      };

      audioRef.current?.addEventListener("timeupdate", handleTimeUpdate);
      audioRef.current?.addEventListener("ended", handleEnded);

      return () => {
        audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current?.removeEventListener("ended", handleEnded);
      };
    }
  }, [music]);

  useEffect(() => {
    if (!data || !audioURL) return;
    if (!("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: data.name || "Unknown",
        artist: data.artists?.primary?.[0]?.name || "Unknown",
        album: data.album?.name || "",
        artwork: [
          { src: data.image?.[0]?.url, sizes: "96x96", type: "image/jpeg" },
          { src: data.image?.[1]?.url, sizes: "192x192", type: "image/jpeg" },
          { src: data.image?.[2]?.url, sizes: "512x512", type: "image/jpeg" },
        ].filter((a) => a.src),
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play();
        setPlaying(true);
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
        setPlaying(false);
      });
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevious);
      navigator.mediaSession.setActionHandler("nexttrack", handleNext);
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        if (!audioRef.current) return;
        const seekOffset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seekOffset);
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        if (!audioRef.current) return;
        const seekOffset = details.seekOffset || 10;
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || Infinity,
          audioRef.current.currentTime + seekOffset
        );
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!audioRef.current || details.seekTime == null) return;
        audioRef.current.currentTime = details.seekTime;
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        audioRef.current?.pause();
        setPlaying(false);
      });
    } catch {
      // ignore MediaSession failures
    }
  }, [data, audioURL]);

  useEffect(() => {
    if (!audioRef.current || !audioURL) return;
    const audio = audioRef.current;
    if (playRequested || playing) {
      const res = audio.play();
      if (res && typeof res.catch === "function") {
        res.catch(() => setPlaying(false));
      } else {
        setPlaying(true);
      }
      if (playRequested) setPlayRequested(false);
    } else {
      audio.pause();
    }
  }, [audioURL, playRequested, playing, setPlayRequested, setPlaying]);

  if (!mounted || !music) return null;

  return (
    <>
      {(!playerOpen || isDesktop) && (
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-t border-border shadow-2xl h-[72px] sm:h-24 flex flex-col">
        <div className="absolute top-0 left-0 right-0 -translate-y-[2px] px-0">
          <Slider
            thumbClassName="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity"
            trackClassName="h-[3px] group-hover:h-1.5 transition-all"
            onValueChange={handleSeek}
            value={[currentTime]}
            max={duration || 100}
            className="w-full group cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between h-full px-3 sm:px-4 md:px-8 gap-3 sm:gap-4">
          {/* Left Section: Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 sm:w-1/4 sm:min-w-[150px]">
            {data ? (
              <>
                <div className="relative group">
                  <img
                    src={data.image?.[1]?.url}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-md object-cover shadow-lg group-hover:opacity-80 transition cursor-pointer"
                    onClick={() => setPlayerOpen(true)}
                  />
                </div>
                <div className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPlayerOpen(true)}
                    className="text-left text-sm font-semibold truncate block hover:text-primary transition"
                  >
                    {data.name}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {data.artists?.primary?.[0]?.name}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            )}
          </div>

          {/* Center Section: Controls */}
          <div className="flex items-center justify-center gap-2 sm:flex-1 sm:flex-col sm:gap-1">
            <div className="flex items-center gap-2 sm:hidden">
              <Button
                variant="secondary"
                size="icon"
                onClick={togglePlayPause}
                className="h-10 w-10 rounded-full shadow-md bg-foreground text-background"
              >
                {playing ? <IoPause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                className="h-9 w-9 text-muted-foreground hover:text-foreground flex"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden sm:flex items-center gap-1 sm:gap-6">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePrevious}
                className="h-9 w-9 text-muted-foreground hover:text-foreground flex"
              >
                <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => (audioRef.current.currentTime -= 10)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Rewind className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={togglePlayPause}
                className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shadow-md bg-foreground text-background hover:scale-105 transition-transform shrink-0"
              >
                {playing ? <IoPause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => (audioRef.current.currentTime += 10)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <FastForward className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleNext}
                className="h-9 w-9 text-muted-foreground hover:text-foreground flex"
              >
                <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <div className="hidden md:flex text-[10px] text-muted-foreground font-medium gap-2">
              <span>{new Date(currentTime * 1000).toISOString().substr(14, 5)}</span>
              <span>/</span>
              <span>{new Date(duration * 1000).toISOString().substr(14, 5)}</span>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="hidden sm:flex items-center justify-end gap-2 w-1/4 min-w-[100px]">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsLooping(!isLooping);
                if (audioRef.current) audioRef.current.loop = !isLooping;
              }}
              className={`h-9 w-9 ${isLooping ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            >
              {isLooping ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setMusic(null);
                setCurrent(0);
                localStorage.removeItem("last-played");
              }}
              className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setMusic(null);
                setCurrent(0);
                localStorage.removeItem("last-played");
              }}
              className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      )}

      <audio
        ref={audioRef}
        src={audioURL}
        autoPlay={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={() => setDuration(audioRef.current?.duration || 0)}
      />
      {isDesktop ? (
        <Sheet open={playerOpen} onOpenChange={setPlayerOpen}>
          <SheetContent side="right" className="p-0 w-[360px] max-w-[90vw]">
            <SidebarPlayer />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
          <DialogContent className="w-[100vw] h-[100vh] max-w-none rounded-none overflow-y-auto p-0 bg-background">
            <div className="relative pt-14 sm:pt-6">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => setPlayerOpen(false)}
                className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full"
                title="Close player"
              >
                <X className="h-4 w-4" />
              </Button>
              <FullPlayer id={music} mode="overlay" onClose={() => setPlayerOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
