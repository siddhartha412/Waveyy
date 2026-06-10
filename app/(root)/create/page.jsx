"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { Plus, Music } from "lucide-react";

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [playlistName, setPlaylistName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen pt-4 pb-24 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-4 pb-24 px-4">
        <div className="text-center">Please log in to create playlists</div>
      </div>
    );
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    if (!playlistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    setIsCreating(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        toast.error("Database connection failed");
        return;
      }

      const { data, error } = await supabase
        .from("playlists")
        .insert({
          name: playlistName.trim(),
          description: description.trim() || null,
          user_id: user.id,
          image: null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create playlist");
        console.error(error);
        return;
      }

      toast.success("Playlist created successfully!");
      setPlaylistName("");
      setDescription("");

      // Redirect to playlist
      if (data?.id) {
        router.push(`/playlists/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen pt-4 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Playlist</h1>
          <p className="text-muted-foreground">Start building your perfect collection</p>
        </div>

        <form onSubmit={handleCreatePlaylist} className="space-y-6 bg-muted/30 p-6 rounded-lg border border-border/50">
          <div>
            <label className="block text-sm font-medium mb-2">Playlist Name</label>
            <Input
              type="text"
              placeholder="My Awesome Mix"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              disabled={isCreating}
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="What's this playlist about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={4}
              className="text-base"
            />
          </div>

          <Button
            type="submit"
            disabled={isCreating || !playlistName.trim()}
            className="w-full"
            size="lg"
          >
            {isCreating ? "Creating..." : "Create Playlist"}
            <Plus className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <Music className="h-6 w-6 mb-2 text-blue-500" />
            <h3 className="font-semibold mb-1">Organize Your Music</h3>
            <p className="text-sm text-muted-foreground">Create playlists to organize your favorite tracks</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <Plus className="h-6 w-6 mb-2 text-green-500" />
            <h3 className="font-semibold mb-1">Add Songs Later</h3>
            <p className="text-sm text-muted-foreground">Add songs to your playlist anytime</p>
          </div>
        </div>
      </div>
    </main>
  );
}
