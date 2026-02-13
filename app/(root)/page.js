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

export default function Page() {
  const { playLog, music } = useMusicProvider();
  const { user, loading: authLoading } = useAuth();
  const [recommended, setRecommended] = useState([]);
  const [recommendedGenres, setRecommendedGenres] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trending, setTrending] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
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

      {user && (
        <section className="mt-12">
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
