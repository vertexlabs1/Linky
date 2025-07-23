-- Test RLS policy for users table
-- This should show Tyler's data if the policy is working correctly

-- Check current RLS policies on users table
SELECT 
  'CURRENT RLS POLICIES ON USERS TABLE:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- Test if we can read Tyler's data (this should work now)
SELECT 
  'TESTING USER DATA ACCESS:' as info,
  id,
  email,
  first_name,
  last_name,
  auth_user_id,
  is_admin,
  founding_member
FROM users 
WHERE email = 'tyler@vxlabs.co'; 