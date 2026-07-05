"use client";
import { useEffect, useRef } from "react";

export default function useMediaSession({ song, playing, togglePlayPause, handleNext, handlePrevious, seekToTime }) {
  const handlersRef = useRef({ togglePlayPause, handleNext, handlePrevious, seekToTime });

  useEffect(() => {
    handlersRef.current = { togglePlayPause, handleNext, handlePrevious, seekToTime };
  }, [togglePlayPause, handleNext, handlePrevious, seekToTime]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (song?.name) {
      const imageUrl = song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url || "";
      const primaryArtists = (song.artists?.primary || []).map((a) => a?.name).filter(Boolean);
      const artistLabel = primaryArtists.join(", ") || "unknown";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || "",
        artist: artistLabel,
        album: song.album?.name || song.name || "",
        artwork: imageUrl
          ? [
              { src: imageUrl, sizes: "300x300", type: "image/jpeg" },
              { src: imageUrl, sizes: "600x600", type: "image/jpeg" },
            ]
          : [],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [song]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const setHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    };

    setHandler("play", () => handlersRef.current.togglePlayPause());
    setHandler("pause", () => handlersRef.current.togglePlayPause());
    setHandler("previoustrack", () => handlersRef.current.handlePrevious());
    setHandler("nexttrack", () => handlersRef.current.handleNext());

    setHandler("seekbackward", (details) => {
      const skip = details.seekOffset || 10;
      const audio = document.querySelector("audio");
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - skip);
    });

    setHandler("seekforward", (details) => {
      const skip = details.seekOffset || 10;
      const audio = document.querySelector("audio");
      if (audio) audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + skip);
    });

    setHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in (document.querySelector("audio") || {})) {
        document.querySelector("audio")?.fastSeek(details.seekTime);
        return;
      }
      handlersRef.current.seekToTime(details.seekTime);
    });

    return () => {
      ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"].forEach(
        (action) => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch {}
        }
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);
}
