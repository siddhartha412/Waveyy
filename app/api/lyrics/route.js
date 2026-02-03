import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const track = searchParams.get("track") || "";
  const artist = searchParams.get("artist") || "";
  const album = searchParams.get("album") || "";
  const duration = searchParams.get("duration") || "";

  if (!track || !artist) {
    return NextResponse.json({ error: "Missing track or artist" }, { status: 400 });
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
        return NextResponse.json(data, { status: 200 });
      }
    }

    // Fallback to search for a looser match.
    const searchParams = new URLSearchParams({
      track_name: track,
      artist_name: artist,
    });
    if (album) searchParams.append("album_name", album);

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

    return NextResponse.json(best, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Lyrics fetch failed" }, { status: 500 });
  }
}
