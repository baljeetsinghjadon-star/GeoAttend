import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
        { error: "Forbidden: Only instructors and campus administrators can add students." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { emails, classId } = body;

    if (!emails) {
      return NextResponse.json({ error: "Please provide student email addresses" }, { status: 400 });
    }

    const emailList: string[] = Array.isArray(emails)
      ? emails
      : String(emails)
          .split(/[\n,; ]+/)
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.length > 3 && e.includes("@"));

    if (emailList.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses found. Please enter valid student email addresses." },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let enrolledCount = 0;
    let alreadyExistsCount = 0;
    const errors: string[] = [];

    for (const email of emailList) {
      try {
        let studentUid: string | null = null;
        const displayName = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");

        // Check if user profile already exists
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          studentUid = existingProfile.id;
          alreadyExistsCount++;
        } else {
          // Create in auth.users with auto-confirmed email
          const { data: newUser, error: createErr } =
            await adminClient.auth.admin.createUser({
              email,
              password: "Student@123456",
              email_confirm: true,
              user_metadata: {
                full_name: displayName,
                role: "student",
              },
            });

          if (createErr) {
            // Check if already in auth.users
            const { data: userList } = await adminClient.auth.admin.listUsers();
            const found = userList?.users?.find(
              (u) => u.email?.toLowerCase() === email
            );
            if (found) {
              studentUid = found.id;
            } else {
              errors.push(`Could not create ${email}: ${createErr.message}`);
              continue;
            }
          } else if (newUser?.user) {
            studentUid = newUser.user.id;
            createdCount++;
          }

          if (studentUid) {
            await adminClient.from("profiles").upsert({
              id: studentUid,
              email,
              full_name: displayName,
              role: "student",
            });
          }
        }

        // If classId is provided, enroll into class
        if (classId && studentUid) {
          const { error: enrollErr } = await adminClient
            .from("class_enrollments")
            .insert({
              class_id: classId,
              student_id: studentUid,
            });

          if (!enrollErr) {
            enrolledCount++;
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${email}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalSubmitted: emailList.length,
      createdCount,
      alreadyExistsCount,
      enrolledCount,
      errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to bulk add students";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
