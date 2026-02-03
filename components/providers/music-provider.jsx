"use client";
import { MusicContext } from "@/hooks/use-context";
import { useEffect, useRef, useState } from "react";

export default function MusicProvider({ children }) {
  const [music, setMusic] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("last-played") || null;
    }
    return null;
  });
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("song-history");
      return saved ? JSON.parse(saved) : [];
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
    if (music) localStorage.setItem("last-played", music);
  }, [music]);

  useEffect(() => {
    if (!music) setPlayerOpen(false);
  }, [music]);

  useEffect(() => {
    localStorage.setItem("song-history", JSON.stringify(history.slice(-50)));
  }, [history]);

  return (
    <MusicContext.Provider
      value={{
        music,
        setMusic,
        current,
        setCurrent,
        history,
        setHistory,
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
