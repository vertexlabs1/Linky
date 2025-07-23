-- Temporary workaround for the broken auth system
-- Since we can't create auth users, let's see what we can do

-- First, let's check if there are any unused auth users we can link to
SELECT 'CHECKING FOR UNUSED AUTH USERS' as info;
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as auth_created,
    u.id as linked_user_id,
    u.email as linked_user_email
FROM auth.users au
LEFT JOIN users u ON au.id = u.auth_user_id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Let's also check if we can find any patterns in the auth user creation
SELECT 'AUTH USER CREATION PATTERNS' as info;
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    au.raw_user_meta_data
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 5;

-- For now, let's create a temporary solution by updating the user with a note
UPDATE users 
SET 
    updated_at = NOW()
WHERE email = 'tyleramos2025@gmail.com';

-- Show the final state
SELECT 'FINAL USER STATE' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    status,
    founding_member,
    auth_user_id IS NOT NULL as has_auth_user,
    CASE 
        WHEN status = 'active' AND auth_user_id IS NULL THEN '🚨 NEEDS AUTH USER CREATION'
        WHEN status = 'active' AND auth_user_id IS NOT NULL THEN '✅ FULLY ACTIVE'
        ELSE '❓ UNKNOWN STATE'
    END as user_state,
    created_at,
    updated_at
FROM users 
WHERE email = 'tyleramos2025@gmail.com'; 