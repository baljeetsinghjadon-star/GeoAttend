import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, BookOpen, CalendarCheck, FileSpreadsheet, ShieldAlert, ArrowRight } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Campus-wide geofencing, class structures, active sessions, and compliance audit trail
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:border-blue-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Geofence Zones</CardTitle>
            <CardDescription>
              Define campus boundaries on the interactive Leaflet map with adjustable radius.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/zones">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Manage Zones <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Classes & Enrollments</CardTitle>
            <CardDescription>
              Assign teachers and students to courses and academic cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/classes">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Manage Classes <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mb-2">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Class Sessions</CardTitle>
            <CardDescription>
              Schedule geofenced lecture windows and view live student attendance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/sessions">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Manage Sessions <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Reports & Exports</CardTitle>
            <CardDescription>
              Filter attendance by date, course, or student and export compliant CSV spreadsheets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="w-full gap-2">
                View Reports <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-red-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center mb-2">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Security Audit Logs</CardTitle>
            <CardDescription>
              Review all manual attendance overrides, security events, and administrative edits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/audit">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Review Audit Log <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
