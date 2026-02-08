"use client";

import Link from "next/link";
import { Check, LogOut, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const getUserLabel = (user) => {
  if (!user) return "";
  const fullName =
    user.user_metadata?.display_name ||
    user.user_metadata?.username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name;
  if (fullName) return fullName;
  return user.email || "Account";
};

const getAvatarUrl = (user) =>
  user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

const getAvatarFallback = (user) => {
  const label = getUserLabel(user);
  return (label?.[0] || "U").toUpperCase();
};

export default function AuthActions({ onMenuOpenChange = () => {} }) {
  const { user, loading, signOut, discordConnected, connectDiscord } = useAuth();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Failed to logout");
      return;
    }
    toast.success("Logged out");
  };

  const handleConnectDiscord = async () => {
    const { error } = await connectDiscord();
    if (error) {
      toast.error(error.message || "Failed to connect Discord");
      return;
    }
    toast.success("Opening Discord auth...");
  };

  if (loading) {
    return (
      <Button variant="ghost" className="h-9 px-2" disabled>
        ...
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-9 px-2 sm:px-3 text-xs sm:text-sm" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button
          className="hidden sm:inline-flex h-9 px-3 bg-foreground text-background hover:bg-foreground/90"
          asChild
        >
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu onOpenChange={onMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-9 w-9 rounded-full overflow-hidden border border-border/60 bg-secondary/40 hover:bg-secondary/60 transition-colors"
          aria-label="Open account menu"
        >
          {getAvatarUrl(user) ? (
            <img
              src={getAvatarUrl(user)}
              alt={getUserLabel(user)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-xs font-semibold">
              {getAvatarFallback(user)}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="z-[220] w-[min(92vw,16rem)]"
      >
        <DropdownMenuLabel className="truncate">{getUserLabel(user)}</DropdownMenuLabel>
        {user?.email && <DropdownMenuLabel className="pt-0 text-xs text-muted-foreground truncate break-all">{user.email}</DropdownMenuLabel>}
        <DropdownMenuSeparator />
        {discordConnected ? (
          <DropdownMenuItem className="cursor-default text-emerald-500 focus:text-emerald-500">
            <Check className="mr-2 h-4 w-4" />
            Connections
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleConnectDiscord} className="cursor-pointer">
            <Plug className="mr-2 h-4 w-4" />
            Connect Discord
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
