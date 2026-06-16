"use client";

import Link from "next/link";
import Logo from "./logo";
import Search from "./search";
import { usePathname, useRouter } from "next/navigation";
import { useMusicProvider } from "@/hooks/use-context";
import { useAuth } from "@/hooks/use-auth";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Home, User, LogOut, Link2, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Header({ sidebarOpen = true }) {
  const path = usePathname();
  const router = useRouter();
  const { playerOpen, music } = useMusicProvider();
  const { user, signOut } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isAuthPage = path === "/login" || path === "/signup";

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message || "Failed to logout");
      return;
    }
    toast.success("Logged out");
    router.push("/");
  };

  if (playerOpen && !isDesktop) return null;

  return (
    <header
      className={`sticky top-0 relative z-[120] border-b border-border/60 bg-secondary/20 backdrop-blur-[40px] saturate-[180%] px-4 py-3 sm:px-5 lg:h-[64px] lg:py-0 lg:flex lg:items-center rounded-b-2xl mx-4`}
    >
      <div className="flex w-full items-center gap-3 sm:grid sm:grid-cols-[auto_minmax(320px,620px)_auto] sm:items-center lg:flex lg:items-center lg:h-full">
        <div className="shrink-0 sm:justify-self-start">
          <Logo />
        </div>

        {!isAuthPage && (
          <div className="hidden w-full sm:block sm:justify-self-center">
            <div className="mx-auto flex w-full max-w-[640px] items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#333333] transition-all duration-200 ease-smooth"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <div className="relative min-w-0 flex-1 rounded-full border border-white/[0.06] bg-secondary/30 px-1">
                <Search />
                <div className="pointer-events-none absolute right-10 top-1/2 h-4 w-px -translate-y-1/2 bg-white/[0.08]" />
              </div>
            </div>
          </div>
        )}

        {!isAuthPage && !isDesktop && (
          <div className="ml-auto sm:justify-self-end">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-secondary/30 text-muted-foreground transition-colors duration-200 hover:bg-secondary/70 hover:text-foreground overflow-hidden outline-none"
                    title="Account"
                  >
                    {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.display_name || user.user_metadata?.username || "Account"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex w-full items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/connections" className="flex w-full items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      <span>Connections</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 text-red-500 focus:text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-secondary/30 text-muted-foreground transition-colors duration-200 hover:bg-secondary/70 hover:text-foreground"
                title="Login"
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}
      </div>

      {!isAuthPage && (
        <div className="mt-3 sm:hidden">
          <Search />
        </div>
      )}
    </header>
  );
}
