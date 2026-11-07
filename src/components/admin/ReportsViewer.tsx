"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AttendanceRecord, ClassItem, UserRole } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface ReportsViewerProps {
  role: UserRole;
}

export function ReportsViewer({ role }: ReportsViewerProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFiltersAndData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Fetch available classes
      let classQuery = supabase.from("classes").select("*").order("name");
      if (role === "teacher" && user) {
        classQuery = classQuery.eq("teacher_id", user.id);
      }
      const { data: clsData } = await classQuery;
      setClasses(clsData || []);

      // 2. Fetch attendance records
      let query = supabase
        .from("attendance")
        .select(
          "*, student:profiles!attendance_student_id_fkey(*), session:sessions(*, class:classes(*))"
        )
        .order("verified_at", { ascending: false });

      if (selectedClassId) {
        query = query.eq("session.class_id", selectedClassId);
      }
      if (selectedStatus) {
        query = query.eq("status", selectedStatus);
      }

      const { data: attData, error: attErr } = await query;
      if (attErr) throw attErr;

      setRecords(attData || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load reports";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersAndData();
  }, [selectedClassId, selectedStatus]);

  // Client-side search filtering by student name/email
  const filteredRecords = records.filter((rec) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = rec.student?.full_name?.toLowerCase().includes(query);
    const emailMatch = rec.student?.email?.toLowerCase().includes(query);
    const classMatch = rec.session?.class?.name?.toLowerCase().includes(query);
    return nameMatch || emailMatch || classMatch;
  });

  const handleDownloadCsv = () => {
    const params = new URLSearchParams();
    if (selectedClassId) params.set("classId", selectedClassId);
    if (selectedStatus) params.set("status", selectedStatus);

    window.open(`/api/attendance/export?${params.toString()}`, "_blank");
    toast.success("CSV export initiated");
  };

  const presentCount = filteredRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "OVERRIDDEN"
  ).length;
  const rejectedCount = filteredRecords.filter((r) => r.status === "REJECTED").length;
  const totalCount = filteredRecords.length;
  const presentRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Attendance Reports & CSV Export
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Query verified check-in data, filter by class cohorts, and download spreadsheets
          </p>
        </div>

        <Button
          onClick={handleDownloadCsv}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 self-start sm:self-auto shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Metric Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold">
              Total Submissions
            </CardDescription>
            <CardTitle className="text-2xl font-bold">{totalCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Present / Approved
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
              {presentCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-red-700 dark:text-red-400">
              Rejected (Out of Zone)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-800 dark:text-red-300">
              {rejectedCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Presence Rate
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-300">
              {presentRate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search student by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs"
              />
            </div>

            <div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">All Courses & Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">All Statuses</option>
                <option value="PRESENT">Present Only</option>
                <option value="REJECTED">Rejected Only</option>
                <option value="OVERRIDDEN">Overridden Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Generating report...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No attendance records match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Course & Session</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">GPS Distance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredRecords.map((rec) => {
                    const isPresent = rec.status === "PRESENT";
                    const isOverridden = rec.status === "OVERRIDDEN";

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {rec.student?.full_name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rec.student?.email}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
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

                        <td className="px-4 py-3">
                          <span className="font-mono">{rec.distance_meters}m</span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            (±{rec.accuracy}m)
                          </span>
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
