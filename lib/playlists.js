"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRows = (rows = []) =>
  (rows || []).map((playlist) => ({
    id: String(playlist.id),
    name: String(playlist.name || "My Playlist"),
    createdAt: new Date(playlist.created_at || Date.now()).getTime(),
    songs: (playlist.playlist_songs || [])
      .map((song) => ({
        id: String(song.song_id),
        name: String(song.song_name || "Unknown"),
        artist: String(song.song_artist || "unknown"),
        image: String(song.song_image || ""),
        playCount: toNumber(song.play_count, 0),
        addedAt: song.created_at || null,
        createdAt: new Date(song.created_at || Date.now()).getTime(),
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ createdAt, ...song }) => song),
  }));

export const getUserPlaylists = async ({ userId }) => {
  if (!userId) return { data: [], error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], error: new Error("Supabase is not configured") };

  const { data, error } = await supabase
    .from("playlists")
    .select(
      "id,name,created_at,playlist_songs(song_id,song_name,song_artist,song_image,play_count,created_at)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };
  return { data: normalizeRows(data), error: null };
};

export const createUserPlaylist = async ({ userId, playlist }) => {
  if (!userId || !playlist?.id) return { error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const { error } = await supabase.from("playlists").upsert(
    {
      id: playlist.id,
      user_id: userId,
      name: playlist.name,
    },
    { onConflict: "id" }
  );
  return { error: error || null };
};

export const deleteUserPlaylist = async ({ userId, playlistId }) => {
  if (!userId || !playlistId) return { error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("user_id", userId)
    .eq("id", playlistId);
  return { error: error || null };
};

export const addUserPlaylistSong = async ({ userId, playlistId, song }) => {
  if (!userId || !playlistId || !song?.id) return { error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const payload = {
    user_id: userId,
    playlist_id: playlistId,
    song_id: String(song.id),
    song_name: String(song.name || "Unknown"),
    song_artist: String(song.artist || "unknown"),
    song_image: String(song.image || ""),
    play_count: toNumber(song.playCount, 0),
  };

  const { error } = await supabase
    .from("playlist_songs")
    .upsert(payload, { onConflict: "playlist_id,song_id" });

  return { error: error || null };
};

export const removeUserPlaylistSong = async ({ userId, playlistId, songId }) => {
  if (!userId || !playlistId || !songId) return { error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("user_id", userId)
    .eq("playlist_id", playlistId)
    .eq("song_id", songId);
  return { error: error || null };
};
