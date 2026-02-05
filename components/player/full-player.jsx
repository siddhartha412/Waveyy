"use client";
import { Button } from "@/components/ui/button";
import { getSongsById, getSongsSuggestions } from "@/lib/fetch";
import {
  Download,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Rewind,
  FastForward,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useMusicProvider,
  useNextMusicProvider,
} from "@/hooks/use-context";
import { IoPause } from "react-icons/io5";
import { getLyrics } from "@/lib/lyrics-client";
import { decodeHTML } from "@/lib/decode-html";
import { toHinglish } from "@/lib/hinglish";

export default function Player({ id, mode = "page", onClose }) {
  // start with an object so checks are straightforward
  const [data, setData] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [lyricsLines, setLyricsLines] = useState([]);
  const [lyricsText, setLyricsText] = useState("");
  const [activeLine, setActiveLine] = useState(-1);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const next = useNextMusicProvider();
  const {
    current,
    setCurrent,
    music,
    setMusic,
    history,
    setHistory,
    setQueue,
    setDownloadProgress,
    downloadProgress,
    queue,
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
  const router = useRouter();
  const isOverlay = mode === "overlay";
  const lyricsContainerRef = useRef(null);
  const lineRefs = useRef([]);

  useEffect(() => {
    if (mode !== "tv") return;
    if (typeof document === "undefined") return;
    const handleChange = () => {
      if (!document.fullscreenElement && onClose) onClose();
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
    };
  }, [mode, onClose]);

  const getSong = async () => {
    try {
      const get = await getSongsById(id);
      const res = await get.json();
      if (res.data?.[0]) {
        const songData = res.data[0];
        setData(songData);
        setAudioURL(
          songData.downloadUrl?.[2]?.url ||
            songData.downloadUrl?.[1]?.url ||
            songData.downloadUrl?.[0]?.url ||
            ""
        );
      } else {
        toast.error("Song not found");
        if (isOverlay) {
          setMusic(null);
          if (onClose) onClose();
        } else {
          router.push("/", { scroll: false });
        }
      }
    } catch (error) {
      console.error("Failed to fetch song:", error);
      toast.error("An error occurred while loading the song");
    }
  };

  const parseLrc = (lrcText = "") => {
    const lines = lrcText.split("\n");
    const result = [];

    for (const rawLine of lines) {
      const timeTags = [...rawLine.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
      if (timeTags.length === 0) continue;

      const text = rawLine.replace(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g, "").trim();
      for (const match of timeTags) {
        const min = Number(match[1]);
        const sec = Number(match[2]);
        const msRaw = match[3] || "0";
        const ms = msRaw.length === 2 ? Number(msRaw) * 10 : Number(msRaw);
        const time = min * 60 + sec + ms / 1000;
        result.push({ time, text });
      }
    }

    return result.sort((a, b) => a.time - b.time);
  };

  const fetchLyrics = async (songData) => {
    if (!songData?.name || !songData?.artists?.primary?.[0]?.name) {
      setLyricsLines([]);
      setLyricsText("");
      return;
    }

    try {
      setIsLyricsLoading(true);
      const payload = await getLyrics(songData);
      const synced = payload?.synced || "";
      const plain = payload?.plain || "";
      const parsed = synced ? parseLrc(synced) : [];
      setLyricsLines(parsed);
      setLyricsText(plain || synced || "");
    } catch (e) {
      setLyricsLines([]);
      setLyricsText("");
    } finally {
      setIsLyricsLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // make toggle safe if audioRef isn't ready
  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      // nothing to do yet
      setPlaying(false);
      return;
    }

    if (audio.paused || audio.ended) {
      audio.play().catch((err) => {
        // play() can fail due to autoplay restrictions — handle silently
        console.warn("audio.play() failed:", err);
      });
      localStorage.setItem("p", "true");
      setPlaying(true);
    } else {
      audio.pause();
      localStorage.setItem("p", "false");
      setPlaying(false);
    }
  }, []);

  const downloadSong = async () => {
    if (!audioURL) {
      toast.error("No audio URL to download");
      return;
    }

    if (isDownloading) {
      setDownloadProgress(0);
      setIsDownloading(false);
      return;
    }
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(audioURL);
      if (!response.ok) throw new Error("Failed to fetch");

      const contentLength = response.headers.get("Content-Length");
      if (!contentLength) {
        console.warn("No Content-Length header, can't show progress accurately.");
      }

      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;

          if (total) {
            const progress = Math.round((loaded / total) * 100);
            setDownloadProgress(progress);
          }
        }
      }

      // Combine chunks into a blob
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // use decoded name for filename
      const decodedName = decodeHTML(data.name || "song");
      a.download = `${decodedName}.mp3`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Downloaded!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = e[0];
    if (audioRef.current) audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const loopSong = () => {
    if (!audioRef.current) return;
    audioRef.current.loop = !audioRef.current.loop;
    setIsLooping(!isLooping);
  };

  const handleShare = () => {
    try {
      navigator.share({
        url: `${window.location.origin}/${data.id || id}`,
      });
    } catch (e) {
      toast.error("Something went wrong!");
    }
  };

  const handlePrevious = () => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > 5) {
      audioRef.current.currentTime = 0;
    } else if (history.length > 0) {
      const prevId = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1)); // Remove the last item as we are going back to it
      if (isOverlay) {
        setMusic(prevId);
      } else {
        router.push(`/${prevId}`, { scroll: false });
      }
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  const getRecommendations = async (songId, currentHistory = history) => {
    try {
      const res = await getSongsSuggestions(songId);
      const suggestions = await res.json();
      if (suggestions && suggestions.data.length > 0) {
        // Filter out the current song and anything in the history
        const filtered = suggestions.data.filter(
          (s) => s.id !== songId && !currentHistory.includes(s.id)
        );
        const finalData = filtered.length > 0 ? filtered : suggestions.data;

        setQueue(finalData);
        let d = finalData[0]; // Always pick the first unique one
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

  useEffect(() => {
    getSong();
    localStorage.removeItem("p");

    // Logic to update history when switching songs
    let updatedHistory = [...history];
    if (music && music !== id) {
      if (updatedHistory[updatedHistory.length - 1] !== music) {
        updatedHistory = [...updatedHistory, music].slice(-50);
        setHistory(updatedHistory);
      }
    }

    getRecommendations(id, updatedHistory);

    // Only resume playback position if it's the same song being reloaded
    if (music === id && current) {
      if (audioRef.current) audioRef.current.currentTime = parseFloat(current);
    } else {
      setCurrent(0);
      setMusic(id);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
    fetchLyrics(data?.name ? data : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (data?.name) fetchLyrics(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.name]);

  // Redirect to next when song ends (if not looping)
  useEffect(() => {
    const handleRedirect = () => {
      if (currentTime === duration && !isLooping && duration !== 0) {
        if (isOverlay) {
          if (next?.nextData?.id) {
            setMusic(next.nextData.id);
          } else if (queue && queue.length > 0) {
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
          }
        } else {
          router.push(`/${next?.nextData?.id}`, { scroll: false });
        }
      }
    };
    if (isLooping || duration === 0) return;
    return handleRedirect();
  }, [currentTime, duration, isLooping, next?.nextData?.id, router, isOverlay, setMusic]);

  useEffect(() => {
    if (!lyricsLines.length) {
      setActiveLine(-1);
      return;
    }
    let idx = -1;
    for (let i = 0; i < lyricsLines.length; i += 1) {
      if (currentTime >= lyricsLines[i].time) idx = i;
      else break;
    }
    setActiveLine(idx);
  }, [currentTime, lyricsLines]);

  useEffect(() => {
    if (activeLine < 0) return;
    const container = lyricsContainerRef.current;
    const el = lineRefs.current[activeLine];
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
    container.scrollBy({ top: offset, behavior: "auto" });
  }, [activeLine]);

  // === Spacebar play/pause handler ===
  useEffect(() => {
    const onKeyDown = (e) => {
      // check for space (use code for consistency, fallback to key)
      const isSpace = e.code === "Space" || e.key === " ";
      if (!isSpace) return;

      const target = e.target;
      const tag = target && target.tagName ? target.tagName.toUpperCase() : null;
      const isFormElement =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target && target.isContentEditable);

      // If user is typing or a form control is focused, don't toggle playback
      if (isFormElement) return;

      // Prevent page scrolling when space toggles playback
      e.preventDefault();
      togglePlayPause();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlayPause]);

  if (mode === "tv") {
    return (
      <div className="relative h-[100vh] w-[100vw] overflow-hidden bg-black text-white">
        <img
          src={data?.image?.[2]?.url || data?.image?.[1]?.url || data?.image?.[0]?.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
        <div className="relative z-10 h-full w-full flex flex-col justify-between p-8 sm:p-10 lg:p-14">
          <div className="flex items-center justify-between">
            <div className="text-xs tracking-[0.2em] uppercase text-white/60">
              Full Screen Mode
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => (onClose ? onClose() : router.push("/", { scroll: false }))}
              className="h-10 w-10 rounded-full"
              title="Exit full screen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div />

          <div className="grid gap-10 items-end">
            <div className="grid gap-6 w-full max-w-none">
              <div className="flex items-center gap-4">
                <img
                  src={data?.image?.[1]?.url || data?.image?.[0]?.url}
                  alt={decodeHTML(data?.name || "")}
                  className="h-16 w-16 rounded-lg object-cover shadow-xl"
                />
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-semibold truncate">
                    {decodeHTML(data?.name || "Unknown")}
                  </h1>
                  <p className="text-sm md:text-base text-white/70 truncate">
                    {decodeHTML(data?.artists?.primary?.[0]?.name || "unknown")}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 w-full">
                <Slider
                  onValueChange={handleSeek}
                  value={[currentTime]}
                  max={duration || 100}
                  className="w-full"
                  trackClassName="h-[3px] bg-white/30"
                  thumbClassName="h-4 w-4 bg-white"
                />
                <div className="w-full flex items-center justify-between text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 md:gap-6">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePrevious}
                  className="rounded-full hover:bg-white/10"
                  title="Previous"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => (audioRef.current.currentTime -= 10)}
                  className="rounded-full hover:bg-white/10"
                  title="Rewind 10s"
                >
                  <Rewind className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                  onClick={togglePlayPause}
                >
                  {playing ? (
                    <IoPause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 fill-current" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => (audioRef.current.currentTime += 10)}
                  className="rounded-full hover:bg-white/10"
                  title="Fast Forward 10s"
                >
                  <FastForward className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (next?.nextData?.id) {
                      setMusic(next.nextData.id);
                    } else {
                      toast.error("No next song available");
                    }
                  }}
                  className="rounded-full hover:bg-white/10"
                  title="Next Song"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div />
          </div>
          <div className="absolute right-10 top-24 max-w-[40vw] text-right">
            {isLyricsLoading ? (
              <div className="text-sm text-white/70 flex items-center gap-2 justify-end">
                <span className="inline-block h-2 w-2 rounded-full bg-white/60 animate-pulse" />
                Fetching lyrics...
              </div>
            ) : lyricsLines.length > 0 ? (
              <div>
                    {lyricsLines.slice(activeLine, activeLine + 3).map((line, idx) => (
                      <div
                        key={`${line.time}-${idx}`}
                        className={`text-xl md:text-2xl font-semibold leading-snug ${
                          idx === 0 ? "text-white" : "text-white/60"
                        }`}
                      >
                        {toHinglish(line.text || "…")}
                      </div>
                    ))}
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {toHinglish(
                  lyricsText ||
                    data?.lyrics?.lyrics ||
                    data?.lyrics ||
                    data?.subtitles ||
                    "Lyrics are not available for this track."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isOverlay ? "mb-3 mt-2 pt-10 sm:pt-6" : "mb-3 mt-10"}>
      <div className="grid gap-6 w-full">
        <div className="grid gap-5 w-full px-4 sm:px-6 md:px-10 lg:px-16 sm:flex sm:items-start max-w-4xl mx-auto">
          <div>
            {!data.name ? (
              <Skeleton className="md:w-[130px] aspect-square rounded-2xl md:h-[150px]" />
            ) : (
              <div className="relative">
                <img
                  src={data.image?.[2]?.url}
                  className="sm:h-[150px] h-full aspect-square bg-secondary/50 rounded-2xl sm:w-[200px] w-full sm:mx-0 mx-auto object-cover"
                  alt={decodeHTML(data.name)}
                />
                <img
                  src={data.image?.[2]?.url}
                  className="hidden dark:block absolute top-0 left-0 w-[110%] h-[110%] blur-3xl -z-10 opacity-50"
                  alt=""
                />
              </div>
            )}
          </div>
          {!data.name ? (
            <div className="flex flex-col justify-between w-full">
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-16 mb-4" />
              </div>
              <div>
                <Skeleton className="h-4 w-full rounded-full mb-2" />
                <div className="w-full flex items-center justify-between">
                  <Skeleton className="h-[9px] w-6" />
                  <Skeleton className="h-[9px] w-6" />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between w-full">
              <div className="sm:mt-0 mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold md:max-w-lg">
                    {decodeHTML(data.name)}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    by{" "}
                    <Link
                      href={
                        "/search/" +
                        `${encodeURI(
                          decodeHTML(
                            data.artists?.primary?.[0]?.name?.toLowerCase() || ""
                          ).split(" ").join("+")
                        )}`
                      }
                      className="text-foreground"
                    >
                      {decodeHTML(data.artists?.primary?.[0]?.name || "unknown")}
                    </Link>
                  </p>
                </div>
                <div />
              </div>
              <div className="grid gap-2 w-full mt-5 sm:mt-0">
                <Slider
                  onValueChange={handleSeek}
                  value={[currentTime]}
                  max={duration}
                  className="w-full"
                  trackClassName="h-[3px] hover:h-[4px] transition-all"
                  thumbClassName="h-4 w-4"
                />
                <div className="w-full flex items-center justify-between">
                  <span className="text-sm">{formatTime(currentTime)}</span>
                  <span className="text-sm">{formatTime(duration)}</span>
                </div>
                <div className="flex flex-col items-center gap-4 w-full mt-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handlePrevious}
                      className="rounded-full hover:bg-secondary/80 flex"
                      title="Previous"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => (audioRef.current.currentTime -= 10)}
                      className="rounded-full hover:bg-secondary/80"
                      title="Rewind 10s"
                    >
                      <Rewind className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="default"
                      className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
                      onClick={togglePlayPause}
                    >
                      {playing ? (
                        <IoPause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 fill-current" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => (audioRef.current.currentTime += 10)}
                      className="rounded-full hover:bg-secondary/80"
                      title="Fast Forward 10s"
                    >
                      <FastForward className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (next?.nextData?.id) {
                          if (isOverlay) {
                            setMusic(next.nextData.id);
                          } else {
                            router.push(`/${next.nextData.id}`, { scroll: false });
                          }
                        } else {
                          toast.error("No next song available");
                        }
                      }}
                      className="rounded-full hover:bg-secondary/80 flex"
                      title="Next Song"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={loopSong}
                      className={isLooping ? "text-primary bg-secondary/50" : ""}
                    >
                      {!isLooping ? (
                        <Repeat className="h-4 w-4" />
                      ) : (
                        <Repeat1 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant={!isDownloading ? "ghost" : "secondary"}
                      onClick={downloadSong}
                    >
                      {isDownloading ? (
                        <span className="text-xs font-bold">{downloadProgress}%</span>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-2xl border border-border/60 bg-secondary/20 p-4 sm:p-6">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">Lyrics</h2>
                {isLyricsLoading ? (
                  <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                    Fetching lyrics...
                  </div>
                ) : lyricsLines.length > 0 ? (
                  <div
                    ref={lyricsContainerRef}
                    className="mt-3 max-h-64 sm:max-h-80 overflow-y-auto pr-1"
                  >
                    <div className="py-16">
                      {lyricsLines.map((line, idx) => (
                        <button
                          key={`${line.time}-${idx}`}
                          ref={(el) => {
                            lineRefs.current[idx] = el;
                          }}
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = line.time;
                            }
                          }}
                          className={`text-left w-full py-1 text-sm leading-relaxed transition-colors ${
                            idx === activeLine
                              ? "text-foreground font-semibold"
                              : "text-foreground/60"
                          }`}
                        >
                          {toHinglish(line.text || "…")}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                    {toHinglish(
                      lyricsText ||
                        data?.lyrics?.lyrics ||
                        data?.lyrics ||
                        data?.subtitles ||
                        "Lyrics are not available for this track."
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
