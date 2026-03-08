"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SearchIcon, Music, X } from "lucide-react";
import { getSongsByQuery } from "@/lib/fetch";
import { decodeHTML } from "@/lib/decode-html";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Search() {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const { setPlayerOpen, playerOpen } = useMusicProvider();
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) return;

        const timer = setTimeout(() => {
            router.push("/search/" + encodeURIComponent(trimmed));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, router]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push("/search/" + encodeURIComponent(query.trim()));
        }
    };

    // Hide search only when the player is fullscreen (mobile/tablet).
    if (playerOpen && !isDesktop) {
        return null;
    }

    return (
        <div className="relative z-[110] w-full">
            <form onSubmit={handleSubmit} className="flex items-center relative w-full">
                <Button
                    variant="ghost"
                    type="submit"
                    size="icon"
                    className="absolute right-1 h-8 w-8 rounded-full hover:bg-secondary transition-colors"
                >
                    <SearchIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    type="search"
                    className="rounded-full bg-transparent border-transparent h-10 pl-4 pr-10 transition-all outline-none focus:bg-background/10 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    name="query"
                    placeholder="Search for songs, artists..."
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setQuery("")}
                        className="absolute right-10 h-6 w-6 rounded-full hover:bg-secondary/80 p-0"
                    >
                        <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                )}
            </form>
        </div>
    );
}
