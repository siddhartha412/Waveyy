import { getArtistById } from "@/lib/fetch";
import SongCard from "@/components/cards/song";
import AlbumCard from "@/components/cards/album";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { decodeHTML } from "@/lib/decode-html";
import { Users, CheckCircle } from "lucide-react";

export default async function ArtistPage({ params }) {
    const { id } = params;
    const res = await getArtistById(id);
    const json = await res.json();
    const data = json.data;

    if (!data) return <div className="text-center py-20">Artist not found</div>;

    const artistImage = data.image?.[2]?.url;
    const bannerImage = artistImage;

    return (
        <div className="pb-24 md:pb-10">
            {/* Header Section */}
            <div className="relative w-full h-[350px] md:h-[400px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                    style={{ backgroundImage: `url(${bannerImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                <div className="relative h-full flex flex-col justify-end px-4 md:px-20 lg:px-32 py-6 md:py-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                        <img
                            src={artistImage}
                            alt={data.name}
                            className="h-[140px] w-[140px] md:h-[200px] md:w-[200px] rounded-full shadow-2xl object-cover border-4 border-background"
                        />
                        <div className="mb-2">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                {data.isVerified && <Badge variant="secondary" className="gap-1"><CheckCircle className="w-3 h-3" /> Verified Artist</Badge>}
                            </div>
                            <h1 className="text-3xl md:text-6xl font-black tracking-tight mb-2">{decodeHTML(data.name)}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground text-xs md:text-sm font-medium">
                                {Number(data.followerCount) > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {Number(data.followerCount).toLocaleString()} Followers
                                    </span>
                                )}
                                {Number(data.followerCount) > 0 && <span>•</span>}
                                <span>{data.dominantLanguage} {data.dominantType}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-20 lg:px-32 -mt-4 relative z-10 space-y-8 md:space-y-12">

                {/* Top Songs */}
                {data.topSongs && data.topSongs.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Popular</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {data.topSongs.map((song) => (
                                <SongCard
                                    key={song.id}
                                    id={song.id}
                                    image={song.image?.[2]?.url}
                                    title={song.name}
                                    artist={song.artists.primary[0]?.name}
                                    playCount={song.playCount}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Albums */}
                {data.topAlbums && data.topAlbums.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Albums</h2>
                        {/* ScrollArea probably works fine in Server Component as wrapper due to client directive in its own file? Check shadcn implementation */}
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

                {/* Bio */}
                {data.bio && data.bio.length > 0 && (
                    <section className="bg-secondary/20 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold mb-4">About</h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                            <p>{decodeHTML(data.bio[0]?.text)}</p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
