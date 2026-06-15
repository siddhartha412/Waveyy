"use client";

import { Button } from "@/components/ui/button";
import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { requireAuthToPlay } from "@/lib/auth-gate";
import { Play } from "lucide-react";

export default function HeroPlayButton({ songId }) {
  const { setMusic, setPlayRequested, setPlayerOpen } = useMusicProvider();
  const { user } = useAuth();

  if (!songId) return null;

  return (
    <Button
      className="rounded-full h-10 px-5 font-semibold"
      onClick={() => {
        if (!requireAuthToPlay(user)) return;
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

