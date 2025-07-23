-- FIX TYLER'S PROFILE DATA - Restore correct user information
-- This fixes the "Demo User" issue and ensures admin menu appears

-- Update Tyler's profile with correct information
UPDATE users 
SET 
  first_name = 'Tyler',
  last_name = 'Amos',
  email = 'tyler@vxlabs.co',
  is_admin = true,
  status = 'active',
  email_verified = true,
  updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Verify Tyler's profile is correct
SELECT 'TYLER PROFILE VERIFICATION:' as check_type;
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  auth_user_id,
  status,
  email_verified,
  'Should show: Tyler Amos, Admin=true' as expected_result
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Check that Tyler has admin role assignment
SELECT 'TYLER ADMIN ROLE CHECK:' as check_type;
SELECT 
  u.email,
  u.is_admin as user_table_admin,
  COUNT(ur.id) as active_admin_roles,
  STRING_AGG(r.name, ', ') as role_names,
  CASE 
    WHEN u.is_admin = true AND COUNT(ur.id) > 0 THEN 'ADMIN MENU SHOULD APPEAR ✓'
    WHEN u.is_admin = true AND COUNT(ur.id) = 0 THEN 'MISSING ROLE ASSIGNMENT ❌'
    ELSE 'NOT ADMIN ❌'
  END as admin_menu_status
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co'
GROUP BY u.id, u.email, u.is_admin;

-- If no admin role exists, create it
INSERT INTO user_roles (user_id, role_id, granted_by, active)
SELECT
  u.id,  -- Tyler's user ID
  r.id,  -- Admin role ID
  u.id,  -- Granted by Tyler himself
  true   -- Active
FROM users u, roles r
WHERE u.email = 'tyler@vxlabs.co'
  AND r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur2 
    WHERE ur2.user_id = u.id 
    AND ur2.role_id = r.id 
    AND ur2.active = true
  )
ON CONFLICT (user_id, role_id) DO UPDATE SET active = true;

-- Final verification
SELECT 'FINAL VERIFICATION - Tyler should now show correctly:' as final_check;
SELECT 
  email,
  first_name || ' ' || last_name as full_name,
  is_admin,
  'Tyler should now appear correctly in top right' as display_fix,
  'Admin menu should now be visible' as menu_fix
FROM users 
WHERE email = 'tyler@vxlabs.co'; 