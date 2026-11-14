"use client";

import React, { useEffect, useState } from "react";
import { ClassItem, Profile } from "@/types/database";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, UserMinus, Users, Mail, UserCheck } from "lucide-react";

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClass: ClassItem | null;
}

export function EnrollmentModal({
  open,
  onOpenChange,
  selectedClass,
}: EnrollmentModalProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [studentToEnroll, setStudentToEnroll] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [mode, setMode] = useState<"bulk" | "single">("bulk");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoster = async () => {
    if (!selectedClass) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/classes/enroll?classId=${selectedClass.id}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load class roster");

      setEnrolledStudents(json.enrolledStudents || []);
      setAllStudents(json.allStudents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load class roster";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && selectedClass) {
      fetchRoster();
      setBulkEmails("");
      setStudentToEnroll("");
    }
  }, [open, selectedClass]);

  // Single student dropdown enrollment
  const handleSingleEnroll = async () => {
    if (!selectedClass || !studentToEnroll) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/classes/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass.id,
          studentId: studentToEnroll,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to enroll student");

      toast.success("Student enrolled successfully!");
      setStudentToEnroll("");
      fetchRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enroll student";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk enrollment by emails
  const handleBulkEnroll = async () => {
    if (!selectedClass || !bulkEmails.trim()) {
      toast.error("Please enter at least one student email address");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/classes/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass.id,
          emails: bulkEmails,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to enroll students");

      const successMsg = `Enrolled ${json.enrolledCount} student(s)! ${
        json.newAccountsCount > 0
          ? `(${json.newAccountsCount} new student account(s) created with default password Student@123456)`
          : ""
      } ${json.alreadyEnrolledCount > 0 ? `(${json.alreadyEnrolledCount} already in class)` : ""}`;

      toast.success(successMsg, { duration: 6000 });
      setBulkEmails("");
      fetchRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enroll students";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (studentId: string, studentName: string) => {
    if (!selectedClass) return;
    if (!confirm(`Remove ${studentName} from this class?`)) return;

    try {
      const res = await fetch(
        `/api/classes/enroll?classId=${selectedClass.id}&studentId=${studentId}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to remove student");

      toast.success("Student removed from roster");
      fetchRoster();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove student";
      toast.error(msg);
    }
  };

  const enrolledIds = new Set(enrolledStudents.map((s) => s.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Roster: {selectedClass?.code} - {selectedClass?.name}
        </DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Toggle Mode: Bulk Emails vs Single Dropdown */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("bulk")}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === "bulk"
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Bulk Add by Email (Multiple)
          </button>
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === "single"
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Select Existing Student
          </button>
        </div>

        {/* Bulk Email Enrollment Box */}
        {mode === "bulk" ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Paste Student Email Addresses
              </label>
              <span className="text-[10px] text-slate-500">
                Separated by commas, spaces, or lines
              </span>
            </div>
            <textarea
              rows={3}
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder="e.g.&#10;alice@college.edu&#10;bob@college.edu, charlie@college.edu"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                💡 Automatically creates student accounts with default password{" "}
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  Student@123456
                </span>
              </p>
              <Button
                size="sm"
                onClick={handleBulkEnroll}
                disabled={submitting || !bulkEmails.trim()}
                className="gap-1.5 shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {submitting ? "Enrolling..." : "Enroll All"}
              </Button>
            </div>
          </div>
        ) : (
          /* Single Student Dropdown */
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select from Registered Students
            </label>
            <div className="flex gap-2">
              <select
                value={studentToEnroll}
                onChange={(e) => setStudentToEnroll(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Select a student...</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.email})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleSingleEnroll}
                disabled={submitting || !studentToEnroll}
                className="gap-1.5 h-10"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {submitting ? "Enrolling..." : "Enroll"}
              </Button>
            </div>
          </div>
        )}

        {/* Current Roster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Enrolled Students in this Course</span>
            <Badge variant="secondary">{enrolledStudents.length} Students</Badge>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Loading roster...
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No students enrolled yet. Paste student emails above to add them.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                      {student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => handleRemove(student.id, student.full_name)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close Roster
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
