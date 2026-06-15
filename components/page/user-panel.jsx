"use client";

import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
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

export default function UserPanel({ open = true }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Failed to logout");
      return;
    }
    toast.success("Logged out");
  };

  if (loading) {
    return (
      <div className={`${open ? "px-2 pb-2" : "p-2 flex justify-center"}`}>
        <div className={`${open ? "flex items-center gap-2.5" : "flex justify-center"}`}>
          <div className="h-8 w-8 shrink-0 rounded-full bg-secondary animate-pulse" />
          {open && (
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-secondary rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${open ? "px-2 pb-2" : "p-2 flex justify-center"}`}>
        {open ? (
          <div className="rounded-xl bg-secondary/50 p-2.5 w-full">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-secondary/80 flex items-center justify-center surface-shadow-sm">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">Welcome</p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-foreground text-background text-xs font-medium h-8 hover:opacity-90 transition-all duration-200 ease-smooth"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-secondary text-foreground text-xs font-medium h-8 hover:bg-secondary/80 transition-all duration-200 ease-smooth surface-shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary/80 transition-all duration-200 ease-smooth surface-shadow-sm"
            title="Login"
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user);
  const initials = getAvatarFallback(user);

  if (isProfilePage) {
    return (
      <div className={`mt-auto ${open ? "px-2 pb-2" : "p-2 flex justify-center"}`}>
        {open ? (
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium h-9 hover:bg-red-500/20 transition-all duration-200 ease-smooth"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-all duration-200 ease-smooth"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-red-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${open ? "px-2 pb-2" : "p-2 flex justify-center"}`}>
      {open ? (
        <div className="rounded-xl bg-secondary/50 p-2.5 w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-secondary flex items-center justify-center surface-shadow-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt={getUserLabel(user)} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{getUserLabel(user)}</p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href="/profile"
          className="h-9 w-9 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary/80 transition-all duration-200 ease-smooth surface-shadow-sm"
          title="Settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}
    </div>
  );
}
