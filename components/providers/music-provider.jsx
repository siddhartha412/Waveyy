"use client";
import { MusicContext } from "@/hooks/use-context";
import { useEffect, useRef, useState } from "react";

export default function MusicProvider({ children }) {
  const [music, setMusic] = useState(null);
  const previousMusicRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("song-history");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [playLog, setPlayLog] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("song-play-log");
      if (!saved) return [];
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((entry) => entry && typeof entry.id === "string")
          .map((entry) => ({
            id: entry.id,
            playedAt: Number(entry.playedAt) || Date.now(),
          }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [queue, setQueue] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("last-played");
    }
  }, []);

  useEffect(() => {
    if (!music) setPlayerOpen(false);
  }, [music]);

  useEffect(() => {
    localStorage.setItem("song-history", JSON.stringify(history.slice(-50)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("song-play-log", JSON.stringify(playLog.slice(-300)));
  }, [playLog]);

  useEffect(() => {
    if (!music || previousMusicRef.current === music) return;
    previousMusicRef.current = music;
    setPlayLog((prev) => {
      const next = [...prev, { id: music, playedAt: Date.now() }];
      return next.slice(-300);
    });
  }, [music]);

  return (
    <MusicContext.Provider
      value={{
        music,
        setMusic,
        current,
        setCurrent,
        history,
        setHistory,
        playLog,
        setPlayLog,
        queue,
        setQueue,
        downloadProgress,
        setDownloadProgress,
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
