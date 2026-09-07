-- ==============================================================================
-- Supabase Security Setup & Schema Configuration
-- Angren Specialized School (angren-im)
-- ==============================================================================

-- 1. Create the `site_data` table
CREATE TABLE IF NOT EXISTS public.site_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Insert initial rows for all site data categories
INSERT INTO public.site_data (id, data) VALUES
  ('settings', '{"admissionActive": true}'),
  ('gallery', '[]'),
  ('students', '[]'),
  ('teachers', '[]'),
  ('events', '[]'),
  ('news', '[]'),
  ('timetable', '{}'),
  ('student_life', '[]')
ON CONFLICT (id) DO NOTHING;

-- 3. Create the `admin_users` table for Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert primary admin email
INSERT INTO public.admin_users (email)
VALUES ('angrenimuz@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Helper function to verify admin status
-- SECURITY DEFINER with fixed search_path to prevent search_path hijacking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Extract email from JWT claims
  current_user_email := auth.jwt() ->> 'email';
  
  IF current_user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check primary hardcoded admin or admin_users table
  IF lower(current_user_email) = 'angrenimuz@gmail.com' THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE lower(email) = lower(current_user_email)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- RLS for admin_users: Only admins can read the admin list
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can modify admin_users" ON public.admin_users;
CREATE POLICY "Admins can modify admin_users"
ON public.admin_users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Enable Row Level Security (RLS) on site_data
ALTER TABLE public.site_data ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for site_data
-- Allow public (anyone) to SELECT (read) public content
DROP POLICY IF EXISTS "Public can view site_data" ON public.site_data;
CREATE POLICY "Public can view site_data" 
ON public.site_data FOR SELECT 
TO public 
USING (true);

-- Restrict INSERT/UPDATE/DELETE strictly to verified admins
DROP POLICY IF EXISTS "Admins can insert site_data" ON public.site_data;
CREATE POLICY "Admins can insert site_data" 
ON public.site_data FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update site_data" ON public.site_data;
CREATE POLICY "Admins can update site_data" 
ON public.site_data FOR UPDATE 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete site_data" ON public.site_data;
CREATE POLICY "Admins can delete site_data" 
ON public.site_data FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 7. Create and secure the storage bucket 'gallery'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Setup RLS Policies for the storage bucket 'gallery'
-- Allow public to SELECT (view) images
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
CREATE POLICY "Public can view gallery"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- Restrict upload, update, and delete to verified admins
DROP POLICY IF EXISTS "Admins can upload to gallery" ON storage.objects;
CREATE POLICY "Admins can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update gallery" ON storage.objects;
CREATE POLICY "Admins can update gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery' AND public.is_admin())
WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete from gallery" ON storage.objects;
CREATE POLICY "Admins can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery' AND public.is_admin());
