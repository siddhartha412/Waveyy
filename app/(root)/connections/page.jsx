"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mail, Chrome, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ConnectionsPage() {
  const router = useRouter();
  const { user, loading, discordConnected, connectDiscord, connectGoogle } = useAuth();

  const activeProviders = useMemo(() => {
    const set = new Set();
    const appProviders = Array.isArray(user?.app_metadata?.providers) ? user.app_metadata.providers : [];
    const identities = Array.isArray(user?.identities) ? user.identities : [];
    
    appProviders.forEach(p => set.add(p));
    identities.forEach(i => set.add(i.provider));
    
    return set;
  }, [user]);

  // Unified click handler
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

  const PROVIDERS = [
    { id: "email", label: "Email", icon: Mail, isConnected: activeProviders.has("email") },
    { id: "google", label: "Google", icon: Chrome, isConnected: activeProviders.has("google") },
    { id: "discord", label: "Discord", icon: MessageSquare, isConnected: discordConnected || activeProviders.has("discord") },
  ];

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-zinc-400">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-zinc-100">Auth Providers</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your connected authentication methods.</p>

        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-[#111111]">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-5 last:border-0"
            >
              <div className="flex items-center gap-4">
                <provider.icon className="h-5 w-5 text-zinc-500" strokeWidth={1.5} />
                <span className="text-[15px] font-medium text-zinc-200">{provider.label}</span>
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
                  className="h-8 gap-1.5 border border-zinc-800 bg-zinc-900/50 px-3 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
