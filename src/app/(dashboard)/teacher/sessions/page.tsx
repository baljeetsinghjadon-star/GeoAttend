import React from "react";
import { SessionManager } from "@/components/admin/SessionManager";

export const dynamic = "force-dynamic";

export default function TeacherSessionsPage() {
  return <SessionManager role="teacher" />;
}
