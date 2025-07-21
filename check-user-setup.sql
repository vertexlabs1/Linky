-- ============================================================================
-- CHECK CURRENT USER SETUP
-- ============================================================================
-- Run this in the Supabase SQL Editor to see current user status

-- Check current user
SELECT 
    id,
    email,
    first_name,
    last_name,
    auth_user_id,
    password_set,
    status,
    created_at
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Check user roles
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    ur.active as role_active,
    ur.created_at as role_granted_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'tyler@vxlabs.co';

-- ============================================================================
-- SETUP PASSWORD FOR ADMIN USER
-- ============================================================================
-- This will create a proper Supabase Auth user with password

-- First, let's create a password for the existing user
-- We'll use a secure password: LinkyAdmin2024!
-- You can change this password later through the admin portal

-- Note: This requires manual setup through Supabase Auth
-- Go to Authentication > Users in your Supabase dashboard
-- Find tyler@vxlabs.co and set a password, or create a new user

-- Alternative: We can create a new user with proper auth
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'tyler@vxlabs.co',
    crypt('LinkyAdmin2024!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Tyler","last_name":"Amos"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Then update the users table to link to the auth user
UPDATE users 
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'),
    password_set = true
WHERE email = 'tyler@vxlabs.co';

-- Verify the setup
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_user_id,
    u.password_set,
    au.email as auth_email,
    au.role as auth_role
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'tyler@vxlabs.co'; 