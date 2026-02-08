"use client";
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongsByQuery, searchAlbumByQuery } from "@/lib/fetch";
import { useEffect, useState } from "react";
import Link from "next/link";

const normalizeText = (value = "") =>
    value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const getEditDistance = (a = "", b = "") => {
    const s = normalizeText(a);
    const t = normalizeText(b);
    const dp = Array.from({ length: s.length + 1 }, () => Array(t.length + 1).fill(0));

    for (let i = 0; i <= s.length; i += 1) dp[i][0] = i;
    for (let j = 0; j <= t.length; j += 1) dp[0][j] = j;

    for (let i = 1; i <= s.length; i += 1) {
        for (let j = 1; j <= t.length; j += 1) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[s.length][t.length];
};

const getSimilarity = (a = "", b = "") => {
    const s = normalizeText(a);
    const t = normalizeText(b);
    if (!s || !t) return 0;
    const maxLen = Math.max(s.length, t.length);
    if (!maxLen) return 0;
    const distance = getEditDistance(s, t);
    return 1 - distance / maxLen;
};

const buildQueryVariants = (rawQuery = "") => {
    const normalized = normalizeText(rawQuery);
    const variants = new Set([rawQuery.trim(), normalized]);
    if (normalized.includes("&")) variants.add(normalized.replaceAll("&", "and"));
    if (normalized.includes(" and ")) variants.add(normalized.replaceAll(" and ", " "));
    if (normalized.includes(" ")) variants.add(normalized.replaceAll(" ", ""));
    return [...variants].filter(Boolean);
};

export default function Search({ params }) {
    const query = decodeURI(params.id || "");
    const normalizedQuery = normalizeText(query);
    const queryVariants = buildQueryVariants(query);

    const [artists, setArtists] = useState([]);
    const [songs, setSongs] = useState([]);
    const [albums, setAlbums] = useState([]);

    const getArtistScore = (name = "") => {
        const normalizedName = normalizeText(name);
        const queryWords = normalizedQuery.split(" ").filter(Boolean);
        const nameWords = normalizedName.split(" ").filter(Boolean);
        const intersection = queryWords.filter((word) => nameWords.includes(word)).length;
        const overlapBoost = queryWords.length > 0 ? (intersection / queryWords.length) * 20 : 0;
        const wholeDistance = getEditDistance(normalizedName, normalizedQuery);
        const wholeSimilarity = getSimilarity(normalizedName, normalizedQuery);
        const firstWordDistance = queryWords[0] && nameWords[0]
            ? getEditDistance(queryWords[0], nameWords[0])
            : 99;
        const firstWordSimilarity = queryWords[0] && nameWords[0]
            ? getSimilarity(queryWords[0], nameWords[0])
            : 0;
        const fuzzyTokenMatches = queryWords.filter((word) =>
            nameWords.some((nameWord) => getSimilarity(word, nameWord) >= 0.72)
        ).length;

        if (!normalizedName) return 0;
        if (queryVariants.some((variant) => normalizeText(variant) === normalizedName)) return 100;
        if (queryVariants.some((variant) => normalizedName.startsWith(normalizeText(variant)))) return 85 + overlapBoost;
        if (queryVariants.some((variant) => normalizedName.includes(normalizeText(variant)))) return 65 + overlapBoost;
        if (wholeDistance <= 2 && normalizedQuery.length > 4) return 80;
        if (wholeSimilarity >= 0.72) return 78 + overlapBoost;
        if (firstWordDistance <= 2 && intersection > 0) return 72;
        if (firstWordSimilarity >= 0.72 && (intersection > 0 || fuzzyTokenMatches > 1)) return 70 + overlapBoost;
        if (fuzzyTokenMatches >= Math.max(1, queryWords.length - 1)) return 62 + overlapBoost;
        if (normalizedQuery.includes(normalizedName)) return 45 + overlapBoost;
        if (intersection > 0 || fuzzyTokenMatches > 0) return 40 + overlapBoost;
        return 0;
    };

    const getSongs = async () => {
        const responses = await Promise.all(
            queryVariants.slice(0, 3).map(async (variant) => {
                try {
                    const res = await getSongsByQuery(variant, 20);
                    const data = await res.json();
                    return data?.data?.results || [];
                } catch {
                    return [];
                }
            })
        );

        const results = responses.flat();

        const uniqueSongs = results.filter((song, index, self) =>
            index === self.findIndex((s) => (
                s.id === song.id || (s.name === song.name && s.artists.primary[0]?.name === song.artists.primary[0]?.name)
            ))
        );

        setSongs(uniqueSongs);
        setArtists(uniqueSongs);
    };
    const getAlbum = async () => {
        const responses = await Promise.all(
            queryVariants.slice(0, 2).map(async (variant) => {
                try {
                    const res = await searchAlbumByQuery(variant);
                    const data = await res.json();
                    return data?.data?.results || [];
                } catch {
                    return [];
                }
            })
        );
        const merged = responses.flat();
        const uniqueAlbums = merged.filter((album, index, self) =>
            index === self.findIndex((a) => a.id === album.id)
        );
        setAlbums(uniqueAlbums);
    };
    useEffect(() => {
        getSongs();
        getAlbum();
    }, [params.id, query]);

    const uniqueArtists = [...new Set(artists.map(a => a.artists.primary[0]?.id).filter(Boolean))]
        .map(id => {
            const artistData = artists.find(a => a.artists.primary[0]?.id === id);
            return artistData?.artists?.primary?.[0];
        })
        .filter(Boolean);

    const topArtist = uniqueArtists
        .map((artist) => ({ artist, score: getArtistScore(artist?.name) }))
        .sort((a, b) => b.score - a.score)[0];

    const shouldShowTopArtist = Boolean(topArtist?.artist && topArtist.score >= 50);

    return (
        <div className="py-12 px-6 md:px-20 lg:px-32">
            <div className="grid gap-4">
                <div className="mt-2">
                    <h1 className="text-base">Search Results</h1>
                    <p className="text-xs text-muted-foreground">search results for "{query}"</p>
                </div>

                {shouldShowTopArtist && (
                    <>
                        <div className="mt-3">
                            <h1 className="text-base font-medium">Top Result</h1>
                        </div>
                        <Link
                            href={`/artist/${topArtist.artist.id}`}
                            className="group w-fit flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2 hover:bg-secondary/40 transition-colors"
                        >
                            <img
                                src={topArtist.artist.image?.[2]?.url || `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${topArtist.artist?.name?.charAt(0).toUpperCase() || "U"}`}
                                alt={topArtist.artist.name || "unknown"}
                                className="h-14 w-14 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{topArtist.artist.name || "unknown"}</p>
                                <p className="text-xs text-muted-foreground">Artist</p>
                            </div>
                        </Link>
                    </>
                )}

                <ScrollArea>
                    <div className="flex gap-4">
                        {songs.length ? songs.map((song) => (
                            <SongCard key={song.id} id={song.id} image={song.image[2].url} artist={song.artists.primary[0]?.name || "unknown"} title={song.name} playCount={song.playCount} />
                        )) : (
                            <>
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                            </>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>

                <div className="mt-8">
                    <h1 className="text-base">Related Albums</h1>
                    <p className="text-xs text-muted-foreground">Albums related to "{query}"</p>
                </div>
                <ScrollArea className="whitespace-nowrap pb-4">
                    <div className="flex gap-4">
                        {albums.length ? albums.map((song) => (
                            <AlbumCard key={song.id} lang={song.language} desc={song.description || null} id={`album/${song.id}`} image={song.image[2].url} title={song.name} artist={song.artists.primary[0]?.name || "unknown"} />
                        )) : (
                            <>
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                                <SongCard />
                            </>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>

                <div className="mt-4">
                    <h1 className="text-base font-medium">Related Artists</h1>
                    <p className="text-xs text-muted-foreground">artists related to "{query}"</p>
                </div>
                <ScrollArea>
                    {artists.length > 0 ? (
                        <div className="flex gap-4">
                            {uniqueArtists.map(artistInfo => {
                                const id = artistInfo?.id;
                                return (
                                    <ArtistCard
                                        key={id}
                                        id={id}
                                        image={artistInfo?.image?.[2]?.url || `https://az-avatar.vercel.app/api/avatar/?bgColor=0f0f0f0&fontSize=60&text=${artistInfo?.name?.charAt(0).toUpperCase() || "U"}`}
                                        name={artistInfo?.name || "unknown"}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <div>
                                <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                <Skeleton className="h-3 mt-2 w-10" />
                            </div>
                            <div>
                                <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                <Skeleton className="h-3 mt-2 w-10" />
                            </div>
                            <div>
                                <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                <Skeleton className="h-3 mt-2 w-10" />
                            </div>
                            <div>
                                <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                <Skeleton className="h-3 mt-2 w-10" />
                            </div>
                            <div>
                                <Skeleton className="h-[100px] w-[100px] rounded-2xl" />
                                <Skeleton className="h-3 mt-2 w-10" />
                            </div>
                        </div>
                    )}
                    <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                </ScrollArea>
            </div>
        </div>
    )
}
