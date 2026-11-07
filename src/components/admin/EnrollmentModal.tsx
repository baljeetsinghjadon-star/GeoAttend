"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClassItem, Profile } from "@/types/database";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, UserMinus, GraduationCap, Users } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

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
    }
  }, [open, selectedClass]);

  const handleEnroll = async () => {
    if (!selectedClass || !studentToEnroll) return;

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
    }
  };

  const handleRemove = async (studentId: string, studentName: string) => {
    if (!selectedClass) return;
    if (!confirm(`Remove ${studentName} from this class?`)) return;

    try {
      const res = await fetch(`/api/classes/enroll?classId=${selectedClass.id}&studentId=${studentId}`, {
        method: "DELETE",
      });

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

      <DialogContent className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Enroll New Student Bar */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Add Student to Class
          </label>
          <div className="flex gap-2">
            <select
              value={studentToEnroll}
              onChange={(e) => setStudentToEnroll(e.target.value)}
              className="flex-1 h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="">Select a student to enroll...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleEnroll}
              disabled={!studentToEnroll}
              className="gap-1.5 h-10"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Enroll
            </Button>
          </div>
        </div>

        {/* Current Roster */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Enrolled Students</span>
            <Badge variant="secondary">{enrolledStudents.length} Students</Badge>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Loading roster...
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No students enrolled yet. Select a student above to add them.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-[11px]">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {student.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
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
