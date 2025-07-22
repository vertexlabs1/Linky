-- FIX TYLER'S USER_ROLES WITH CORRECT USER ID
-- This fixes the mismatch between Tyler's user record and his role assignment

-- First, let's see the current mismatch
SELECT 'CURRENT MISMATCH:' as issue;
SELECT 
  'Tyler Users ID: ' || u.id as tyler_users_id,
  'Tyler UserRoles ID: ' || ur.user_id as tyler_userroles_id,
  'Match: ' || CASE WHEN u.id = ur.user_id THEN 'YES' ELSE 'NO - THIS IS THE PROBLEM!' END as ids_match
FROM users u
CROSS JOIN user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'
AND r.name = 'admin';

-- Delete the incorrect role assignment
DELETE FROM user_roles 
WHERE user_id = '696f7595-eaad-4c10-b9a6-634b10221bb7'
AND role_id = '4a3aea94-5623-44fa-801d-691588d51f21';

-- Insert the correct role assignment with Tyler's actual user ID
INSERT INTO user_roles (user_id, role_id, granted_by, active)
SELECT
  u.id,  -- Tyler's actual user ID from users table
  r.id,  -- Admin role ID
  u.id,  -- Granted by Tyler himself
  true   -- Active
FROM users u, roles r
WHERE u.email = 'tyler@vxlabs.co'
  AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO UPDATE SET active = true;

-- Verify the fix
SELECT 'AFTER FIX - VERIFICATION:' as status;
SELECT 
  u.id as user_id,
  u.email,
  u.is_admin,
  ur.active as has_admin_role,
  r.name as role_name,
  'IDs Match: ' || CASE WHEN u.id = ur.user_id THEN 'YES ✅' ELSE 'NO ❌' END as verification
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co'; 