"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ShieldCheck, GraduationCap, School } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    toast.info(`Filled credentials for demo ${role.toUpperCase()}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Login failed. No user found.");
      }

      // Fetch user profile to know their role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .single();

      toast.success(`Welcome back, ${profile?.full_name || "User"}!`);

      const targetPath = redirectTo || (profile?.role ? `/${profile.role}` : "/student");
      router.push(targetPath);
      router.refresh();
    } catch (err: unknown) {
      let message =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please verify and try again.";

      if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("networkerror")) {
        message = "Cannot connect to Supabase: Your Supabase project appears to be paused due to inactivity, or the network is unreachable. Please visit supabase.com/dashboard and click 'Restore project' to unpause it.";
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
          Enter your institutional credentials to access GeoAttend
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
            disabled={loading}
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
