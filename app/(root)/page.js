"use client";

import { useEffect, useRef, useState } from "react";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import {
  getSongsById,
  getSongsByQuery,
  getSongsSuggestions,
  getSpotifyRecommendations,
} from "@/lib/fetch";
import { topChartsPublic } from "@/lib/jiosaavn-public";

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

export default function Page() {
  const { playLog, music } = useMusicProvider();
  const { user, loading: authLoading } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [recommendedGenres, setRecommendedGenres] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const recRequestRef = useRef(0);

  useEffect(() => {
    const run = async () => {
      const requestId = ++recRequestRef.current;
      if (!user) {
        setRecommended([]);
        setRecommendedGenres([]);
        setRecLoading(false);
        return;
      }

      setRecLoading(true);

      try {
        const cutoff = Date.now() - FIVE_DAYS_MS;
        const recentEntries = (playLog || []).filter((entry) => entry.playedAt >= cutoff);

        const uniqueRecentIds = [...new Set(recentEntries.map((entry) => entry.id).reverse())].slice(0, 10);

        if (!uniqueRecentIds.length) {
          setRecommended([]);
          setRecommendedGenres([]);
          return;
        }

        const songMetaList = (
          await Promise.all(
            uniqueRecentIds.map(async (songId) => {
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

        const genreCount = new Map();
        for (const song of songMetaList) {
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

        if (collected.length < 20 && songMetaList[0]?.name) {
          try {
            const spotifyRes = await getSpotifyRecommendations({
              name: songMetaList[0].name,
              artist: songMetaList[0].artists?.primary?.[0]?.name || "",
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
        if (requestId === recRequestRef.current) setRecLoading(false);
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
        extractSongs(data, collected, new Set(), 20);
        if (collected.length === 0) throw new Error("No charts data");
        setTrending(collected);
      } catch {
        try {
          const fallback = await getSongsByQuery("Top Hits", 20);
          const fallbackData = await fallback.json();
          setTrending(fallbackData?.data?.results || []);
        } catch {
          setTrending([]);
        }
      } finally {
        setTrendLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen py-10 px-6 md:px-20 lg:px-32">
      {user && (
        <section>
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

      <section className={user ? "mt-12" : "mt-0"}>
        <div>
          <h2 className="text-xl font-semibold">Trending Now</h2>
          <p className="text-sm text-muted-foreground">The tracks everyone is playing right now.</p>
        </div>
        <div className="mt-4">
          <ScrollArea>
            <div className="flex gap-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => <SongCard key={`trend-skel-${i}`} />)
                : trending.length > 0
                  ? trending.map((song) => (
                      <SongCard
                        key={song.id}
                        id={song.id}
                        image={toImage(song)}
                        artist={toArtistLabel(song)}
                        title={song.name}
                        playCount={song.playCount}
                      />
                    ))
                  : Array.from({ length: 6 }).map((_, i) => <SongCard key={`trend-empty-${i}`} />)}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>
    </main>
  );
}
