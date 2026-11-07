import { z } from "zod";

export const markAttendanceSchema = z.object({
  sessionId: z.string().uuid("Invalid session identifier"),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  accuracy: z.number().nonnegative("Accuracy must be a non-negative number"),
  code: z.string().length(6, "Session verification code must be exactly 6 characters").optional().or(z.literal("")),
  deviceInfo: z.record(z.string(), z.unknown()).optional(),
});

export const overrideAttendanceSchema = z.object({
  attendanceId: z.string().uuid("Invalid attendance record ID"),
  status: z.enum(["PRESENT", "REJECTED"]),
  reason: z.string().min(5, "A reason of at least 5 characters is required for manual override"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type OverrideAttendanceInput = z.infer<typeof overrideAttendanceSchema>;
