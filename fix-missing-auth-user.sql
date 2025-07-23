-- Fix the missing auth user for tyleramos2025@gmail.com
-- This user exists in the database but has no auth_user_id linked

-- First, let's check the current state
SELECT 'CURRENT STATE' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    auth_user_id,
    founding_member, 
    status, 
    created_at
FROM users 
WHERE email = 'tyleramos2025@gmail.com';

-- Check if auth user already exists
SELECT 'CHECKING AUTH USERS' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'tyleramos2025@gmail.com';

-- Since we can't create auth users directly via SQL (that's handled by Supabase Auth),
-- we need to update the user status to active and provide instructions for manual auth creation

-- Update the user status to active (since payment was completed)
UPDATE users 
SET 
    status = 'active',
    updated_at = NOW()
WHERE email = 'tyleramos2025@gmail.com';

-- Verify the update
SELECT 'USER UPDATED' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    auth_user_id,
    founding_member, 
    status, 
    created_at,
    updated_at
FROM users 
WHERE email = 'tyleramos2025@gmail.com';

-- Show all users for comparison
SELECT 'ALL USERS STATUS' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    auth_user_id IS NOT NULL as has_auth_user,
    founding_member, 
    status, 
    created_at
FROM users 
ORDER BY created_at DESC; 