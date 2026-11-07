"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Mail, User, ShieldCheck, GraduationCap, School, Check } from "lucide-react";
import { UserRole } from "@/types/database";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Explicitly ensure profile row exists with selected role
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
        });

        toast.success("Account created successfully!");
        router.push(`/${role}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not create account. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-slate-200 dark:border-slate-800">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Join GeoAttend as a student, teacher, or campus administrator
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-3.5 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role Selection Tabs */}
          <div className="space-y-1.5">
            <Label>Select Role</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all relative ${
                  role === "student"
                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {role === "student" && (
                  <span className="absolute top-1.5 right-1.5 text-blue-600">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <GraduationCap className="h-5 w-5 mb-1 text-blue-500" />
                Student
              </button>

              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all relative ${
                  role === "teacher"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {role === "teacher" && (
                  <span className="absolute top-1.5 right-1.5 text-emerald-600">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <School className="h-5 w-5 mb-1 text-emerald-500" />
                Teacher
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all relative ${
                  role === "admin"
                    ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-500 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {role === "admin" && (
                  <span className="absolute top-1.5 right-1.5 text-purple-600">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <ShieldCheck className="h-5 w-5 mb-1 text-purple-500" />
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="fullName"
                type="text"
                required
                placeholder="Alex Johnson"
                className="pl-10"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Institutional Email</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                required
                placeholder="alex@geoattend.edu"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password (min. 6 characters)</Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                required
                minLength={6}
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
            className="w-full h-11 text-sm font-semibold"
          >
            {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
