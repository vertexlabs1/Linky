-- SAFE USER CLEANUP SCRIPT
-- This script will delete all users except tyler@vxlabs.co and luke@lukepauldine.com
-- Run this in your Supabase SQL editor

-- STEP 1: First, let's see what users we have
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    subscription_status,
    founding_member,
    created_at
FROM users 
ORDER BY created_at DESC;

-- STEP 2: Count how many users will be deleted
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IN ('tyler@vxlabs.co', 'luke@lukepauldine.com') THEN 1 END) as users_to_keep,
    COUNT(CASE WHEN email NOT IN ('tyler@vxlabs.co', 'luke@lukepauldine.com') THEN 1 END) as users_to_delete
FROM users;

-- STEP 3: Show which users will be deleted (for verification)
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM users 
WHERE email NOT IN ('tyler@vxlabs.co', 'luke@lukepauldine.com')
ORDER BY created_at DESC;

-- STEP 4: ACTUAL DELETION (uncomment when ready)
-- DELETE FROM users WHERE email NOT IN ('tyler@vxlabs.co', 'luke@lukepauldine.com');

-- STEP 5: Verify deletion (run after step 4)
-- SELECT 
--     id,
--     email,
--     first_name,
--     last_name,
--     status,
--     subscription_status,
--     founding_member,
--     created_at
-- FROM users 
-- ORDER BY created_at DESC; 