import Link from "next/link";
import { decodeHTML } from "@/lib/decode-html";

export default function ArtistCard({ image, name, id }) {
    const safeName = decodeHTML(name || "");
    return (
        <Link href={`/artist/${id}`}>
            <div className="overflow-hidden h-[100px] w-[100px] rounded-md">
                <img src={image} alt={safeName} className="hover:scale-105 transition cursor-pointer rounded-full h-[100px] min-w-[100px] object-cover" />
            </div>
            <div className="mt-2 text-center">
                <h1 className="text-sm max-w-[100px] text-ellipsis text-nowrap overflow-hidden">{safeName.split(" ")[0] || null} {safeName.split(" ")[1] || null}</h1>
            </div>
        </Link>
    )
}
