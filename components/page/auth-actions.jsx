"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default function AuthActions() {
  const { user, loading, signOut } = useAuth();

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
      <Button variant="ghost" className="h-9 px-2" disabled>
        ...
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="h-9 px-3" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button className="h-9 px-3 bg-foreground text-background hover:bg-foreground/90" asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-xs text-muted-foreground max-w-[180px] truncate">
        {getUserLabel(user)}
      </span>
      <Button variant="outline" className="h-9 px-3" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
