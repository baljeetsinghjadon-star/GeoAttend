"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Mail, Users, CheckCircle } from "lucide-react";
import { ClassItem } from "@/types/database";

interface BulkStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassItem[];
  onSuccess: () => void;
}

export function BulkStudentModal({
  open,
  onOpenChange,
  classes,
  onSuccess,
}: BulkStudentModalProps) {
  const [emailsInput, setEmailsInput] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedEmails = emailsInput
    .split(/[\n,; ]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 3 && e.includes("@"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedEmails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: parsedEmails,
          classId: selectedClassId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add students");

      const parts: string[] = [];
      if (json.createdCount > 0) parts.push(`${json.createdCount} new account(s) created`);
      if (json.enrolledCount > 0) parts.push(`${json.enrolledCount} enrolled into class`);
      if (json.alreadyExistsCount > 0) parts.push(`${json.alreadyExistsCount} existing account(s) processed`);

      const summary = parts.length > 0 ? parts.join(", ") : "Students processed successfully";
      toast.success(`Success! ${summary} (Default password: Student@123456)`, {
        duration: 7000,
      });

      setEmailsInput("");
      setSelectedClassId("");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add students";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
          <Users className="h-5 w-5 text-blue-600" />
          Bulk Add Students by Email
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Optional Class Assignment */}
          <div className="space-y-1.5">
            <Label htmlFor="targetClass">Assign to Course Cohort (Optional)</Label>
            <select
              id="targetClass"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="">Campus Directory Only (Do not assign to a specific class)</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} — {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="studentEmails" className="font-semibold text-xs">
                Student Email Addresses
              </Label>
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                {parsedEmails.length} email(s) detected
              </span>
            </div>
            <textarea
              id="studentEmails"
              rows={5}
              value={emailsInput}
              onChange={(e) => setEmailsInput(e.target.value)}
              placeholder="Paste student emails separated by newlines, commas, or spaces:&#10;&#10;student1@college.edu&#10;student2@college.edu&#10;student3@college.edu"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/40 p-3 border border-blue-200/80 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Automated Student Account Setup
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Accounts will be automatically created with email pre-verified and password:{" "}
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                Student@123456
              </span>
              . Students can sign in right away from their phones!
            </p>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || parsedEmails.length === 0}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Adding Students..." : `Add ${parsedEmails.length || ""} Student(s)`}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
