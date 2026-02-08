import { NextResponse } from "next/server";
import { getCachedJson, setCachedJson } from "@/lib/redis-server";

const LYRICS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const track = searchParams.get("track") || "";
  const artist = searchParams.get("artist") || "";
  const album = searchParams.get("album") || "";
  const duration = searchParams.get("duration") || "";
  const cacheKey = `lyrics:${track}:${artist}:${album}:${duration}`.toLowerCase();

  if (!track || !artist) {
    return NextResponse.json({ error: "Missing track or artist" }, { status: 400 });
  }

  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  try {
    const baseUrl = "https://lrclib.net/api";
    const headers = { "User-Agent": "MusicHub/1.0" };

    // Try strict match via /get when we have enough metadata.
    if (album && duration) {
      const getParams = new URLSearchParams({
        track_name: track,
        artist_name: artist,
        album_name: album,
        duration,
      });
      const getRes = await fetch(`${baseUrl}/get?${getParams.toString()}`, {
        cache: "no-store",
        headers,
      });
      if (getRes.ok) {
        const data = await getRes.json();
        if (data?.syncedLyrics || data?.plainLyrics) {
          await setCachedJson(cacheKey, data, LYRICS_CACHE_TTL_SECONDS);
        }
        return NextResponse.json(data, { status: 200 });
      }
    }

    // Fallback to search for a looser match.
    const searchParams = new URLSearchParams({
      track_name: track,
      artist_name: artist,
    });
    // Removing album_name from fallback search to find more results (often album names mismatch)
    // if (album) searchParams.append("album_name", album);

    const searchRes = await fetch(`${baseUrl}/search?${searchParams.toString()}`, {
      cache: "no-store",
      headers,
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: "Lyrics not found" }, { status: searchRes.status });
    }

    const results = await searchRes.json();
    const best =
      (Array.isArray(results) && results.find((r) => r.syncedLyrics)) ||
      (Array.isArray(results) && results[0]) ||
      null;

    if (!best) {
      return NextResponse.json({ error: "Lyrics not found" }, { status: 404 });
    }

    if (best?.syncedLyrics || best?.plainLyrics) {
      await setCachedJson(cacheKey, best, LYRICS_CACHE_TTL_SECONDS);
    }
    return NextResponse.json(best, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Lyrics fetch failed" }, { status: 500 });
  }
}
