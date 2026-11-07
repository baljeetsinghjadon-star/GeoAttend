import React from "react";
import { ClassManager } from "@/components/admin/ClassManager";

export const dynamic = "force-dynamic";

export default function TeacherClassesPage() {
  return <ClassManager role="teacher" />;
}
