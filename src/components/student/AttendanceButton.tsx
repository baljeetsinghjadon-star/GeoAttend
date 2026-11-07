"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LocationPermissionModal } from "@/components/student/LocationPermissionModal";
import { SuccessAnimation } from "@/components/animations/SuccessAnimation";
import { toast } from "sonner";
import {
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
  KeyRound,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface AttendanceButtonProps {
  sessionId: string;
  sessionTitle: string;
  classNameTitle?: string;
  zoneName?: string;
  zoneRadius?: number;
  requireCode?: boolean;
  alreadyMarked?: boolean;
  onSuccess?: () => void;
}

type MarkingState = "idle" | "locating" | "validating" | "success" | "failed";

export function AttendanceButton({
  sessionId,
  sessionTitle,
  classNameTitle,
  zoneName,
  zoneRadius,
  requireCode = false,
  alreadyMarked = false,
  onSuccess,
}: AttendanceButtonProps) {
  const [state, setState] = useState<MarkingState>(
    alreadyMarked ? "success" : "idle"
  );
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metersOutside, setMetersOutside] = useState<number | null>(null);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    distance: number;
    title: string;
  } | null>(null);

  const startMarkingAttendance = () => {
    setErrorMessage(null);
    setMetersOutside(null);

    if (requireCode && (!code || code.length !== 6)) {
      toast.error("Please enter the 6-digit session code given by your instructor");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setState("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState("validating");
        try {
          const { latitude, longitude, accuracy } = position.coords;

          const res = await fetch("/api/attendance/mark", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              latitude,
              longitude,
              accuracy,
              code: requireCode ? code : undefined,
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
              },
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setState("failed");
            const reason = data.error || data.reason || "Attendance was rejected";
            setErrorMessage(reason);
            if (data.metersOutside) {
              setMetersOutside(data.metersOutside);
            }
            toast.error(reason);
            return;
          }

          // Marked Successfully!
          setState("success");
          setSuccessInfo({
            distance: data.distanceMeters,
            title: sessionTitle,
          });
          toast.success("Attendance verified and recorded!");
          if (onSuccess) onSuccess();
        } catch (err: unknown) {
          setState("failed");
          const msg =
            err instanceof Error
              ? err.message
              : "Network error occurred while verifying attendance.";
          setErrorMessage(msg);
          toast.error(msg);
        }
      },
      (error) => {
        setState("failed");
        let msg = "Could not get your GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access to mark attendance.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS signal is currently unavailable. Move closer to a window or outdoors.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS request timed out. Please try again.";
        }
        setLocationError(msg);
        setErrorMessage(msg);
        setPermissionModalOpen(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Optional Anti-Cheat 6-digit Code Input */}
      {requireCode && state !== "success" && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-purple-500" />
            Enter 6-Digit Class PIN
          </label>
          <Input
            placeholder="e.g. 842915"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
            className="font-mono text-center tracking-widest font-bold text-base h-11"
          />
        </div>
      )}

      {/* Rejection Feedback Box */}
      {state === "failed" && errorMessage && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold">
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            <span>Attendance Rejected</span>
          </div>
          <p>{errorMessage}</p>
          {metersOutside !== null && metersOutside > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 font-mono font-bold text-[11px] mt-1">
              <MapPin className="h-3 w-3" /> ~{metersOutside}m outside zone
            </div>
          )}
        </div>
      )}

      {/* Big Touch-Friendly Button with States */}
      {state === "success" ? (
        <div className="w-full py-4 px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Attendance Verified & Present</span>
        </div>
      ) : (
        <Button
          onClick={startMarkingAttendance}
          disabled={state === "locating" || state === "validating"}
          size="xl"
          className={`w-full relative overflow-hidden transition-all duration-300 ${
            state === "locating"
              ? "bg-amber-600 hover:bg-amber-700"
              : state === "validating"
              ? "bg-blue-700"
              : state === "failed"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
          }`}
        >
          {state === "locating" && (
            <div className="flex items-center gap-2.5">
              <Radio className="h-5 w-5 animate-pulse text-amber-200" />
              <span>Acquiring High-Precision GPS...</span>
            </div>
          )}

          {state === "validating" && (
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying Geofence with Server...</span>
            </div>
          )}

          {state === "failed" && (
            <div className="flex items-center gap-2.5">
              <XCircle className="h-5 w-5" />
              <span>Try Marking Again</span>
            </div>
          )}

          {state === "idle" && (
            <div className="flex items-center gap-2.5">
              <MapPin className="h-5 w-5 animate-bounce" />
              <span>Mark Attendance</span>
            </div>
          )}
        </Button>
      )}

      {/* Permission Explainer Modal */}
      <LocationPermissionModal
        open={permissionModalOpen}
        onOpenChange={setPermissionModalOpen}
        error={locationError}
        onRetry={startMarkingAttendance}
      />

      {/* Celebratory Success Confetti Animation */}
      {successInfo && (
        <SuccessAnimation
          distanceMeters={successInfo.distance}
          sessionTitle={successInfo.title}
          classNameTitle={classNameTitle}
          onClose={() => setSuccessInfo(null)}
        />
      )}
    </div>
  );
}
