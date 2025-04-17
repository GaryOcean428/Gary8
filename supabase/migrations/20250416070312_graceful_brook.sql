/*
  # Fix User Role Recursion in Policies

  1. Changes
    - Ensures all required columns exist in the profiles table
    - Replaces problematic policies with non-recursive versions
    - Creates a SECURITY DEFINER function to safely check admin role
    - Sets up proper RLS for user and admin access to profiles
    - Fixes user_details view
  
  2. Security
    - Prevents infinite recursion in policies
    - Maintains proper row-level security
*/

-- First ensure all required columns exist in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'::text,
ADD COLUMN IF NOT EXISTS is_dev_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Drop ALL existing policies on the profiles table to ensure a clean slate
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate the user_has_admin_role function using SECURITY DEFINER
-- This breaks the recursion chain by bypassing RLS completely
CREATE OR REPLACE FUNCTION auth.user_has_admin_role()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Direct database access to bypass RLS
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Return whether user has admin/dev role
  RETURN COALESCE(user_role IN ('admin', 'dev'), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create basic policies for regular users to manage their own profile
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

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT
TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE
TO authenticated 
USING (id = auth.uid());

-- Create separate policies for admin access using the SECURITY DEFINER function
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

CREATE POLICY "Admins can insert any profile" 
ON public.profiles 
FOR INSERT
TO authenticated 
WITH CHECK (auth.user_has_admin_role());

CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE
TO authenticated 
USING (auth.user_has_admin_role());

-- Fix the user_details view by using only existing columns
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