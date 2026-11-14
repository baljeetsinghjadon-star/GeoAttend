"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClassSession, UserRole } from "@/types/database";
import { SessionForm } from "@/components/admin/SessionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CalendarCheck,
  Plus,
  MapPin,
  Clock,
  KeyRound,
  Users,
  Edit2,
  Trash2,
  Eye,
  Activity,
} from "lucide-react";

interface SessionManagerProps {
  role: UserRole;
}

interface SessionWithDetails extends ClassSession {
  attendanceCount?: number;
}

export function SessionManager({ role }: SessionManagerProps) {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSessionToEdit, setSelectedSessionToEdit] = useState<ClassSession | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Failed to load sessions");

      setSessions(json.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sessions";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Are you sure you want to delete session "${sessionTitle}"?`)) return;

    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete session");

      toast.success("Session deleted successfully");
      fetchSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete session";
      toast.error(msg);
    }
  };

  const getSessionStatus = (session: ClassSession) => {
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    if (!session.is_active) {
      return { label: "Deactivated", variant: "secondary" as const };
    }
    if (now >= start && now <= end) {
      return { label: "Live Now", variant: "success" as const };
    }
    if (now < start) {
      return { label: "Upcoming", variant: "default" as const };
    }
    return { label: "Closed", variant: "secondary" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Attendance Sessions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Launch geofenced lecture windows and monitor live student check-ins
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedSessionToEdit(null);
            setIsFormOpen(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Schedule Session
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <Card className="text-center p-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base mb-1">No Attendance Sessions</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Schedule your first session to link a course with a geofence zone and allow students to check in.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSelectedSessionToEdit(null);
              setIsFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Session
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((sess) => {
            const status = getSessionStatus(sess);
            const isLive = status.label === "Live Now";
            const livePath =
              role === "admin"
                ? `/admin/live/${sess.id}`
                : `/teacher/live/${sess.id}`;

            return (
              <Card
                key={sess.id}
                className={`flex flex-col justify-between transition-all ${
                  isLive
                    ? "border-emerald-500 dark:border-emerald-600/60 shadow-xs"
                    : "hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={status.variant} className="gap-1 text-[11px]">
                      {isLive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
                      {status.label}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600"
                        onClick={() => {
                          setSelectedSessionToEdit(sess);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600"
                        onClick={() => handleDelete(sess.id, sess.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="text-base line-clamp-1">{sess.title}</CardTitle>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {sess.class?.code} - {sess.class?.name}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {sess.zone?.name} ({sess.zone?.radius_meters}m)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(sess.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(sess.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {sess.require_code && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                        <span className="flex items-center gap-1 text-[11px]">
                          <KeyRound className="h-3.5 w-3.5" /> PIN Code:
                        </span>
                        <span className="font-mono font-bold tracking-widest text-xs">
                          {sess.code}
                        </span>
                      </div>
                    )}
                  </div>

                  <Link href={livePath} className="block w-full">
                    <Button
                      variant={isLive ? "success" : "outline"}
                      size="sm"
                      className="w-full gap-2 text-xs font-semibold h-9"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      Live Roll Call ({sess.attendanceCount} Present)
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session Form Modal */}
      <SessionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sessionToEdit={selectedSessionToEdit}
        onSuccess={fetchSessions}
      />
    </div>
  );
}
