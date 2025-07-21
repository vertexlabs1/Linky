-- ============================================================================
-- CHECK AUTH USER STATUS
-- ============================================================================
-- Run this in the Supabase SQL Editor to check auth user status

-- Check if auth user exists
SELECT 
    'Auth User Check' as check_type,
    id,
    email,
    role,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Check database user status
SELECT 
    'Database User Check' as check_type,
    id,
    email,
    auth_user_id,
    password_set,
    status
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Check role assignment
SELECT 
    'Role Assignment Check' as check_type,
    u.email,
    r.name as role_name,
    ur.active as role_active,
    ur.granted_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- ============================================================================
-- MANUAL AUTH USER SETUP INSTRUCTIONS
-- ============================================================================
-- If the auth user doesn't exist, you need to create it manually:

-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User"
-- 4. Enter:
--    - Email: tyler@vxlabs.co
--    - Password: LinkyAdmin2024!
--    - First Name: Tyler
--    - Last Name: Amos
-- 5. Click "Create User"

-- After creating the auth user, run this to link it:
UPDATE users 
SET 
    auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'),
    password_set = true
WHERE email = 'tyler@vxlabs.co'; 