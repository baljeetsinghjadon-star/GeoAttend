"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClassItem, Profile } from "@/types/database";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToEdit?: ClassItem | null;
  onSuccess: () => void;
  userRole: "admin" | "teacher";
}

export function ClassForm({
  open,
  onOpenChange,
  classToEdit,
  onSuccess,
  userRole,
}: ClassFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTeachers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher");
      setTeachers(data || []);
    }
    if (open) {
      loadTeachers();
    }
  }, [open]);

  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name);
      setCode(classToEdit.code);
      setDescription(classToEdit.description || "");
      setTeacherId(classToEdit.teacher_id);
    } else {
      setName("");
      setCode("");
      setDescription("");
      setTeacherId("");
    }
  }, [classToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If teacher role, teacherId defaults to current teacher
      const effectiveTeacherId =
        userRole === "teacher" ? user?.id : teacherId || user?.id;

      if (!effectiveTeacherId) {
        throw new Error("Please select an assigned instructor");
      }

      if (classToEdit) {
        const { error } = await supabase
          .from("classes")
          .update({
            name,
            code: code.toUpperCase().trim(),
            description,
            teacher_id: effectiveTeacherId,
          })
          .eq("id", classToEdit.id);

        if (error) throw error;
        toast.success("Class updated successfully");
      } else {
        const { error } = await supabase.from("classes").insert({
          name,
          code: code.toUpperCase().trim(),
          description,
          teacher_id: effectiveTeacherId,
        });

        if (error) throw error;
        toast.success("Class created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save class";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>{classToEdit ? "Edit Course" : "Create New Course"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="className">Course Name</Label>
            <Input
              id="className"
              placeholder="e.g. CS101: Computer Science & Data Structures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="classCode">Course Code</Label>
            <Input
              id="classCode"
              placeholder="e.g. CS101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="uppercase"
              required
            />
          </div>

          {userRole === "admin" && (
            <div className="space-y-1.5">
              <Label htmlFor="teacherSelect">Assigned Teacher</Label>
              <select
                id="teacherSelect"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">Select an instructor...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="classDesc">Syllabus / Description</Label>
            <Input
              id="classDesc"
              placeholder="e.g. Core undergraduate algorithms and discrete math"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : classToEdit ? "Update Course" : "Create Course"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
