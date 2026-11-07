export type UserRole = "admin" | "teacher" | "student";

export type AttendanceStatus = "PRESENT" | "REJECTED" | "OVERRIDDEN";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  teacher_id: string;
  created_at: string;
  teacher?: Profile;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  student?: Profile;
  class?: ClassItem;
}

export interface GeofenceZone {
  id: string;
  name: string;
  description?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_by: string;
  created_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  zone_id: string;
  title: string;
  start_time: string;
  end_time: string;
  code?: string | null;
  require_code: boolean;
  is_active: boolean;
  created_at: string;
  class?: ClassItem;
  zone?: GeofenceZone;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distance_meters: number;
  status: AttendanceStatus;
  rejection_reason?: string | null;
  verified_at: string;
  device_info?: Record<string, unknown> | null;
  student?: Profile;
  session?: ClassSession;
}

export interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  target_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}
