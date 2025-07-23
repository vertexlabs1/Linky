-- Fix RLS policies to allow admin access to all users
-- This will allow the admin page to see all users including tyleramos2025@gmail.com

-- First, let's see the current policies
SELECT 'CURRENT POLICIES:' as info;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users';

-- Add a policy that allows admin users to view all users
CREATE POLICY "admin_can_view_all_users" ON users
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_admin = true
    )
  );

-- Also add a more permissive policy for admin access
CREATE POLICY "admin_full_access" ON users
  FOR ALL
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND is_admin = true
    )
  );

-- Grant necessary permissions
GRANT SELECT ON users TO anon;

-- Show the updated policies
SELECT 'UPDATED POLICIES:' as info;
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users'; 