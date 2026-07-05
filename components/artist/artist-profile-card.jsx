"use client";

import { useState } from "react";
import { decodeHTML } from "@/lib/decode-html";
import { capitalizeWords, formatPlayCount } from "@/lib/utils";
import { Users, CheckCircle, ArrowLeftRight } from "lucide-react";
import AdaptiveImage from "../ui/adaptive-image";

export default function ArtistProfileCard({
    artistImage,
    name,
    isVerified,
    followerCount,
    dominantLanguage,
    dominantType,
    bio,
}) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            className="w-[300px] shrink-0 rounded-2xl border border-border/60 bg-secondary/20 overflow-hidden cursor-pointer select-none"
            style={{ perspective: "1000px" }}
            onClick={() => setFlipped((f) => !f)}
        >
            <div
                className="relative transition-transform duration-500"
                style={{
                    transformStyle: "preserve-3d",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* Front */}
                <div style={{ backfaceVisibility: "hidden" }}>
                    <div
                        className="relative h-[230px] flex items-center justify-center"
                        style={{
                            backgroundImage: `url(${artistImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
                        <AdaptiveImage
                            src={artistImage}
                            alt={name}
                            className="relative h-[125px] w-[125px] rounded-full shadow-2xl object-cover border-4 border-background z-10"
                        />
                    </div>

                    <div className="bg-[#0f0f10] px-5 pt-4 pb-0">
                        <div className="flex items-center justify-center gap-1 mb-2">
                            <h1 className="text-[18px] font-bold tracking-tight truncate max-w-[180px]">
                                {decodeHTML(name)}
                            </h1>

                            {isVerified && (
                                <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3 mb-6">
                            <p className="text-sm text-muted-foreground truncate flex-1">
                                {formatPlayCount(followerCount)} Followers
                            </p>

                            <span className="text-sm text-muted-foreground/70 shrink-0">
                                {capitalizeWords(dominantLanguage)} {capitalizeWords(dominantType)}
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/70">
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>About</span>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 flex flex-col rounded-2xl overflow-hidden"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="bg-[#0f0f10] px-5 py-4 border-b border-border/60">
                        <h2 className="text-[16px] font-bold tracking-tight">
                            About the Artist
                        </h2>
                    </div>

                    <div className="flex-1 min-h-0 bg-[#0f0f10] px-5 py-4">
                        <div className="h-full max-h-[220px] overflow-y-auto pr-1 text-sm text-muted-foreground leading-relaxed">
                            {bio && bio.length > 0 ? (
                                <p>{decodeHTML(bio[0]?.text || "")}</p>
                            ) : (
                                <p className="text-muted-foreground/50">
                                    No bio available.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}