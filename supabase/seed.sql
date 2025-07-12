-- Seed data for local development
-- This file will be automatically run when you run `supabase db reset`

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('user-documents', 'user-documents', false, 10485760, NULL),
  ('user-files', 'user-files', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for profile-images bucket (public read, authenticated write)
CREATE POLICY "Public can view profile images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Set up RLS policies for user-documents bucket (private)
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Set up RLS policies for user-files bucket (private)
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Example: Create a test user (optional)
-- Note: This is just an example. In production, users would sign up through your app