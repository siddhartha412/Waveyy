"use client";

import AlbumCard from "@/components/cards/album";
import Next from "@/components/cards/next";
import SongCard from "@/components/cards/song";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusicProvider, useNextMusicProvider } from "@/hooks/use-context";
import { getSongsById, getSongsSuggestions, getSpotifyRecommendations } from "@/lib/fetch";
import { useEffect, useRef, useState } from "react";

export default function Recomandation({ id }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const recRequestRef = useRef(0);
  const next = useNextMusicProvider();
  const { setQueue } = useMusicProvider();

  useEffect(() => {
    const getData = async () => {
      const requestId = ++recRequestRef.current;
      if (data.length === 0) setLoading(true); // Only show loading skeletons if no data exists
      try {
        let recData = null;
        let songMeta = null;
        if (id) {
          const songRes = await getSongsById(id);
          const songJson = await songRes.json();
          songMeta = songJson?.data?.[0] || null;
        }
        if (songMeta?.name) {
          const spotifyRes = await getSpotifyRecommendations({
            name: songMeta.name,
            artist: songMeta.artists?.primary?.[0]?.name || "",
            limit: 12,
          });
          recData = await spotifyRes.json();
        }
        if (!recData || !recData.data || recData.data.length === 0) {
          const res = await getSongsSuggestions(id);
          recData = await res.json();
        }
        if (requestId !== recRequestRef.current) return;

        if (recData && recData.data.length > 0) {
          setData(recData.data);
          setQueue(recData.data); // Set the full recommendation list as the queue
          let d = recData.data[0]; // Always pick the first one for stability
          next.setNextData({
            id: d.id,
            name: d.name,
            artist: d.artists.primary[0]?.name || "unknown",
            album: d.album?.name || "unknown",
            image: d.image[1].url,
          });
        } else {
          setData(false);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    setData([]); // Clear old data to show skeletons
    getData();
  }, [id]);
  return (
    <section className="py-10 px-6 md:px-20 lg:px-32">
      <div>
        <h1 className="text-base font-medium">Recomandation</h1>
        <p className="text-xs text-muted-foreground">You might like this</p>
      </div>
      <div className="rounded-md mt-6">
        {!loading && data && (
          <div className="grid sm:grid-cols-2 gap-3 overflow-hidden">
            {data.map((song) => (
              <Next
                next={false}
                key={song.id}
                image={song.image[2].url}
                name={song.name}
                artist={song.artists.primary[0]?.name || "unknown"}
                id={song.id}
              />
            ))}
          </div>
        )}
        {loading && (
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        )}
      </div>
      {!loading && !data && (
        <div className="flex items-center justify-center border text-center h-[100px]">
          <p className="text-sm text-muted-foreground">
            No recomandation for this song.
          </p>
        </div>
      )}
    </section>
  );
}
