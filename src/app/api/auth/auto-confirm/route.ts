import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = createAdminClient();

    // 1. Try to find user profile to get their auth id
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (profile?.id) {
      // Auto-confirm the user in auth.users
      await admin.auth.admin.updateUserById(profile.id, {
        email_confirm: true,
      });

      return NextResponse.json({
        success: true,
        confirmed: true,
        user: { id: profile.id, role: profile.role },
      });
    }

    // 2. If no profile found yet, query auth.users list
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (!listError && usersData?.users) {
      const match = usersData.users.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (match) {
        await admin.auth.admin.updateUserById(match.id, {
          email_confirm: true,
        });

        // Ensure profile row exists
        const fullName =
          match.user_metadata?.full_name ||
          match.user_metadata?.name ||
          match.email?.split("@")[0] ||
          "Student";
        const role = match.user_metadata?.role || "student";

        await admin.from("profiles").upsert({
          id: match.id,
          email: cleanEmail,
          full_name: fullName,
          role: role,
        });

        return NextResponse.json({
          success: true,
          confirmed: true,
          user: { id: match.id, role },
        });
      }
    }

    return NextResponse.json(
      { error: "Account with this email was not found." },
      { status: 404 }
    );
  } catch (err: unknown) {
    console.error("API /api/auth/auto-confirm error:", err);
    const message = err instanceof Error ? err.message : "Auto-confirm failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
