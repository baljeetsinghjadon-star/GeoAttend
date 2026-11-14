"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, School, Loader2 } from "lucide-react";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authError === "auth-callback-failed") {
      setErrorMsg("Authentication callback failed. Please try signing in again.");
    }
  }, [authError]);

  // Quick Demo account filler
  const fillDemo = (role: "admin" | "teacher" | "student") => {
    setErrorMsg(null);
    if (role === "admin") {
      setEmail("admin@geoattend.app");
      setPassword("Admin@123456");
    } else if (role === "teacher") {
      setEmail("teacher@geoattend.app");
      setPassword("Teacher@123456");
    } else {
      setEmail("student@geoattend.app");
      setPassword("Student@123456");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("provider is not enabled") ||
          error.message.toLowerCase().includes("unsupported provider")
        ) {
          throw new Error(
            "Google Sign-In is not yet enabled in your Supabase project. In your Supabase Dashboard, go to Authentication -> Providers -> Google, enable it, and add your Google Client ID and Secret."
          );
        }
        throw error;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to Google.";
      setErrorMsg(message);
      toast.error(message, { duration: 8000 });
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();

      let loginResult = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Self-heal: If email is unconfirmed, auto-confirm it via server API and retry login automatically
      if (
        loginResult.error &&
        loginResult.error.message.toLowerCase().includes("email not confirmed")
      ) {
        const autoConfirmRes = await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });

        if (autoConfirmRes.ok) {
          // Retry login after auto-confirm
          loginResult = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        }
      }

      if (loginResult.error) {
        throw loginResult.error;
      }

      if (!loginResult.data.user) {
        throw new Error("Login failed. No user found.");
      }

      // Fetch user profile to know their role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", loginResult.data.user.id)
        .maybeSingle();

      const targetPath = redirectTo || (profile?.role ? `/${profile.role}` : "/student");
      router.push(targetPath);
      router.refresh();
    } catch (err: unknown) {
      let message =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please verify and try again.";

      if (
        message.toLowerCase().includes("failed to fetch") ||
        message.toLowerCase().includes("networkerror")
      ) {
        message =
          "Cannot connect to Supabase: Your Supabase project appears to be paused due to inactivity, or the network is unreachable. Please visit supabase.com/dashboard and click 'Restore project' to unpause it.";
      }

      setErrorMsg(message);
      toast.error(message, { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Sign In
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials or continue with Google
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google One-Click Sign In */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full h-11 text-sm font-semibold gap-3 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs transition-all"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {googleLoading ? "Connecting to Google..." : "Sign in using Google"}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
            Quick Fill Demo Accounts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("student")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-2xs"
            >
              <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo("teacher")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-2xs"
            >
              <School className="h-3.5 w-3.5 text-emerald-500" />
              Teacher
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 transition-colors shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
              Admin
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-3.5 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Institutional Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                required
                placeholder="student@geoattend.edu"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-11 text-sm font-semibold gap-2"
          >
            {loading ? "Authenticating..." : "Sign In to GeoAttend"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading login form...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
