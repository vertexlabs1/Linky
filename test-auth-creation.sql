-- Test if we can create auth users directly
-- This will help us understand if the issue is with the function or the database itself

-- First, let's check if the user already exists in auth.users
SELECT 'CHECKING AUTH USERS' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'tyleramos2025@gmail.com';

-- Let's also check what auth users exist
SELECT 'ALL AUTH USERS' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if the trigger is working by looking at recent auth user creations
SELECT 'RECENT AUTH USER CREATIONS' as info;
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created,
    u.id as user_id,
    u.email as user_email,
    u.auth_user_id as linked_auth_id,
    u.created_at as user_created
FROM auth.users au
LEFT JOIN users u ON au.id = u.auth_user_id
ORDER BY au.created_at DESC
LIMIT 5; 