import { z } from "zod";

export const zoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters"),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  radiusMeters: z.number().min(20, "Radius must be at least 20 meters").max(1000, "Radius cannot exceed 1000 meters"),
});

export const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  code: z.string().min(2, "Class code must be at least 2 characters").toUpperCase(),
  description: z.string().optional(),
  teacherId: z.string().uuid("Please select a valid teacher"),
});

export const sessionSchema = z.object({
  classId: z.string().uuid("Please select a valid class"),
  zoneId: z.string().uuid("Please select a valid geofence zone"),
  title: z.string().min(2, "Session title must be at least 2 characters"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  requireCode: z.boolean().default(false),
  code: z.string().length(6, "Code must be 6 digits").optional().or(z.literal("")),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const enrollmentSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
});

export type ZoneInput = z.infer<typeof zoneSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
