# 📍 GeoAttend — Mobile-First Geofence Attendance System

GeoAttend is a production-ready, mobile-first web application designed for universities, colleges, and schools. It enables students to mark attendance with a single tap on their mobile phones, validated strictly server-side using real GPS geofencing, the Haversine formula, GPS accuracy thresholds, and scheduled lecture time windows.

---

## 🌟 Key Features

### 👨‍🎓 For Students
- **Mobile-First 1-Tap Marking:** Big touch-friendly button with clear animated states (*Acquiring GPS Signal...*, *Verifying with Server...*, *Verified & Present*).
- **Friendly Permission Explainer:** Transparent explanations of why GPS is needed, with zero background tracking.
- **Accurate Rejection Feedback:** Explains why an attempt failed in plain English (e.g. *"You are 142m outside the zone"*, *"GPS accuracy ±160m is too weak"*, *"Session window closed"*).
- **Attendance History & Statistics:** Real-time percentage attendance per course with visual progress bars.
- **Confetti Celebration:** Haptic and visual celebratory feedback upon verified check-in.

### 👩‍🏫 For Teachers & Instructors
- **Interactive OpenStreetMap Geofencing:** Click or drag pins on a live Leaflet map to set boundary centers; slider to set radius from 20m to 1000m with live circular boundary preview. No paid Google Maps API keys needed!
- **Scheduled Lecture Windows:** Create attendance sessions tied to course cohorts and physical classroom zones.
- **Optional Anti-Cheat PIN:** Generate an optional 6-digit board code that students must also type while inside the room.
- **Live Classroom Monitor:** Watch roll call update in real-time as students check in.
- **Manual Attendance Overrides:** Adjust a student's status with a mandatory written justification.

### 🏛️ For Administrators
- **Campus-Wide Governance:** Manage all campus geofence zones, departments, classes, instructors, and student rosters.
- **CSV Spreadsheets:** Filter attendance by date range, course, or student with 1-click compliant CSV downloads.
- **Security Audit Trail:** Permanent, tamper-evident audit logs capturing every manual override and administrative action.

---

## 🛡️ Anti-Cheat & Server-Side Security Architecture

Client devices can be spoofed or manipulated. Therefore, **the browser never decides whether an attendance attempt is valid**.

Every check-in request to `/api/attendance/mark` executes 10 strict server checks:
1. **Sliding-Window Rate Limiter:** Protects against automated script spamming and brute-force PIN guessing.
2. **Session Authentication:** Ensures the user is logged in with valid Supabase auth cookies.
3. **Class Enrollment Guard:** Verifies the student is actively enrolled in that specific course.
4. **Server-Side Time Window:** Checks current atomic server time against lecture `start_time` and `end_time` (ignores manipulated device clocks).
5. **Session PIN Verification:** If enabled, verifies the student's 6-digit PIN matches the instructor's code.
6. **Haversine Distance Engine:** Computes great-circle distance over the Earth's curvature between student coordinates and the zone center down to centimeter precision.
7. **GPS Accuracy Threshold:** Automatically rejects location submissions with poor accuracy ($\ge 100$ meters) to prevent passing with huge radius circles of uncertainty.
8. **Radius Check:** Ensures `distance <= zone_radius`. If outside, records exact distance outside.
9. **Race Condition Prevention:** Database `UNIQUE(session_id, student_id)` constraint prevents double-marking.
10. **Full Audit Logging:** All attempts (successful and failed) are logged with raw GPS coordinates, accuracy, and device metadata.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + custom radar & confetti animations
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
- **Maps:** Leaflet + OpenStreetMap (100% free, no credit card or paid API keys required)
- **Validation:** Zod schemas
- **Icons & UI:** Lucide React, Sonner Toasts, Canvas Confetti
- **Testing:** Node.js native test runner + tsx

---

## 🚀 Quick Start Guide

### Step 1: Clone and Install Dependencies
```bash
cd GeoAttend
npm install
```

### Step 2: Configure Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Run the files in order:
   - `supabase/migrations/001_initial_schema.sql` (Creates tables, triggers, and indexes)
   - `supabase/migrations/002_rls_policies.sql` (Enables Row Level Security for all roles)
   - `supabase/seed.sql` (Populates ready-to-test demo accounts, classes, zones, and active sessions)
4. Go to **Project Settings -> API** and copy:
   - **Project URL**
   - **anon / public key**
   - **service_role secret key**

### Step 3: Set Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop.

---

## 👥 Ready-to-Use Demo Accounts

The seed script creates 3 demo accounts. You can also click the quick-fill buttons on the login screen:

| Role | Email | Password |
|---|---|---|
| **Campus Admin** | `admin@geoattend.app` | `Admin@123456` |
| **Instructor** | `teacher@geoattend.app` | `Teacher@123456` |
| **Student** | `student@geoattend.app` | `Student@123456` |

---

## 🧪 Running Unit Tests

The mathematical Haversine engine and geofence decision logic are covered by standalone unit tests:
```bash
npm test
```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Click **Deploy**. Your geofenced attendance system is live!
