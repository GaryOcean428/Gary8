/*
  # Fix Profiles Table and User Details View

  1. New Columns
    - Adds missing bio column to profiles table
    - Adds missing display_name column to profiles table
    - Adds missing avatar_url column to profiles table
  
  2. Changes
    - Fixes the user_details view to reference only existing columns
    - Removes IF NOT EXISTS from policy creation which is not supported in PostgreSQL
    - Creates proper admin policies using a safe approach
*/

-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Fix the user_details view by removing any references to non-existent columns
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

-- Create a function to safely check if a user has admin privileges
CREATE OR REPLACE FUNCTION auth.user_has_admin_role()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Fetch the role directly to avoid recursion in policies
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN user_role IN ('admin', 'dev');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up any policies that might be causing recursion issues
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

-- Create separate policies for admin access that won't cause recursion
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

CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE
TO authenticated 
USING (auth.user_has_admin_role());

CREATE POLICY "Admins can insert any profile" 
ON public.profiles 
FOR INSERT
TO authenticated 
WITH CHECK (auth.user_has_admin_role());