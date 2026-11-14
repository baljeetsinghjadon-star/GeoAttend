import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-radial-[at_top_right] from-blue-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xs border border-slate-200/80 dark:border-slate-800"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              GeoAttend
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Smart Geofence Attendance System
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
