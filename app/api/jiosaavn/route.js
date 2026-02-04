import { NextResponse } from "next/server";

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
  if (!ALLOWED_PATHS.has(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
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
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json({ error: "Upstream error" }, { status: lastStatus });
  } catch (e) {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
