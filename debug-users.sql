-- Debug Users Table
-- Run this in Supabase SQL Editor to see what's happening

-- Check all users
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
ORDER BY created_at DESC;

-- Check if Tyler exists in auth.users
SELECT 
  id,
  email,
  role,
  created_at
FROM auth.users 
WHERE email = 'tyler@vxlabs.co';

-- Check if there's a linking issue
SELECT 
  'public.users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users;

-- Check for orphaned users
SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  au.id as auth_id,
  au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'tyler@vxlabs.co' OR au.email = 'tyler@vxlabs.co'; 