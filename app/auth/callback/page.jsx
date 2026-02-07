"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      router.replace("/");
    };

    run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </main>
  );
}
