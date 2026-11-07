import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markAttendanceSchema } from "@/lib/validations/attendance";
import { validateGeofence } from "@/lib/geo/validator";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check (Max 10 requests per minute)
    const ip = req.headers.get("x-forwarded-for") || "client-ip";
    const rateCheck = checkRateLimit(`att_${ip}`, 10, 60000);

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many attendance attempts. Please wait ${Math.ceil(
            rateCheck.resetMs / 1000
          )} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    // 2. Authentication Check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    // 3. Request Payload Validation (Zod)
    const body = await req.json();
    const parseResult = markAttendanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid location payload" },
        { status: 400 }
      );
    }

    const { sessionId, latitude, longitude, accuracy, code, deviceInfo } =
      parseResult.data;

    // 4. Fetch Session, Class, and Geofence Zone
    const { data: session, error: sessErr } = await supabase
      .from("sessions")
      .select("*, class:classes(*), zone:zones(*)")
      .eq("id", sessionId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json(
        { error: "Attendance session not found" },
        { status: 404 }
      );
    }

    // 5. Check if user has already successfully marked attendance
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("id, status, verified_at")
      .eq("session_id", sessionId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (
      existingAttendance &&
      (existingAttendance.status === "PRESENT" ||
        existingAttendance.status === "OVERRIDDEN")
    ) {
      return NextResponse.json(
        {
          error:
            "You have already successfully marked attendance for this session.",
          alreadyMarked: true,
          status: existingAttendance.status,
          verifiedAt: existingAttendance.verified_at,
        },
        { status: 400 }
      );
    }

    // 6. Check Class Enrollment
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("class_id", session.class_id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (!enrollment) {
      const reason = "You are not enrolled in this course roster.";
      await recordAttempt({
        supabase,
        sessionId,
        studentId: user.id,
        latitude,
        longitude,
        accuracy,
        distanceMeters: 0,
        status: "REJECTED",
        rejectionReason: reason,
        deviceInfo,
      });

      return NextResponse.json(
        {
          success: false,
          status: "REJECTED",
          reason,
        },
        { status: 403 }
      );
    }

    // 7. Check Active Session Window (Server Time, not device time)
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);

    if (!session.is_active || now < startTime || now > endTime) {
      const reason =
        now < startTime
          ? `Session has not started yet. Starts at ${startTime.toLocaleTimeString()}`
          : "Session attendance window is closed.";

      await recordAttempt({
        supabase,
        sessionId,
        studentId: user.id,
        latitude,
        longitude,
        accuracy,
        distanceMeters: 0,
        status: "REJECTED",
        rejectionReason: reason,
        deviceInfo,
      });

      return NextResponse.json(
        {
          success: false,
          status: "REJECTED",
          reason,
        },
        { status: 400 }
      );
    }

    // 8. Anti-Cheat 6-Digit Code Verification (if enabled for session)
    if (session.require_code) {
      if (!code || code.trim().toUpperCase() !== (session.code || "").toUpperCase()) {
        const reason = "Invalid or missing 6-digit session PIN code.";
        await recordAttempt({
          supabase,
          sessionId,
          studentId: user.id,
          latitude,
          longitude,
          accuracy,
          distanceMeters: 0,
          status: "REJECTED",
          rejectionReason: reason,
          deviceInfo,
        });

        return NextResponse.json(
          {
            success: false,
            status: "REJECTED",
            reason,
          },
          { status: 400 }
        );
      }
    }

    // 9. Haversine Geofence & GPS Accuracy Validation
    const zone = session.zone;
    if (!zone) {
      return NextResponse.json(
        { error: "Geofence zone configuration missing from session" },
        { status: 500 }
      );
    }

    const geofenceResult = validateGeofence({
      studentLocation: { latitude, longitude },
      accuracyMeters: accuracy,
      zoneCenter: { latitude: zone.latitude, longitude: zone.longitude },
      zoneRadiusMeters: zone.radius_meters,
      maxAccuracyThreshold: 100, // Reject if phone GPS accuracy > 100m
    });

    if (!geofenceResult.isValid) {
      await recordAttempt({
        supabase,
        sessionId,
        studentId: user.id,
        latitude,
        longitude,
        accuracy,
        distanceMeters: geofenceResult.distanceMeters,
        status: "REJECTED",
        rejectionReason: geofenceResult.rejectionReason,
        deviceInfo,
      });

      return NextResponse.json(
        {
          success: false,
          status: "REJECTED",
          reason: geofenceResult.rejectionReason,
          distanceMeters: geofenceResult.distanceMeters,
          radiusMeters: zone.radius_meters,
          metersOutside: geofenceResult.metersOutside,
          accuracyMeters: accuracy,
        },
        { status: 400 }
      );
    }

    // 10. SUCCESS: Student is inside zone and within active window!
    const savedRecord = await recordAttempt({
      supabase,
      sessionId,
      studentId: user.id,
      latitude,
      longitude,
      accuracy,
      distanceMeters: geofenceResult.distanceMeters,
      status: "PRESENT",
      rejectionReason: null,
      deviceInfo,
    });

    return NextResponse.json({
      success: true,
      status: "PRESENT",
      distanceMeters: geofenceResult.distanceMeters,
      radiusMeters: zone.radius_meters,
      verifiedAt: savedRecord?.verified_at || new Date().toISOString(),
      sessionTitle: session.title,
      className: session.class?.name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Helper to upsert attendance attempts (including failed and successful)
 */
async function recordAttempt({
  supabase,
  sessionId,
  studentId,
  latitude,
  longitude,
  accuracy,
  distanceMeters,
  status,
  rejectionReason,
  deviceInfo,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  sessionId: string;
  studentId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  status: "PRESENT" | "REJECTED" | "OVERRIDDEN";
  rejectionReason: string | null;
  deviceInfo?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        session_id: sessionId,
        student_id: studentId,
        latitude,
        longitude,
        accuracy,
        distance_meters: distanceMeters,
        status,
        rejection_reason: rejectionReason,
        device_info: deviceInfo || {},
        verified_at: new Date().toISOString(),
      },
      { onConflict: "session_id,student_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error recording attendance attempt:", error);
  }
  return data;
}
