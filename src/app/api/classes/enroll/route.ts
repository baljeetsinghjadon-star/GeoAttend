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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json({ error: "Class ID required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Get enrolled students
    const { data: enrollments, error: enrollErr } = await adminClient
      .from("class_enrollments")
      .select("student:profiles!class_enrollments_student_id_fkey(id, email, full_name, role)")
      .eq("class_id", classId);

    if (enrollErr) throw enrollErr;

    const enrolledStudents = (enrollments || [])
      .map((e: unknown) => (e as { student: unknown }).student)
      .filter(Boolean);

    // 2. Get all students
    const { data: allStudents, error: studentsErr } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("role", "student");

    if (studentsErr) throw studentsErr;

    return NextResponse.json({
      enrolledStudents,
      allStudents: allStudents || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch roster";
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
    const body = await req.json();
    const { classId, studentId } = body;

    if (!classId || !studentId) {
      return NextResponse.json({ error: "classId and studentId are required" }, { status: 400 });
    }

    const { data: enrollment, error: insertErr } = await adminClient
      .from("class_enrollments")
      .insert({
        class_id: classId,
        student_id: studentId,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Student is already enrolled in this class." }, { status: 400 });
      }
      throw insertErr;
    }

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to enroll student";
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
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!classId || !studentId) {
      return NextResponse.json({ error: "classId and studentId required" }, { status: 400 });
    }

    const { error: deleteErr } = await adminClient
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", studentId);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to remove enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
