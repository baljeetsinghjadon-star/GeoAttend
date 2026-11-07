-- ==============================================================================
-- GeoAttend Demo Seed Data (Valid Hexadecimal UUIDs)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor after 001 and 002.
-- ==============================================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Demo Users in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES
-- Admin User
(
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@geoattend.app',
    crypt('Admin@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Campus Administrator","role":"admin"}',
    now(),
    now()
),
-- Teacher User
(
    '00000000-0000-0000-0000-000000000000',
    'b0000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'teacher@geoattend.app',
    crypt('Teacher@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Prof. Alan Turing","role":"teacher"}',
    now(),
    now()
),
-- Student User
(
    '00000000-0000-0000-0000-000000000000',
    'c0000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'student@geoattend.app',
    crypt('Student@123456', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Ada Lovelace","role":"student"}',
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Upsert Profiles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@geoattend.app', 'Campus Administrator', 'admin'),
('b0000000-0000-0000-0000-000000000002', 'teacher@geoattend.app', 'Prof. Alan Turing', 'teacher'),
('c0000000-0000-0000-0000-000000000003', 'student@geoattend.app', 'Ada Lovelace', 'student')
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 3. Create Geofence Zones (Valid hex starting with 'd0000000...')
INSERT INTO public.zones (id, name, description, latitude, longitude, radius_meters, created_by)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Main Auditorium (Hall A)',
    'Central campus lecture hall for high-capacity courses',
    28.545123,
    77.192345,
    60,
    'b0000000-0000-0000-0000-000000000002'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Computing Lab 304',
    'Advanced engineering and software computing lab',
    28.545890,
    77.193100,
    35,
    'b0000000-0000-0000-0000-000000000002'
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Campus Library Seminar Room',
    'Quiet study and tutorial conference area',
    28.544500,
    77.191500,
    50,
    'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create Classes (Valid hex starting with 'c1111111...')
INSERT INTO public.classes (id, name, code, description, teacher_id)
VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    'CS101: Computer Science & Data Structures',
    'CS101',
    'Foundational programming concepts, asymptotic complexity, and basic data structures',
    'b0000000-0000-0000-0000-000000000002'
),
(
    'c2222222-2222-2222-2222-222222222222',
    'PHYS201: Classical Mechanics & Laboratory',
    'PHYS201',
    'Newtonian kinematics, harmonic motion, and experimental physics lab',
    'b0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Enroll Demo Student in Classes
INSERT INTO public.class_enrollments (class_id, student_id)
VALUES
('c1111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000003'),
('c2222222-2222-2222-2222-222222222222', 'c0000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 6. Create Active Attendance Sessions (Valid hex starting with 'e1111111...')
INSERT INTO public.sessions (
    id,
    class_id,
    zone_id,
    title,
    start_time,
    end_time,
    code,
    require_code,
    is_active
) VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'd0000000-0000-0000-0000-000000000001',
    'CS101 Lecture: Binary Search Trees',
    now() - interval '30 minutes',
    now() + interval '3 hours',
    '842915',
    false,
    true
),
(
    'e2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    'd0000000-0000-0000-0000-000000000002',
    'PHYS201 Lab: Pendulum Oscillation Analysis',
    now() - interval '10 minutes',
    now() + interval '2 hours',
    '492813',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;
