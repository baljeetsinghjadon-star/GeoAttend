"use client";

import dynamic from "next/dynamic";
import React from "react";

const GeofenceMap = dynamic(() => import("./GeofenceMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <span className="text-xs font-medium">Loading OpenStreetMap Engine...</span>
    </div>
  ),
});

export default GeofenceMap;
