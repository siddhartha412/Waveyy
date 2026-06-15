"use client";

import { useMusicProvider } from "@/hooks/use-context";
import { decodeHTML } from "@/lib/decode-html";
import { IoPlay } from "react-icons/io5";

export default function ArtistFeaturedCard({ song, artistName }) {
  const { setMusic, setPlayRequested } = useMusicProvider();

  if (!song) return null;

  const songImage =
    song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url;

  const songName = decodeHTML(song.name || "");
  const year = song.year || song.releaseDate?.slice(0, 4) || "";

  const playSong = () => {
    if (!song.id) return;
    setMusic(song.id);
    setPlayRequested(true);
  };

  return (
    <div className="w-[300px] min-w-0 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-secondary/20 shadow-xl">
      {/* Top cover */}
      <div
        className="relative h-[230px] flex items-center justify-center"
        style={{
          backgroundImage: songImage ? `url(${songImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />

        {songImage && (
          <img
            src={songImage}
            alt={songName}
            className="relative z-10 h-[125px] w-[125px] rounded-lg object-cover shadow-2xl border border-white/10"
          />
        )}
      </div>

      {/* Bottom text area */}
      <div className="bg-[#0f0f10] px-5 py-4">
        <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
          Latest Release
        </span>

        <h3 className="truncate text-[16px] font-bold leading-tight text-white">
          {songName}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-[13px] text-muted-foreground flex-1">
            {artistName}
            {year ? ` • ${year}` : ""}
          </p>

          <button
            type="button"
            onClick={playSong}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors shrink-0"
          >
            <div className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors">
              <IoPlay className="w-3 h-3 dark:fill-white ml-0.5" />
            </div>
            <span className="text-[13px] font-medium">Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}
