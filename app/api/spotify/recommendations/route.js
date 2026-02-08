import { NextResponse } from "next/server";
import { getCachedJson, setCachedJson } from "@/lib/redis-server";

const SPOTIFY_REC_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

let cachedToken = null;
let tokenExpiresAt = 0;

const getSpotifyAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Spotify token");
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
};

const getOriginFromRequest = (req) => {
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return host ? `${proto}://${host}` : "";
};

const searchJioSaavn = async (origin, query) => {
  if (!origin) return null;
  const params = new URLSearchParams({ path: "searchSongs", q: query });
  const res = await fetch(`${origin}/api/jiosaavn?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") || "";
    const artist = searchParams.get("artist") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 20);
    const cacheKey = `spotify:rec:${name}:${artist}:${limit}`.toLowerCase();

    if (!name) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const cached = await getCachedJson(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { status: 200 });
    }

    const token = await getSpotifyAccessToken();
    const searchQuery = `track:${name}${artist ? ` artist:${artist}` : ""}`;

    const searchRes = await fetch(
      `${SPOTIFY_API_BASE}/search?type=track&limit=1&q=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!searchRes.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const searchData = await searchRes.json();
    const seedTrackId = searchData?.tracks?.items?.[0]?.id;

    if (!seedTrackId) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const recRes = await fetch(
      `${SPOTIFY_API_BASE}/recommendations?limit=${limit}&seed_tracks=${seedTrackId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!recRes.ok) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const recData = await recRes.json();
    const tracks = recData?.tracks || [];

    if (!tracks.length) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const origin = getOriginFromRequest(req);
    const results = [];
    const seen = new Set();

    for (const track of tracks) {
      const q = `${track.name} ${track.artists?.[0]?.name || ""}`.trim();
      if (!q) continue;
      const saavn = await searchJioSaavn(origin, q);
      const first = saavn?.data?.results?.[0];
      if (first && !seen.has(first.id)) {
        seen.add(first.id);
        results.push(first);
      }
    }

    const payload = { data: results };
    if (results.length > 0) {
      await setCachedJson(cacheKey, payload, SPOTIFY_REC_CACHE_TTL_SECONDS);
    }
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json({ data: [], error: "Spotify recommendations failed" }, { status: 200 });
  }
}
