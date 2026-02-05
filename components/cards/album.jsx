import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { decodeHTML } from "@/lib/decode-html";

export default function AlbumCard({ title, image, artist, id, desc, lang }) {
    const safeTitle = decodeHTML(title || "");
    const safeArtist = decodeHTML(artist || "");
    const safeDesc = decodeHTML(desc || "");
    return (
        <div className="h-fit w-[200px]">
            <div className="overflow-hidden rounded-md">
                {image ? (
                    <Link href={`/${id}`}>
                        <img src={image} alt={safeTitle} className="h-[182px] w-full bg-secondary/60 rounded-md transition hover:scale-105 cursor-pointer" />
                    </Link>
                ) : (
                    <Skeleton className="w-full h-[182px]" />
                )}
            </div>
            <div className="cursor-pointer">
                {title ? (
                    <Link href={`/${id}`} className="mt-3 flex items-center justify-between">
                        <h1 className="text-base">{safeTitle.slice(0, 20)}{safeTitle.length > 20 && '...'}</h1>
                    </Link>
                ) : (
                    <Skeleton className="w-[70%] h-4 mt-2" />
                )}
                {desc && (
                    <p className="text-xs text-muted-foreground">{safeDesc.slice(0, 30)}</p>
                )}
                {artist ? (
                    <>
                        <p className="text-sm font-light mb-1 text-muted-foreground">{safeArtist.slice(0, 20)}{safeArtist.length > 20 && '...'}</p>
                        {lang && <Badge variant="outline" className="font-normal">{lang}</Badge>}
                    </>
                ) : (
                    <Skeleton className="w-10 h-2 mt-2" />
                )}
            </div>
        </div>
    )
}
