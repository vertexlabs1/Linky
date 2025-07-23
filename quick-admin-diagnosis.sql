-- QUICK ADMIN LOGIN DIAGNOSIS
-- Run each query separately to see results clearly

-- STEP 1: Disable RLS temporarily so we can see data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Check if Tyler exists in users table
SELECT 'TYLER IN USERS TABLE:' as check_name;
SELECT 
  id,
  email,
  first_name,
  last_name,
  auth_user_id,
  is_admin,
  status
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- STEP 3: Check if Tyler exists in auth.users
SELECT 'TYLER IN AUTH.USERS:' as check_name;
SELECT 
  id,
  email,
  email_confirmed_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- STEP 4: Check roles table
SELECT 'ROLES TABLE:' as check_name;
SELECT * FROM roles;

-- STEP 5: Check Tyler's user_roles
SELECT 'TYLER USER_ROLES:' as check_name;
SELECT 
  ur.*,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'tyler@vxlabs.co';

-- STEP 6: Check if user_roles table has correct structure
SELECT 'USER_ROLES COLUMNS:' as check_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position; 