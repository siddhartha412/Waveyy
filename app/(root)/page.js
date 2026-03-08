"use client";

import { useEffect, useRef, useState } from "react";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { getRecentListeningEvents } from "@/lib/listening-events";
import {
  getSongsById,
  getSongsByQuery,
  getSongsSuggestions,
  getSpotifyRecommendations,
} from "@/lib/fetch";
import { topChartsPublic } from "@/lib/jiosaavn-public";
import ArtistCard from "@/components/cards/artist";
import AlbumCard from "@/components/cards/album";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

const extractSongs = (node, out, seen, limit = 20) => {
  if (!node || out.length >= limit) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      if (out.length >= limit) break;
      extractSongs(item, out, seen, limit);
    }
    return;
  }
  if (typeof node !== "object") return;

  const looksLikeSong =
    node &&
    node.id &&
    node.name &&
    node.image &&
    (node.type === "song" || node.downloadUrl || node.duration);

  if (looksLikeSong && !seen.has(node.id)) {
    seen.add(node.id);
    out.push(node);
  }

  for (const value of Object.values(node)) {
    if (out.length >= limit) break;
    extractSongs(value, out, seen, limit);
  }
};

const normalizeTag = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const formatTag = (value) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

const getGenreTags = (song) => {
  const raw = [];

  if (Array.isArray(song?.genres)) raw.push(...song.genres);
  if (typeof song?.genre === "string") raw.push(...song.genre.split(/[|,]/));
  if (song?.language) raw.push(song.language);
  if (song?.album?.language) raw.push(song.album.language);

  return [...new Set(raw.map(normalizeTag).filter(Boolean))];
};

const toArtistLabel = (song) =>
  song.artists?.primary
    ?.map((a) => a?.name)
    .filter(Boolean)
    .join(", ") || "unknown";

const toImage = (song) => song.image?.[2]?.url || song.image?.[1]?.url;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const TRENDING_ARTIST_BLOCKLIST = [
  /top \d+/i,
  /top hit music charts/i,
  /todays hits/i,
  /chart hits allstars/i,
  /summer hit superstars/i,
  /dance hits \d+/i,
  /pop tracks/i,
];

const TRENDING_ALBUM_BLOCKLIST = [
  /big chart/i,
  /massive chart/i,
  /vital pop/i,
  /ultimate noughties/i,
  /top chart/i,
  /chart tunes/i,
  /superstars/i,
  /monsoon bollywood hits/i,
  /bollywood party hits/i,
  /essentials/i,
];

const TRENDING_TITLE_BLOCKLIST = [
  /trending version/i,
  /slowed/i,
  /reverb/i,
  /nightcore/i,
  /8d/i,
];

const getPrimaryArtistNames = (song) =>
  (song?.artists?.primary || []).map((artist) => artist?.name).filter(Boolean);

const isSyntheticTrendingSong = (song) => {
  const artistBlob = normalizeText(getPrimaryArtistNames(song).join(" "));
  const albumName = normalizeText(song?.album?.name || "");
  const title = normalizeText(song?.name || "");

  if (!song?.id || !song?.name || !song?.image) return true;
  if (!artistBlob) return true;

  if (TRENDING_TITLE_BLOCKLIST.some((pattern) => pattern.test(title))) return true;
  if (TRENDING_ARTIST_BLOCKLIST.some((pattern) => pattern.test(artistBlob))) return true;
  if (TRENDING_ALBUM_BLOCKLIST.some((pattern) => pattern.test(albumName))) return true;

  return false;
};

const curateTrendingSongs = (songs = [], limit = 20, existingTrackKeys = new Set()) => {
  const selected = [];
  const seenIds = new Set();
  const seenTracks = new Set(existingTrackKeys);

  const ranked = [...songs].sort(
    (a, b) => (Number(b?.playCount) || 0) - (Number(a?.playCount) || 0)
  );

  for (const song of ranked) {
    if (!song?.id || seenIds.has(song.id)) continue;
    if (isSyntheticTrendingSong(song)) continue;

    const trackKey = normalizeText(song.name);
    if (seenTracks.has(trackKey)) continue;

    seenIds.add(song.id);
    seenTracks.add(trackKey);
    selected.push(song);

    if (selected.length >= limit) break;
  }

  return { songs: selected, trackKeys: seenTracks };
};

const DEFAULT_TRENDING_GRADIENT = "rgb(10, 10, 12)";

