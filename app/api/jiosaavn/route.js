import { NextResponse } from "next/server";
import { getCachedJson, setCachedJson } from "@/lib/redis-server";

const JIOSAAVN_TOP_CHARTS_TTL_SECONDS = 60 * 5; // 5 minutes
const JIOSAAVN_DEFAULT_TTL_SECONDS = 60 * 2; // 2 minutes

const ALLOWED_PATHS = new Set([
  "searchSongs",
  "topCharts",
  "albumDetails",
  "artistDetails",
  "recommendedSongs",
]);

const hasMeaningfulPayload = (data) => {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (Array.isArray(data?.data)) return data.data.length > 0;
  if (Array.isArray(data?.data?.results)) return data.data.results.length > 0;
  if (Array.isArray(data?.results)) return data.results.length > 0;
  if (Array.isArray(data?.songs)) return data.songs.length > 0;
  return true;
};

const buildBaseCandidates = () => {
  const bases = [];
  const addBase = (value) => {
    if (!value) return;
    let base = value.trim();
    base = base.replace(/^['"]|['"]$/g, "");
    if (!base) return;
    if (!base.startsWith("http")) base = `https://${base}`;
    bases.push(base.replace(/\/+$/, ""));
    if (!base.includes("/api")) {
      bases.push(base.replace(/\/+$/, "") + "/api");
    }
  };

  addBase(process.env.NEXT_PUBLIC_API_URL);
  addBase(process.env.API_URL);
  addBase("https://jiosavaanapi-tan.vercel.app/api");
  addBase("https://saavn.me");
  addBase("https://saavn.dev");
  addBase("https://jiosaavn-api.vercel.app");

  return [...new Set(bases)];
};

const buildUrl = (base, path, params) => {
  const query = params.toString();
  return `${base.replace(/\/+$/, "")}/${path}${query ? `?${query}` : ""}`;
};

const extractSongs = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.songs)) return payload.data.songs;
  if (Array.isArray(payload?.songs)) return payload.songs;
  if (Array.isArray(payload?.data)) return payload.data;
  return Array.isArray(payload) ? payload : [];
};

const asTopChartsPayload = (payload) => {
  const songs = extractSongs(payload);
  if (!songs.length) return payload;

  return {
    success: true,
    data: {
      topCharts: songs,
      charts: songs,
      results: songs,
      trending: { songs },
    },
    source: payload,
  };
};

const buildTargets = (path, incomingParams, base) => {
  const params = new URLSearchParams(incomingParams);
  params.delete("path");

  if (path === "searchSongs") {
    const query = params.get("query") || params.get("q") || "";
    params.delete("q");
    if (query && !params.get("query")) params.set("query", query);
    return [buildUrl(base, "search/songs", params)];
  }

  if (path === "topCharts") {
    return [
      buildUrl(base, "modules", new URLSearchParams({ language: "hindi" })),
      buildUrl(base, "search/songs", new URLSearchParams({ query: "top charts" })),
      buildUrl(base, "search/songs", new URLSearchParams({ query: "trending songs" })),
    ];
  }

  if (path === "albumDetails") {
    const albumId = params.get("albumId") || params.get("id") || "";
    const albumParams = new URLSearchParams();
    if (albumId) albumParams.set("id", albumId);
    return [buildUrl(base, "albums", albumParams)];
  }

  if (path === "artistDetails") {
    const artistId = params.get("artistId") || params.get("id") || "";
    const artistParams = new URLSearchParams();
    if (artistId) artistParams.set("id", artistId);
    return [buildUrl(base, "artists", artistParams)];
  }

  if (path === "recommendedSongs") {
    const songId = params.get("songId") || params.get("id") || "";
    const recParams = new URLSearchParams();
    if (songId) recParams.set("id", songId);
    const urls = [buildUrl(base, "songs/recommendations", recParams)];
    if (songId) {
      urls.unshift(buildUrl(base, `songs/${songId}/suggestions`, new URLSearchParams()));
    }
    return urls;
  }

  return [];
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";
  const rawParams = searchParams.toString();
  const cacheKey = `jiosaavn:${path}:${rawParams}`.toLowerCase();
  if (!ALLOWED_PATHS.has(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { status: 200 });
  }

  try {
    const bases = buildBaseCandidates();
    let lastStatus = 500;
    let lastError = "Upstream error";

    for (const base of bases) {
      const targets = buildTargets(path, searchParams, base);

      for (const url of targets) {
        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "User-Agent": "MusicHub/1.0",
          },
        });
        if (!res.ok) {
          lastStatus = res.status;
          lastError = `Upstream status ${res.status}`;
          continue;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          lastStatus = 502;
          lastError = "Unexpected response type from upstream";
          continue;
        }

        let data;
        try {
          data = await res.json();
        } catch {
          lastStatus = 502;
          lastError = "Invalid JSON from upstream";
          continue;
        }

        const responseData = path === "topCharts" ? asTopChartsPayload(data) : data;
        if (hasMeaningfulPayload(responseData)) {
          const ttl =
            path === "topCharts"
              ? JIOSAAVN_TOP_CHARTS_TTL_SECONDS
              : JIOSAAVN_DEFAULT_TTL_SECONDS;
          await setCachedJson(cacheKey, responseData, ttl);
        }
        return NextResponse.json(responseData, { status: 200 });
      }
    }

    if (path === "topCharts") {
      return NextResponse.json(
        {
          success: true,
          data: {
            topCharts: [],
            charts: [],
            results: [],
            trending: { songs: [] },
          },
          warning: lastError,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: lastError }, { status: lastStatus });
  } catch (e) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
