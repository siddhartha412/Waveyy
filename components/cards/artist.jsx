import Link from "next/link";
import { decodeHTML } from "@/lib/decode-html";
import AdaptiveImage from "@/components/ui/adaptive-image";

export default function ArtistCard({ image, name, id }) {
    const safeName = decodeHTML(name || "");
    return (
        <Link href={`/artist/${id}`} className="group block w-fit">
            <div className="overflow-hidden h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full shadow-lg relative bg-secondary/30">
                {image ? (
                    <AdaptiveImage
                        src={image}
                        alt={safeName}
                        className="group-hover:scale-105 transition cursor-pointer rounded-full h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full rounded-full animate-pulse bg-secondary" />
                )}
            </div>
            <div className="mt-3 text-left pl-1">
                <h1 className="text-lg font-bold max-w-[160px] sm:max-w-[180px] truncate">{safeName}</h1>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">Artist</p>
            </div>
        </Link>
    )
}
