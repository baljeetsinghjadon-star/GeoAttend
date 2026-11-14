"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClassItem, GeofenceZone, ClassSession } from "@/types/database";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, RefreshCw, Save } from "lucide-react";

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToEdit?: ClassSession | null;
  onSuccess: () => void;
}

export function SessionForm({
  open,
  onOpenChange,
  sessionToEdit,
  onSuccess,
}: SessionFormProps) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [classId, setClassId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [requireCode, setRequireCode] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Random 6-digit PIN generator
  const generateRandomCode = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(randomPin);
  };

  useEffect(() => {
    async function loadSelectData() {
      const supabase = createClient();
      const [classRes, zoneRes] = await Promise.all([
        fetch("/api/classes?all=true").then((r) => r.json()),
        fetch("/api/zones").then((r) => r.json()),
      ]);
      setClasses(classRes.classes || []);
      setZones(zoneRes.zones || []);
    }

    if (open) {
      loadSelectData();
    }
  }, [open]);

  useEffect(() => {
    if (sessionToEdit) {
      setClassId(sessionToEdit.class_id);
      setZoneId(sessionToEdit.zone_id);
      setTitle(sessionToEdit.title);
      // Format to datetime-local
      const start = new Date(sessionToEdit.start_time);
      const end = new Date(sessionToEdit.end_time);
      setStartTime(start.toISOString().slice(0, 16));
      setEndTime(end.toISOString().slice(0, 16));
      setRequireCode(sessionToEdit.require_code);
      setCode(sessionToEdit.code || "");
    } else {
      setClassId("");
      setZoneId("");
      setTitle("");
      // Default: starts now, ends in 90 minutes
      const now = new Date();
      const later = new Date(now.getTime() + 90 * 60000);
      setStartTime(now.toISOString().slice(0, 16));
      setEndTime(later.toISOString().slice(0, 16));
      setRequireCode(false);
      setCode("");
    }
  }, [sessionToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !zoneId) {
      toast.error("Please select a class and geofence zone");
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      toast.error("Session end time must be after start time");
      return;
    }

    if (requireCode && (!code || code.length !== 6)) {
      toast.error("Anti-cheat session code must be exactly 6 characters");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        class_id: classId,
        zone_id: zoneId,
        title,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        require_code: requireCode,
        code: requireCode ? code : null,
      };

      if (sessionToEdit) {
        payload.id = sessionToEdit.id;
      }

      const res = await fetch("/api/sessions", {
        method: sessionToEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save session");

      toast.success(sessionToEdit ? "Attendance session updated" : "Attendance session launched successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save session";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>
          {sessionToEdit ? "Edit Attendance Session" : "Schedule Attendance Session"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="sessionTitle">Session Title</Label>
            <Input
              id="sessionTitle"
              placeholder="e.g. CS101 Lecture: Binary Search Trees"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="classSelect">Course / Class</Label>
              <select
                id="classSelect"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">Select a class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zoneSelect">Geofence Zone</Label>
              <select
                id="zoneSelect"
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100"
                required
              >
                <option value="">Select a zone...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.radius_meters}m radius)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Date & Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endTime">End Date & Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Optional Anti-Cheat 6-digit Code */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="requireCode"
                  className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="h-4 w-4 text-purple-500" />
                  Optional Anti-Cheat 6-Digit Code
                </Label>
                <p className="text-[11px] text-slate-500">
                  Require students inside the zone to also type a board PIN
                </p>
              </div>

              <input
                id="requireCode"
                type="checkbox"
                checked={requireCode}
                onChange={(e) => {
                  setRequireCode(e.target.checked);
                  if (e.target.checked && !code) {
                    generateRandomCode();
                  }
                }}
                className="h-4 w-4 rounded-md accent-blue-600 cursor-pointer"
              />
            </div>

            {requireCode && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="6-digit code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono text-center tracking-widest font-bold text-base h-10 w-44"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomCode}
                  className="gap-1.5 text-xs h-10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate New Code
                </Button>
              </div>
            )}
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
            {loading ? "Scheduling..." : sessionToEdit ? "Update Session" : "Launch Session"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
