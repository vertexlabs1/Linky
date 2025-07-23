-- FIX AUTH USER METADATA FOR TYLER
-- This will update the auth.users metadata to contain the correct name

-- First, let's see what's currently in the metadata
SELECT 
  'CURRENT METADATA:' as info,
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Update the auth user metadata with correct name information
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_build_object(
    'first_name', 'Tyler',
    'last_name', 'Amos',
    'full_name', 'Tyler Amos',
    'email', 'tyler@vxlabs.co'
  ),
  raw_app_meta_data = jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'is_admin', true,
    'founding_member', true
  ),
  updated_at = NOW()
WHERE email = 'tyler@vxlabs.co';

-- Verify the update worked
SELECT 
  'UPDATED METADATA:' as info,
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  updated_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Also verify the users table still has correct data
SELECT 
  'USERS TABLE VERIFICATION:' as info,
  id,
  email,
  first_name,
  last_name,
  auth_user_id,
  is_admin,
  founding_member
FROM users 
WHERE email = 'tyler@vxlabs.co'; 