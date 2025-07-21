-- Fix Tyler's user record
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT 'Current state:' as info;
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  is_admin,
  auth_user_id,
  created_at
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Check auth.users
SELECT 'Auth users:' as info;
SELECT 
  id,
  email,
  role,
  created_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- If Tyler doesn't exist in users table, create him
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  phone,
  auth_user_id,
  status,
  subscription_plan,
  subscription_status,
  is_admin,
  founding_member,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'tyler@vxlabs.co',
  'Tyler',
  'Amos',
  '(615) 602-0218',
  au.id,
  'active',
  'prospector',
  'active',
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'tyler@vxlabs.co'
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = 'tyler@vxlabs.co'
);

-- If Tyler exists but needs updating
UPDATE users 
SET 
  first_name = 'Tyler',
  last_name = 'Amos',
  phone = '(615) 602-0218',
  status = 'active',
  subscription_plan = 'prospector',
  subscription_status = 'active',
  is_admin = TRUE,
  founding_member = TRUE,
  updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Link Tyler to his auth user if not linked
UPDATE users 
SET auth_user_id = (
  SELECT id FROM auth.users WHERE email = 'tyler@vxlabs.co'
)
WHERE email = 'tyler@vxlabs.co' 
AND auth_user_id IS NULL;

-- Verify the fix
SELECT 'After fix:' as info;
SELECT 
  id,
  email,
  first_name,
  last_name,
  status,
  is_admin,
  auth_user_id,
  created_at
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Show all users to confirm Tyler is there
SELECT 'All users:' as info;
SELECT 
  email,
  first_name,
  last_name,
  status,
  is_admin,
  subscription_plan
FROM users 
ORDER BY created_at DESC; 