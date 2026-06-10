"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const VIBES = [
  { id: "relax", label: "Relax", color: "bg-emerald-500/20 hover:bg-emerald-500/30" },
  { id: "trending", label: "Trending", color: "bg-blue-500/20 hover:bg-blue-500/30" },
  { id: "lit", label: "Lit", color: "bg-orange-500/20 hover:bg-orange-500/30" },
  { id: "sad", label: "Sad", color: "bg-purple-500/20 hover:bg-purple-500/30" },
  { id: "billboard", label: "BILLBOARD", color: "bg-red-500/20 hover:bg-red-500/30" },
  { id: "facts", label: "FACTS", color: "bg-pink-500/20 hover:bg-pink-500/30" },
];

export default function VibeSelector({ onVibeSelect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (vibe) => {
    setSelected(vibe.id);
    onVibeSelect?.(vibe);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {VIBES.map((vibe) => (
        <Button
          key={vibe.id}
          variant="outline"
          size="sm"
          onClick={() => handleSelect(vibe)}
          className={`whitespace-nowrap rounded-full transition-colors ${
            selected === vibe.id ? vibe.color + " border-white" : vibe.color
          }`}
        >
          {vibe.label}
        </Button>
      ))}
    </div>
  );
}
