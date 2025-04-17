/*
  # User Profile Enhancements

  1. New Fields
    - `role` - User role (user, admin, dev)
    - `is_dev_user` - Boolean flag for developer status
    - `metadata` - JSONB field for additional profile data
    - `profile_complete` - Boolean flag for profile completion status
  
  2. Security
    - Add constraint to validate role values
    - Create policy for admin/dev users to manage profiles
    - Create helper function to set dev user status
  
  3. Automation
    - Create trigger to set default values for new profiles
    - Update handle_new_user function for role assignment
    - Create user_details view for easy access to profile information
*/

-- Add role field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'::text,
ADD COLUMN IF NOT EXISTS is_dev_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Create a type for user roles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'dev');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add a check constraint to ensure role is valid
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'dev'));

-- Create a function to set display_name to email username if null
CREATE OR REPLACE FUNCTION public.set_profile_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_name is null, use the email username
  IF NEW.display_name IS NULL THEN
    NEW.display_name := split_part(
      (SELECT email FROM auth.users WHERE id = NEW.id),
      '@',
      1
    );
  END IF;
  
  -- Check if this is a developer email domain
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = NEW.id 
    AND (
      email LIKE '%@company.com' OR  -- Replace with your actual dev domains
      email LIKE '%@dev.company.com' OR
      email = 'admin@example.com'    -- Example for testing
    )
  ) THEN
    NEW.is_dev_user := TRUE;
    NEW.role := 'dev';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger before creating a new one
DROP TRIGGER IF EXISTS set_profile_defaults_trigger ON public.profiles;

-- Create trigger to call the function before insert
CREATE TRIGGER set_profile_defaults_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_profile_defaults();

-- Update handle_new_user function to handle role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_dev_email BOOLEAN;
BEGIN
  -- Check if this is a developer email domain
  SELECT (
    NEW.email LIKE '%@company.com' OR  -- Replace with your actual dev domains
    NEW.email LIKE '%@dev.company.com' OR
    NEW.email = 'admin@example.com'    -- Example for testing
  ) INTO is_dev_email;

  -- Insert into profiles with appropriate role
  INSERT INTO public.profiles (
    id, 
    avatar_url,
    role,
    is_dev_user
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_dev_email THEN 'dev' ELSE 'user' END,
    is_dev_email
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new policy for admin users to manage other profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'dev')
) 
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'dev')
);

-- Create a view for accessing user profile information with role details
CREATE OR REPLACE VIEW public.user_details AS
SELECT 
  u.id,
  u.email,
  p.role,
  p.is_dev_user,
  u.created_at,
  u.updated_at
FROM 
  auth.users u
JOIN 
  public.profiles p ON u.id = p.id;

-- Set permissions on the view
GRANT SELECT ON public.user_details TO authenticated;

-- Helper function to set a user as a dev user
CREATE OR REPLACE FUNCTION public.set_user_as_dev(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'dev', is_dev_user = TRUE
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing users to have proper roles (optional migration script)
UPDATE public.profiles
SET role = 'dev', is_dev_user = TRUE
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@company.com' 
  OR email LIKE '%@dev.company.com'
  OR email = 'admin@example.com'
);