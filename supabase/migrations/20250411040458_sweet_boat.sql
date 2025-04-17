/*
  # Initial Schema Setup

  1. New Tables
    - `profiles` - Stores user profile information
    - `documents` - Stores document metadata
    - `workspaces` - Stores workspace information
    - `chats` - Stores chat metadata
    - `chat_messages` - Stores individual chat messages
    - `settings` - Stores user settings
  
  2. Security
    - Enable RLS on all tables
    - Create policies to control access to data
    - Set up appropriate authentication hooks
*/

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS "public";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS "public"."profiles" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "display_name" TEXT,
  "avatar_url" TEXT,
  "bio" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS "public"."documents" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storage_path" TEXT NOT NULL,
  "url" TEXT,
  "tags" TEXT[] DEFAULT '{}',
  "workspace_id" UUID,
  "vector_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS "public"."workspaces" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chats table
CREATE TABLE IF NOT EXISTS "public"."chats" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chat_id" UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "model" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS "public"."settings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "category" TEXT NOT NULL,
  "settings" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("user_id", "category")
);

-- Enable Row Level Security
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";

DROP POLICY IF EXISTS "Users can view own documents" ON "public"."documents";
DROP POLICY IF EXISTS "Users can create own documents" ON "public"."documents";
DROP POLICY IF EXISTS "Users can update own documents" ON "public"."documents";
DROP POLICY IF EXISTS "Users can delete own documents" ON "public"."documents";

DROP POLICY IF EXISTS "Users can view own workspaces" ON "public"."workspaces";
DROP POLICY IF EXISTS "Users can create own workspaces" ON "public"."workspaces";
DROP POLICY IF EXISTS "Users can update own workspaces" ON "public"."workspaces";
DROP POLICY IF EXISTS "Users can delete own workspaces" ON "public"."workspaces";

DROP POLICY IF EXISTS "Users can view own chats" ON "public"."chats";
DROP POLICY IF EXISTS "Users can create own chats" ON "public"."chats";
DROP POLICY IF EXISTS "Users can update own chats" ON "public"."chats";
DROP POLICY IF EXISTS "Users can delete own chats" ON "public"."chats";

DROP POLICY IF EXISTS "Users can view their chat messages" ON "public"."chat_messages";
DROP POLICY IF EXISTS "Users can insert chat messages" ON "public"."chat_messages";

DROP POLICY IF EXISTS "Users can view own settings" ON "public"."settings";
DROP POLICY IF EXISTS "Users can modify own settings" ON "public"."settings";

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile"
  ON "public"."profiles"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON "public"."profiles"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for Documents
CREATE POLICY "Users can view own documents"
  ON "public"."documents"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON "public"."documents"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON "public"."documents"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON "public"."documents"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Workspaces
CREATE POLICY "Users can view own workspaces"
  ON "public"."workspaces"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
  ON "public"."workspaces"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON "public"."workspaces"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON "public"."workspaces"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Chats
CREATE POLICY "Users can view own chats"
  ON "public"."chats"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats"
  ON "public"."chats"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON "public"."chats"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON "public"."chats"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Chat Messages
CREATE POLICY "Users can view their chat messages"
  ON "public"."chat_messages"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chat messages"
  ON "public"."chat_messages"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE id = chat_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for Settings
CREATE POLICY "Users can view own settings"
  ON "public"."settings"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own settings"
  ON "public"."settings"
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create or replace update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers before recreating
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- Create triggers for updated_at fields
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON chats
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create or replace handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing auth trigger before recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();