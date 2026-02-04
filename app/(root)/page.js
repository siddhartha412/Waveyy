"use client"
import AlbumCard from "@/components/cards/album";
import ArtistCard from "@/components/cards/artist";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { searchSongsPublic } from "@/lib/jiosaavn-public";
import { useEffect, useState } from "react";

export default function Page() {
  const [sections, setSections] = useState({
    trending: [],
    newReleases: [],
    topHits: [],
    hotPlaylists: [],
    nowPlaying: [],
    editorsPicks: [],
    staffCurated: [],
  });
  const [featuredAlbums, setFeaturedAlbums] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);

  const unwrapSongs = (payload) => {
    if (!payload) return [];
    if (payload?.data?.results) return payload.data.results;
    if (payload?.results) return payload.results;
    if (payload?.data?.songs) return payload.data.songs;
    if (payload?.songs) return payload.songs;
    if (Array.isArray(payload?.data)) return payload.data;
    return Array.isArray(payload) ? payload : [];
  };

  const normalizeSong = (song) => {
    const image =
      song?.image?.[2]?.url ||
      song?.image?.[2] ||
      song?.image?.[1]?.url ||
      song?.image?.[1] ||
      song?.image?.[0]?.url ||
      song?.image?.[0] ||
      song?.image ||
      null;
    const artist =
      song?.artists?.primary?.[0]?.name ||
      song?.primaryArtists ||
      song?.artist ||
      song?.subtitle ||
      "unknown";
    const albumName =
      song?.album?.name || song?.album || song?.albumName || song?.album_title || "";
    const albumId = song?.album?.id || song?.albumId || song?.album_id || "";
    return {
      id: song?.id || song?.songid || song?.songId,
      name: song?.name || song?.title || song?.song || song?.songName || "Unknown",
      image,
      artist,
      albumName,
      albumId,
      raw: song,
    };
  };

  const uniqueBy = (items, keyFn) => {
    const seen = new Set();
    const out = [];
    for (const item of items) {
      const key = keyFn(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  };

  const fetchSection = async (key, query) => {
    try {
      const res = await searchSongsPublic(query);
      const payload = await res.json();
      const songs = unwrapSongs(payload).map(normalizeSong).filter((s) => s.id && s.image);
      setSections((prev) => ({ ...prev, [key]: songs }));
      return songs;
    } catch {
      setSections((prev) => ({ ...prev, [key]: [] }));
      return [];
    }
  };

  const buildFeaturedAlbums = (songs) => {
    const albums = uniqueBy(
      songs
        .filter((s) => s.albumName && s.albumId)
        .map((s) => ({
          id: s.albumId || `${s.albumName}-${s.artist}`,
          name: s.albumName,
          artist: s.artist,
          image: s.image,
          language: s.raw?.language || s.raw?.lang || "",
        })),
      (a) => a.id
    );
    setFeaturedAlbums(albums.slice(0, 12));
  };

  const buildPopularArtists = (songs) => {
    const artists = uniqueBy(
      songs.map((s) => ({
        id: s.raw?.artists?.primary?.[0]?.id || s.raw?.primaryArtistsId || s.artist,
        name: s.artist,
        image:
          s.raw?.artists?.primary?.[0]?.image?.[2]?.url ||
          s.raw?.artists?.primary?.[0]?.image?.[1]?.url ||
          s.raw?.artists?.primary?.[0]?.image?.[0]?.url ||
          s.image,
      })),
      (a) => a.id
    );
    setPopularArtists(artists.slice(0, 12));
  };

  useEffect(() => {
    const load = async () => {
      const trending = await fetchSection("trending", "trending");
      const topHits = await fetchSection("topHits", "top hits");
      fetchSection("newReleases", "new releases");
      fetchSection("hotPlaylists", "hot playlists");
      fetchSection("nowPlaying", "now playing");
      fetchSection("editorsPicks", "editor picks");
      fetchSection("staffCurated", "staff picks");
      fetchSection("genrePop", "pop");
      fetchSection("genreRock", "rock");
      fetchSection("genreHipHop", "hip hop");

      // Featured albums and popular artists derived from popular sections
      buildFeaturedAlbums(topHits.length ? topHits : trending);
      buildPopularArtists(trending.length ? trending : topHits);
    };

    load();
  }, []);

  return (
    <main className="px-6 py-5 md:px-20 lg:px-32">
      <div>
        <div className="grid">
          <h1 className="text-base">Trending Tracks</h1>
          <p className="text-xs text-muted-foreground">
            Songs trending globally or regionally right now.
          </p>
        </div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {sections.trending.length
              ? sections.trending.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <div className="grid">
          <h1 className="text-base">New Releases</h1>
          <p className="text-xs text-muted-foreground">
            Newly released tracks, albums, or playlists.
          </p>
        </div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {sections.newReleases.length
              ? sections.newReleases.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <div className="grid">
          <h1 className="text-base">Top Hits</h1>
          <p className="text-xs text-muted-foreground">
            The most popular songs right now.
          </p>
        </div>
        <ScrollArea className="rounded-md mt-4">
          <div className="flex gap-4">
            {sections.topHits.length
              ? sections.topHits.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Featured Albums</h1>
        <p className="text-xs text-muted-foreground">
          Albums getting the most attention right now.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {featuredAlbums.length
              ? featuredAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    lang={album.language}
                    image={album.image}
                    album={album.name}
                    title={album.name}
                    artist={album.artist}
                    id={`album/${album.id}`}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Hot Playlists</h1>
        <p className="text-xs text-muted-foreground">
          Playlists trending across moods and moments.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {sections.hotPlaylists.length
              ? sections.hotPlaylists.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Now Playing</h1>
        <p className="text-xs text-muted-foreground">
          What people are listening to right now.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {sections.nowPlaying.length
              ? sections.nowPlaying.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Popular Artists</h1>
        <p className="text-xs text-muted-foreground">
          Artists everyone is talking about.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {popularArtists.length
              ? popularArtists.map((artist) => (
                  <ArtistCard
                    key={artist.id}
                    id={artist.id}
                    image={artist.image}
                    name={artist.name}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid gap-2">
                    <Skeleton className="h-[100px] w-[100px] rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Genre Highlights</h1>
        <p className="text-xs text-muted-foreground">
          Popular and recent songs by genre.
        </p>
        <div className="mt-6 grid gap-8">
          {[
            { key: "genrePop", title: "Pop" },
            { key: "genreRock", title: "Rock" },
            { key: "genreHipHop", title: "Hip-Hop" },
          ].map((genre) => (
            <div key={genre.key}>
              <h2 className="text-sm font-semibold">{genre.title}</h2>
              <ScrollArea className="rounded-md mt-4">
                <div className="flex gap-4">
                  {(sections[genre.key] || []).length
                    ? (sections[genre.key] || []).map((song) => (
                        <SongCard
                          key={`${genre.key}-${song.id}`}
                          image={song.image}
                          title={song.name}
                          artist={song.artist}
                          id={song.id}
                        />
                      ))
                    : Array.from({ length: 8 }).map((_, i) => <SongCard key={i} />)}
                </div>
                <ScrollBar orientation="horizontal" className="hidden sm:flex" />
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Editor’s Picks</h1>
        <p className="text-xs text-muted-foreground">
          Curated recommendations from our editors.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {sections.editorsPicks.length
              ? sections.editorsPicks.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>

      <div className="mt-12">
        <h1 className="text-base">Staff Curated</h1>
        <p className="text-xs text-muted-foreground">
          Weekly picks from the team.
        </p>
        <ScrollArea className="rounded-md mt-6">
          <div className="flex gap-4">
            {sections.staffCurated.length
              ? sections.staffCurated.map((song) => (
                  <SongCard
                    key={song.id}
                    image={song.image}
                    title={song.name}
                    artist={song.artist}
                    id={song.id}
                  />
                ))
              : Array.from({ length: 10 }).map((_, i) => <SongCard key={i} />)}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
      </div>
    </main>
  )
}
