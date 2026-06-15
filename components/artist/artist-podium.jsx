"use client";

import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { requireAuthToPlay } from "@/lib/auth-gate";
import { decodeHTML } from "@/lib/decode-html";
import { formatPlayCount } from "@/lib/utils";
import { IoPlay } from "react-icons/io5";

export default function ArtistPodium({ songs }) {
    const { setMusic, setPlayRequested } = useMusicProvider();
    const { user } = useAuth();

    const playSong = (songId) => {
        if (!songId) return;
        if (!requireAuthToPlay(user)) return;
        setMusic(songId);
        setPlayRequested(true);
    };

    const podium = [
        { idx: 1, song: songs[1], h: "h-20", img: "h-16 w-16 sm:h-20 sm:w-20", badge: "bg-slate-300 text-slate-800" },
        { idx: 0, song: songs[0], h: "h-28", img: "h-20 w-20 sm:h-24 sm:w-24", badge: "bg-amber-400 text-amber-900" },
        { idx: 2, song: songs[2], h: "h-14", img: "h-14 w-14 sm:h-16 sm:w-16", badge: "bg-orange-300 text-orange-900" },
    ];

    return (
        <div className="flex-1 rounded-2xl border border-border/60 bg-secondary/20 p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-6">Popular</h2>
            <div className="flex-1 flex items-end justify-center gap-5 px-4">
                {podium.map(({ idx, song, h, img, badge }) => (
                    <div key={song.id} className="flex flex-col items-center flex-1 max-w-[200px]">
                        <div
                            className="relative mb-2 cursor-pointer group"
                            onClick={() => playSong(song.id)}
                        >
                            <img
                                src={song.image?.[2]?.url || song.image?.[1]?.url}
                                alt={song.name}
                                className={`${img} rounded-full object-cover border-2 border-border/60 transition-transform duration-200 group-hover:scale-105`}
                            />
                            <span className={`absolute -bottom-1 -right-1 ${badge} text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md`}>
                                #{idx + 1}
                            </span>
                            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <IoPlay className="w-6 h-6 dark:fill-white" />
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-white text-center truncate w-full mb-1">
                            {(() => { const n = decodeHTML(song.name); return n.length > 15 ? n.slice(0, 15) + "..." : n; })()}
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                            {song.playCount ? `${formatPlayCount(song.playCount)} streams` : ""}
                        </p>
                        <div className={`${h} w-full mt-2 bg-secondary/40 rounded-t-lg`} />
                    </div>
                ))}
            </div>
        </div>
    );
}
