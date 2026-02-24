"use client";
import { Skeleton } from "../ui/skeleton";
import { useContext, useMemo, useState } from "react";
import { MusicContext, useNextMusicProvider } from "@/hooks/use-context";
import { IoPlay } from "react-icons/io5";
import { FaFire } from "react-icons/fa";
import { decodeHTML } from "@/lib/decode-html";
import AdaptiveImage from "@/components/ui/adaptive-image";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Heart, ListMusic, Music2, Play, Plus, Share2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
    getQueueSongId,
    mapQueueSongToNextData,
    normalizeQueueSong,
} from "@/lib/queue-utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function SongCard({ title, image, artist, id, desc, playCount }) {
    const ids = useContext(MusicContext);
    const next = useNextMusicProvider();
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPoint, setMenuPoint] = useState({ x: 0, y: 0 });
    const isMobile = useMediaQuery("(max-width: 767px)");
    const safeTitle = decodeHTML(title || "");
    const safeArtist = decodeHTML(artist || "");
    const safeDesc = decodeHTML(desc || "");
    const songId = String(id || "");
    const selectablePlaylists = (ids?.playlists || []).filter(
        (playlist) => !ids?.isLikedPlaylist?.(playlist.id)
    );
    const liked = ids?.isSongLiked?.(songId);
    const songPayload = useMemo(
        () => ({
            id,
            name: safeTitle,
            artist: safeArtist,
            image,
            playCount,
        }),
        [id, safeTitle, safeArtist, image, playCount]
    );

    const setLastPlayed = () => {
        if (!songId) return;
        localStorage.removeItem("last-played");
        localStorage.setItem("last-played", songId);
    };

    const playSong = () => {
        if (!songId) return;
        ids?.setMusic?.(songId);
        ids?.setPlayRequested?.(true);
        setLastPlayed();
    };

    const addToQueue = () => {
        const normalizedSong = normalizeQueueSong(songPayload);
        if (!normalizedSong) {
            toast.error("Could not add this song to queue");
            return;
        }

        const currentSongId = String(ids?.music || "");
        let alreadyQueued = false;
        let nextQueue = [];

        ids?.setQueue?.((prev) => {
            if (prev.some((item) => getQueueSongId(item) === songId)) {
                alreadyQueued = true;
                nextQueue = prev;
                return prev;
            }
            nextQueue = [...prev, normalizedSong];
            return nextQueue;
        });

        if (!next?.nextData) {
            const candidate = nextQueue.find((item) => getQueueSongId(item) !== currentSongId);
            if (candidate) {
                next.setNextData(mapQueueSongToNextData(candidate));
            }
        }

        if (alreadyQueued) {
            toast.message("Song already in queue");
            return;
        }
        toast.success("Added to queue");
    };

    const shareSong = async () => {
        if (!songId || typeof window === "undefined") return;
        const normalizedSongId = String(songId).trim().replace(/^\/+/, "");
        const shareUrl = `${window.location.origin}/${normalizedSongId}`;
        const shareText = safeArtist
            ? `Listen to ${safeTitle || "this song"} by ${safeArtist}`
            : `Listen to ${safeTitle || "this song"}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: safeTitle || "Waveyy",
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }
        } catch (error) {
            if (error?.name === "AbortError") return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Share link copied");
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            textArea.style.position = "fixed";
            textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                toast.success("Share link copied");
            } catch {
                toast.error("Could not copy share link");
            } finally {
                document.body.removeChild(textArea);
            }
        }
    };

    const toggleLike = () => {
        if (!user) return;
        ids?.toggleLikedSong?.(songPayload).then(({ liked: nextLiked, error }) => {
            if (error) {
                toast.error(error.message || "Failed to update liked songs");
                return;
            }
            toast.success(nextLiked ? "Added to Liked Songs" : "Removed from Liked Songs");
        });
    };

    const addToPlaylist = (playlistId) => {
        const selected = ids?.playlists?.find((playlist) => playlist.id === playlistId);
        ids?.addSongToPlaylist?.(playlistId, songPayload).then(({ error }) => {
            if (error) {
                toast.error(error.message || "Failed to add song to playlist");
                return;
            }
            toast.success(`Added to ${selected?.name || "playlist"}`);
        });
    };

    const createAndAdd = () => {
        const name = window.prompt("Playlist name");
        if (name === null) return;
        ids?.createPlaylist?.(name).then(({ data: playlist, error }) => {
            if (error || !playlist) {
                toast.error(error?.message || "Failed to create playlist");
                return;
            }
            ids?.addSongToPlaylist?.(playlist.id, songPayload).then(({ error: addError }) => {
                if (addError) {
                    toast.error(addError.message || "Failed to add song to playlist");
                    return;
                }
                toast.success(`Added to ${playlist.name}`);
            });
        });
    };

    const openContextMenu = (event) => {
        if (!songId) return;
        event.preventDefault();
        if (isMobile) {
            setMenuOpen(true);
            return;
        }
        setMenuPoint({ x: event.clientX, y: event.clientY });
        setMenuOpen(true);
    };

    const isPopular = playCount && Number(playCount) > 1000000;

    return (
        <div className="h-fit w-[200px]" onContextMenu={openContextMenu}>
            <div className="overflow-hidden rounded-md">
                {image ? (
                    <div className="relative group" onClick={playSong}>
                        <AdaptiveImage
                            src={image}
                            alt={safeTitle}
                            className="h-[182px] blurz w-full bg-secondary/60 rounded-md transition hover:scale-105 cursor-pointer"
                        />
                        <div className="absolute inset-0 rounded-md bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="pointer-events-none absolute z-10 bottom-2 left-2 bg-background/70 backdrop-blur-md rounded-full h-8 w-8 flex items-center justify-center opacity-0 scale-90 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100">
                            <IoPlay className="w-4 h-4 -mr-0.5 dark:fill-white" />
                        </div>
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
                    <div onClick={playSong} className="mt-3 flex items-center justify-between">
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
            {!isMobile ? (
                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-hidden="true"
                            tabIndex={-1}
                            style={{
                                position: "fixed",
                                left: menuPoint.x,
                                top: menuPoint.y,
                                width: 1,
                                height: 1,
                                opacity: 0,
                                pointerEvents: "none",
                            }}
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6} className="w-56">
                        <DropdownMenuLabel className="truncate">{safeTitle || "Song"}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={playSong}>
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            Play
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={addToQueue}>
                            <ListMusic className="mr-2 h-4 w-4" />
                            Add to Queue
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={shareSong}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </DropdownMenuItem>
                        {user ? (
                            <>
                                <DropdownMenuItem onClick={toggleLike}>
                                    <Heart className="mr-2 h-4 w-4" />
                                    {liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <Music2 className="mr-2 h-4 w-4" />
                                        Add to Playlist
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-56">
                                        {selectablePlaylists.length === 0 ? (
                                            <DropdownMenuItem onClick={createAndAdd}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create playlist
                                            </DropdownMenuItem>
                                        ) : (
                                            <>
                                                {selectablePlaylists.map((playlist) => (
                                                    <DropdownMenuItem
                                                        key={playlist.id}
                                                        onClick={() => addToPlaylist(playlist.id)}
                                                    >
                                                        <Music2 className="mr-2 h-4 w-4" />
                                                        <span className="truncate">{playlist.name}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={createAndAdd}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    New playlist
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </>
                        ) : (
                            <DropdownMenuItem disabled>
                                <Heart className="mr-2 h-4 w-4" />
                                Login to save songs
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                    <DrawerContent className="rounded-t-2xl border-border/70 pb-[max(env(safe-area-inset-bottom),16px)]">
                        <DrawerHeader className="pb-2">
                            <DrawerTitle className="truncate text-left">{safeTitle || "Song"}</DrawerTitle>
                            <p className="text-left text-sm text-muted-foreground truncate">
                                {safeArtist || "unknown"}
                            </p>
                        </DrawerHeader>
                        <div className="px-4 pb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    playSong();
                                    setMenuOpen(false);
                                }}
                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                            >
                                <Play className="h-4 w-4 fill-current" />
                                Play
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    addToQueue();
                                    setMenuOpen(false);
                                }}
                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                            >
                                <ListMusic className="h-4 w-4" />
                                Add to Queue
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await shareSong();
                                    setMenuOpen(false);
                                }}
                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </button>
                            {user ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toggleLike();
                                            setMenuOpen(false);
                                        }}
                                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                                    >
                                        <Heart className="h-4 w-4" />
                                        {liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                                    </button>
                                    <div className="mt-2 border-t border-border/60 pt-2">
                                        <p className="px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                                            Add to Playlist
                                        </p>
                                        {selectablePlaylists.length === 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    createAndAdd();
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create playlist
                                            </button>
                                        ) : (
                                            <>
                                                {selectablePlaylists.map((playlist) => (
                                                    <button
                                                        key={playlist.id}
                                                        type="button"
                                                        onClick={() => {
                                                            addToPlaylist(playlist.id);
                                                            setMenuOpen(false);
                                                        }}
                                                        className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                                                    >
                                                        <Music2 className="h-4 w-4" />
                                                        <span className="truncate">{playlist.name}</span>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        createAndAdd();
                                                        setMenuOpen(false);
                                                    }}
                                                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-secondary/60 flex items-center gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    New playlist
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    Login to save songs
                                </p>
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    )
}