const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const fallbackTintFromSong = (song) => {
  const seed = `${song?.id || ""}|${song?.name || ""}|${toArtistLabel(song)}`;
  const hash = hashString(seed);
  const hue = hash % 360;
  const sat = 62 + (hash % 18); // 62-79
  const light = 34 + (hash % 10); // 34-43
  return `hsl(${hue} ${sat}% ${light}%)`;
};

const extractImageTint = (src) =>
  new Promise((resolve) => {
    if (typeof window === "undefined" || !src) {
      resolve(DEFAULT_TRENDING_GRADIENT);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 28;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_TRENDING_GRADIENT);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let samples = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 140) continue;

          const brightness = (r + g + b) / 3;
          if (brightness < 25 || brightness > 235) continue;

          totalR += r;
          totalG += g;
          totalB += b;
          samples += 1;
        }

        if (!samples) {
          resolve(DEFAULT_TRENDING_GRADIENT);
          return;
        }

        const r = Math.min(255, Math.round((totalR / samples) * 0.85));
        const g = Math.min(255, Math.round((totalG / samples) * 0.72));
        const b = Math.min(255, Math.round((totalB / samples) * 0.68));

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch {
        resolve(DEFAULT_TRENDING_GRADIENT);
      }
    };

    img.onerror = () => resolve(DEFAULT_TRENDING_GRADIENT);
    img.src = src;
  });

