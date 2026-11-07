"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClassItem, UserRole } from "@/types/database";
import { ClassForm } from "@/components/admin/ClassForm";
import { EnrollmentModal } from "@/components/admin/EnrollmentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Plus, Users, Edit2, Trash2, GraduationCap } from "lucide-react";

interface ClassManagerProps {
  role: UserRole;
}

interface ClassWithCount extends ClassItem {
  enrollmentCount?: number;
  teacherName?: string;
}

export function ClassManager({ role }: ClassManagerProps) {
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClassToEdit, setSelectedClassToEdit] = useState<ClassItem | null>(null);
  const [rosterClass, setRosterClass] = useState<ClassItem | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let query = supabase
        .from("classes")
        .select("*, teacher:profiles!classes_teacher_id_fkey(full_name, email)");

      if (role === "teacher" && user) {
        query = query.eq("teacher_id", user.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch enrollment counts
      const classesWithCounts = await Promise.all(
        (data || []).map(async (cls) => {
          const { count } = await supabase
            .from("class_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);

          return {
            ...cls,
            enrollmentCount: count || 0,
            teacherName: cls.teacher?.full_name || "Assigned Teacher",
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load classes";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? All linked sessions will also be deleted.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;

      toast.success("Class deleted successfully");
      fetchClasses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete class";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Courses & Classes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {role === "admin"
              ? "Oversee campus courses, assigned faculty, and enrolled student cohorts"
              : "Manage your assigned classes and enrolled student rosters"}
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedClassToEdit(null);
            setIsFormOpen(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Class
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading classes...
        </div>
      ) : classes.length === 0 ? (
        <Card className="text-center p-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base mb-1">No Classes Registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Create your first academic class and enroll students to start tracking geofenced attendance.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSelectedClassToEdit(null);
              setIsFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Class
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id} className="flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="default" className="font-mono text-xs">
                    {cls.code}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-blue-600"
                      onClick={() => {
                        setSelectedClassToEdit(cls);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleDelete(cls.id, cls.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <CardTitle className="text-base line-clamp-1">{cls.name}</CardTitle>
                {cls.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {cls.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Instructor:</span>
                  <span className="font-semibold">{cls.teacherName}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRosterClass(cls)}
                  className="w-full gap-2 text-xs h-9 justify-center font-medium"
                >
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>Enrolled Students ({cls.enrollmentCount})</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Class Form Dialog */}
      <ClassForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        classToEdit={selectedClassToEdit}
        onSuccess={fetchClasses}
        userRole={role === "admin" ? "admin" : "teacher"}
      />

      {/* Enrollment Roster Modal */}
      <EnrollmentModal
        open={!!rosterClass}
        onOpenChange={(open) => !open && setRosterClass(null)}
        selectedClass={rosterClass}
      />
    </div>
  );
}
