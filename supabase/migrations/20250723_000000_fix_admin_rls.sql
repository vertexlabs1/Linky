-- Fix RLS policies to allow admin access to all users
-- This will allow the admin page to see all users including tyleramos2025@gmail.com

-- Temporarily disable RLS to see all data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_access" ON users;
DROP POLICY IF EXISTS "anon_can_insert" ON users;
DROP POLICY IF EXISTS "users_own_data" ON users;
DROP POLICY IF EXISTS "admin_can_view_all_users" ON users;
DROP POLICY IF EXISTS "admin_full_access" ON users;

-- Create service role policy (for Edge Functions)
CREATE POLICY "service_role_all_access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy for anon users to insert (for public signups)
CREATE POLICY "anon_can_insert" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy for authenticated users to view/update their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL
  TO authenticated
  USING (auth.uid() = auth_user_id OR auth.email() = email)
  WITH CHECK (auth.uid() = auth_user_id OR auth.email() = email);

-- Create policy for admin users to view all users (for admin interface)
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

-- Create policy for admin users to manage all users (for admin interface)
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
GRANT ALL ON users TO service_role;
GRANT INSERT ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, UPDATE, DELETE ON users TO anon; 