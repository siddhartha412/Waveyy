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

const PATH_MAP = {
  searchSongs: "search/songs",
  albumDetails: "albums",
  artistDetails: "artists",
  recommendedSongs: "songs/recommendations",
  topCharts: "modules",
};

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
    if (!base) return;
    if (!base.startsWith("http")) base = `https://${base}`;
    bases.push(base.replace(/\/+$/, ""));
    if (!base.includes("/api")) {
      bases.push(base.replace(/\/+$/, "") + "/api");
    }
  };

  addBase(process.env.NEXT_PUBLIC_API_URL);
  addBase("https://saavn.me");
  addBase("https://saavn.dev");
  addBase("https://jiosaavn-api.vercel.app");

  return [...new Set(bases)];
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

  const params = new URLSearchParams(searchParams);
  params.delete("path");
  if (path === "searchSongs") {
    const q = params.get("q");
    if (q && !params.get("query")) params.set("query", q);
  }

  const mappedPath = PATH_MAP[path] || path;

  try {
    const bases = buildBaseCandidates();
    let lastStatus = 500;

    for (const base of bases) {
      const url = `${base}/${mappedPath}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "MusicHub/1.0",
        },
      });
      if (!res.ok) {
        lastStatus = res.status;
        continue;
      }
      const data = await res.json();
      if (hasMeaningfulPayload(data)) {
        const ttl =
          path === "topCharts"
            ? JIOSAAVN_TOP_CHARTS_TTL_SECONDS
            : JIOSAAVN_DEFAULT_TTL_SECONDS;
        await setCachedJson(cacheKey, data, ttl);
      }
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json({ error: "Upstream error" }, { status: lastStatus });
  } catch (e) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
