-- ==============================================================================
-- GeoAttend Migration 003: Fix RLS Mutual Recursion Between Classes & Enrollments
-- ==============================================================================
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Helper function: is_class_teacher (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_class_teacher(c_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classes
        WHERE id = c_id AND teacher_id = auth.uid()
    );
$$;

-- 2. Helper function: is_enrolled_student (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_enrolled_student(c_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.class_enrollments
        WHERE class_id = c_id AND student_id = auth.uid()
    );
$$;

-- 3. Replace CLASSES policies with non-recursive versions
DROP POLICY IF EXISTS "Classes viewable by relevant users" ON public.classes;
CREATE POLICY "Classes viewable by relevant users"
ON public.classes FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    teacher_id = auth.uid() OR
    public.is_enrolled_student(id)
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

-- 4. Replace CLASS ENROLLMENTS policies with non-recursive versions
DROP POLICY IF EXISTS "Enrollments viewable by enrolled student, class teacher, or admin" ON public.class_enrollments;
CREATE POLICY "Enrollments viewable by enrolled student, class teacher, or admin"
ON public.class_enrollments FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    student_id = auth.uid() OR
    public.is_class_teacher(class_id)
);

DROP POLICY IF EXISTS "Teachers and Admins can enroll students" ON public.class_enrollments;
CREATE POLICY "Teachers and Admins can enroll students"
ON public.class_enrollments FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    public.is_class_teacher(class_id)
);

DROP POLICY IF EXISTS "Teachers and Admins can remove enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers and Admins can remove enrollments"
ON public.class_enrollments FOR DELETE
TO authenticated
USING (
    public.is_admin() OR
    public.is_class_teacher(class_id)
);

-- 5. Replace SESSIONS policies to use helper functions
DROP POLICY IF EXISTS "Sessions viewable by enrolled students, teacher, or admin" ON public.sessions;
CREATE POLICY "Sessions viewable by enrolled students, teacher, or admin"
ON public.sessions FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    public.is_class_teacher(class_id) OR
    public.is_enrolled_student(class_id)
);

DROP POLICY IF EXISTS "Teachers and Admins can create sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    public.is_class_teacher(class_id)
);

DROP POLICY IF EXISTS "Teachers and Admins can update sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    public.is_class_teacher(class_id)
);

DROP POLICY IF EXISTS "Teachers and Admins can delete sessions" ON public.sessions;
CREATE POLICY "Teachers and Admins can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (
    public.is_admin() OR
    public.is_class_teacher(class_id)
);
