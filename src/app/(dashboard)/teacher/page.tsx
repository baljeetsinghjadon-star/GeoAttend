import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, BookOpen, CalendarCheck, FileSpreadsheet, ArrowRight } from "lucide-react";

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Instructor Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create geofenced sessions, track live roll-calls, and manage student attendance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-blue-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mb-2">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Class Sessions</CardTitle>
            <CardDescription>
              Launch new attendance sessions or monitor current active lectures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/sessions">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Sessions <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-emerald-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-2">
              <BookOpen className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">My Classes</CardTitle>
            <CardDescription>
              View assigned classes and rosters of enrolled students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/classes">
              <Button variant="outline" size="sm" className="w-full gap-2">
                My Classes <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Geofence Zones</CardTitle>
            <CardDescription>
              Configure lecture halls and lab zones on OpenStreetMap.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/zones">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Manage Zones <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-amber-500/50 transition-all">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">Reports</CardTitle>
            <CardDescription>
              Review attendance records and export CSV sheets for grading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/reports">
              <Button variant="outline" size="sm" className="w-full gap-2">
                View Reports <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
