import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // User authenticated via Google OAuth
      const adminClient = createAdminClient();
      
      // Check existing profile
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      let userRole = existingProfile?.role || "student";

      if (!existingProfile) {
        // First-time Google sign-in: directly fetch from email ID and metadata
        const email = data.user.email || "";
        const fullName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          email.split("@")[0] ||
          "Student";

        const avatarUrl =
          data.user.user_metadata?.avatar_url ||
          data.user.user_metadata?.picture ||
          null;

        await adminClient.from("profiles").upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: "student",
          avatar_url: avatarUrl,
        });
      }

      // If next is a custom internal path (e.g. /teacher or /student), respect it; otherwise go to role dashboard
      const targetPath = next !== "/" ? next : `/${userRole}`;
      return NextResponse.redirect(`${origin}${targetPath}`);
    }
  }

  // If code exchange failed or was not provided, return to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}
