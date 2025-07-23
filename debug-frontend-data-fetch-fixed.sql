-- DEBUG FRONTEND DATA FETCH - FIXED VERSION
-- Remove user_metadata reference that doesn't exist

-- 1. Verify Tyler's database record
SELECT '=== STEP 1: TYLER DATABASE RECORD ===' as debug_step;
SELECT 
  id,
  email,
  first_name,
  last_name,
  is_admin,
  auth_user_id,
  status,
  email_verified,
  created_at,
  updated_at
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- 2. Check Tyler's auth user record (without user_metadata)
SELECT '=== STEP 2: TYLER AUTH USER RECORD ===' as debug_step;
SELECT 
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- 3. Test the exact query the frontend uses (Method 1: by auth_user_id)
SELECT '=== STEP 3: FRONTEND METHOD 1 - BY AUTH_USER_ID ===' as debug_step;
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  u.auth_user_id,
  u.id,
  'This is what DashboardLayout should see' as expected_result
FROM users u
WHERE u.auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'
);

-- 4. Test frontend fallback method (Method 2: by email)
SELECT '=== STEP 4: FRONTEND METHOD 2 - BY EMAIL ===' as debug_step;
SELECT 
  u.first_name,
  u.last_name,
  u.email,
  u.auth_user_id,
  u.id,
  'This is what DashboardLayout fallback should see' as expected_result
FROM users u
WHERE u.email = 'tyler@vxlabs.co';

-- 5. Check if auth_user_id linkage is correct
SELECT '=== STEP 5: AUTH LINKAGE CHECK ===' as debug_step;
SELECT 
  u.email as db_email,
  u.auth_user_id as db_auth_id,
  au.id as actual_auth_id,
  au.email as auth_email,
  CASE 
    WHEN u.auth_user_id = au.id THEN 'LINKED CORRECTLY ✓'
    WHEN u.auth_user_id IS NULL THEN 'NOT LINKED - auth_user_id is NULL ❌'
    WHEN u.auth_user_id != au.id THEN 'WRONG LINK - IDs dont match ❌'
    ELSE 'UNKNOWN ISSUE ❌'
  END as linkage_status
FROM users u
FULL OUTER JOIN auth.users au ON u.email = au.email
WHERE u.email = 'tyler@vxlabs.co' OR au.email = 'tyler@vxlabs.co';

-- 6. Check Tyler's admin role assignment (for admin menu)
SELECT '=== STEP 6: TYLER ADMIN ROLE CHECK ===' as debug_step;
SELECT 
  u.email,
  u.is_admin as user_table_admin_flag,
  ur.active as has_active_role,
  r.name as role_name,
  'Should show: is_admin=true AND has_active_role=true' as expected_result
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.active = true
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'admin'
WHERE u.email = 'tyler@vxlabs.co';

-- 7. Diagnostic summary
SELECT '=== DIAGNOSTIC SUMMARY ===' as debug_step;
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE email = 'tyler@vxlabs.co') 
    THEN 'PROBLEM: No Tyler user record in database'
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tyler@vxlabs.co')
    THEN 'PROBLEM: No Tyler auth record'
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE email = 'tyler@vxlabs.co' AND auth_user_id IS NULL
    )
    THEN 'PROBLEM: Tyler auth_user_id is NULL - not linked'
    WHEN NOT EXISTS (
      SELECT 1 FROM users u 
      JOIN auth.users au ON u.auth_user_id = au.id 
      WHERE u.email = 'tyler@vxlabs.co'
    )
    THEN 'PROBLEM: Tyler auth_user_id linkage broken'
    ELSE 'Database looks correct - check frontend logic'
  END as diagnosis; 