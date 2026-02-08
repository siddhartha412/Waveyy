// Client-side lyrics helper with IndexedDB + localStorage caching.
// Uses our same-origin /api/lyrics proxy to avoid CORS issues.

import { decodeHTML } from "@/lib/decode-html";

const LYRICS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

const LYRICS_TEXT_FIXES = [
  // Common OCR/transliteration glitches seen in fetched romanized lyrics.
  [/\baashikli\b/gi, "aashiki"],
  [/\baashikii\b/gi, "aashiki"],
  [/\bbhil\b/gi, "bhi"],
  [/\bbhii\b/gi, "bhi"],
  [/\bmeraa\b/gi, "mera"],
  [/\bjindagii\b/gi, "jindagi"],
];

const sanitizeLyricsText = (text = "") => {
  if (!text || typeof text !== "string") return "";
  let out = text;
  for (const [pattern, replacement] of LYRICS_TEXT_FIXES) {
    out = out.replace(pattern, replacement);
  }
  return out;
};

const sanitizeLyricsPayload = (payload) => ({
  synced: sanitizeLyricsText(payload?.synced || ""),
  plain: sanitizeLyricsText(payload?.plain || ""),
});

export const makeLyricsCacheKey = (songData) => {
  const name = decodeHTML(songData?.name || "");
  const artist = decodeHTML(songData?.artists?.primary?.[0]?.name || "");
  const album = decodeHTML(songData?.album?.name || "");
  const duration = songData?.duration || "";
  return `lyrics:${name}:${artist}:${album}:${duration}`.toLowerCase();
};

const openLyricsDB = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open("lyrics-cache", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("lyrics")) {
        db.createObjectStore("lyrics");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const idbGet = async (key) => {
  const db = await openLyricsDB();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("lyrics", "readonly");
    const store = tx.objectStore("lyrics");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

const idbSet = async (key, value) => {
  const db = await openLyricsDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction("lyrics", "readwrite");
    const store = tx.objectStore("lyrics");
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getCachedLyrics = async (cacheKey) => {
  // Prefer IndexedDB on mobile.
  try {
    const cachedIdb = await idbGet(cacheKey);
    if (cachedIdb?.ts && Date.now() - cachedIdb.ts < LYRICS_CACHE_TTL_MS) {
      return cachedIdb;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached?.ts && Date.now() - cached.ts < LYRICS_CACHE_TTL_MS) {
      return cached;
    }
  } catch {
    // ignore
  }

  return null;
};

export const setCachedLyrics = async (cacheKey, payload) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    }
  } catch {
    // ignore
  }
  try {
    await idbSet(cacheKey, payload);
  } catch {
    // ignore
  }
};

export const fetchLyricsFromApi = async (songData) => {
  const track = decodeHTML(songData?.name || "");
  const artist = decodeHTML(songData?.artists?.primary?.[0]?.name || "");
  if (!track || !artist) return null;

  const params = new URLSearchParams({ track, artist });
  if (songData?.album?.name) {
    params.append("album", decodeHTML(songData.album.name));
  }
  if (songData?.duration) params.append("duration", String(songData.duration));

  const res = await fetch(`/api/lyrics?${params.toString()}`);
  if (!res.ok) return null;
  const json = await res.json();
  return sanitizeLyricsPayload({
    synced: json?.syncedLyrics || "",
    plain: json?.plainLyrics || "",
  });
};

export const getLyrics = async (songData) => {
  const cacheKey = makeLyricsCacheKey(songData);
  const cached = await getCachedLyrics(cacheKey);
  if (cached) return { ...cached, ...sanitizeLyricsPayload(cached) };

  const fetched = await fetchLyricsFromApi(songData);
  if (!fetched) return null;

  const payload = {
    ts: Date.now(),
    ...sanitizeLyricsPayload({ synced: fetched.synced, plain: fetched.plain }),
  };
  await setCachedLyrics(cacheKey, payload);
  return payload;
};
