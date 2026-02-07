"use client";

import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

const getSupabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
};

export const getSupabaseBrowserClient = () => {
  if (supabaseClient) return supabaseClient;

  const env = getSupabaseEnv();
  if (!env) return null;

  supabaseClient = createClient(env.url, env.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  return supabaseClient;
};
