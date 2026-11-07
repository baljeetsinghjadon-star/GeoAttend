import React from "react";
import { ReportsViewer } from "@/components/admin/ReportsViewer";

export const dynamic = "force-dynamic";

export default function TeacherReportsPage() {
  return <ReportsViewer role="teacher" />;
}
