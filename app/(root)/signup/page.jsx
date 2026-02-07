"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { useAuth } from "@/hooks/use-auth";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, router, user]);

  return <AuthForm mode="signup" />;
}
