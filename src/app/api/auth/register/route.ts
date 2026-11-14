import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole } from "@/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Full Name, Institutional Email, and Password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const assignedRole: UserRole = ["admin", "teacher", "student"].includes(role)
      ? (role as UserRole)
      : "student";

    const admin = createAdminClient();

    // 1. Create auth user with pre-confirmed email so student can immediately sign in without email verification block
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        role: assignedRole,
      },
    });

    if (createError) {
      // If user already exists, check if unconfirmed and update
      if (createError.message.toLowerCase().includes("already registered") || createError.message.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please Sign In." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
    }

    // 2. Ensure profile exists in profiles table
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userData.user.id,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role: assignedRole,
    });

    if (profileError) {
      console.error("Error creating profile record:", profileError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        role: assignedRole,
      },
    });
  } catch (err: unknown) {
    console.error("API /api/auth/register error:", err);
    const message = err instanceof Error ? err.message : "Internal server error during registration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
