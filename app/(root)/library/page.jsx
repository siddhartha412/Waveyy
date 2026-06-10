"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import SongCard from "@/components/cards/song";
import PlaylistCard from "@/components/cards/playlist";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Music, ListMusic } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading_content, setLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchLibraryData();
  }, [user, loading, router]);

  const fetchLibraryData = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      // Fetch liked songs
      const { data: likedSongs } = await supabase
        .from("liked_songs")
        .select("song_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (likedSongs) {
        setFavoriteSongs(likedSongs.map(item => item.song_id));
      }

      // Fetch user playlists
      const { data: userPlaylists } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (userPlaylists) {
        setPlaylists(userPlaylists);
      }
    } catch (error) {
      console.error("Error fetching library:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || loading_content) {
    return (
      <div className="min-h-screen pt-4 pb-24 px-4">
        <div className="text-center">Loading your library...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-4 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Your Library</h1>
        <p className="text-muted-foreground mb-8">Your favorite songs and playlists</p>

        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="liked" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Liked Songs</span>
              <span className="sm:hidden">Liked</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              <span className="hidden sm:inline">Playlists</span>
              <span className="sm:hidden">Lists</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked" className="mt-6">
            {favoriteSongs.length > 0 ? (
              <div className="space-y-2">
                {favoriteSongs.map((songId) => (
                  <div key={songId} className="p-2 rounded hover:bg-muted/50">
                    {/* Song item will be displayed here */}
                    {songId}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No liked songs yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            {playlists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    id={playlist.id}
                    name={playlist.name}
                    description={playlist.description}
                    image={playlist.image}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ListMusic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No playlists yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
