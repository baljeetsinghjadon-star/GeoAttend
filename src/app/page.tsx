import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MapPin, ShieldCheck, Smartphone, Clock, ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "student";
    redirect(`/${role}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GeoAttend
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Next-Gen Mobile Geofence Attendance
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-3xl leading-[1.15]">
          Attendance validated by{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Real GPS Geofencing
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Students mark attendance directly on their mobile phones in one tap. Validated strictly server-side using the Haversine formula, GPS accuracy thresholds, and time windows.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold shadow-lg shadow-blue-500/20">
              Sign In to Your Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-semibold">
              Create New Account
            </Button>
          </Link>
        </div>

        {/* Key Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 sm:mt-24 w-full text-left">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-blue-500/50 transition-all">
            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Mobile-First 1-Tap Marking
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Native-feeling mobile experience. Transparent GPS location permission handling with instant visual feedback.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-emerald-500/50 transition-all">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Anti-Spoofing Server Verification
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Never trusts client code. Haversine distance calculations, GPS accuracy limits, and optional 6-digit session codes protect against proxy attendance.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-xs hover:border-purple-500/50 transition-all">
            <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Live Session Monitoring
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Teachers watch classroom roll calls populate in real-time. Full audit trails for manual overrides and 1-click CSV report exports.
            </p>
          </div>
        </div>

        {/* Role Overview */}
        <div className="mt-16 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Built for 3 Academic Roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="font-semibold text-blue-600 mb-1">👨‍🎓 Student</div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Active sessions view</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> 1-tap GPS attendance</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500" /> Class percentage statistics</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="font-semibold text-emerald-600 mb-1">👩‍🏫 Teacher</div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Interactive map geofencing</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Live classroom roll call</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Manual override with audit note</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="font-semibold text-purple-600 mb-1">🏛️ Administrator</div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Campus-wide zones & classes</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Complete CSV report exports</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-purple-500" /> Tamper-proof audit logs</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        GeoAttend • Production-Ready Geofence Attendance System
      </footer>
    </div>
  );
}
