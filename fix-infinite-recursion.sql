-- IMMEDIATE FIX FOR INFINITE RECURSION
-- The "Secure user access" policy is causing infinite recursion

-- Drop all problematic policies
DROP POLICY IF EXISTS "Secure user access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create a simple, safe policy that won't cause recursion
CREATE POLICY "Simple user access" ON users
  FOR ALL 
  USING (
    auth.role() = 'service_role' 
    OR auth.uid() = auth_user_id
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Test if the policy works without recursion
SELECT 
  'TESTING FIXED POLICY:' as info,
  id,
  email,
  first_name,
  last_name,
  auth_user_id
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Verify the new policy
SELECT 
  'VERIFY FIXED POLICY:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'; 