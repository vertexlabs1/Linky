-- Fix the user flow for tyleramos2025@gmail.com
-- This user completed payment but the webhook failed to process them

-- First, let's see the current state
SELECT 'CURRENT USER STATE' as info;
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

-- Update the user to reflect that payment was completed
-- Since the webhook failed, we need to manually process this user
UPDATE users 
SET 
    status = 'active',
    founding_member = true,
    updated_at = NOW()
WHERE email = 'tyleramos2025@gmail.com';

-- Verify the update
SELECT 'USER PROCESSED' as info;
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

-- Show all users to see the flow
SELECT 'ALL USERS FLOW STATUS' as info;
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    status,
    founding_member,
    auth_user_id IS NOT NULL as has_auth_user,
    CASE 
        WHEN status = 'pending' AND auth_user_id IS NULL THEN '⏳ PENDING PAYMENT'
        WHEN status = 'active' AND auth_user_id IS NULL THEN '✅ PAID BUT NO AUTH'
        WHEN status = 'active' AND auth_user_id IS NOT NULL THEN '✅ FULLY ACTIVE'
        ELSE '❓ UNKNOWN STATE'
    END as user_state,
    created_at
FROM users 
ORDER BY created_at DESC; 