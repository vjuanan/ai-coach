-- Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public access to view avatars
DROP POLICY IF EXISTS "Avatar images are public" ON storage.objects;
CREATE POLICY "Avatar images are public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Policy: Allow users to update their own avatars (based on naming convention or just general update if we can't restrict easily by folder structure yet, usually we want to restrict to their own folder, but for now simple authenticated update is better than nothing, or we can rely on file path strategy like `avatars/{user_id}/...`)
-- Let's try to restrict to their own folder if possible, assuming file path is `avatars/{user_id}/*`
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Allow users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
