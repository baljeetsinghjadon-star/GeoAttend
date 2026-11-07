import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { overrideAttendanceSchema } from "@/lib/validations/attendance";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch requester profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json(
        { error: "Forbidden: Only teachers and administrators can override attendance" },
        { status: 403 }
      );
    }

    // 3. Validate body with Zod
    const body = await req.json();
    const parseResult = overrideAttendanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { attendanceId, status, reason } = parseResult.data;

    // 4. Fetch existing attendance record
    const { data: existing, error: fetchErr } = await supabase
      .from("attendance")
      .select("*, session:sessions(*, class:classes(*))")
      .eq("id", attendanceId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // 5. If teacher, verify they teach this class
    if (
      profile.role === "teacher" &&
      existing.session?.class?.teacher_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You are not the assigned teacher for this class" },
        { status: 403 }
      );
    }

    // 6. Update attendance status
    const newStatus = status === "PRESENT" ? "OVERRIDDEN" : "REJECTED";
    const { error: updateErr } = await supabase
      .from("attendance")
      .update({
        status: newStatus,
        rejection_reason: status === "REJECTED" ? `Override: ${reason}` : null,
      })
      .eq("id", attendanceId);

    if (updateErr) throw updateErr;

    // 7. Write to Audit Logs table
    await supabase.from("audit_logs").insert({
      action: "ATTENDANCE_OVERRIDE",
      performed_by: user.id,
      target_id: attendanceId,
      details: {
        previous_status: existing.status,
        new_status: newStatus,
        reason: reason,
        student_id: existing.student_id,
        session_id: existing.session_id,
        performed_by_name: profile.full_name,
        performed_by_role: profile.role,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: "Attendance overridden and logged to audit trail",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
