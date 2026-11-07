"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClassSession, AttendanceRecord } from "@/types/database";
import { SessionCard } from "@/components/student/SessionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CalendarCheck, History, RefreshCw, Sparkles, MapPin } from "lucide-react";

export default function StudentDashboardPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  const fetchStudentSessions = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1. Get classes student is enrolled in
      const { data: enrollments, error: enrollErr } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id);

      if (enrollErr) throw enrollErr;

      const classIds = (enrollments || []).map((e) => e.class_id);

      if (classIds.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // 2. Get active / scheduled sessions for these classes
      const { data: sessData, error: sessErr } = await supabase
        .from("sessions")
        .select("*, class:classes(*), zone:zones(*)")
        .in("class_id", classIds)
        .order("start_time", { ascending: true });

      if (sessErr) throw sessErr;
      setSessions(sessData || []);

      // 3. Get student's attendance submissions for these sessions
      const sessionIds = (sessData || []).map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: attData } = await supabase
          .from("attendance")
          .select("*")
          .in("session_id", sessionIds)
          .eq("student_id", user.id);

        const attMap: Record<string, AttendanceRecord> = {};
        (attData || []).forEach((rec) => {
          attMap[rec.session_id] = rec;
        });
        setMyAttendance(attMap);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load student sessions";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentSessions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-semibold mb-2">
            <Sparkles className="h-3 w-3" />
            Today&apos;s Active Lectures
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Class Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tap &quot;Mark Attendance&quot; while inside the lecture hall boundary to register your presence
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudentSessions}
            disabled={loading}
            className="gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/student/history">
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs h-9">
              <History className="h-3.5 w-3.5" />
              My History
            </Button>
          </Link>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Checking enrolled classes and active geofences...
        </div>
      ) : sessions.length === 0 ? (
        <Card className="text-center p-8 sm:p-12 rounded-3xl">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            No Active Sessions Right Now
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            You don&apos;t have any lectures scheduled at this moment. When your instructor launches an attendance window, it will automatically appear here.
          </p>
          <Link href="/student/history">
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              Check Past Attendance History
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((sess) => (
            <SessionCard
              key={sess.id}
              session={sess}
              myAttendance={myAttendance[sess.id]}
              onRefresh={fetchStudentSessions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
