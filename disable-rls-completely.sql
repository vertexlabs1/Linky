-- TEMPORARILY DISABLE RLS COMPLETELY FOR ADMIN ACCESS
-- This will allow Tyler to access admin features while we fix the underlying issue

-- Disable RLS on all relevant tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS STATUS:' as check;
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'user_roles', 'roles')
AND schemaname = 'public';

-- Test that Tyler's admin status is accessible
SELECT 'TYLER ADMIN TEST:' as test;
SELECT 
  u.email,
  u.is_admin,
  ur.active as has_admin_role,
  r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co';

SELECT 'RLS DISABLED - Tyler should now have admin access in the app' as message; 