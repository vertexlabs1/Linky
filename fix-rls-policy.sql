-- FIX RLS POLICY ISSUE
-- The current RLS policy is causing 500 errors when frontend tries to read user data

-- First, let's see what RLS policies exist
SELECT 
  'CURRENT RLS POLICIES ON USERS:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can view own data" ON users;

-- Create a simpler, more permissive policy that should work
CREATE POLICY "Users can view own data" ON users
  FOR SELECT 
  USING (
    auth.role() = 'service_role' 
    OR auth.uid() = auth_user_id
  );

-- Also ensure RLS is enabled but with proper policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Test if the policy works
SELECT 
  'TESTING NEW RLS POLICY:' as info,
  id,
  email,
  first_name,
  last_name,
  auth_user_id
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Verify the policy was created
SELECT 
  'VERIFY NEW POLICY:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 