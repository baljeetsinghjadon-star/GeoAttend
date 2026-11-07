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

    // Check user profile for role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "student";

    let query = adminClient
      .from("classes")
      .select("*, teacher:profiles!classes_teacher_id_fkey(full_name, email)");

    if (role === "teacher") {
      query = query.eq("teacher_id", user.id);
    }

    const { data: rawClasses, error: fetchErr } = await query.order("created_at", {
      ascending: false,
    });

    if (fetchErr) throw fetchErr;

    // Fetch enrollment counts using admin client
    const classesWithCounts = await Promise.all(
      (rawClasses || []).map(async (cls) => {
        const { count } = await adminClient
          .from("class_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("class_id", cls.id);

        return {
          ...cls,
          enrollmentCount: count || 0,
          teacherName: cls.teacher?.full_name || "Assigned Teacher",
        };
      })
    );

    return NextResponse.json({ classes: classesWithCounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch classes";
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
      return NextResponse.json(
        { error: "Forbidden: Only teachers and admins can create classes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, description, teacherId } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Course name and course code are required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check for duplicate class code
    const { data: existing } = await adminClient
      .from("classes")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Course code "${cleanCode}" already exists. Please choose a unique code.` },
        { status: 400 }
      );
    }

    const assignedTeacherId =
      profile.role === "admin" && teacherId ? teacherId : user.id;

    const { data: newClass, error: insertErr } = await adminClient
      .from("classes")
      .insert({
        name: name.trim(),
        code: cleanCode,
        description: description ? description.trim() : null,
        teacher_id: assignedTeacherId,
      })
      .select("*, teacher:profiles!classes_teacher_id_fkey(full_name, email)")
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json(
      { class: { ...newClass, enrollmentCount: 0, teacherName: newClass.teacher?.full_name || "Assigned Teacher" } },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create class";
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
    const { id, name, code, description, teacherId } = body;

    if (!id || !name || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Verify ownership if teacher
    if (profile.role === "teacher") {
      const { data: existingClass } = await adminClient
        .from("classes")
        .select("teacher_id")
        .eq("id", id)
        .single();

      if (existingClass?.teacher_id !== user.id) {
        return NextResponse.json({ error: "You can only edit your own classes." }, { status: 403 });
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : null,
    };

    if (profile.role === "admin" && teacherId) {
      updatePayload.teacher_id = teacherId;
    }

    const { data: updatedClass, error: updateErr } = await adminClient
      .from("classes")
      .update(updatePayload)
      .eq("id", id)
      .select("*, teacher:profiles!classes_teacher_id_fkey(full_name, email)")
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ class: updatedClass });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update class";
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
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 });
    }

    if (profile.role === "teacher") {
      const { data: existingClass } = await adminClient
        .from("classes")
        .select("teacher_id")
        .eq("id", id)
        .single();

      if (existingClass?.teacher_id !== user.id) {
        return NextResponse.json({ error: "You can only delete your own classes." }, { status: 403 });
      }
    }

    const { error: deleteErr } = await adminClient
      .from("classes")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete class";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