export default function Page() {
  const { playLog, music } = useMusicProvider();
  const { user, loading: authLoading } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [recommendedGenres, setRecommendedGenres] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendingTint, setTrendingTint] = useState(DEFAULT_TRENDING_GRADIENT);
  const [hoveredTrendingTint, setHoveredTrendingTint] = useState(null);
  const hoverTintCacheRef = useRef(new Map());
  const recRequestRef = useRef(0);

  useEffect(() => {
    const run = async () => {
      const requestId = ++recRequestRef.current;
      if (!user) {
        setRecommended([]);
        setRecommendedGenres([]);
        setRecentlyPlayed([]);
        setRecLoading(false);
        setRecentLoading(false);
        return;
      }

      setRecLoading(true);
      setRecentLoading(true);

      try {
        const cutoff = Date.now() - FIVE_DAYS_MS;
        let recentEntries = [];

        if (user?.id) {
          const { data: dbEvents, error } = await getRecentListeningEvents({
            userId: user.id,
            days: 5,
            limit: 300,
          });
          if (!error && dbEvents.length > 0) {
            recentEntries = dbEvents.map((entry) => ({
              id: entry.song_id,
              playedAt: new Date(entry.played_at).getTime(),
            }));
          }
        }

        if (recentEntries.length === 0) {
          recentEntries = (playLog || []).filter((entry) => entry.playedAt >= cutoff);
        }

        const normalizedRecentEntries = recentEntries
          .map((entry) => ({
            id: entry?.id,
            playedAt: Number(entry?.playedAt) || 0,
          }))
          .filter((entry) => entry.id && entry.playedAt > 0)
          .sort((a, b) => b.playedAt - a.playedAt);

        const recentIdsByTime = [
          ...new Set(normalizedRecentEntries.map((entry) => entry.id)),
        ];
        const uniqueRecentIds = recentIdsByTime.slice(0, 10);

        if (!uniqueRecentIds.length) {
          setRecommended([]);
          setRecommendedGenres([]);
          setRecentlyPlayed([]);
          return;
        }

        const recentSongMetaList = (
          await Promise.all(
            recentIdsByTime.slice(0, 12).map(async (songId) => {
              try {
                const res = await getSongsById(songId);
                if (!res) return null;
                const data = await res.json();
                return data?.data?.[0] || null;
              } catch {
                return null;
              }
            })
          )
        ).filter(Boolean);

        const songMetaMap = new Map(recentSongMetaList.map((song) => [song.id, song]));
        const orderedRecentSongs = recentIdsByTime
          .map((songId) => songMetaMap.get(songId))
          .filter(Boolean)
          .slice(0, 12);

        if (requestId !== recRequestRef.current) return;
        setRecentlyPlayed(orderedRecentSongs);

        const seedSongMeta = uniqueRecentIds
          .map((songId) => songMetaMap.get(songId))
          .filter(Boolean);

        const genreCount = new Map();
        for (const song of seedSongMeta) {
          for (const tag of getGenreTags(song)) {
            genreCount.set(tag, (genreCount.get(tag) || 0) + 1);
          }
        }

        const topGenres = [...genreCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag]) => tag);

        const recentIdSet = new Set(uniqueRecentIds);
        const seen = new Set();
        const collected = [];

        for (const tag of topGenres) {
          try {
            const res = await getSongsByQuery(`${tag} songs`, 12);
            if (!res) continue;
            const data = await res.json();
            const results = data?.data?.results || [];
            for (const song of results) {
              if (!song?.id || seen.has(song.id) || recentIdSet.has(song.id)) continue;
              seen.add(song.id);
              collected.push(song);
              if (collected.length >= 20) break;
            }
          } catch {
            // Continue to fallback if a query fails.
          }
          if (collected.length >= 20) break;
        }

        if (collected.length < 20 && seedSongMeta[0]?.name) {
          try {
            const spotifyRes = await getSpotifyRecommendations({
              name: seedSongMeta[0].name,
              artist: seedSongMeta[0].artists?.primary?.[0]?.name || "",
              limit: 12,
            });
            const spotifyData = await spotifyRes.json();
            for (const song of spotifyData?.data || []) {
              if (!song?.id || seen.has(song.id) || recentIdSet.has(song.id)) continue;
              seen.add(song.id);
              collected.push(song);
              if (collected.length >= 20) break;
            }
          } catch {
            // Ignore and continue to next fallback.
          }
        }

        if (collected.length === 0 && uniqueRecentIds[0]) {
          try {
            const fallbackRes = await getSongsSuggestions(uniqueRecentIds[0]);
            const fallbackData = await fallbackRes.json();
            for (const song of fallbackData?.data || []) {
              if (!song?.id || seen.has(song.id) || recentIdSet.has(song.id)) continue;
              seen.add(song.id);
              collected.push(song);
              if (collected.length >= 20) break;
            }
          } catch {
            // Keep empty state.
          }
        }

        if (requestId !== recRequestRef.current) return;

        setRecommended(collected);
        setRecommendedGenres(topGenres.map(formatTag));
      } finally {
        if (requestId === recRequestRef.current) {
          setRecLoading(false);
          setRecentLoading(false);
        }
      }
    };

    if (authLoading) return;
    run();
  }, [authLoading, music, playLog, user]);

  useEffect(() => {
    const run = async () => {
      setTrendLoading(true);
      try {
        const res = await topChartsPublic();
        if (!res.ok) throw new Error("Top charts failed");
        const data = await res.json();
        const collected = [];
        extractSongs(data, collected, new Set(), 120);

        let { songs: cleanedTrending, trackKeys } = curateTrendingSongs(collected, 20);

        if (cleanedTrending.length < 20) {
          const fallbackSources = [
            { query: "arijit singh hits", max: 5 },
            { query: "bollywood hits", max: 5 },
            { query: "punjabi hits", max: 5 },
            { query: "latest tamil hits", max: 5 },
            { query: "telugu hits", max: 5 },
          ];

          for (const source of fallbackSources) {
            if (cleanedTrending.length >= 20) break;
            try {
              const fallbackRes = await getSongsByQuery(source.query, 20);
              const fallbackData = await fallbackRes.json();
              const fallbackSongs = fallbackData?.data?.results || [];
              const picked = curateTrendingSongs(
                fallbackSongs,
                Math.min(source.max, 20 - cleanedTrending.length),
                trackKeys
              );
              cleanedTrending = [...cleanedTrending, ...picked.songs];
              trackKeys = picked.trackKeys;
            } catch {
              // Ignore query failure and continue with next fallback.
            }
          }
        }

        if (cleanedTrending.length === 0) throw new Error("No clean charts data");
        
        const popArt = [];
        const seenArt = new Set();
        const popAlb = [];
        const seenAlb = new Set();
        for (const s of cleanedTrending) {
          for (const a of s.artists?.primary || []) {
            if (a?.id && !seenArt.has(a.id)) {
              seenArt.add(a.id);
              popArt.push({ id: a.id, name: a.name, image: a.image?.[2]?.url || a.image?.[1]?.url || a.image?.[0]?.url || s.image?.[2]?.url });
            }
          }
          if (s.album?.id && !seenAlb.has(s.album.id)) {
            seenAlb.add(s.album.id);
            popAlb.push({ id: s.album.id, name: s.album.name, artist: s.artists?.primary?.[0]?.name || "", image: s.image?.[2]?.url || s.image?.[1]?.url || s.image?.[0]?.url });
          }
        }
        
        setPopularArtists(popArt.slice(0, 12));
        setPopularAlbums(popAlb.slice(0, 12));
        setTrending(cleanedTrending);


      } catch {
        try {
          const fallback = await getSongsByQuery("Top Hits", 20);
          const fallbackData = await fallback.json();
          const cleanedFallback = curateTrendingSongs(fallbackData?.data?.results || [], 20);
          setTrending(cleanedFallback.songs);
        } catch {
          setTrending([]);
        }
      } finally {
        setTrendLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    if (trendLoading) {
      setTrendingTint("rgb(0, 0, 0)");
      return;
    }

    const firstTrendingSong = trending[0];
    if (!firstTrendingSong) {
      setTrendingTint(DEFAULT_TRENDING_GRADIENT);
      return;
    }

    let active = true;
    const cover = toImage(firstTrendingSong) || firstTrendingSong?.image?.[0]?.url;
    extractImageTint(cover).then((color) => {
      if (active) setTrendingTint(color);
    });

    return () => {
      active = false;
    };
  }, [trending, trendLoading]);

  const handleTrendingHover = async (song) => {
    const songId = String(song?.id || "");
    if (!songId) return;

    const cached = hoverTintCacheRef.current.get(songId);
    if (cached) {
      setHoveredTrendingTint(cached);
      return;
    }

    // Immediate visible hover tint, even when image sampling is blocked by CORS.
    const instantTint = fallbackTintFromSong(song);
    setHoveredTrendingTint(instantTint);

    const cover = toImage(song) || song?.image?.[0]?.url;
    const color = await extractImageTint(cover);
    const finalColor =
      color && color !== DEFAULT_TRENDING_GRADIENT ? color : instantTint;
    hoverTintCacheRef.current.set(songId, finalColor);
    setHoveredTrendingTint(finalColor);
  };

  const clearTrendingHover = () => setHoveredTrendingTint(null);

  const mainLayoutClass = user
    ? "min-h-screen pt-4 pb-10 px-6 md:px-20 lg:px-32"
    : "min-h-screen pt-0 pb-10 px-0";
  const trendingSectionClass = user
    ? "mt-12 relative -mx-6 px-6 py-4 md:-mx-20 md:px-20 lg:-mx-32 lg:px-32"
    : "mt-2 relative w-full pt-5 pb-3";
  const trendingInnerClass = user ? "relative z-10" : "relative z-10 px-5 md:px-7 lg:px-8";
  const trendingGradientClass = user
    ? "pointer-events-none absolute inset-x-0 top-0 h-52 hidden sm:block"
    : "pointer-events-none absolute left-0 right-0 top-0 h-52 lg:-left-8 hidden sm:block";
  const activeTrendingTint = hoveredTrendingTint || trendingTint;
  const hasHoverTint = Boolean(hoveredTrendingTint);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const navTint = trendLoading ? "rgb(16, 16, 20)" : activeTrendingTint;
    root.style.setProperty("--waveyy-nav-tint", navTint);
  }, [activeTrendingTint, trendLoading]);

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      document.documentElement.style.removeProperty("--waveyy-nav-tint");
    };
  }, []);

  return (
    <main className={`${mainLayoutClass} relative`}>
      {/* Global Top Gradient Background */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] sm:h-[600px] z-0 opacity-40 transition-colors duration-500 ease-in-out"
        style={{
          background: trendLoading
            ? "transparent"
            : `linear-gradient(180deg, ${activeTrendingTint} 0%, rgba(0,0,0,0) 100%)`,
        }}
        aria-hidden="true"
      />
      
      {user && (
        <section className="relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Made for You</h1>
              <p className="text-sm text-muted-foreground">
                {recommendedGenres.length
                  ? `Based on your last 5 days: ${recommendedGenres.join(", ")}`
                  : "Personalized picks from your last 5 days of listening."}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ScrollArea>
              <div className="flex gap-4">
                {recLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SongCard key={`rec-skel-${i}`} />)
                  : recommended.length > 0
                    ? recommended.map((song) => (
                        <SongCard
                          key={song.id}
                          id={song.id}
                          image={toImage(song)}
                          artist={toArtistLabel(song)}
                          title={song.name}
                          playCount={song.playCount}
                        />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => <SongCard key={`rec-empty-${i}`} />)}
              </div>
              <ScrollBar orientation="horizontal" className="hidden sm:flex" />
            </ScrollArea>
          </div>
        </section>
      )}

      {user && (
        <section className="mt-12 relative z-10">
          <div>
            <h2 className="text-xl font-semibold">Recently Played</h2>
            <p className="text-sm text-muted-foreground">From your account activity.</p>
          </div>
          <div className="mt-4">
            <ScrollArea>
              <div className="flex gap-4">
                {recentLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SongCard key={`recent-skel-${i}`} />)
                  : recentlyPlayed.length > 0
                    ? recentlyPlayed.map((song) => (
                        <SongCard
                          key={song.id}
                          id={song.id}
                          image={toImage(song)}
                          artist={toArtistLabel(song)}
                          title={song.name}
                          playCount={song.playCount}
                        />
                      ))
                    : Array.from({ length: 6 }).map((_, i) => <SongCard key={`recent-empty-${i}`} />)}
              </div>
              <ScrollBar orientation="horizontal" className="hidden sm:flex" />
            </ScrollArea>
          </div>
        </section>
      )}

      <section className={trendingSectionClass}>
        <div className={`${trendingInnerClass} flex items-end gap-3`}>
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.08] tracking-tight text-white">
              Trending Now
            </h2>
            <p className="mt-1 text-sm sm:text-base text-white/75">
              The tracks everyone is playing right now.
            </p>
          </div>
        </div>
        <div
          className={`${trendingInnerClass} mt-4`}
          id="trending-cards"
          onMouseLeave={clearTrendingHover}
        >
          <ScrollArea>
            <div className="flex gap-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => <SongCard key={`trend-skel-${i}`} />)
                : trending.length > 0
                  ? trending.map((song) => (
                      <div key={song.id} onMouseEnter={() => handleTrendingHover(song)}>
                        <SongCard
                          id={song.id}
                          image={toImage(song)}
                          artist={toArtistLabel(song)}
                          title={song.name}
                          playCount={song.playCount}
                        />
                      </div>
                    ))
                  : Array.from({ length: 6 }).map((_, i) => <SongCard key={`trend-empty-${i}`} />)}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>

      {/* Popular Artists */}
      <section className={trendingSectionClass}>
        <div className={`${trendingInnerClass} flex items-center justify-between`}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Popular artists</h2>
          <span className="text-sm font-medium text-white/60 hover:text-white cursor-pointer transition">Show all</span>
        </div>
        <div
          className={`${trendingInnerClass} mt-4`}
          id="trending-cards"
          onMouseLeave={clearTrendingHover}
        >
          <ScrollArea>
            <div className="flex gap-4 pb-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={`paramusic-skel-${i}`} className="shrink-0 space-y-3">
                      <div className="h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full bg-secondary animate-pulse" />
                      <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                      <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
                    </div>
                  ))
                : popularArtists.map((artist, idx) => (
                    <div key={idx} className="shrink-0 flex-none bg-transparent" onMouseEnter={() => handleTrendingHover({ id: artist.id, name: artist.name, image: [{ url: artist.image }] })}>
                      <ArtistCard
                        id={artist.id}
                        name={artist.name}
                        image={artist.image}
                      />
                    </div>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>

      {/* Popular Albums */}
      <section className={trendingSectionClass}>
        <div className={`${trendingInnerClass} flex items-center justify-between`}>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Popular albums and singles</h2>
          <span className="text-sm font-medium text-white/60 hover:text-white cursor-pointer transition">Show all</span>
        </div>
        <div
          className={`${trendingInnerClass} mt-4`}
          id="trending-cards"
          onMouseLeave={clearTrendingHover}
        >
          <ScrollArea>
            <div className="flex gap-4 pb-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={`paramusic-al-skel-${i}`} className="shrink-0 space-y-2 w-[160px] sm:w-[200px]">
                      <div className="h-[160px] sm:h-[200px] w-full bg-secondary rounded-md animate-pulse" />
                      <div className="h-4 w-[70%] bg-secondary rounded animate-pulse mt-2" />
                      <div className="h-3 w-10 bg-secondary rounded animate-pulse" />
                    </div>
                  ))
                : popularAlbums.map((album, idx) => (
                    <div key={idx} className="shrink-0 flex-none w-[160px] sm:w-[200px]" onMouseEnter={() => handleTrendingHover({ id: album.id, name: album.name, image: [{ url: album.image }] })}>
                      <AlbumCard
                        id={album.id}
                        title={album.name}
                        artist={album.artist}
                        image={album.image}
                      />
                    </div>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>

    </main>
  );
}
