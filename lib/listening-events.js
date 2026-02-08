"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export const logListeningEvent = async ({ userId, songId, playedAt }) => {
  if (!userId || !songId) return { error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase is not configured") };

  const { error } = await supabase.from("listening_events").insert({
    user_id: userId,
    song_id: songId,
    played_at: playedAt || new Date().toISOString(),
  });

  return { error: error || null };
};

export const getRecentListeningEvents = async ({ userId, days = 5, limit = 300 }) => {
  if (!userId) return { data: [], error: null };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: [], error: new Error("Supabase is not configured") };

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("listening_events")
    .select("song_id, played_at")
    .eq("user_id", userId)
    .gte("played_at", cutoff)
    .order("played_at", { ascending: false })
    .limit(limit);

  if (error) return { data: [], error };
  return { data: data || [], error: null };
};

