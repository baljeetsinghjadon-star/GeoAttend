-- ==============================================================================
-- GeoAttend Row Level Security (RLS) Policies (Safe & Re-runnable)
-- ==============================================================================

-- 1. Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the requesting user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- Helper function to check if the requesting user is a Teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
    );
END;
$$;

-- ==============================================================================
-- PROFILES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- ZONES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Zones viewable by authenticated users" ON public.zones;
CREATE POLICY "Zones viewable by authenticated users"
ON public.zones FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Teachers and Admins can create zones" ON public.zones;
CREATE POLICY "Teachers and Admins can create zones"
ON public.zones FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    (public.is_teacher() AND auth.uid() = created_by)
);

DROP POLICY IF EXISTS "Teachers can update own zones and Admins update any" ON public.zones;
CREATE POLICY "Teachers can update own zones and Admins update any"
ON public.zones FOR UPDATE
TO authenticated
USING (public.is_admin() OR (public.is_teacher() AND created_by = auth.uid()));

DROP POLICY IF EXISTS "Teachers can delete own zones and Admins delete any" ON public.zones;
CREATE POLICY "Teachers can delete own zones and Admins delete any"
ON public.zones FOR DELETE
TO authenticated
USING (public.is_admin() OR (public.is_teacher() AND created_by = auth.uid()));

-- ==============================================================================
-- CLASSES POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Classes viewable by relevant users" ON public.classes;
CREATE POLICY "Classes viewable by relevant users"
ON public.classes FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    teacher_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.class_enrollments
        WHERE class_enrollments.class_id = classes.id
        AND class_enrollments.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can create classes" ON public.classes;
CREATE POLICY "Teachers and Admins can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    (public.is_teacher() AND teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Teachers update own classes and Admins update any" ON public.classes;
CREATE POLICY "Teachers update own classes and Admins update any"
ON public.classes FOR UPDATE
TO authenticated
USING (public.is_admin() OR (public.is_teacher() AND teacher_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers delete own classes and Admins delete any" ON public.classes;
CREATE POLICY "Teachers delete own classes and Admins delete any"
ON public.classes FOR DELETE
TO authenticated
USING (public.is_admin() OR (public.is_teacher() AND teacher_id = auth.uid()));

-- ==============================================================================
-- CLASS ENROLLMENTS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Enrollments viewable by enrolled student, class teacher, or admin" ON public.class_enrollments;
CREATE POLICY "Enrollments viewable by enrolled student, class teacher, or admin"
ON public.class_enrollments FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    student_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can enroll students" ON public.class_enrollments;
CREATE POLICY "Teachers and Admins can enroll students"
ON public.class_enrollments FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can remove enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers and Admins can remove enrollments"
ON public.class_enrollments FOR DELETE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- ==============================================================================
-- SESSIONS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Sessions viewable by enrolled students, teacher, or admin" ON public.sessions;
CREATE POLICY "Sessions viewable by enrolled students, teacher, or admin"
ON public.sessions FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = sessions.class_id
        AND classes.teacher_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.class_enrollments
        WHERE class_enrollments.class_id = sessions.class_id
        AND class_enrollments.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can create sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = sessions.class_id
        AND classes.teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can update sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = sessions.class_id
        AND classes.teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Teachers and Admins can delete sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = sessions.class_id
        AND classes.teacher_id = auth.uid()
    )
);

-- ==============================================================================
-- ATTENDANCE POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Attendance viewable by student, teacher, or admin" ON public.attendance;
CREATE POLICY "Attendance viewable by student, teacher, or admin"
ON public.attendance FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    student_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.sessions
        JOIN public.classes ON classes.id = sessions.class_id
        WHERE sessions.id = attendance.session_id
        AND classes.teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students can record attendance" ON public.attendance;
CREATE POLICY "Students can record attendance"
ON public.attendance FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Teachers and Admins can update attendance records" ON public.attendance;
CREATE POLICY "Teachers and Admins can update attendance records"
ON public.attendance FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.sessions
        JOIN public.classes ON classes.id = sessions.class_id
        WHERE sessions.id = attendance.session_id
        AND classes.teacher_id = auth.uid()
    )
);

-- ==============================================================================
-- AUDIT LOGS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Only Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers and Admins can insert audit entries" ON public.audit_logs;
CREATE POLICY "Teachers and Admins can insert audit entries"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR public.is_teacher()
);
