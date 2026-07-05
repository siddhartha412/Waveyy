"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Player from "@/components/cards/player";
import Footer from "@/components/page/footer";
import Header from "@/components/page/header";
import SidebarNav from "@/components/page/sidebar-nav";
import MobileBottomNav from "@/components/page/mobile-bottom-nav";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

const getSongKey = (song) => {
  const title = normalizeText(song?.name || song?.title || "");
  const artist = normalizeText(
    (song?.artists?.primary || []).map((a) => a?.name).filter(Boolean).join(" ") || "",
  );
  return `${title}||${artist}`;
};

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

  if (TRENDING_TITLE_BLOCKLIST.some((pattern) => pattern.test(title)))
    return true;
  if (TRENDING_ARTIST_BLOCKLIST.some((pattern) => pattern.test(artistBlob)))
    return true;
  if (TRENDING_ALBUM_BLOCKLIST.some((pattern) => pattern.test(albumName)))
    return true;

  return false;
};

const curateTrendingSongs = (
  songs = [],
  limit = 20,
  existingTrackKeys = new Set(),
) => {
  const selected = [];
  const seenIds = new Set();
  const seenTracks = new Set(existingTrackKeys);

  const ranked = [...songs].sort(
    (a, b) => (Number(b?.playCount) || 0) - (Number(a?.playCount) || 0),
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
  const [popularArtists, setPopularArtists] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
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
          recentEntries = (playLog || []).filter(
            (entry) => entry.playedAt >= cutoff,
          );
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
            }),
          )
        ).filter(Boolean);

        const songMetaMap = new Map(
          recentSongMetaList.map((song) => [song.id, song]),
        );
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
        const seenTitleArtist = new Set();
        const collected = [];

        for (const tag of topGenres) {
          try {
            const res = await getSongsByQuery(`${tag} songs`, 12);
            if (!res) continue;
            const data = await res.json();
            const results = data?.data?.results || [];
            for (const song of results) {
              const key = getSongKey(song);
              if (
                !song?.id ||
                seen.has(song.id) ||
                recentIdSet.has(song.id) ||
                seenTitleArtist.has(key)
              )
                continue;
              seen.add(song.id);
              seenTitleArtist.add(key);
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
              const key = getSongKey(song);
              if (
                !song?.id ||
                seen.has(song.id) ||
                recentIdSet.has(song.id) ||
                seenTitleArtist.has(key)
              )
                continue;
              seen.add(song.id);
              seenTitleArtist.add(key);
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
              const key = getSongKey(song);
              if (
                !song?.id ||
                seen.has(song.id) ||
                recentIdSet.has(song.id) ||
                seenTitleArtist.has(key)
              )
                continue;
              seen.add(song.id);
              seenTitleArtist.add(key);
              collected.push(song);
              if (collected.length >= 20) break;
            }
          } catch {
            // Keep empty state.
          }
        }

        const genericFallbackQueries = [
          "Top Hits",
          "Popular Songs",
          "Bollywood Hits",
          "Indie Pop",
          "Dance Hits",
          "Trending Now",
        ];

        for (const query of genericFallbackQueries) {
          if (collected.length >= 20) break;
          try {
            const res = await getSongsByQuery(query, 12);
            if (!res) continue;
            const data = await res.json();
            const results = data?.data?.results || [];
            for (const song of results) {
              const key = getSongKey(song);
              if (
                !song?.id ||
                seen.has(song.id) ||
                recentIdSet.has(song.id) ||
                seenTitleArtist.has(key)
              )
                continue;
              seen.add(song.id);
              seenTitleArtist.add(key);
              collected.push(song);
              if (collected.length >= 20) break;
            }
          } catch {
            // Ignore generic fallback failures.
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

        let { songs: cleanedTrending, trackKeys } = curateTrendingSongs(
          collected,
          20,
        );

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
                trackKeys,
              );
              cleanedTrending = [...cleanedTrending, ...picked.songs];
              trackKeys = picked.trackKeys;
            } catch {
              // Ignore query failure and continue with next fallback.
            }
          }
        }

        if (cleanedTrending.length === 0)
          throw new Error("No clean charts data");

        const popArt = [];
        const seenArt = new Set();
        const popAlb = [];
        const seenAlb = new Set();
        for (const s of cleanedTrending) {
          for (const a of s.artists?.primary || []) {
            if (a?.id && !seenArt.has(a.id)) {
              seenArt.add(a.id);
              popArt.push({
                id: a.id,
                name: a.name,
                image:
                  a.image?.[2]?.url ||
                  a.image?.[1]?.url ||
                  a.image?.[0]?.url ||
                  s.image?.[2]?.url,
              });
            }
          }
          if (s.album?.id && !seenAlb.has(s.album.id)) {
            seenAlb.add(s.album.id);
            popAlb.push({
              id: s.album.id,
              name: s.album.name,
              artist: s.artists?.primary?.[0]?.name || "",
              image:
                s.image?.[2]?.url || s.image?.[1]?.url || s.image?.[0]?.url,
            });
          }
        }

        setPopularArtists(popArt.slice(0, 12));
        setPopularAlbums(popAlb.slice(0, 12));
        setTrending(cleanedTrending);
      } catch {
        try {
          const fallback = await getSongsByQuery("Top Hits", 20);
          const fallbackData = await fallback.json();
          const cleanedFallback = curateTrendingSongs(
            fallbackData?.data?.results || [],
            20,
          );
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

  const mainLayoutClass = user
    ? "min-h-screen pt-4 pb-10 px-0"
    : "min-h-screen pt-0 pb-10 px-0";
  const trendingSectionClass =
    "relative z-10 isolate mt-[30px] pt-5 pb-3 overflow-hidden rounded-2xl border border-border/60 bg-secondary/20 backdrop-blur-sm ml-2 mr-4";
  const trendingInnerClass = "relative z-10 px-5 md:px-7 lg:px-8";


  return (
    <main className={`${mainLayoutClass} relative`}>

      {user && (recLoading || recommended.length > 0) && (
        <section className={trendingSectionClass}>
          <div className={trendingInnerClass}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold leading-[1.08] tracking-tight text-white">
                  Made for You
                </h1>
              </div>
            </div>

            <div className="mt-6">
              <ScrollArea>
                <div className="flex gap-4 pb-4">
                  {recLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <SongCard key={`rec-skel-${i}`} />
                      ))
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
                      : null}
                </div>
                <ScrollBar orientation="horizontal" className="hidden sm:flex" />
              </ScrollArea>
            </div>
          </div>
        </section>
      )}

      {(user && (recentLoading || recentlyPlayed.length > 0)) && (
        <section className={trendingSectionClass}>
          <div className={trendingInnerClass}>
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold leading-[1.08] tracking-tight text-white">
                Recently Played
              </h2>
              <p className="mt-1 text-sm sm:text-base text-white/75">
                From your account activity.
              </p>
            </div>
            <div className="mt-4">
              {recentLoading ? (
                <ScrollArea>
                  <div className="flex gap-4 pb-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <SongCard key={`recent-skel-${i}`} />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>
              ) : recentlyPlayed.length > 0 ? (
                <ScrollArea>
                  <div className="flex gap-4 pb-4">
                    {recentlyPlayed.map((song) => (
                      <SongCard
                        key={song.id}
                        id={song.id}
                        image={toImage(song)}
                        artist={toArtistLabel(song)}
                        title={song.name}
                        playCount={song.playCount}
                      />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>
              ) : null}
            </div>
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
        >
          <ScrollArea>
            <div className="flex gap-4 pb-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SongCard key={`trend-skel-${i}`} />
                  ))
                : trending.length > 0
                  ? trending.map((song, idx) => (
                      <SongCard
                        key={song.id}
                        id={song.id}
                        image={toImage(song)}
                        artist={toArtistLabel(song)}
                        title={song.name}
                        playCount={song.playCount}
                        priority={idx < 4}
                      />
                    ))
                  : Array.from({ length: 6 }).map((_, i) => (
                      <SongCard key={`trend-empty-${i}`} />
                    ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>

      <section className={trendingSectionClass}>
        <div
          className={`${trendingInnerClass} flex items-center justify-between`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Popular artists
          </h2>
          <span className="text-sm font-medium text-white/60 hover:text-white cursor-pointer transition">
            Show all
          </span>
        </div>
        <div
          className={`${trendingInnerClass} mt-4`}
          id="trending-cards"
        >
          <ScrollArea>
            <div className="flex gap-4 pb-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`paramusic-skel-${i}`}
                      className="shrink-0 space-y-3"
                    >
                      <div className="h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full bg-secondary animate-pulse" />
                      <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                      <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
                    </div>
                  ))
                : popularArtists.map((artist, idx) => (
                    <div
                      key={idx}
                      className="shrink-0 flex-none rounded-xl"
                    >
                      <ArtistCard
                        id={artist.id}
                        name={artist.name}
                        image={artist.image}
                        priority={idx < 4}
                      />
                    </div>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
          </ScrollArea>
        </div>
      </section>

      <section className={trendingSectionClass}>
        <div
          className={`${trendingInnerClass} flex items-center justify-between`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Popular albums and singles
          </h2>
          <span className="text-sm font-medium text-white/60 hover:text-white cursor-pointer transition">
            Show all
          </span>
        </div>
        <div
          className={`${trendingInnerClass} mt-4`}
          id="trending-cards"
        >
          <ScrollArea>
            <div className="flex gap-4 pb-4">
              {trendLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={`paramusic-al-skel-${i}`}
                      className="shrink-0 space-y-2 w-[160px] sm:w-[200px]"
                    >
                      <div className="h-[160px] sm:h-[200px] w-full bg-secondary rounded-md animate-pulse" />
                      <div className="h-4 w-[70%] bg-secondary rounded animate-pulse mt-2" />
                      <div className="h-3 w-10 bg-secondary rounded animate-pulse" />
                    </div>
                  ))
                : popularAlbums.map((album, idx) => (
                    <div
                      key={idx}
                      className="shrink-0 flex-none w-[160px] sm:w-[200px] rounded-xl"
                    >
                      <AlbumCard
                        id={album.id}
                        title={album.name}
                        artist={album.artist}
                        image={album.image}
                        priority={idx < 4}
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
