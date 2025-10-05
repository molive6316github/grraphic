/*
  # Create storage policies for design-images bucket

  1. Storage Policies
    - Allow authenticated users to upload images to their own folder
    - Allow public read access to uploaded images
  
  2. Security
    - Users can only upload to folders matching their user ID
    - Public read access for sharing functionality
*/

-- Create the design-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-images', 'design-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'design-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to all images in the bucket
CREATE POLICY "Public read access for images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'design-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'design-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );