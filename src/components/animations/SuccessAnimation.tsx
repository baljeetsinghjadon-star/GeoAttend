"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, MapPin } from "lucide-react";

interface SuccessAnimationProps {
  distanceMeters: number;
  sessionTitle: string;
  classNameTitle?: string;
  onClose: () => void;
}

export function SuccessAnimation({
  distanceMeters,
  sessionTitle,
  classNameTitle,
  onClose,
}: SuccessAnimationProps) {
  useEffect(() => {
    // Fire confetti cannon
    const end = Date.now() + 1.5 * 1000;
    const colors = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 space-y-5">
        <div className="relative mx-auto h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-300" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-ping" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Attendance Marked!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your physical presence inside the lecture geofence has been verified.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Session:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
              {sessionTitle}
            </span>
          </div>
          {classNameTitle && (
            <div className="flex justify-between">
              <span className="text-slate-500">Course:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {classNameTitle}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Distance to Center:
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {distanceMeters}m
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}
