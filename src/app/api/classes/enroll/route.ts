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
    const { classId, studentId, emails } = body;

    if (!classId) {
      return NextResponse.json({ error: "classId is required" }, { status: 400 });
    }

    // --- BULK ENROLLMENT BY EMAILS ---
    if (emails) {
      const emailList: string[] = Array.isArray(emails)
        ? emails
        : String(emails)
            .split(/[\n,; ]+/)
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.length > 3 && e.includes("@"));

      if (emailList.length === 0) {
        return NextResponse.json(
          { error: "No valid email addresses provided. Please enter at least one email." },
          { status: 400 }
        );
      }

      let enrolledCount = 0;
      let newAccountsCount = 0;
      let alreadyEnrolledCount = 0;
      const errors: string[] = [];

      for (const email of emailList) {
        try {
          // 1. Check if profile exists
          let studentUid: string | null = null;
          const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (existingProfile) {
            studentUid = existingProfile.id;
          } else {
            // 2. Create auth user with default password
            const defaultPassword = "Student@123456";
            const displayName = email.split("@")[0];

            const { data: newUser, error: createErr } =
              await adminClient.auth.admin.createUser({
                email,
                password: defaultPassword,
                email_confirm: true,
                user_metadata: {
                  full_name: displayName,
                  role: "student",
                },
              });

            if (createErr) {
              // User might exist in auth.users but not profiles
              const { data: listUsers } = await adminClient.auth.admin.listUsers();
              const matchedUser = listUsers?.users?.find(
                (u) => u.email?.toLowerCase() === email
              );
              if (matchedUser) {
                studentUid = matchedUser.id;
              } else {
                errors.push(`Could not create account for ${email}: ${createErr.message}`);
                continue;
              }
            } else if (newUser?.user) {
              studentUid = newUser.user.id;
              newAccountsCount++;
            }

            if (studentUid) {
              // Ensure profile row exists
              await adminClient.from("profiles").upsert({
                id: studentUid,
                email,
                full_name: displayName,
                role: "student",
              });
            }
          }

          if (studentUid) {
            // 3. Enroll into class
            const { error: enrollErr } = await adminClient
              .from("class_enrollments")
              .insert({
                class_id: classId,
                student_id: studentUid,
              });

            if (enrollErr) {
              if (enrollErr.code === "23505") {
                alreadyEnrolledCount++;
              } else {
                errors.push(`Error enrolling ${email}: ${enrollErr.message}`);
              }
            } else {
              enrolledCount++;
            }
          }
        } catch (itemErr: unknown) {
          const msg = itemErr instanceof Error ? itemErr.message : "Unknown error";
          errors.push(`Failed for ${email}: ${msg}`);
        }
      }

      return NextResponse.json({
        success: true,
        enrolledCount,
        newAccountsCount,
        alreadyEnrolledCount,
        totalSubmitted: emailList.length,
        errors,
      });
    }

    // --- SINGLE STUDENT ENROLLMENT ---
    if (!studentId) {
      return NextResponse.json(
        { error: "Please select a student or enter email addresses" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: "Student is already enrolled in this class." },
          { status: 400 }
        );
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
