"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SearchIcon, Music, X } from "lucide-react";
import { getSongsByQuery } from "@/lib/fetch";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { useMusicProvider } from "@/hooks/use-context";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Search() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();
    const containerRef = useRef(null);
    const { setMusic, setPlayerOpen, setPlayRequested, playerOpen } = useMusicProvider();
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await getSongsByQuery(query);
                const data = await res.json();
                if (data?.data?.results) {
                    setResults(data.data.results.slice(0, 8)); // Top 8 results
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query) {
            setIsFocused(false);
            router.push("/search/" + encodeURIComponent(query));
        }
    };

    const handleResultClick = (id) => {
        setIsFocused(false);
        setQuery("");
        setMusic(id);
        setPlayerOpen(true);
        setPlayRequested(true);
    };

    // Hide search only when the player is fullscreen (mobile/tablet).
    if (playerOpen && !isDesktop) {
        return null;
    }

    return (
        <div ref={containerRef} className="relative z-[110] w-full max-w-md mx-auto">
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
                    onFocus={() => setIsFocused(true)}
                    autoComplete="off"
                    type="search"
                    className="rounded-full bg-secondary/30 border-secondary/50 focus:bg-secondary/50 focus:ring-1 focus:ring-primary/30 transition-all h-10 pl-4 pr-10"
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

            {/* Dropdown Results */}
            {isFocused && (query.length > 0 || isLoading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-2">
                                    <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                            ))
                        ) : results.length > 0 ? (
                            results.map((song) => (
                                <button
                                    key={song.id}
                                    onClick={() => handleResultClick(song.id)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded-xl transition-all text-left"
                                >
                                    <div className="relative h-10 w-10 shrink-0">
                                        <img
                                            src={song.image?.[1]?.url || song.image?.[0]?.url}
                                            className="h-full w-full rounded-md object-cover"
                                            alt=""
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{song.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {song.artists?.primary?.[0]?.name}
                                        </p>
                                    </div>
                                    <Music className="h-3 w-3 text-muted-foreground/50 mr-2" />
                                </button>
                            ))
                        ) : query.length >= 2 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-4 text-center px-4">
                                <p className="text-xs text-muted-foreground">Type at least 2 characters to search...</p>
                            </div>
                        )}

                        {results.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                className="w-full py-2 mt-1 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg border-t border-border/50 transition-colors"
                            >
                                Show all results for "{query}"
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
