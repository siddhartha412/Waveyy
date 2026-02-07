"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { loading, isConfigured, signInWithPassword, signUpWithPassword, signInWithGoogle } =
    useAuth();
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!identifier || !password) {
        toast.error("Username/email and password are required");
        return;
      }

      setSubmitting(true);
      try {
        const { error } = await signInWithPassword({ identifier, password });
        if (error) {
          toast.error(error.message || "Authentication failed");
          return;
        }
        toast.success("Logged in");
        router.push("/");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!username || !email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      toast.error("Username must be 3-30 characters (letters, numbers, underscore)");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await signUpWithPassword({ username, email, password });
      if (error) {
        toast.error(error.message || "Authentication failed");
        return;
      }

      if (data?.session) {
        toast.success("Account created");
        router.push("/");
      } else {
        toast.success("Check your email to confirm your account");
        router.push("/login");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) toast.error(error.message || "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-6 md:px-20 lg:px-32">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border p-6 sm:p-8 bg-background/90 backdrop-blur">
        <h1 className="text-2xl font-semibold">{isLogin ? "Login" : "Sign Up"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "Access your account" : "Create an account"}
        </p>

        {!isConfigured && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and a publishable key.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          {isLogin ? (
            <Input
              type="text"
              name="identifier"
              autoComplete="username"
              placeholder="Email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={submitting || loading || !isConfigured}
            />
          ) : (
            <>
              <Input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting || loading || !isConfigured}
              />
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || loading || !isConfigured}
              />
            </>
          )}
          <Input
            type="password"
            name="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || loading || !isConfigured}
          />
          {!isLogin && (
            <Input
              type="password"
              name="confirm_password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting || loading || !isConfigured}
            />
          )}
          <Button type="submit" disabled={submitting || loading || !isConfigured}>
            {submitting ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGoogle}
          disabled={submitting || loading || !isConfigured}
        >
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <p className="mt-4 text-sm text-muted-foreground">
          {isLogin ? "No account yet?" : "Already have an account?"}{" "}
          {isLogin ? (
            <Link href="/signup" className="text-foreground underline underline-offset-4">
              Sign up
            </Link>
          ) : (
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Login
            </Link>
          )}
        </p>
      </div>
    </main>
  );
}
