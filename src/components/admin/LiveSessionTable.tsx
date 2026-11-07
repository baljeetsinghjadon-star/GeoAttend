"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AttendanceRecord, ClassSession, UserRole } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Edit,
} from "lucide-react";

interface LiveSessionTableProps {
  sessionId: string;
  role: UserRole;
}

export function LiveSessionTable({ sessionId, role }: LiveSessionTableProps) {
  const [session, setSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Manual Override state
  const [overrideRecord, setOverrideRecord] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"PRESENT" | "REJECTED">("PRESENT");
  const [overrideReason, setOverrideReason] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const fetchSessionData = async () => {
    try {
      const supabase = createClient();

      // 1. Fetch Session details
      const { data: sess, error: sessErr } = await supabase
        .from("sessions")
        .select("*, class:classes(*), zone:zones(*)")
        .eq("id", sessionId)
        .single();

      if (sessErr) throw sessErr;
      setSession(sess);

      // 2. Fetch enrolled count for class
      const { count } = await supabase
        .from("class_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("class_id", sess.class_id);

      setEnrolledCount(count || 0);

      // 3. Fetch attendance submissions
      const { data: attData, error: attErr } = await supabase
        .from("attendance")
        .select("*, student:profiles!attendance_student_id_fkey(*)")
        .eq("session_id", sessionId)
        .order("verified_at", { ascending: false });

      if (attErr) throw attErr;
      setAttendance(attData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load live session";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();

    // Supabase Realtime Subscription for live updates
    const supabase = createClient();
    const channel = supabase
      .channel(`live_attendance_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchSessionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const handleManualOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideRecord || !overrideReason.trim()) {
      toast.error("Please provide a reason for the manual attendance override");
      return;
    }

    setSubmittingOverride(true);
    try {
      const res = await fetch("/api/attendance/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId: overrideRecord.id,
          status: overrideStatus,
          reason: overrideReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Override request failed");

      toast.success(
        `Attendance updated to ${overrideStatus} and logged to audit trail`
      );
      setOverrideRecord(null);
      setOverrideReason("");
      fetchSessionData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply override";
      toast.error(msg);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const presentCount = attendance.filter((a) => a.status === "PRESENT" || a.status === "OVERRIDDEN").length;
  const rejectedCount = attendance.filter((a) => a.status === "REJECTED").length;
  const attendanceRate = enrolledCount > 0 ? Math.round((presentCount / enrolledCount) * 100) : 0;

  const backUrl = role === "admin" ? "/admin/sessions" : "/teacher/sessions";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={backUrl}>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {session?.title || "Live Roll Call"}
              </h1>
              <Badge variant="success" className="gap-1 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Monitor
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session?.class?.code} - {session?.class?.name} • Zone: {session?.zone?.name} ({session?.zone?.radius_meters}m)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSessionData}
          disabled={loading}
          className="gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Present
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
              {presentCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-red-700 dark:text-red-400">
              Rejected
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-300">
              {rejectedCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold">
              Enrolled Students
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{enrolledCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Attendance Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">
              {attendanceRate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Live Submissions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Student Check-in Feed</span>
            <span className="text-xs font-normal text-slate-500">
              {attendance.length} total attempts
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Submissions verified with server-side Haversine distance, GPS accuracy margin, and active session window
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students have checked in yet. Waiting for students to tap &quot;Mark Attendance&quot; inside the classroom geofence.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Distance & Accuracy</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {attendance.map((rec) => {
                    const isPresent = rec.status === "PRESENT";
                    const isOverridden = rec.status === "OVERRIDDEN";

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {rec.student?.full_name || "Unknown Student"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rec.student?.email}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(rec.verified_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="font-mono font-medium">
                              {rec.distance_meters}m from center
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Accuracy: ±{rec.accuracy}m
                            </p>
                          </div>
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

                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 rounded-lg"
                            onClick={() => {
                              setOverrideRecord(rec);
                              setOverrideStatus(isPresent ? "REJECTED" : "PRESENT");
                              setOverrideReason("");
                            }}
                          >
                            <Edit className="h-3 w-3" />
                            Override
                          </Button>
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

      {/* Manual Override Modal with Mandatory Audit Reason */}
      <Dialog open={!!overrideRecord} onOpenChange={(open) => !open && setOverrideRecord(null)}>
        <DialogHeader onClose={() => setOverrideRecord(null)}>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Manual Attendance Override
          </DialogTitle>
        </DialogHeader>

        {overrideRecord && (
          <form onSubmit={handleManualOverride}>
            <DialogContent className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold">{overrideRecord.student?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Status:</span>
                  <Badge variant={overrideRecord.status === "PRESENT" ? "success" : "destructive"} className="text-[10px]">
                    {overrideRecord.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Distance:</span>
                  <span className="font-mono">{overrideRecord.distance_meters} meters</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="overrideStatus">New Attendance Status</Label>
                <select
                  id="overrideStatus"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as "PRESENT" | "REJECTED")}
                  className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs"
                >
                  <option value="PRESENT">Mark as PRESENT (Approved)</option>
                  <option value="REJECTED">Mark as REJECTED (Disapproved)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="overrideReason">
                  Reason for Override <span className="text-red-500">* (Logged in Audit Trail)</span>
                </Label>
                <Input
                  id="overrideReason"
                  required
                  placeholder="e.g. Student present in class, phone GPS malfunctioned due to basement walls"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideRecord(null)}
                disabled={submittingOverride}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingOverride} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                {submittingOverride ? "Recording Audit..." : "Apply Override"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
}
