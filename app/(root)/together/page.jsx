"use client";

import { useRoom } from "@/components/providers/room-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Copy, DoorOpen } from "lucide-react";

export default function TogetherPage() {
  const { roomId, joinRoom, leaveRoom } = useRoom() || {};

  const handleListenTogether = () => {
    if (roomId) {
      leaveRoom();
      toast.success("Left the room");
    } else {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      joinRoom(newRoomId);
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?room=${newRoomId}`;
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Room link copied!");
      }).catch(() => {
        toast.success(`Room created! Link: ${url}`);
      });
    }
  };

  const copyLink = () => {
    if (!roomId) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Room link copied!");
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="bg-secondary/20 p-8 rounded-2xl border border-border/60 max-w-md w-full backdrop-blur-sm">
        <Users className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Listen Together</h1>
        <p className="text-muted-foreground mb-8 text-sm sm:text-base">
          {roomId 
            ? "You are currently in a room. Share the link below to listen with your friends in real-time."
            : "Create a room and invite your friends to listen to music together in real-time."}
        </p>

        {roomId ? (
          <div className="space-y-4">
            <div className="bg-background/80 p-3 rounded-lg flex items-center justify-between border border-border/50">
              <span className="truncate text-sm opacity-80 mr-4 select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/?room=${roomId}` : `/?room=${roomId}`}
              </span>
              <Button size="icon" variant="secondary" onClick={copyLink} className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="destructive" className="w-full gap-2" onClick={handleListenTogether}>
              <DoorOpen className="w-4 h-4" /> Leave Room
            </Button>
          </div>
        ) : (
          <Button className="w-full gap-2" size="lg" onClick={handleListenTogether}>
            <Users className="w-5 h-5" /> Create Room
          </Button>
        )}
      </div>
    </div>
  );
}
