-- ============================================================================
-- LINK AUTH USER TO DATABASE USER
-- ============================================================================
-- Run this after creating the auth user in Supabase Dashboard

-- First, let's see what auth users exist
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Then, let's see our database user
SELECT 
    id,
    email,
    first_name,
    last_name,
    auth_user_id,
    password_set
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Now link them together
UPDATE users 
SET 
    auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'),
    password_set = true
WHERE email = 'tyler@vxlabs.co';

-- Verify the link
SELECT 
    u.id as db_user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_user_id,
    u.password_set,
    au.id as auth_user_id,
    au.email as auth_email,
    au.role as auth_role
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'tyler@vxlabs.co';

-- Check user roles
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    ur.active as role_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co'; 