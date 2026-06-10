"use client";

import Link from "next/link";
import { Music2 } from "lucide-react";
import AdaptiveImage from "@/components/ui/adaptive-image";

export default function PlaylistCard({ id, name, description, image, count }) {
  return (
    <Link href={`/playlists/${id}`}>
      <div className="group cursor-pointer rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-border/50 hover:border-border transition-all hover:shadow-lg">
        <div className="aspect-square bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden flex items-center justify-center">
          {image ? (
            <AdaptiveImage
              src={image}
              alt={name}
              fill
              className="object-cover group-hover:scale-110 transition-transform"
            />
          ) : (
            <Music2 className="h-12 w-12 text-white/50" />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
              {description}
            </p>
          )}
          {count && (
            <p className="text-xs text-muted-foreground mt-2">
              {count} {count === 1 ? "song" : "songs"}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
