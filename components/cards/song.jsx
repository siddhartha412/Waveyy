"use client";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useContext, useEffect } from "react";
import { MusicContext } from "@/hooks/use-context";
import { IoPlay } from "react-icons/io5";
import { FaFire } from "react-icons/fa";
import { decodeHTML } from "@/lib/decode-html";
import AdaptiveImage from "@/components/ui/adaptive-image";

export default function SongCard({ title, image, artist, id, desc, playCount }) {
    const ids = useContext(MusicContext);
    const safeTitle = decodeHTML(title || "");
    const safeArtist = decodeHTML(artist || "");
    const safeDesc = decodeHTML(desc || "");
    const setLastPlayed = () => {
        localStorage.removeItem("last-played");
        localStorage.setItem("last-played", id);
    };

    const isPopular = playCount && Number(playCount) > 1000000;

    return (
        <div className="h-fit w-[200px]">
            <div className="overflow-hidden rounded-md">
                {image ? (
                    <div className="relative" onClick={() => { ids.setMusic(id); ids.setPlayRequested?.(true); setLastPlayed(); }}>
                        <AdaptiveImage
                            src={image}
                            alt={safeTitle}
                            className="h-[182px] blurz w-full bg-secondary/60 rounded-md transition hover:scale-105 cursor-context-menu"
                        />
                        <div className="cursor-pointer absolute z-10 bottom-2 left-2 bg-background/60 backdrop-blur-md rounded-full h-8 w-8 flex items-center justify-center"><IoPlay className="w-4 h-4 -mr-0.5 dark:fill-white" /></div>
                        {isPopular && (
                            <div className="absolute top-2 right-2 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-sm">
                                <FaFire className="w-3 h-3" />
                                <span>HOT</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <Skeleton className="w-full h-[182px]" />
                )}
            </div>
            <div className="cursor-pointer">
                {title ? (
                    <div onClick={() => { ids.setMusic(id); ids.setPlayRequested?.(true); setLastPlayed(); }} className="mt-3 flex items-center justify-between">
                        <h1 className="text-base truncate w-full" title={safeTitle}>
                            {safeTitle}
                        </h1>
                    </div>
                ) : (
                    <Skeleton className="w-[70%] h-4 mt-2" />
                )}
                {desc && (
                    <p className="text-xs text-muted-foreground">{safeDesc.slice(0, 30)}</p>
                )}
                {artist ? (
                    <p className="text-sm font-light text-muted-foreground truncate w-full" title={safeArtist}>
                        {safeArtist}
                    </p>
                ) : (
                    <Skeleton className="w-10 h-2 mt-2" />
                )}
            </div>
        </div>
    )
}
