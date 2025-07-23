-- FIX ADMIN ROLE QUERY - Debug why Tyler's admin role isn't being recognized
-- This addresses the "Roles check: 0" issue from the console

-- First, let's see what the admin auth query is actually finding
SELECT 'DEBUG: Tyler user lookup' as step;
SELECT 
  id,
  email,
  auth_user_id,
  is_admin
FROM users 
WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co');

-- Check what the role query should return (this mimics useAdminAuth logic)
SELECT 'DEBUG: Role query simulation' as step;
SELECT 
  ur.active,
  r.name as role_name,
  'Query found role: ' || r.name as debug_message
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (
  SELECT id FROM users 
  WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co')
)
AND ur.active = true;

-- Check if there's a data mismatch
SELECT 'DEBUG: Data mismatch check' as step;
SELECT 
  u.id as user_table_id,
  u.auth_user_id,
  au.id as auth_users_id,
  'Auth IDs match: ' || CASE WHEN u.auth_user_id = au.id THEN 'YES' ELSE 'NO - PROBLEM!' END as auth_match,
  ur.user_id as role_user_id,
  'Role user ID match: ' || CASE WHEN u.id = ur.user_id THEN 'YES' ELSE 'NO - PROBLEM!' END as role_match
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co';

-- Force fix any mismatched role assignments
DELETE FROM user_roles 
WHERE role_id = (SELECT id FROM roles WHERE name = 'admin')
AND user_id NOT IN (SELECT id FROM users WHERE email = 'tyler@vxlabs.co');

-- Ensure Tyler has the admin role with his correct user ID
INSERT INTO user_roles (user_id, role_id, granted_by, active)
SELECT
  u.id,
  r.id,
  u.id,
  true
FROM users u, roles r
WHERE u.email = 'tyler@vxlabs.co'
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET active = true;

-- Final verification - this should match what the app queries
SELECT 'FINAL: App query simulation' as step;
SELECT 
  ur.active,
  r.name as role_name,
  'App should see: Admin role = ' || CASE WHEN ur.active AND r.name = 'admin' THEN 'TRUE' ELSE 'FALSE' END as result
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (
  SELECT id FROM users 
  WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co')
)
AND ur.active = true
AND r.name = 'admin'; 