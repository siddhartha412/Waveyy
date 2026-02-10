"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const USERNAME_MAP_KEY = "local-username-map";

const normalizeUsername = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const isEmail = (value = "") => value.includes("@");
const normalizeBaseUrl = (value = "") => String(value).replace(/\/+$/, "");
const hasDiscordIdentity = (user) => {
  if (!user) return false;
  const providers = Array.isArray(user?.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];
  if (providers.includes("discord")) return true;
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  return identities.some((identity) => identity?.provider === "discord");
};

const readLocalUsernameMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(USERNAME_MAP_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
};

const writeLocalUsername = (username, email) => {
  if (typeof window === "undefined") return;
  const map = readLocalUsernameMap();
  map[username] = email;
  localStorage.setItem(USERNAME_MAP_KEY, JSON.stringify(map));
};

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setUser(data.session?.user || null);
      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    const supabase = getSupabaseBrowserClient();

    const resolveEmailFromUsername = async (identifier) => {
      const username = normalizeUsername(identifier);

      const localMap = readLocalUsernameMap();
      if (localMap[username]) {
        return { email: localMap[username] };
      }

      // Optional: shared lookup when a public `profiles` table exists.
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        return {
          error: new Error(
            "Username login requires a `profiles` table in Supabase. Use email or configure profiles."
          ),
        };
      }

      if (!data?.email) {
        return { error: new Error("Username not found") };
      }

      return { email: data.email };
    };

    const upsertProfile = async ({ id, username, email, displayName }) => {
      if (!id || !username || !email) return null;
      const normalized = normalizeUsername(username);
      writeLocalUsername(normalized, email);

      const { error } = await supabase.from("profiles").upsert(
        {
          id,
          username: normalized,
          email,
          display_name: displayName || username,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return error || null;
    };

    return {
      session,
      user,
      loading,
      discordConnected: hasDiscordIdentity(user),
      isConfigured: Boolean(supabase),
      signInWithPassword: async ({ identifier, password }) => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }

        let email = identifier;
        if (!isEmail(identifier)) {
          const lookup = await resolveEmailFromUsername(identifier);
          if (lookup.error) return { error: lookup.error };
          email = lookup.email;
        }

        return supabase.auth.signInWithPassword({ email, password });
      },
      signUpWithPassword: async ({ username, email, password }) => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }

        const normalizedUsername = normalizeUsername(username);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: normalizedUsername,
              display_name: username,
            },
          },
        });

        if (error) return { data, error };

        const userId = data?.user?.id;
        if (userId) {
          await upsertProfile({
            id: userId,
            username: normalizedUsername,
            email,
            displayName: username,
          });
        }

        return { data, error: null };
      },
      signInWithGoogle: async () => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }
        const configured = process.env.NEXT_PUBLIC_APP_URL;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const baseUrl = normalizeBaseUrl(configured || origin);
        const redirectTo = `${baseUrl}/auth/callback`;
        return supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
      },
      connectGoogle: async () => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }
        const configured = process.env.NEXT_PUBLIC_APP_URL;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const baseUrl = normalizeBaseUrl(configured || origin);
        const redirectTo = `${baseUrl}/auth/callback`;

        // Link Google identity to current logged-in account.
        if (user) {
          return supabase.auth.linkIdentity({
            provider: "google",
            options: { redirectTo },
          });
        }

        return supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
      },
      connectDiscord: async () => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }
        const configured = process.env.NEXT_PUBLIC_APP_URL;
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const baseUrl = normalizeBaseUrl(configured || origin);
        const redirectTo = `${baseUrl}/auth/callback`;

        // If user already has a session, link Discord as an additional identity.
        if (user) {
          return supabase.auth.linkIdentity({
            provider: "discord",
            options: { redirectTo },
          });
        }

        // Fallback: direct sign-in via Discord.
        return supabase.auth.signInWithOAuth({
          provider: "discord",
          options: { redirectTo },
        });
      },
      signOut: async () => {
        if (!supabase) {
          return { error: new Error("Supabase is not configured") };
        }
        return supabase.auth.signOut();
      },
    };
  }, [loading, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
