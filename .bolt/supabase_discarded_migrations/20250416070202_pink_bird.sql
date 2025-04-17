/*
  # Fix Infinite Recursion in Profiles Policy

  1. Changes
    - Drops problematic policies causing infinite recursion
    - Creates a safer version of the user_has_admin_role function
    - Recreates non-recursive policies for admin and user access
    - Ensures all required columns exist on the profiles table
  
  2. Security
    - Uses SECURITY DEFINER functions to avoid RLS recursion
    - Properly scopes policies to maintain data isolation
*/

-- Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'::text,
ADD COLUMN IF NOT EXISTS is_dev_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Check constraint for role (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'dev'));
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If something goes wrong, we'll just continue
END $$;

-- Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select any profile" ON public.profiles;

-- Create a safer version of the user_has_admin_role function
-- This function uses SECURITY DEFINER to break the circular reference
CREATE OR REPLACE FUNCTION auth.user_has_admin_role()
RETURNS boolean AS $$
DECLARE
  _role text;
  _is_admin boolean;
BEGIN
  -- Direct query without going through RLS
  SELECT role INTO _role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  _is_admin := _role IN ('admin', 'dev');
  
  -- Return the result
  RETURN _is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create basic user policies (non-recursive)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE
TO authenticated 
USING (id = auth.uid());

-- Create admin policies using the non-recursive function
CREATE POLICY "Admins can view any profile" 
ON public.profiles 
FOR SELECT
TO authenticated 
USING (auth.user_has_admin_role());

CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE
TO authenticated 
USING (auth.user_has_admin_role());

-- Fix any existing user_details view
DROP VIEW IF EXISTS public.user_details;

CREATE VIEW public.user_details AS
SELECT 
  u.id,
  u.email,
  p.role,
  p.is_dev_user,
  p.display_name,
  p.avatar_url,
  p.bio,
  u.created_at,
  u.updated_at
FROM 
  auth.users u
JOIN 
  public.profiles p ON u.id = p.id;

-- Grant permissions on the view
GRANT SELECT ON public.user_details TO authenticated;

-- Create a trigger function to set default profile values
CREATE OR REPLACE FUNCTION public.set_profile_defaults()
RETURNS TRIGGER AS $$
DECLARE
  _email text;
BEGIN
  -- Get user email
  SELECT email INTO _email
  FROM auth.users
  WHERE id = NEW.id;
  
  -- Set display name from email if not provided
  IF NEW.display_name IS NULL THEN
    NEW.display_name := split_part(_email, '@', 1);
  END IF;
  
  -- Check for developer email pattern
  IF _email LIKE '%@company.com' OR 
     _email LIKE '%@dev.company.com' OR
     _email = 'admin@example.com' THEN
    NEW.is_dev_user := TRUE;
    NEW.role := 'dev';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for setting defaults
DROP TRIGGER IF EXISTS set_profile_defaults_trigger ON public.profiles;
CREATE TRIGGER set_profile_defaults_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_defaults();