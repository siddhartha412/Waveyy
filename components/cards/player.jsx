"use client";
import { useEffect, useRef, useState } from "react";
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
  MonitorPlay,
} from "lucide-react";
import { Slider } from "../ui/slider";
import { getSongsById, getSongsSuggestions, getSpotifyRecommendations } from "@/lib/fetch";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { Skeleton } from "../ui/skeleton";
import { IoPause } from "react-icons/io5";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FullPlayer from "@/components/player/full-player";
import SidebarPlayer from "@/components/player/sidebar-player";
import { decodeHTML } from "@/lib/decode-html";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";

export default function Player() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const recRequestRef = useRef(0);
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

  useEffect(() => {
    if (music) setIsClosing(false);
  }, [music]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (tvOpen) root.classList.add("tv-mode");
    else root.classList.remove("tv-mode");
    return () => root.classList.remove("tv-mode");
  }, [tvOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!music) {
      setData(null);
      setAudioURL("");
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setTvOpen(false);
    }
  }, [music, setAudioURL, setPlaying, setCurrentTime, setDuration]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!tvOpen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [tvOpen]);

  const finalizeClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setMusic(null);
    setCurrent(0);
    setCurrentTime(0);
    setDuration(0);
    setAudioURL("");
    setData(null);
    setPlayRequested(false);
    localStorage.removeItem("last-played");
  };

  const handleClosePlayer = () => {
    if (isDesktop) {
      setIsClosing(true);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        finalizeClosePlayer();
        setIsClosing(false);
      }, 280);
      return;
    }
    finalizeClosePlayer();
  };

  const handleOpenTv = async () => {
    if (typeof document === "undefined") {
      setTvOpen(true);
      return;
    }
    const root = document.documentElement;
    if (!root.requestFullscreen) {
      setTvOpen(true);
      return;
    }
    try {
      await root.requestFullscreen();
      setTvOpen(true);
    } catch {
      toast.error("Fullscreen is blocked by your browser.");
    }
  };

  const getSong = async () => {
    if (!music) return;
    try {
      const get = await getSongsById(music);
      const res = await get.json();
      if (res.data?.[0]) {
        const song = res.data[0];
        setData(song);
        const urls = song.downloadUrl;
        setAudioURL(urls[2]?.url || urls[1]?.url || urls[0]?.url || "");
        return song;
      }
    } catch (e) {
      console.error("Failed to fetch song", e);
    }
    return null;
  };

  const getRecommendations = async (songId, songMeta = data) => {
    const requestId = ++recRequestRef.current;
    try {
      let suggestions = null;
      if (songMeta?.name) {
        const spotifyRes = await getSpotifyRecommendations({
          name: songMeta.name,
          artist: songMeta.artists?.primary?.[0]?.name || "",
          limit: 12,
        });
        suggestions = await spotifyRes.json();
      }

      if (!suggestions || !suggestions.data || suggestions.data.length === 0) {
        const res = await getSongsSuggestions(songId);
        suggestions = await res.json();
      }

      if (requestId !== recRequestRef.current || songId !== music) return;

      if (suggestions && suggestions.data.length > 0) {
        const filtered = suggestions.data.filter(
          (s) => s.id !== songId && !history.includes(s.id)
        );
        const finalData = filtered.length > 0 ? filtered : suggestions.data;
        setQueue(finalData);
        const d = finalData[0];
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
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
      localStorage.setItem("p", "true");
    } else {
      audio.pause();
      setPlaying(false);
      localStorage.setItem("p", "false");
    }
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

  const pushCurrentToHistory = (currentSongId = music) => {
    if (!currentSongId) return;
    setHistory((prev) => {
      if (prev[prev.length - 1] === currentSongId) return prev;
      return [...prev, currentSongId].slice(-50);
    });
  };

  const handleNext = () => {
    const consumeQueue = (currentNextId) => {
      if (!queue || queue.length === 0) return;
      const shouldShift = currentNextId && queue[0]?.id === currentNextId;
      if (!shouldShift) return;
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
    };

    if (next?.nextData?.id) {
      const nextId = next.nextData.id;
      pushCurrentToHistory(music);
      setMusic(nextId);
      consumeQueue(nextId);
      return;
    }

    if (queue && queue.length > 0) {
      const nextSong = queue[0];
      pushCurrentToHistory(music);
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
      return;
    }

    toast.error("No next song available");
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = e[0];
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  useEffect(() => {
    if (music) {
      const run = async () => {
        const song = await getSong();
        getRecommendations(music, song);
      };
      run();

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
    const onKeyDown = (e) => {
      if (e.defaultPrevented) return;
      const isSpace = e.code === "Space" || e.key === " ";
      if (!isSpace) return;

      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toUpperCase() : null;
      const isFormElement =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target && target.isContentEditable);

      if (isFormElement) return;
      e.preventDefault();
      togglePlayPause();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlayPause]);

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
  const safeTitle = decodeHTML(data?.name || "");
  const artistNames = (data?.artists?.primary || [])
    .map((a) => a?.name)
    .filter(Boolean);
  const safeArtist = decodeHTML(artistNames.join(", ") || "");

  return (
    <>
      {/* Desktop: dock a permanent right sidebar (Spotify-like) */}
      {isDesktop && !tvOpen && (
        <aside
          className={`hidden lg:block fixed right-0 top-0 h-screen w-[360px] border-l border-border bg-background z-[90] transition-transform duration-300 ${
            isClosing ? "translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
          }`}
        >
          <SidebarPlayer />
        </aside>
      )}

      {(!playerOpen || isDesktop) && !tvOpen && (
      <div className="fixed bottom-0 left-0 right-0 lg:right-[360px] z-[100] bg-background/95 backdrop-blur-md border-t border-border shadow-2xl h-[72px] sm:h-24 flex flex-col">
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
                    {safeTitle}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {safeArtist}
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
              onClick={handleOpenTv}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hidden lg:inline-flex"
              title="Full Screen Mode"
            >
              <MonitorPlay className="h-4 w-4" />
            </Button>
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
              onClick={handleClosePlayer}
              className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClosePlayer}
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
      {!isDesktop && (
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

      {isDesktop && (
        <Dialog open={tvOpen} onOpenChange={setTvOpen}>
          <DialogContent className="w-[100vw] h-[100vh] max-w-none rounded-none overflow-hidden p-0 bg-black">
            <FullPlayer
              id={music}
              mode="tv"
              onClose={async () => {
                if (typeof document !== "undefined" && document.fullscreenElement) {
                  try {
                    await document.exitFullscreen();
                  } catch {}
                }
                setTvOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
