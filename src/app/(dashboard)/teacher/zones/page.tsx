import React from "react";
import { ZoneManager } from "@/components/admin/ZoneManager";

export const dynamic = "force-dynamic";

export default function TeacherZonesPage() {
  return <ZoneManager role="teacher" />;
}
