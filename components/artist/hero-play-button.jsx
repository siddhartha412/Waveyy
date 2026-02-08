"use client";

import { Button } from "@/components/ui/button";
import { useMusicProvider } from "@/hooks/use-context";
import { Play } from "lucide-react";

export default function HeroPlayButton({ songId }) {
  const { setMusic, setPlayRequested, setPlayerOpen } = useMusicProvider();

  if (!songId) return null;

  return (
    <Button
      className="rounded-full h-10 px-5 font-semibold"
      onClick={() => {
        setMusic(songId);
        setPlayRequested(true);
        setPlayerOpen(false);
      }}
    >
      <Play className="w-4 h-4 fill-current mr-2" />
      Play
    </Button>
  );
}

