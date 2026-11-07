"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AttendanceRecord, ClassItem } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

interface ClassStat {
  classId: string;
  name: string;
  code: string;
  totalHeld: number;
  attended: number;
  percentage: number;
}

export default function StudentHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Fetch user attendance records
      const { data: attData, error: attErr } = await supabase
        .from("attendance")
        .select("*, session:sessions(*, class:classes(*))")
        .eq("student_id", user.id)
        .order("verified_at", { ascending: false });

      if (attErr) throw attErr;
      setRecords(attData || []);

      // 2. Fetch classes student is enrolled in
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class:classes(*)")
        .eq("student_id", user.id);

      const enrolledClasses = (enrollments || [])
        .map((e: unknown) => (e as { class: ClassItem }).class)
        .filter(Boolean);

      // 3. Compute stats per class
      const stats: ClassStat[] = await Promise.all(
        enrolledClasses.map(async (cls) => {
          // Total sessions held for this class
          const { count: totalSessions } = await supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);

          // Total attended (PRESENT or OVERRIDDEN)
          const attendedCount = (attData || []).filter(
            (r) =>
              r.session?.class_id === cls.id &&
              (r.status === "PRESENT" || r.status === "OVERRIDDEN")
          ).length;

          const total = totalSessions || 0;
          const percentage = total > 0 ? Math.round((attendedCount / total) * 100) : 100;

          return {
            classId: cls.id,
            name: cls.name,
            code: cls.code,
            totalHeld: total,
            attended: attendedCount,
            percentage,
          };
        })
      );

      setClassStats(stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load history";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/student">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Attendance History & Stats
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your attendance track record and percentages across all enrolled courses
            </p>
          </div>
        </div>
      </div>

      {/* Course Percentage Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classStats.map((stat) => (
          <Card key={stat.classId} className="hover:border-blue-500/40 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {stat.code}
                </Badge>
                <span
                  className={`text-lg font-extrabold ${
                    stat.percentage >= 75
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {stat.percentage}%
                </span>
              </div>
              <CardTitle className="text-base line-clamp-1">{stat.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stat.percentage >= 75 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Attended: {stat.attended} sessions</span>
                  <span>Held: {stat.totalHeld}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Attendance Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Detailed Check-In Records</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {records.length} Records
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Complete log of GPS submissions and verification statuses
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your records...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No attendance records found yet. Active session check-ins will be logged here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Course & Session</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">GPS Distance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {records.map((rec) => {
                    const isPresent = rec.status === "PRESENT";
                    const isOverridden = rec.status === "OVERRIDDEN";

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {rec.session?.title}
                          </p>
                          <p className="text-[10px] text-blue-600 dark:text-blue-400">
                            {rec.session?.class?.code} - {rec.session?.class?.name}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(rec.verified_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(rec.verified_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="px-4 py-3 font-mono">
                          {rec.distance_meters > 0 ? (
                            <span>{rec.distance_meters}m</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {isPresent ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Present
                            </Badge>
                          ) : isOverridden ? (
                            <Badge variant="warning" className="gap-1">
                              <ShieldCheck className="h-3 w-3" /> Overridden
                            </Badge>
                          ) : (
                            <div className="space-y-0.5">
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" /> Rejected
                              </Badge>
                              {rec.rejection_reason && (
                                <p className="text-[10px] text-red-600 dark:text-red-400 max-w-xs truncate" title={rec.rejection_reason}>
                                  {rec.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
