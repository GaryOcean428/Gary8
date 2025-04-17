-- Enable the storage extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE
);

-- Create the storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB,
  path TEXT
);

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'Documents Bucket', TRUE)
ON CONFLICT DO NOTHING;

-- Add policy to allow authenticated users to upload objects to their folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Documents Insert Policy'
  ) THEN
    CREATE POLICY "Documents Insert Policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Add policy to allow users to select their own objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Documents Select Policy'
  ) THEN
    CREATE POLICY "Documents Select Policy" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'documents' AND
      owner = auth.uid()
    );
  END IF;
END $$;

-- Add policy to allow users to update their own objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Documents Update Policy'
  ) THEN
    CREATE POLICY "Documents Update Policy" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'documents' AND
      owner = auth.uid()
    );
  END IF;
END $$;

-- Add policy to allow users to delete their own objects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Documents Delete Policy'
  ) THEN
    CREATE POLICY "Documents Delete Policy" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'documents' AND
      owner = auth.uid()
    );
  END IF;
END $$;

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a convenience function to extract folder name from a path
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
  SELECT string_to_array(name, '/')
$$ LANGUAGE SQL IMMUTABLE;

-- Create a separate index to ensure we're hitting the policy when using USING
CREATE INDEX IF NOT EXISTS objects_owner_idx ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects(bucket_id);