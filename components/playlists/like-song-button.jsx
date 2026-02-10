"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMusicProvider } from "@/hooks/use-context";

export default function LikeSongButton({
  song,
  className = "",
  iconClassName = "h-4 w-4",
  size = "icon",
  variant = "secondary",
}) {
  const { user } = useAuth();
  const { isSongLiked, toggleLikedSong } = useMusicProvider();

  if (!user) return null;

  const songId = String(song?.id || "");
  if (!songId) return null;
  const liked = isSongLiked(songId);

  const handleClick = (event) => {
    event.stopPropagation();
    toggleLikedSong(song).then(({ liked: nextLiked, error }) => {
      if (error) {
        toast.error(error.message || "Failed to update liked songs");
        return;
      }
      toast.success(nextLiked ? "Added to Liked Songs" : "Removed from Liked Songs");
    });
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={className}
      title={liked ? "Remove from liked songs" : "Like song"}
    >
      <Heart className={`${iconClassName} ${liked ? "fill-current text-red-500" : ""}`} />
    </Button>
  );
}

