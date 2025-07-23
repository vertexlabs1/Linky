-- DEBUG ADMIN PANEL ISSUE
-- Check all admin-related data to see why the panel isn't showing

-- 1. Check Tyler's complete user data
SELECT 
  'TYLER USER DATA:' as info,
  id,
  email,
  first_name,
  last_name,
  auth_user_id,
  is_admin,
  founding_member,
  status
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- 2. Check if roles table exists and has admin role
SELECT 
  'ROLES TABLE CHECK:' as info,
  id,
  name,
  description
FROM roles 
WHERE name = 'admin';

-- 3. Check if Tyler has admin role assigned
SELECT 
  'TYLER ADMIN ROLE CHECK:' as info,
  ur.id,
  ur.user_id,
  ur.role_id,
  ur.active,
  r.name as role_name,
  u.email as user_email
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'tyler@vxlabs.co' AND r.name = 'admin';

-- 4. Check RLS policies on user_roles table
SELECT 
  'USER_ROLES RLS POLICIES:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';

-- 5. Check RLS policies on users table
SELECT 
  'USERS RLS POLICIES:' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 6. Test if we can read Tyler's roles (this is what useAdminCheck does)
SELECT 
  'TESTING ADMIN CHECK QUERY:' as info,
  u.id as user_id,
  u.email,
  ur.active as role_active,
  r.name as role_name,
  'This should show admin role if everything is working' as status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'; 