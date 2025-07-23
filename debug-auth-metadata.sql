-- Debug auth user metadata for Tyler
-- This will show us what's stored in auth.users metadata

-- Check auth.users table for Tyler's metadata
SELECT 
  'AUTH USER METADATA:' as info,
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Also check if there are any auth user metadata issues
SELECT 
  'AUTH USER BASIC INFO:' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co'; 