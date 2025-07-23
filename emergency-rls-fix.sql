-- EMERGENCY RLS FIX - Temporarily disable RLS to allow admin access
-- Run this in production Supabase SQL Editor

-- Step 1: Completely disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Test that Tyler can be found
SELECT 'TYLER TEST WITHOUT RLS:' as test;
SELECT 
  id,
  email,
  is_admin,
  auth_user_id
FROM users 
WHERE email = 'tyler@vxlabs.co';

-- Step 3: Check auth.users to make sure Tyler's auth account exists
SELECT 'TYLER AUTH USER:' as test;
SELECT 
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'tyler@vxlabs.co';

-- Step 4: Re-enable RLS with VERY permissive policies for testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can do everything" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- Create extremely permissive policy for debugging
CREATE POLICY "Allow all authenticated users" ON users
    FOR ALL USING (
        auth.role() = 'authenticated' 
        OR auth.role() = 'service_role'
        OR auth.uid() IS NOT NULL
    );

-- Verify policies are active
SELECT 'RLS POLICIES:' as check;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'users';

-- Final test with RLS enabled
SELECT 'FINAL TEST WITH PERMISSIVE RLS:' as test;
SELECT 'Test completed - try admin login now' as message; 