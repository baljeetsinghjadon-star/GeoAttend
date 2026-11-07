import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse query filters
    const searchParams = req.nextUrl.searchParams;
    const classId = searchParams.get("classId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    let query = supabase
      .from("attendance")
      .select(
        "*, student:profiles!attendance_student_id_fkey(full_name, email), session:sessions(*, class:classes(*))"
      )
      .order("verified_at", { ascending: false });

    // Role-specific constraints
    if (profile.role === "teacher") {
      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);
      const myClassIds = (myClasses || []).map((c) => c.id);
      if (myClassIds.length > 0) {
        query = query.in("session.class_id", myClassIds);
      } else {
        return new NextResponse("No classes found", { status: 200 });
      }
    }

    if (classId) {
      query = query.eq("session.class_id", classId);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (startDate) {
      query = query.gte("verified_at", new Date(startDate).toISOString());
    }
    if (endDate) {
      query = query.lte("verified_at", new Date(endDate).toISOString());
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // 3. Generate CSV rows
    const csvHeader = [
      "Student Name",
      "Student Email",
      "Course Code",
      "Course Name",
      "Session Title",
      "Status",
      "Distance (m)",
      "Accuracy (m)",
      "Timestamp (UTC)",
      "Rejection Reason",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = (records || []).map((r) => [
      escapeCsv(r.student?.full_name || "Unknown"),
      escapeCsv(r.student?.email || "Unknown"),
      escapeCsv(r.session?.class?.code || "—"),
      escapeCsv(r.session?.class?.name || "—"),
      escapeCsv(r.session?.title || "—"),
      escapeCsv(r.status),
      escapeCsv(r.distance_meters),
      escapeCsv(r.accuracy),
      escapeCsv(r.verified_at),
      escapeCsv(r.rejection_reason || ""),
    ]);

    const csvContent = [
      csvHeader.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\r\n");

    const filename = `geoattend_report_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to export report";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
