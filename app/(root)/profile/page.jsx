"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mail, Chrome, MessageSquare, Plus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const getUserLabel = (user) => {
  if (!user) return "";
  const name =
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name;
  if (name) return name;
  return user.email || "Account";
};

const getAvatarUrl = (user) =>
  user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

const getAvatarFallback = (user) => {
  const label = getUserLabel(user);
  return (label?.[0] || "U").toUpperCase();
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, discordConnected, connectDiscord, connectGoogle } = useAuth();

  const avatarUrl = getAvatarUrl(user);
  const initials = getAvatarFallback(user);

  const activeProviders = useMemo(() => {
    const set = new Set();
    const appProviders = Array.isArray(user?.app_metadata?.providers) ? user.app_metadata.providers : [];
    const identities = Array.isArray(user?.identities) ? user.identities : [];

    appProviders.forEach(p => set.add(p));
    identities.forEach(i => set.add(i.provider));

    return set;
  }, [user]);

  const handleConnect = async (providerId) => {
    try {
      if (providerId === "discord") {
        const { error } = await connectDiscord();
        if (error) {
          const msg = String(error.message || "");
          if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("linked")) {
            toast.error("This Discord account is already linked to another Waveyy account.");
            return;
          }
          toast.error(error.message || "Failed to connect Discord");
          return;
        }
        toast.success("Redirecting to Discord...");
      } else if (providerId === "google") {
        const { error } = await connectGoogle();
        if (error) {
          const msg = String(error.message || "");
          if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("linked")) {
            toast.error("This Google account is already linked to another Waveyy account.");
            return;
          }
          toast.error(error.message || "Failed to connect Google");
          return;
        }
        toast.success("Redirecting to Google...");
      } else if (providerId === "email") {
        toast.info("Email is usually connected at signup.");
      }
    } catch (error) {
      toast.error(error.message || `Failed to connect ${providerId}`);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (!user) return null;

  const PROVIDERS = [
    { id: "email", label: "Email", icon: Mail, isConnected: activeProviders.has("email") },
    { id: "google", label: "Google", icon: Chrome, isConnected: activeProviders.has("google") },
    { id: "discord", label: "Discord", icon: MessageSquare, isConnected: discordConnected || activeProviders.has("discord") },
  ];

  return (
    <main className="min-h-screen px-6 py-12 text-muted-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={getUserLabel(user)} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-medium text-foreground truncate">{getUserLabel(user)}</p>
            {user.email && (
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </div>

        <h2 className="text-sm font-medium text-foreground mb-3">Connections</h2>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/30">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between border-b border-border/40 px-6 py-4 last:border-0"
            >
              <div className="flex items-center gap-4">
                <provider.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[15px] font-medium text-foreground">{provider.label}</span>
              </div>

              {provider.isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-500/90">Connected</span>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 border border-border/60 bg-secondary/50 px-3 text-xs text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  onClick={() => handleConnect(provider.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
