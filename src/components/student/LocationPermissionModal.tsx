"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Compass, CheckCircle } from "lucide-react";

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string | null;
  onRetry: () => void;
}

export function LocationPermissionModal({
  open,
  onOpenChange,
  error,
  onRetry,
}: LocationPermissionModalProps) {
  const isDenied = error?.toLowerCase().includes("denied");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Compass className="h-5 w-5 text-blue-500" />
          )}
          {error ? "Location Access Required" : "GPS Geofence Verification"}
        </DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4">
        {error ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <p className="font-semibold mb-1">Could not get your location</p>
              <p>{error}</p>
            </div>

            {isDenied ? (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p className="font-semibold text-slate-900 dark:text-slate-200">
                  How to enable location in your browser:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>
                    Tap the <strong>Lock / Settings icon</strong> next to the URL in your browser bar.
                  </li>
                  <li>
                    Find <strong>Location</strong> or <strong>Permissions</strong> and set it to <strong>Allow</strong>.
                  </li>
                  <li>
                    Refresh this page and tap <strong>&quot;Mark Attendance&quot;</strong> again.
                  </li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Please make sure High Accuracy Location / GPS is enabled in your phone settings and try again.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              GeoAttend validates attendance by verifying that you are physically inside the lecture hall boundary.
            </p>

            <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>We only read GPS at the exact moment you tap Mark Attendance.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>No continuous or background location tracking is ever conducted.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Server-side encryption protects your location and device privacy.</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Dismiss
        </Button>
        <Button
          onClick={() => {
            onOpenChange(false);
            onRetry();
          }}
          className="gap-1.5"
        >
          <MapPin className="h-4 w-4" />
          {error ? "Try Again" : "Grant Location Access"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
