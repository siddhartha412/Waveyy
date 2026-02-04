"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongsById } from "@/lib/fetch";
import { getLyrics } from "@/lib/lyrics-client";
import { useMusicProvider } from "@/hooks/use-context";

const decodeHTML = (str = "") => {
  if (typeof str !== "string") return str;
  if (typeof window === "undefined") return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
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

export default function SidebarPlayer() {
  const { music, currentTime, audioRef } = useMusicProvider();
  const [song, setSong] = useState(null);
  const [lyricsLines, setLyricsLines] = useState([]);
  const [lyricsText, setLyricsText] = useState("");
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);

  const activeLine = useMemo(() => {
    if (!lyricsLines.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsLines.length; i += 1) {
      if (currentTime >= lyricsLines[i].time) idx = i;
      else break;
    }
    return idx;
  }, [lyricsLines, currentTime]);

  const containerRef = useRef(null);
  const lineRefs = useRef([]);

  useEffect(() => {
    if (!music) {
      setSong(null);
      setLyricsLines([]);
      setLyricsText("");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getSongsById(music);
        const json = await res.json();
        const s = json?.data?.[0] || null;
        if (!cancelled) setSong(s);
      } catch {
        if (!cancelled) setSong(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [music]);

  useEffect(() => {
    if (!song?.name) return;
    let cancelled = false;
    (async () => {
      setIsLyricsLoading(true);
      try {
        const payload = await getLyrics(song);
        const synced = payload?.synced || "";
        const plain = payload?.plain || "";
        const parsed = synced ? parseLrc(synced) : [];
        if (!cancelled) {
          setLyricsLines(parsed);
          setLyricsText(plain || synced || "");
        }
      } finally {
        if (!cancelled) setIsLyricsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [song?.name]);

  useEffect(() => {
    if (activeLine < 0) return;
    const container = containerRef.current;
    const el = lineRefs.current[activeLine];
    if (!container || !el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset =
      elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
    container.scrollBy({ top: offset, behavior: "auto" });
  }, [activeLine]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-5 border-b border-border/60">
        {song ? (
          <div className="flex items-center gap-4">
            <img
              src={song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url}
              alt=""
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{decodeHTML(song.name)}</div>
              <div className="text-sm text-muted-foreground truncate">
                {decodeHTML(song.artists?.primary?.[0]?.name || "unknown")}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-5 overflow-hidden">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Lyrics
        </div>
        {!music ? (
          <div className="mt-4 text-sm text-muted-foreground">
            Pick a song to see lyrics here.
          </div>
        ) : isLyricsLoading ? (
          <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
            Fetching lyrics...
          </div>
        ) : lyricsLines.length > 0 ? (
          <div ref={containerRef} className="mt-4 h-full overflow-y-auto pr-2">
            <div className="py-20">
              {lyricsLines.map((line, idx) => (
                <button
                  key={`${line.time}-${idx}`}
                  ref={(el) => {
                    lineRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = line.time;
                  }}
                  className={`block w-full text-left py-1.5 text-sm leading-relaxed transition-colors ${
                    idx === activeLine
                      ? "text-foreground font-semibold"
                      : "text-foreground/60"
                  }`}
                >
                  {line.text || "…"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-foreground/80 whitespace-pre-line">
            {lyricsText || "Lyrics are not available for this track."}
          </div>
        )}
      </div>
    </div>
  );
}
