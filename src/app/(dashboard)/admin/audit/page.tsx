"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditLog } from "@/types/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Clock, User, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*, actor:profiles!audit_logs_performed_by_fkey(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Security Audit Trail
          </h1>
          <Badge variant="outline" className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 gap-1">
            <ShieldAlert className="h-3 w-3" />
            Immutable Logs
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tamper-evident record of manual attendance overrides, administrative edits, and permission changes
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Audit Events</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {logs.length} Logged Entries
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Every manual override requires a written justification that is permanently preserved in this audit ledger
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading security audit ledger...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit logs recorded yet. When a teacher or administrator overrides an attendance record, it will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {logs.map((log) => {
                const details = log.details as Record<string, unknown>;
                const reason = details?.reason as string;
                const prevStatus = details?.previous_status as string;
                const newStatus = details?.new_status as string;

                return (
                  <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono text-[10px]">
                          {log.action}
                        </Badge>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {log.actor?.full_name || "Authorized User"}
                        </span>
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {log.actor?.role || "Staff"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {reason && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span>
                            Status Transition:{" "}
                            <span className="font-mono line-through text-slate-400">{prevStatus}</span>{" "}
                            → <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{newStatus}</span>
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic pl-5">
                          &quot;{reason}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
