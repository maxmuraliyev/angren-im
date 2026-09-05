-- 1. Create the `site_data` table
CREATE TABLE IF NOT EXISTS public.site_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Insert initial empty rows for each category
INSERT INTO public.site_data (id, data) VALUES
  ('settings', '{"admissionActive": true}'),
  ('gallery', '[]'),
  ('students', '[]'),
  ('teachers', '[]'),
  ('events', '[]'),
  ('timetable', '{}')
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS) on site_data
ALTER TABLE public.site_data ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for site_data
-- Allow public (anyone) to SELECT (read) the data
DROP POLICY IF EXISTS "Public can view site_data" ON public.site_data;
CREATE POLICY "Public can view site_data" 
ON public.site_data FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users (Admin) to INSERT/UPDATE/DELETE data
DROP POLICY IF EXISTS "Admins can insert site_data" ON public.site_data;
CREATE POLICY "Admins can insert site_data" 
ON public.site_data FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update site_data" ON public.site_data;
CREATE POLICY "Admins can update site_data" 
ON public.site_data FOR UPDATE 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins can delete site_data" ON public.site_data;
CREATE POLICY "Admins can delete site_data" 
ON public.site_data FOR DELETE 
TO authenticated 
USING (true);

-- 5. Create the storage bucket 'gallery'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup RLS Policies for the storage bucket 'gallery'
-- Allow public to SELECT (view) images
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
CREATE POLICY "Public can view gallery"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- Allow authenticated users to insert (upload) images
DROP POLICY IF EXISTS "Admins can upload to gallery" ON storage.objects;
CREATE POLICY "Admins can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- Allow authenticated users to update images
DROP POLICY IF EXISTS "Admins can update gallery" ON storage.objects;
CREATE POLICY "Admins can update gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery');

-- Allow authenticated users to delete images
DROP POLICY IF EXISTS "Admins can delete from gallery" ON storage.objects;
CREATE POLICY "Admins can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');
