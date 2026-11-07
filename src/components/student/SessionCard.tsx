"use client";

import React from "react";
import { ClassSession, AttendanceRecord } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceButton } from "@/components/student/AttendanceButton";
import { MapPin, Clock, KeyRound, CheckCircle2 } from "lucide-react";

interface SessionCardProps {
  session: ClassSession;
  myAttendance?: AttendanceRecord | null;
  onRefresh: () => void;
}

export function SessionCard({
  session,
  myAttendance,
  onRefresh,
}: SessionCardProps) {
  const isPresent =
    myAttendance?.status === "PRESENT" || myAttendance?.status === "OVERRIDDEN";

  const startTime = new Date(session.start_time);
  const endTime = new Date(session.end_time);
  const now = new Date();
  const isActive = now >= startTime && now <= endTime && session.is_active;

  return (
    <Card
      className={`border transition-all ${
        isPresent
          ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
          : isActive
          ? "border-blue-300 dark:border-blue-800 shadow-md"
          : "border-slate-200 dark:border-slate-800 opacity-80"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={isPresent ? "success" : isActive ? "default" : "secondary"}
            className="text-[11px]"
          >
            {isPresent ? "Present" : isActive ? "Active Now" : "Inactive"}
          </Badge>

          <span className="font-mono text-xs font-bold text-slate-500">
            {session.class?.code}
          </span>
        </div>

        <CardTitle className="text-lg leading-tight mt-1">{session.title}</CardTitle>
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {session.class?.name}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="font-medium text-slate-900 dark:text-slate-200">
              {session.zone?.name}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {session.zone?.radius_meters}m zone
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {session.require_code && !isPresent && (
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Requires 6-digit board code from instructor</span>
            </div>
          )}
        </div>

        {/* Attendance Action */}
        {isPresent ? (
          <div className="p-3.5 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Attendance Recorded</span>
            </div>
            <span className="font-mono text-[11px]">
              {myAttendance?.distance_meters}m ({new Date(myAttendance!.verified_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          </div>
        ) : isActive ? (
          <AttendanceButton
            sessionId={session.id}
            sessionTitle={session.title}
            classNameTitle={session.class?.name}
            zoneName={session.zone?.name}
            zoneRadius={session.zone?.radius_meters}
            requireCode={session.require_code}
            alreadyMarked={false}
            onSuccess={onRefresh}
          />
        ) : (
          <div className="p-3 text-center text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            {now < startTime
              ? `Session opens at ${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Session has ended"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
