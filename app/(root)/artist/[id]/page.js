import { getArtistById } from "@/lib/fetch";
import SongCard from "@/components/cards/song";
import AlbumCard from "@/components/cards/album";
import AdaptiveImage from "@/components/ui/adaptive-image";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ArtistProfileCard from "@/components/artist/artist-profile-card";
import ArtistFeaturedCard from "@/components/artist/artist-featured-card";
import ArtistPodium from "@/components/artist/artist-podium";
import { formatPlayCount } from "@/lib/utils";

export default async function ArtistPage({ params }) {
    const { id } = await params;
    const res = await getArtistById(id);
    const json = await res.json();
    const data = json.data;

    if (!data) return <div className="text-center py-20">Artist not found</div>;

    const artistImage = data.image?.[2]?.url;
    const uniqueTopSongs = data.topSongs
        ? [...new Map(data.topSongs.map(s => [s.id, s])).values()]
        : [];
    console.log("[ArtistPage] uniqueTopSongs[0]:", uniqueTopSongs[0]);
    const podiumSongs = uniqueTopSongs.slice(0, 3);
    const remainingSongs = uniqueTopSongs.slice(3);

    const latestRelease = uniqueTopSongs.length > 0
        ? [...uniqueTopSongs].sort((a, b) => {
            const dateA = a.releaseDate || `${a.year}-12-31`;
            const dateB = b.releaseDate || `${b.year}-12-31`;
            return new Date(dateB) - new Date(dateA);
        })[0]
        : null;

    const cardClass = "-ml-4 md:-ml-20 lg:-ml-32 mr-4 rounded-2xl border border-border/60 bg-secondary/20 p-6";

    return (
        <div className="pb-24 md:pb-10">
            {/* ===== MOBILE ONLY: Banner + stacked profile ===== */}
            <div className="md:hidden">
                <div className="relative w-full h-[250px] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                        style={{ backgroundImage: `url(${artistImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="px-4 -mt-16 relative z-10">
                    <div className={`${cardClass} flex flex-col items-center text-center`}>
                        <AdaptiveImage
                            src={artistImage}
                            alt={data.name}
                            className="h-[140px] w-[140px] rounded-full shadow-2xl object-cover border-4 border-background shrink-0"
                        />
                        <div className="flex items-center gap-2 mb-1 mt-3">
                            <h1 className="text-2xl font-black tracking-tight">{data.name}</h1>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                            {Number(data.followerCount) > 0 && (
                                <span className="flex items-center gap-1">
                                    {formatPlayCount(data.followerCount)} Followers
                                </span>
                            )}
                            {Number(data.followerCount) > 0 && <span>•</span>}
                            <span>{data.dominantLanguage} {data.dominantType}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== DESKTOP: Profile + Featured + Popular row ===== */}
            <div className="hidden md:flex gap-4 mt-7 ml-2 mr-4">
                <ArtistProfileCard
                    artistImage={artistImage}
                    name={data.name}
                    isVerified={data.isVerified}
                    followerCount={data.followerCount}
                    dominantLanguage={data.dominantLanguage}
                    dominantType={data.dominantType}
                    bio={data.bio}
                />

                <ArtistFeaturedCard
                    song={latestRelease}
                    artistName={data.name}
                />

                {podiumSongs.length >= 3 && (
                    <ArtistPodium songs={podiumSongs} />
                )}
            </div>

            {/* ===== MOBILE: Sections below banner ===== */}
            <div className="md:hidden px-4 mt-4 space-y-6">
                {podiumSongs.length >= 3 && (
                    <section className={cardClass}>
                        <h2 className="text-2xl font-bold mb-6">Popular</h2>
                        <div className="flex items-end justify-center gap-3 px-4">
                            {[
                                { idx: 1, song: podiumSongs[1], h: "h-16", img: "h-14 w-14", badge: "bg-slate-300 text-slate-800" },
                                { idx: 0, song: podiumSongs[0], h: "h-24", img: "h-18 w-18", badge: "bg-amber-400 text-amber-900" },
                                { idx: 2, song: podiumSongs[2], h: "h-12", img: "h-12 w-12", badge: "bg-orange-300 text-orange-900" },
                            ].map(({ idx, song, h, img, badge }) => (
                                <div key={song.id} className="flex flex-col items-center flex-1">
                                    <div className="relative mb-2">
                                        <AdaptiveImage
                                            src={song.image?.[2]?.url || song.image?.[1]?.url}
                                            alt={song.name}
                                            className={`${img} rounded-full object-cover border-2 border-border/60`}
                                        />
                                        <span className={`absolute -bottom-1 -right-1 ${badge} text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md`}>
                                            #{idx + 1}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-white text-center truncate w-full mb-1">
                                        {song.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        {song.playCount || 0} streams
                                    </p>
                                    <div className={`${h} w-full mt-2 bg-secondary/40 rounded-t-lg`} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {remainingSongs.length > 0 && (
                    <section className={cardClass}>
                        <h2 className="text-2xl font-bold mb-6">Track</h2>
                        <ScrollArea className="whitespace-nowrap pb-2">
                            <div className="flex gap-4">
                                {remainingSongs.map((song) => (
                                    <SongCard
                                        key={song.id}
                                        id={song.id}
                                        image={song.image?.[2]?.url}
                                        title={song.name}
                                        artist={song.artists.primary[0]?.name}
                                    />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                        </ScrollArea>
                    </section>
                )}

                {data.topAlbums && data.topAlbums.length > 0 && (
                    <section className={cardClass}>
                        <h2 className="text-2xl font-bold mb-6">Albums</h2>
                        <ScrollArea className="whitespace-nowrap pb-4">
                            <div className="flex gap-4">
                                {data.topAlbums.map((album) => (
                                    <AlbumCard
                                        key={album.id}
                                        id={`album/${album.id}`}
                                        image={album.image?.[2]?.url}
                                        title={album.name}
                                        artist={data.name}
                                        desc={album.description}
                                        lang={album.language}
                                    />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                        </ScrollArea>
                    </section>
                )}
            </div>

            {/* ===== DESKTOP: Track + Albums below ===== */}
            <div className="hidden md:block mt-8 space-y-8 ml-2 mr-4">
                {remainingSongs.length > 0 && (
                    <section className="rounded-2xl border border-border/60 bg-secondary/20 p-6">
                        <h2 className="text-2xl font-bold mb-6">Track</h2>
                        <ScrollArea className="whitespace-nowrap pb-4">
                            <div className="flex gap-4">
                                {remainingSongs.map((song) => (
                                    <SongCard
                                        key={song.id}
                                        id={song.id}
                                        image={song.image?.[2]?.url}
                                        title={song.name}
                                        artist={song.artists.primary[0]?.name}
                                    />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                        </ScrollArea>
                    </section>
                )}

                {data.topAlbums && data.topAlbums.length > 0 && (
                    <section className="rounded-2xl border border-border/60 bg-secondary/20 p-6">
                        <h2 className="text-2xl font-bold mb-6">Albums</h2>
                        <ScrollArea className="whitespace-nowrap pb-4">
                            <div className="flex gap-4">
                                {data.topAlbums.map((album) => (
                                    <AlbumCard
                                        key={album.id}
                                        id={`album/${album.id}`}
                                        image={album.image?.[2]?.url}
                                        title={album.name}
                                        artist={data.name}
                                        desc={album.description}
                                        lang={album.language}
                                    />
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" className="hidden sm:flex" />
                        </ScrollArea>
                    </section>
                )}
            </div>
        </div>
    );
}
