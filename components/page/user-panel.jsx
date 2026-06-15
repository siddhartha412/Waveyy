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
          <div className="rounded-xl border border-white/10 bg-black/90 p-3">
            <div className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">Want to vibe??</p>
                <p className="mt-1 text-xs text-slate-400">Sign in to access your queue.</p>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              <Link
                href="/login"
                className="flex-1 inline-flex items-center justify-center rounded-2xl bg-white text-black text-sm font-semibold h-10 hover:bg-slate-200 transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="flex-1 inline-flex items-center justify-center rounded-2xl border border-white/10 text-white text-sm font-semibold h-10 hover:bg-white/10 transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200"
            title="Login"
          >
            <User className="h-4 w-4 text-white" />
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
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white text-black text-sm font-semibold h-10 hover:bg-slate-200 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="h-9 w-9 rounded-full border border-white/10 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${open ? "px-2 pb-2" : "p-2 flex justify-center"}`}>
      {open ? (
        <div className="rounded-xl border border-white/10 bg-black/90 p-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={getUserLabel(user)} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">{initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{getUserLabel(user)}</p>
              <p className="text-xs text-slate-400">Manage your profile.</p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 text-white/70 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href="/profile"
          className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-200"
          title="Settings"
        >
          <Settings className="h-4 w-4 text-white" />
        </Link>
      )}
    </div>
  );
}
