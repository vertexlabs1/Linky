-- FIX USER_ROLES RLS POLICY
-- Ensure useAdminCheck hook can read role data properly

-- Check current user_roles RLS policies
SELECT 
  'CURRENT USER_ROLES RLS POLICIES:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Create a comprehensive policy for user_roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT 
  USING (
    auth.role() = 'service_role' 
    OR user_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.auth_user_id = auth.uid() 
      AND admin_user.is_admin = true
    )
  );

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Test if we can read Tyler's roles (this is what useAdminCheck does)
SELECT 
  'TESTING USER_ROLES ACCESS:' as info,
  u.id as user_id,
  u.email,
  ur.active as role_active,
  r.name as role_name,
  'Should show admin role if RLS is working' as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- Verify the new policy
SELECT 
  'VERIFY USER_ROLES POLICY:' as info,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public'; 