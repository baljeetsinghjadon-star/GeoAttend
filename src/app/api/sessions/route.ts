import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "student";

    let query = adminClient
      .from("sessions")
      .select("*, class:classes(*), zone:zones(*)")
      .order("start_time", { ascending: false });

    if (role === "teacher") {
      const { data: myClasses } = await adminClient
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      const classIds = (myClasses || []).map((c) => c.id);
      if (classIds.length === 0) {
        return NextResponse.json({ sessions: [] });
      }
      query = query.in("class_id", classIds);
    } else if (role === "student") {
      // Get enrolled classes
      const { data: enrollments } = await adminClient
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id);

      const classIds = (enrollments || []).map((e) => e.class_id);
      if (classIds.length === 0) {
        return NextResponse.json({ sessions: [] });
      }
      query = query.in("class_id", classIds);
    }

    const { data: sessionsData, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    // Fetch attendance counts
    const sessionsWithCounts = await Promise.all(
      (sessionsData || []).map(async (sess) => {
        const { count } = await adminClient
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("session_id", sess.id)
          .eq("status", "PRESENT");

        return {
          ...sess,
          attendanceCount: count || 0,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch sessions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden: Only instructors and admins can launch sessions" }, { status: 403 });
    }

    const body = await req.json();
    const { class_id, zone_id, title, start_time, end_time, require_code, code } = body;

    if (!class_id || !zone_id || !title || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields for session" }, { status: 400 });
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return NextResponse.json({ error: "Session end time must be after start time" }, { status: 400 });
    }

    if (require_code && (!code || code.length !== 6)) {
      return NextResponse.json({ error: "Anti-cheat code must be 6 digits" }, { status: 400 });
    }

    // Verify teacher owns the class if teacher
    if (profile.role === "teacher") {
      const { data: targetClass } = await adminClient
        .from("classes")
        .select("teacher_id")
        .eq("id", class_id)
        .single();

      if (targetClass?.teacher_id !== user.id) {
        return NextResponse.json({ error: "You can only launch sessions for your own classes." }, { status: 403 });
      }
    }

    const { data: newSession, error: insertErr } = await adminClient
      .from("sessions")
      .insert({
        class_id,
        zone_id,
        title: title.trim(),
        start_time,
        end_time,
        require_code: !!require_code,
        code: require_code ? code : null,
        is_active: true,
      })
      .select("*, class:classes(*), zone:zones(*)")
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ session: { ...newSession, attendanceCount: 0 } }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, class_id, zone_id, title, start_time, end_time, require_code, code, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (class_id) updatePayload.class_id = class_id;
    if (zone_id) updatePayload.zone_id = zone_id;
    if (title) updatePayload.title = title.trim();
    if (start_time) updatePayload.start_time = start_time;
    if (end_time) updatePayload.end_time = end_time;
    if (typeof require_code === "boolean") {
      updatePayload.require_code = require_code;
      updatePayload.code = require_code ? code : null;
    }
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;

    const { data: updatedSession, error: updateErr } = await adminClient
      .from("sessions")
      .update(updatePayload)
      .eq("id", id)
      .select("*, class:classes(*), zone:zones(*)")
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ session: updatedSession });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const { error: deleteErr } = await adminClient
      .from("sessions")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
